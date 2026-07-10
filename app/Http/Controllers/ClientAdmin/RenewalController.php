<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\DiscountCode;
use App\Models\Plan;
use App\Models\RenewalRequest;
use App\Services\InvoiceService;
use App\Services\MoyasarPaymentService;
use App\Support\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class RenewalController extends Controller
{
    public function index()
    {
        $tenant = app('current_tenant');
        $planModel = $tenant->plan_id ? \App\Models\Plan::find($tenant->plan_id) : null;

        $renewals = RenewalRequest::where('tenant_id', $tenant->id)
            ->latest('requested_at')
            ->get();

        $hasPendingRequest = $renewals->where('status', 'pending')->isNotEmpty();

        $invoices = \App\Models\Invoice::where('tenant_id', $tenant->id)
            ->orderByDesc('issue_date')
            ->take(10)
            ->get(['id', 'invoice_number', 'type', 'status', 'total', 'issue_date', 'paid_at', 'payment_method']);

        $daysRemaining = null;
        if ($tenant->subscription_ends_at) {
            $daysRemaining = max(0, now()->diffInDays($tenant->subscription_ends_at, false));
        }

        return Inertia::render('client-admin/renewal/index', [
            'tenant' => [
                'name' => $tenant->name,
                'subscription_starts_at' => $tenant->subscription_starts_at?->toDateString(),
                'subscription_ends_at' => $tenant->subscription_ends_at?->toDateString(),
                'is_active' => $tenant->is_active,
                'days_remaining' => $daysRemaining,
                'plan' => $planModel ? [
                    'name_ar' => $planModel->name_ar,
                    'name_en' => $planModel->name_en,
                    'price' => $planModel->price,
                    'billing_cycle' => $planModel->billing_cycle,
                    'features_ar' => $planModel->features_ar ?? [],
                    'features_en' => $planModel->features_en ?? [],
                    'limits' => $planModel->limits ?? [],
                ] : null,
            ],
            'renewals' => $renewals,
            'invoices' => $invoices,
            'canRenew' => !$hasPendingRequest,
            'moyasarPublishableKey' => config('moyasar.publishable_key') ?: null,
            'paymentCallbackUrl' => route('client-admin.renewal.payment.callback'),
            'bankDetails' => [
                'bank_name_ar' => 'البنك الأهلي السعودي',
                'bank_name_en' => 'Saudi National Bank (SNB)',
                'account_name' => 'Diyafah Platform',
                'iban' => 'SA0000000000000000000000',
                'account_number' => '0000000000',
                'swift' => 'NCBKSAJE',
            ],
        ]);
    }

    /**
     * Validate a discount code against the tenant's current plan and return the
     * resulting discount so the checkout UI can preview the new total.
     */
    public function applyDiscount(Request $request)
    {
        $request->validate(['code' => 'required|string|max:50']);

        $tenant = app('current_tenant');
        $plan = $tenant->plan_id ? Plan::find($tenant->plan_id) : null;

        if (!$plan) {
            return back()->withErrors(['code' => 'لا يمكن تحديد الباقة الحالية']);
        }

        $resolved = $this->resolveDiscount($request->input('code'), $plan);

        if ($resolved['error']) {
            return back()->withErrors(['code' => $resolved['error']]);
        }

        $price = (float) $plan->price;
        $net = round($price - $resolved['amount'], 2);

        return back()->with([
            'discount' => [
                'code' => $resolved['model']->code,
                'amount' => $resolved['amount'],
                'price' => $price,
                'net' => $net,
                // No VAT applied — total equals the net amount.
                'total_with_tax' => round($net, 2),
            ],
        ]);
    }

    /**
     * Resolve a discount code for a plan.
     *
     * @return array{model: ?DiscountCode, amount: float, error: ?string}
     */
    private function resolveDiscount(?string $code, Plan $plan): array
    {
        if (!$code) {
            return ['model' => null, 'amount' => 0.0, 'error' => null];
        }

        $model = DiscountCode::whereRaw('UPPER(code) = ?', [strtoupper(trim($code))])->first();

        if (!$model || !$model->isValid()) {
            return ['model' => null, 'amount' => 0.0, 'error' => 'كود الخصم غير صالح أو منتهي'];
        }

        if ($model->plan_id && $model->plan_id !== $plan->id) {
            return ['model' => null, 'amount' => 0.0, 'error' => 'كود الخصم لا ينطبق على باقتك الحالية'];
        }

        $price = (float) $plan->price;
        $amount = $model->type === 'percentage'
            ? round($price * ((float) $model->value / 100), 2)
            : (float) $model->value;
        $amount = max(0.0, min($amount, $price));

        return ['model' => $model, 'amount' => $amount, 'error' => null];
    }

    /**
     * Store renewal via bank transfer (manual).
     */
    public function store(Request $request)
    {
        $tenant = app('current_tenant');

        $hasPending = RenewalRequest::where('tenant_id', $tenant->id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPending) {
            return back()->with('error', 'لديك طلب تجديد قيد المراجعة بالفعل');
        }

        $validated = $request->validate([
            'receipt' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'notes' => 'nullable|string|max:1000',
            'discount_code' => 'nullable|string|max:50',
        ]);

        $plan = $tenant->plan_id ? Plan::find($tenant->plan_id) : null;
        $discount = $plan
            ? $this->resolveDiscount($validated['discount_code'] ?? null, $plan)
            : ['model' => null, 'amount' => 0.0, 'error' => null];

        if ($discount['error']) {
            return back()->withErrors(['discount_code' => $discount['error']]);
        }

        $receiptPath = $request->file('receipt')->store('renewal-receipts', 'public');

        $renewal = RenewalRequest::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $tenant->plan_id,
            'discount_code_id' => $discount['model']?->id,
            'base_amount' => $plan?->price,
            'discount_amount' => $discount['amount'],
            'status' => 'pending',
            'payment_method' => 'bank_transfer',
            'receipt_path' => $receiptPath,
            'notes' => $validated['notes'] ?? null,
            'requested_at' => now(),
        ]);

        ActivityLogger::log('renewal.submitted', 'Renewal request submitted (bank transfer)', [
            'renewal_id' => $renewal->id,
            'discount_amount' => $discount['amount'],
        ], $renewal);

        return back()->with('success', 'تم إرسال طلب التجديد بنجاح');
    }

    /**
     * Initiate a Moyasar invoice for renewal payment.
     */
    public function initiatePayment(Request $request)
    {
        $tenant = app('current_tenant');
        $planModel = $tenant->plan_id ? \App\Models\Plan::find($tenant->plan_id) : null;

        if (!$planModel) {
            return back()->with('error', 'لا يمكن تحديد سعر الباقة');
        }

        $hasPending = RenewalRequest::where('tenant_id', $tenant->id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPending) {
            return back()->with('error', 'لديك طلب تجديد قيد المراجعة بالفعل');
        }

        $request->validate(['discount_code' => 'nullable|string|max:50']);
        $discount = $this->resolveDiscount($request->input('discount_code'), $planModel);
        if ($discount['error']) {
            return back()->withErrors(['discount_code' => $discount['error']]);
        }

        $netAmount = round((float) $planModel->price - $discount['amount'], 2);

        $renewal = RenewalRequest::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $tenant->plan_id,
            'discount_code_id' => $discount['model']?->id,
            'base_amount' => $planModel->price,
            'discount_amount' => $discount['amount'],
            'status' => 'pending',
            'payment_method' => 'moyasar',
            'requested_at' => now(),
        ]);

        $moyasar = new MoyasarPaymentService();

        $result = $moyasar->createCharge([
            'amount' => $netAmount,
            'description' => "Diyafah - Renewal - {$planModel->name_en}",
            'customer_name' => $tenant->name,
            'customer_email' => $tenant->email,
            'reference' => 'renewal_' . $renewal->id,
            'order_id' => 'renewal_ord_' . $renewal->id,
            'metadata' => [
                'type' => 'renewal',
                'renewal_id' => $renewal->id,
                'tenant_id' => $tenant->id,
            ],
            'redirect_url' => route('client-admin.renewal.payment.callback'),
            'webhook_url' => route('renewal.payment.webhook'),
        ]);

        if (!$result['success']) {
            $renewal->delete();
            return back()->with('error', 'فشل في بدء عملية الدفع. حاول مرة أخرى.');
        }

        $renewal->update(['payment_charge_id' => $result['charge_id']]);

        return Inertia::location($result['redirect_url']);
    }

    /**
     * Handle Moyasar redirect callback after renewal payment.
     * The inline JS form posts the payment directly to Moyasar's API and we
     * receive only the payment ID via the redirect, so the renewal record is
     * created (or upgraded) here on a confirmed payment.
     */
    public function paymentCallback(Request $request)
    {
        $paymentId = $request->query('id') ?? $request->query('invoice_id');
        $tenant = app('current_tenant');

        if (!$paymentId) {
            return redirect()->route('client-admin.renewal.index')
                ->with('error', 'عملية الدفع غير صالحة');
        }

        // Idempotent: if this payment ID has already been processed, do nothing.
        $alreadyApproved = RenewalRequest::where('payment_charge_id', $paymentId)
            ->where('tenant_id', $tenant->id)
            ->where('status', 'approved')
            ->exists();
        if ($alreadyApproved) {
            return redirect()->route('client-admin.renewal.index')
                ->with('success', 'تم تجديد الاشتراك بنجاح عبر الدفع الإلكتروني');
        }

        $moyasar = new MoyasarPaymentService();
        $charge = $moyasar->retrieveCharge($paymentId);

        if (!$charge['success'] || $charge['status'] !== 'paid') {
            return redirect()->route('client-admin.renewal.index')
                ->with('error', 'لم يتم إكمال الدفع. حاول مرة أخرى.');
        }

        // Either upgrade an existing pending record (legacy redirect flow) or
        // create one now (inline form flow).
        $renewal = RenewalRequest::where('payment_charge_id', $paymentId)
            ->where('tenant_id', $tenant->id)
            ->first();

        if ($renewal) {
            $renewal->update([
                'status' => 'approved',
                'payment_transaction_id' => $charge['transaction_id'],
                'processed_at' => now(),
            ]);
        } else {
            $renewal = RenewalRequest::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $tenant->plan_id,
                'status' => 'approved',
                'payment_method' => 'moyasar',
                'payment_charge_id' => $paymentId,
                'payment_transaction_id' => $charge['transaction_id'],
                'requested_at' => now(),
                'processed_at' => now(),
            ]);
        }

        $currentEnd = $tenant->subscription_ends_at;
        $baseDate = ($currentEnd && $currentEnd->isFuture()) ? $currentEnd : now();

        $tenant->update([
            'subscription_ends_at' => $baseDate->copy()->addYear(),
            'is_active' => true,
        ]);

        $plan = $renewal->plan_id ? Plan::find($renewal->plan_id) : null;
        if ($plan) {
            app(InvoiceService::class)->createRenewalInvoice($tenant, $renewal->fresh(), $plan);
        }

        $this->markDiscountUsed($renewal);

        ActivityLogger::log('renewal.paid', 'Subscription renewed via Moyasar', [
            'renewal_id' => $renewal->id,
            'payment_id' => $paymentId,
        ], $renewal);

        return redirect()->route('client-admin.renewal.index')
            ->with('success', 'تم تجديد الاشتراك بنجاح عبر الدفع الإلكتروني');
    }

    /**
     * Bump the linked discount code's usage counter (once per renewal).
     */
    private function markDiscountUsed(RenewalRequest $renewal): void
    {
        if ($renewal->discount_code_id) {
            DiscountCode::where('id', $renewal->discount_code_id)->increment('current_uses');
        }
    }

    /**
     * Handle Moyasar webhook for renewal payments.
     */
    public function paymentWebhook(Request $request)
    {
        $payload = $request->all();
        $data = $payload['data'] ?? $payload;
        $invoiceId = $data['invoice_id'] ?? $data['id'] ?? null;
        $status = $data['status'] ?? null;

        Log::info('Moyasar renewal webhook', ['invoice_id' => $invoiceId, 'status' => $status]);

        if ($status === 'paid' && $invoiceId) {
            $renewal = RenewalRequest::where('payment_charge_id', $invoiceId)
                ->where('status', 'pending')
                ->first();

            if ($renewal) {
                $renewal->update([
                    'status' => 'approved',
                    'processed_at' => now(),
                ]);

                $tenant = $renewal->tenant;
                if ($tenant) {
                    $currentEnd = $tenant->subscription_ends_at;
                    $baseDate = ($currentEnd && $currentEnd->isFuture()) ? $currentEnd : now();

                    $tenant->update([
                        'subscription_ends_at' => $baseDate->copy()->addYear(),
                        'is_active' => true,
                    ]);

                    $plan = $renewal->plan_id ? Plan::find($renewal->plan_id) : null;
                    if ($plan) {
                        app(InvoiceService::class)->createRenewalInvoice($tenant, $renewal->fresh(), $plan);
                    }

                    $this->markDiscountUsed($renewal);
                }
            }
        }

        return response()->json(['status' => 'ok']);
    }
}
