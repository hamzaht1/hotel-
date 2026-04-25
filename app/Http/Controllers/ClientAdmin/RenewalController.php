<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\RenewalRequest;
use App\Services\InvoiceService;
use App\Services\TapPaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
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
                ] : null,
            ],
            'renewals' => $renewals,
            'invoices' => $invoices,
            'canRenew' => !$hasPendingRequest,
            'tapPublicKey' => config('tap.public_key'),
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
        ]);

        $receiptPath = $request->file('receipt')->store('renewal-receipts', 'public');

        RenewalRequest::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $tenant->plan_id,
            'status' => 'pending',
            'payment_method' => 'bank_transfer',
            'receipt_path' => $receiptPath,
            'notes' => $validated['notes'] ?? null,
            'requested_at' => now(),
        ]);

        return back()->with('success', 'تم إرسال طلب التجديد بنجاح');
    }

    /**
     * Initiate Tap payment for renewal.
     */
    public function initiateTapPayment()
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

        // Create a pending renewal request first
        $renewal = RenewalRequest::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $tenant->plan_id,
            'status' => 'pending',
            'payment_method' => 'tap',
            'requested_at' => now(),
        ]);

        $tap = new TapPaymentService();

        $result = $tap->createCharge([
            'amount' => (float) $planModel->price,
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
            'redirect_url' => route('client-admin.renewal.tap.callback'),
            'webhook_url' => route('renewal.tap.webhook'),
        ]);

        if (!$result['success']) {
            $renewal->delete();
            return back()->with('error', 'فشل في بدء عملية الدفع. حاول مرة أخرى.');
        }

        $renewal->update(['tap_charge_id' => $result['charge_id']]);

        return Inertia::location($result['redirect_url']);
    }

    /**
     * Handle Tap redirect callback after renewal payment.
     */
    public function tapCallback(Request $request)
    {
        $tapId = $request->query('tap_id');
        $tenant = app('current_tenant');

        if (!$tapId) {
            return redirect()->route('client-admin.renewal.index')
                ->with('error', 'عملية الدفع غير صالحة');
        }

        $tap = new TapPaymentService();
        $charge = $tap->retrieveCharge($tapId);

        $renewal = RenewalRequest::where('tap_charge_id', $tapId)
            ->where('tenant_id', $tenant->id)
            ->first();

        if (!$renewal) {
            return redirect()->route('client-admin.renewal.index')
                ->with('error', 'طلب التجديد غير موجود');
        }

        if (!$charge['success'] || $charge['status'] !== 'CAPTURED') {
            $renewal->update(['status' => 'rejected', 'notes' => 'Tap payment not captured']);
            return redirect()->route('client-admin.renewal.index')
                ->with('error', 'لم يتم إكمال الدفع. حاول مرة أخرى.');
        }

        // Payment successful — auto-approve renewal
        $renewal->update([
            'status' => 'approved',
            'tap_transaction_id' => $charge['transaction_id'],
            'processed_at' => now(),
        ]);

        // Extend subscription
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

        return redirect()->route('client-admin.renewal.index')
            ->with('success', 'تم تجديد الاشتراك بنجاح عبر الدفع الإلكتروني');
    }

    /**
     * Handle Tap webhook for renewal payments.
     */
    public function tapWebhook(Request $request)
    {
        $chargeId = $request->input('id');
        $status = $request->input('status');

        Log::info('Tap renewal webhook', ['charge_id' => $chargeId, 'status' => $status]);

        if ($status === 'CAPTURED' && $chargeId) {
            $renewal = RenewalRequest::where('tap_charge_id', $chargeId)
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
                }
            }
        }

        return response()->json(['status' => 'ok']);
    }
}
