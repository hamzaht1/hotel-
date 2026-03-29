<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\SetupController;
use App\Http\Controllers\TenantSiteController;
use App\Http\Controllers\ClientAdmin\DashboardController as ClientAdminDashboard;
use App\Http\Controllers\ClientAdmin\RoomController;
use App\Http\Controllers\ClientAdmin\GalleryController;
use App\Http\Controllers\ClientAdmin\SiteTextController;
use App\Http\Controllers\ClientAdmin\SiteSectionController;
use App\Http\Controllers\ClientAdmin\ContactSettingController;
use App\Http\Controllers\ClientAdmin\HotelSettingController;
use App\Http\Controllers\ClientAdmin\ReportController;
use App\Http\Controllers\ClientAdmin\InvoiceController;
use App\Http\Controllers\ClientAdmin\ServiceCategoryController;
use App\Http\Controllers\ClientAdmin\ServiceController;
use App\Http\Controllers\ClientAdmin\StaffController;
use App\Http\Controllers\ClientAdmin\RoleController;
use App\Http\Controllers\ClientAdmin\IntegrationController;
use App\Http\Controllers\ClientAdmin\RenewalController;

// ─── Public Routes ──────────────────────────────────────────
Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/welcome', function () {
    return Inertia::render('welcome');
})->name('welcome');

Route::get('/template-test', function () {
    $templateTranslations = __('templates');
    return Inertia::render('TemplateTest', [
        'templateTranslations' => $templateTranslations
    ]);
})->name('template.test');

if (!function_exists('inertiaWithLang')) {
    function inertiaWithLang($page) {
        $lang = syncLangFiles('messages');
        return Inertia::render($page, ['lang' => $lang]);
    }
}

Route::get('/Privacy', fn () => inertiaWithLang('public/Privacy'))->name('privacy');
Route::get('/templates', fn () => inertiaWithLang('public/Templates'))->name('templates');

// ─── Template Preview Routes ────────────────────────────────
Route::prefix('template')->name('template.')->group(function () {
    Route::get('/riyadh', function () {
        return Inertia::render('templates/Riyadh/index', [
            'templateTranslations' => __('templates', [], app()->getLocale()),
        ]);
    })->name('riyadh');

    Route::get('/madina', function () {
        $locale = app()->getLocale();
        return Inertia::render('templates/Madina/index', [
            'templateTranslations' => __('madina', [], $locale),
            'locale' => $locale,
        ]);
    })->name('madina');
});

// ─── Locale Switcher ────────────────────────────────────────
Route::get('/locale/{locale}', function ($locale) {
    if (in_array($locale, ['ar', 'en'])) {
        session()->put('locale', $locale);
    }
    return back(status: 303);
})->name('locale.switch');

// ─── Setup Wizard ───────────────────────────────────────────
Route::prefix('setup')->name('setup.')->group(function () {
    Route::get('plan', [SetupController::class, 'plan'])->name('plan');
    Route::post('plan', [SetupController::class, 'storePlan'])->name('plan.store');

    Route::get('template', [SetupController::class, 'template'])->name('template');
    Route::post('template', [SetupController::class, 'storeTemplate'])->name('template.store');

    Route::get('org', [SetupController::class, 'org'])->name('org');
    Route::post('org', [SetupController::class, 'storeOrg'])->name('org.store');

    Route::get('account', [SetupController::class, 'account'])->name('account');
    Route::post('account', [SetupController::class, 'storeAccount'])->name('account.store');

    Route::get('verify-otp', [SetupController::class, 'verifyOtp'])->name('verifyOtp');
    Route::post('verify-otp', [SetupController::class, 'checkOtp'])->name('verifyOtp.check');
    Route::post('resend-otp', [SetupController::class, 'resendOtp'])->name('resendOtp');

    Route::get('review', [SetupController::class, 'review'])->name('review');

    Route::get('payment-method', [SetupController::class, 'paymentMethod'])->name('paymentMethod');
    Route::post('payment-method', [SetupController::class, 'storePayment'])->name('payment.store');

    Route::get('pending', [SetupController::class, 'pending'])->name('pending');
});

// ─── Tenant Public Site (by slug) ───────────────────────────
Route::get('/hotel/{slug}', [TenantSiteController::class, 'show'])->name('tenant.site');

// ─── Auth Routes ────────────────────────────────────────────
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

// ─── Authenticated Dashboard (default) ─────────────────────
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return redirect()->route('client-admin.dashboard');
    })->name('dashboard');
});

// ─── CMS Pages ─────────────────────────────────────────────
Route::get('/page/{slug}', [PageController::class, 'show'])->name('page.show');

