<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\HotelSetting;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\RenewalRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Unified "Establishment Account" page that bundles three previously
 * separate screens — establishment data, subscription renewal and
 * invoices — into one tabbed surface for the client admin. The original
 * controllers remain as the destination for form submissions, payment
 * callbacks and PDF downloads.
 */
class AccountController extends Controller
{
    public function index(Request $request)
    {
        $tenant = app('current_tenant');
        $tenantId = $tenant->id;

        // --- Establishment data ---
        $settings = HotelSetting::first() ?? new HotelSetting();

        // --- Renewal ---
        $planModel = $tenant->plan_id ? Plan::find($tenant->plan_id) : null;
        $renewals = RenewalRequest::where('tenant_id', $tenantId)
            ->latest('requested_at')
            ->get();
        $hasPendingRequest = $renewals->where('status', 'pending')->isNotEmpty();

        $renewalPayload = [
            'tenant' => [
                'name' => $tenant->name,
                'subscription_starts_at' => $tenant->subscription_starts_at?->toDateString(),
                'subscription_ends_at' => $tenant->subscription_ends_at?->toDateString(),
                'is_active' => $tenant->is_active,
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
        ];

        // --- Invoices (paginated) ---
        $invoices = Invoice::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['sent', 'paid', 'overdue'])
            ->with('items')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('client-admin/account/index', array_merge(
            ['settings' => $settings, 'invoices' => $invoices],
            $renewalPayload,
        ));
    }
}
