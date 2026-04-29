<?php

namespace App\Console\Commands;

use App\Mail\SubscriptionExpiryWarningMail;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Mailer;
use Illuminate\Console\Command;

class CheckSubscriptionExpiry extends Command
{
    protected $signature = 'subscriptions:check-expiry';

    protected $description = 'Send expiry warning emails to tenants';

    public function handle(): void
    {
        $warningDays = [30, 15, 7, 1];

        foreach ($warningDays as $days) {
            $date = now()->addDays($days)->toDateString();

            $tenants = Tenant::where('subscription_ends_at', $date)
                ->where('is_active', true)
                ->get();

            foreach ($tenants as $tenant) {
                $admin = User::where('tenant_id', $tenant->id)
                    ->where('role', 'client_admin')
                    ->first();

                if ($admin) {
                    Mailer::sendIfConfigured(
                        $admin->email,
                        fn () => new SubscriptionExpiryWarningMail($tenant, $admin, $days),
                        "expiry warning ({$days}d)"
                    );
                }
            }

            $this->info("Sent {$tenants->count()} warnings for {$days}-day expiry");
        }
    }
}
