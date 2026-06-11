<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\OtpGuard;
use App\Support\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DomainController extends Controller
{
    /** Soft cap on how many times a tenant may change its subdomain. */
    public const MAX_SUBDOMAIN_CHANGES = 3;

    public function show()
    {
        $tenant = Tenant::findOrFail(app('current_tenant_id'));

        if (!$tenant->dns_verification_token) {
            $tenant->update(['dns_verification_token' => Str::random(32)]);
            $tenant->refresh();
        }

        return Inertia::render('client-admin/domain/index', [
            'tenant' => $tenant->only([
                'id', 'slug', 'subdomain', 'custom_domain',
                'dns_verification_token', 'dns_verified',
                'dns_verified_at', 'dns_last_checked_at',
                'subdomain_changes_count', 'subdomain_last_changed_at', 'ssl_status',
            ]),
            'platformHost' => parse_url(config('app.url'), PHP_URL_HOST) ?? 'diyafah.com',
            'maxSubdomainChanges' => self::MAX_SUBDOMAIN_CHANGES,
            'registrars' => [
                ['name' => 'Namecheap', 'url' => 'https://www.namecheap.com'],
                ['name' => 'GoDaddy', 'url' => 'https://www.godaddy.com'],
                ['name' => 'Cloudflare', 'url' => 'https://www.cloudflare.com'],
                ['name' => 'Saudi Network Information Center', 'url' => 'https://nic.sa'],
            ],
        ]);
    }

    public function save(Request $request)
    {
        $tenant = Tenant::findOrFail(app('current_tenant_id'));

        $validated = $request->validate([
            'custom_domain' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i',
            ],
        ]);

        $domain = $validated['custom_domain'] ? strtolower($validated['custom_domain']) : null;

        // If domain is already in use by another tenant, reject.
        if ($domain && Tenant::where('custom_domain', $domain)->where('id', '!=', $tenant->id)->exists()) {
            return back()->withErrors(['custom_domain' => 'هذا النطاق مستخدم بالفعل']);
        }

        $tenant->update([
            'custom_domain' => $domain,
            'dns_verified' => false,
            'dns_verified_at' => null,
            'ssl_status' => $domain ? 'pending' : 'none',
        ]);

        ActivityLogger::log('domain.saved', 'Custom domain updated', ['custom_domain' => $domain]);

        return back()->with('success', 'تم حفظ النطاق. يرجى إعداد سجلات DNS ثم التحقق.');
    }

    public function verify()
    {
        $tenant = Tenant::findOrFail(app('current_tenant_id'));

        if (!$tenant->custom_domain) {
            return back()->with('error', 'لم يتم تعيين نطاق مخصص');
        }

        $verified = $this->checkDns($tenant->custom_domain, $tenant->dns_verification_token);

        $tenant->update([
            'dns_verified' => $verified,
            'dns_verified_at' => $verified ? now() : null,
            'dns_last_checked_at' => now(),
            // SSL is provisioned automatically once DNS points at the platform;
            // we surface a heuristic status until real cert tracking lands.
            'ssl_status' => $verified ? 'active' : 'pending',
        ]);

        ActivityLogger::log('domain.verified', $verified ? 'Domain DNS verified' : 'Domain DNS verification failed', [
            'custom_domain' => $tenant->custom_domain,
            'verified' => $verified,
        ]);

        if ($verified) {
            return back()->with('success', 'تم التحقق من النطاق بنجاح!');
        }

        return back()->with('error', 'لم يتم العثور على سجل DNS المطلوب. تأكد من الإعداد وحاول مرة أخرى.');
    }

    /**
     * Change the tenant's subdomain. Sensitive: requires a verified OTP window,
     * enforces uniqueness, and tracks the number of changes.
     */
    public function updateSubdomain(Request $request, OtpGuard $otp)
    {
        $otp->assertPassed('subdomain_change');

        $tenant = Tenant::findOrFail(app('current_tenant_id'));

        if ($tenant->subdomain_changes_count >= self::MAX_SUBDOMAIN_CHANGES) {
            return back()->withErrors(['subdomain' => 'لقد بلغت الحد الأقصى لعدد مرات تعديل النطاق الفرعي']);
        }

        $validated = $request->validate([
            'subdomain' => [
                'required', 'string', 'min:3', 'max:60', 'alpha_dash',
                Rule::unique('tenants', 'subdomain')->ignore($tenant->id),
            ],
        ]);

        $subdomain = strtolower($validated['subdomain']);
        $old = $tenant->subdomain;

        $tenant->update([
            'subdomain' => $subdomain,
            'subdomain_changes_count' => $tenant->subdomain_changes_count + 1,
            'subdomain_last_changed_at' => now(),
        ]);

        ActivityLogger::log('subdomain.changed', "Subdomain changed from «{$old}» to «{$subdomain}»", [
            'old' => $old,
            'new' => $subdomain,
        ]);

        return back()->with('success', 'تم تحديث النطاق الفرعي بنجاح');
    }

    /**
     * Verify that a TXT record with the verification token exists at _diyafah-verify.<domain>.
     */
    protected function checkDns(string $domain, string $token): bool
    {
        $record = "_diyafah-verify.{$domain}";

        if (!function_exists('dns_get_record')) {
            return false;
        }

        $records = @dns_get_record($record, DNS_TXT) ?: [];

        foreach ($records as $entry) {
            $txt = $entry['txt'] ?? ($entry['entries'][0] ?? '');
            if (is_string($txt) && str_contains($txt, $token)) {
                return true;
            }
        }

        return false;
    }
}
