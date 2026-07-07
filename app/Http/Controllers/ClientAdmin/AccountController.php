<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\EstablishmentDocument;
use App\Models\HotelSetting;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\RenewalRequest;
use App\Models\Tenant;
use App\Support\RegistrationForm;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Unified "Establishment Account" page bundling five surfaces into one tabbed
 * screen for the client admin: subscription overview, profile & compliance,
 * renewal & checkout, subdomain/domain, and invoices. The dedicated controllers
 * (Renewal, Invoice, Domain, HotelSetting, Document, Otp) remain the destination
 * for form submissions, payment callbacks and PDF downloads.
 */
class AccountController extends Controller
{
    public function index(Request $request)
    {
        $tenant = Tenant::findOrFail(app('current_tenant_id'));
        $tenantId = $tenant->id;

        // Ensure a DNS verification token exists for the domain tab.
        if (!$tenant->dns_verification_token) {
            $tenant->update(['dns_verification_token' => Str::random(32)]);
            $tenant->refresh();
        }

        // --- Establishment data + compliance documents ---
        $settings = HotelSetting::first() ?? new HotelSetting();

        // Values captured for admin-defined custom registration fields, paired
        // with their labels (falling back to the raw key if a field was removed).
        $customValues = is_array($settings->custom_fields) ? $settings->custom_fields : [];
        $customDefs = RegistrationForm::customFields();
        $customFields = [];
        foreach ($customValues as $key => $value) {
            if ($value === null || $value === '') {
                continue;
            }
            $def = $customDefs[$key] ?? null;
            $customFields[] = [
                'key' => $key,
                'label_ar' => $def['label_ar'] ?? $key,
                'label_en' => $def['label_en'] ?? $key,
                'value' => is_array($value) ? implode(', ', $value) : (string) $value,
            ];
        }
        $documents = EstablishmentDocument::where('tenant_id', $tenantId)
            ->latest()
            ->get()
            ->map(fn (EstablishmentDocument $d) => [
                'id' => $d->id,
                'type' => $d->type,
                'title' => $d->title,
                'file_url' => $d->file_url,
                'expires_at' => $d->expires_at?->toDateString(),
                'status' => $d->status,
                'created_at' => $d->created_at?->toDateString(),
            ]);

        // --- Subscription / plan ---
        $planModel = $tenant->plan_id ? Plan::find($tenant->plan_id) : null;
        $planPayload = $planModel ? [
            'name_ar' => $planModel->name_ar,
            'name_en' => $planModel->name_en,
            'price' => $planModel->price,
            'billing_cycle' => $planModel->billing_cycle,
            'features_ar' => $planModel->features_ar ?? [],
            'features_en' => $planModel->features_en ?? [],
            'limits' => $planModel->limits ?? [],
        ] : null;

        $daysRemaining = null;
        if ($tenant->subscription_ends_at) {
            $daysRemaining = max(0, (int) round(now()->diffInDays($tenant->subscription_ends_at, false)));
        }

        $platformHost = parse_url(config('app.url'), PHP_URL_HOST) ?? 'diyafah.com';
        $subdomainUrl = $tenant->subdomain ? "https://{$tenant->subdomain}.{$platformHost}" : null;

        $subscription = [
            'status' => $tenant->is_active && ($daysRemaining === null || $daysRemaining > 0) ? 'active' : 'expired',
            'subscription_starts_at' => $tenant->subscription_starts_at?->toDateString(),
            'subscription_ends_at' => $tenant->subscription_ends_at?->toDateString(),
            'days_remaining' => $daysRemaining,
            'subdomain' => $tenant->subdomain,
            'subdomain_url' => $subdomainUrl,
            'ssl_status' => $tenant->ssl_status,
            'plan' => $planPayload,
        ];

        // --- Renewal payload ---
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
                'plan' => $planPayload,
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

        // --- Domain / subdomain ---
        $domain = [
            'tenant' => $tenant->only([
                'id', 'slug', 'subdomain', 'custom_domain',
                'dns_verification_token', 'dns_verified',
                'dns_verified_at', 'dns_last_checked_at',
                'subdomain_changes_count', 'subdomain_last_changed_at', 'ssl_status',
            ]),
            'platformHost' => $platformHost,
            'maxSubdomainChanges' => DomainController::MAX_SUBDOMAIN_CHANGES,
            'registrars' => [
                ['name' => 'Namecheap', 'url' => 'https://www.namecheap.com'],
                ['name' => 'GoDaddy', 'url' => 'https://www.godaddy.com'],
                ['name' => 'Cloudflare', 'url' => 'https://www.cloudflare.com'],
                ['name' => 'Saudi Network Information Center', 'url' => 'https://nic.sa'],
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
            [
                'settings' => $settings,
                'customFields' => $customFields,
                'contactEmail' => $tenant->email ?: $request->user()?->email,
                'documents' => $documents,
                'subscription' => $subscription,
                'domain' => $domain,
                'invoices' => $invoices,
            ],
            $renewalPayload,
        ));
    }
}