// ─── Client Admin Routes ────────────────────────────────────
Route::middleware(['auth', 'verified', 'role:client_admin,staff', 'tenant'])
    ->prefix('client-admin')
    ->name('client-admin.')
    ->group(function () {
        Route::get('/', [ClientAdminDashboard::class, 'index'])->name('dashboard');

        // Rooms CRUD
        Route::get('rooms', [RoomController::class, 'index'])->name('rooms.index');
        Route::get('rooms/create', [RoomController::class, 'create'])->name('rooms.create');
        Route::post('rooms', [RoomController::class, 'store'])->name('rooms.store');
        Route::get('rooms/{room}/edit', [RoomController::class, 'edit'])->name('rooms.edit');
        Route::put('rooms/{room}', [RoomController::class, 'update'])->name('rooms.update');
        Route::delete('rooms/{room}', [RoomController::class, 'destroy'])->name('rooms.destroy');

        // Gallery
        Route::get('gallery', [GalleryController::class, 'index'])->name('gallery.index');
        Route::post('gallery', [GalleryController::class, 'store'])->name('gallery.store');
        Route::put('gallery/{galleryImage}', [GalleryController::class, 'update'])->name('gallery.update');
        Route::delete('gallery/{galleryImage}', [GalleryController::class, 'destroy'])->name('gallery.destroy');
        Route::post('gallery/reorder', [GalleryController::class, 'reorder'])->name('gallery.reorder');

        // Site Texts
        Route::get('site-texts', [SiteTextController::class, 'index'])->name('site-texts.index');
        Route::put('site-texts', [SiteTextController::class, 'update'])->name('site-texts.update');

        // Site Sections
        Route::get('site-sections', [SiteSectionController::class, 'index'])->name('site-sections.index');
        Route::post('site-sections/{siteSection}/toggle', [SiteSectionController::class, 'toggle'])->name('site-sections.toggle');
        Route::post('site-sections/reorder', [SiteSectionController::class, 'reorder'])->name('site-sections.reorder');

        // Contact Settings
        Route::get('contact-settings', [ContactSettingController::class, 'edit'])->name('contact-settings.edit');
        Route::put('contact-settings', [ContactSettingController::class, 'update'])->name('contact-settings.update');

        // Hotel Settings
        Route::get('hotel-settings', [HotelSettingController::class, 'edit'])->name('hotel-settings.edit');
        Route::put('hotel-settings', [HotelSettingController::class, 'update'])->name('hotel-settings.update');

        // Reports
        Route::get('reports/subscriptions', [ReportController::class, 'subscriptions'])->name('reports.subscriptions');
        Route::get('reports/messages', [ReportController::class, 'messages'])->name('reports.messages');
        Route::post('reports/messages', [ReportController::class, 'sendMessage'])->name('reports.messages.send');

        // Service Categories
        Route::get('service-categories', [ServiceCategoryController::class, 'index'])->name('service-categories.index');
        Route::post('service-categories', [ServiceCategoryController::class, 'store'])->name('service-categories.store');
        Route::put('service-categories/{serviceCategory}', [ServiceCategoryController::class, 'update'])->name('service-categories.update');
        Route::delete('service-categories/{serviceCategory}', [ServiceCategoryController::class, 'destroy'])->name('service-categories.destroy');

        // Services
        Route::get('services', [ServiceController::class, 'index'])->name('services.index');
        Route::get('services/create', [ServiceController::class, 'create'])->name('services.create');
        Route::post('services', [ServiceController::class, 'store'])->name('services.store');
        Route::get('services/{service}/edit', [ServiceController::class, 'edit'])->name('services.edit');
        Route::put('services/{service}', [ServiceController::class, 'update'])->name('services.update');
        Route::delete('services/{service}', [ServiceController::class, 'destroy'])->name('services.destroy');

        // Renewal
        Route::get('renewal', [RenewalController::class, 'index'])->name('renewal.index');
        Route::post('renewal', [RenewalController::class, 'store'])->name('renewal.store');

        // Invoices (read-only for client)
        Route::get('invoices', [InvoiceController::class, 'index'])->name('invoices.index');
        Route::get('invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf'])->name('invoices.pdf');

        // Integrations
        Route::get('integrations', [IntegrationController::class, 'index'])->name('integrations.index');
        Route::post('integrations/{provider}/toggle', [IntegrationController::class, 'toggle'])->name('integrations.toggle');

        // Staff Management
        Route::middleware('can:staff.view')->group(function () {
            Route::get('staff', [StaffController::class, 'index'])->name('staff.index');
            Route::get('staff/create', [StaffController::class, 'create'])->middleware('can:staff.create')->name('staff.create');
            Route::post('staff', [StaffController::class, 'store'])->middleware('can:staff.create')->name('staff.store');
            Route::get('staff/{user}/edit', [StaffController::class, 'edit'])->middleware('can:staff.edit')->name('staff.edit');
            Route::put('staff/{user}', [StaffController::class, 'update'])->middleware('can:staff.edit')->name('staff.update');
            Route::delete('staff/{user}', [StaffController::class, 'destroy'])->middleware('can:staff.delete')->name('staff.destroy');
        });

        // Role Management
        Route::middleware('can:staff.view')->group(function () {
            Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
            Route::post('roles', [RoleController::class, 'store'])->middleware('can:staff.create')->name('roles.store');
            Route::put('roles/{role}', [RoleController::class, 'update'])->middleware('can:staff.edit')->name('roles.update');
            Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('can:staff.delete')->name('roles.destroy');
        });
    });

// ─── 404 Fallback ───────────────────────────────────────────
Route::fallback(fn () => Inertia::render('public/NotFound'));
