<?php

namespace App\Http\Middleware;

use App\Models\SiteSetting;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user ? [
                    ...$user->toArray(),
                    'role' => $user->role ?? null,
                    'tenant_id' => $user->tenant_id ?? null,
                    'permissions' => $user->getPermissions(),
                ] : null,
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',

            'locale' => app()->getLocale(),
            'dir'    => app()->getLocale() === 'ar' ? 'rtl' : 'ltr',

            // Base URL for the public storage disk. Switches automatically:
            // - R2 / S3 configured  → absolute CDN URL (e.g. https://pub-xxx.r2.dev)
            // - local              → APP_URL/storage
            'storageBaseUrl' => rtrim(config('filesystems.disks.public.url') ?: (config('app.url') . '/storage'), '/'),

            'tenant' => app()->bound('current_tenant') ? app('current_tenant') : null,
            'siteSettings' => fn () => SiteSetting::getAllGrouped(),
            'showReviewPopup' => fn () => $this->shouldShowReviewPopup($user),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }

    private function shouldShowReviewPopup($user): bool
    {
        if (!$user || $user->role !== 'client_admin') {
            return false;
        }

        $tenant = $user->tenant;
        if (!$tenant) {
            return false;
        }

        if ($tenant->review_popup_shown_at) {
            return false;
        }

        if (!$tenant->subscription_starts_at) {
            return false;
        }

        return $tenant->subscription_starts_at->addDays(7)->isPast();
    }
    
}
