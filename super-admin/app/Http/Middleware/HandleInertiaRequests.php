<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

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
                ] : null,
                // ['*'] for super_admin (implicit all), specific keys for staff.
                'permissions' => $user ? $user->permissionKeys() : [],
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'locale' => app()->getLocale(),
            'dir'    => app()->getLocale() === 'ar' ? 'rtl' : 'ltr',

            // Base URL for the public storage disk; respects R2 / local automatically.
            'storageBaseUrl' => rtrim(config('filesystems.disks.public.url') ?: (config('app.url') . '/storage'), '/'),
            // Main public app base URL — used for cross-app previews (e.g. /page/{slug}).
            'mainAppUrl' => rtrim(env('MAIN_APP_URL', env('APP_URL', 'http://localhost')), '/'),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
