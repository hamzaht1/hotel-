<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DomainController extends Controller
{
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
            ]),
            'platformHost' => parse_url(config('app.url'), PHP_URL_HOST) ?? 'diyafah.com',
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
        ]);

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
        ]);

        if ($verified) {
            return back()->with('success', 'تم التحقق من النطاق بنجاح!');
        }

        return back()->with('error', 'لم يتم العثور على سجل DNS المطلوب. تأكد من الإعداد وحاول مرة أخرى.');
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
