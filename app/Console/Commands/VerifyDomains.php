<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;

class VerifyDomains extends Command
{
    protected $signature = 'domains:verify {--only-unverified}';

    protected $description = 'Run DNS verification for tenant custom domains';

    public function handle(): int
    {
        $query = Tenant::query()->whereNotNull('custom_domain');

        if ($this->option('only-unverified')) {
            $query->where('dns_verified', false);
        }

        $tenants = $query->get();
        $checked = 0;
        $verified = 0;

        foreach ($tenants as $tenant) {
            $wasVerified = $tenant->dns_verified;
            $isVerified = $this->checkDns($tenant->custom_domain, $tenant->dns_verification_token);

            $tenant->update([
                'dns_verified' => $isVerified,
                'dns_verified_at' => $isVerified && !$wasVerified ? now() : $tenant->dns_verified_at,
                'dns_last_checked_at' => now(),
            ]);

            $checked++;
            if ($isVerified) {
                $verified++;
            }

            $this->line(sprintf(
                '%s %s → %s',
                $tenant->custom_domain,
                $isVerified ? '✓' : '✗',
                $tenant->name,
            ));
        }

        $this->info("Checked: {$checked}, verified: {$verified}");

        return self::SUCCESS;
    }

    protected function checkDns(string $domain, ?string $token): bool
    {
        if (!$token || !function_exists('dns_get_record')) {
            return false;
        }

        $records = @dns_get_record("_diyafah-verify.{$domain}", DNS_TXT) ?: [];

        foreach ($records as $entry) {
            $txt = $entry['txt'] ?? ($entry['entries'][0] ?? '');
            if (is_string($txt) && str_contains($txt, $token)) {
                return true;
            }
        }

        return false;
    }
}
