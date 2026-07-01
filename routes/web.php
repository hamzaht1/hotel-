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
use App\Http\Controllers\ClientAdmin\SystemSettingController;
use App\Http\Controllers\ClientAdmin\SiteBrandingController;
use App\Http\Controllers\ClientAdmin\ReportController;
use App\Http\Controllers\ClientAdmin\InvoiceController;
use App\Http\Controllers\ClientAdmin\ServiceCategoryController;
use App\Http\Controllers\ClientAdmin\ServiceController;
use App\Http\Controllers\ClientAdmin\StaffController;
use App\Http\Controllers\ClientAdmin\RoleController;
use App\Http\Controllers\ClientAdmin\IntegrationController;
use App\Http\Controllers\ClientAdmin\AccountController;
use App\Http\Controllers\ClientAdmin\RenewalController;
use App\Http\Controllers\ClientAdmin\ReviewController as ClientReviewController;
use App\Http\Controllers\ClientAdmin\DomainController;
use App\Http\Controllers\ClientAdmin\OtpController;
use App\Http\Controllers\ClientAdmin\DocumentController;
use App\Http\Controllers\ReviewSubmissionController;

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
Route::get('/templates', function () {
    syncLangFiles('messages');

    // Show every template that is either active OR explicitly marked coming-soon.
    // Inactive-without-coming-soon are drafts and stay hidden.
    $templates = \App\Models\Template::query()
        ->where(function ($q) {
            $q->where('is_active', true)
                ->orWhere('is_coming_soon', true);
        })
        ->orderBy('sort_order')
        ->orderBy('id')
        ->get()
        ->map(function ($t) {
            $previewUrl = $t->preview_image
                ? \Illuminate\Support\Facades\Storage::disk('public')->url($t->preview_image)
                : null;

            return [
                'id' => $t->id,
                'key' => $t->key,
                'name_ar' => $t->name_ar,
                'name_en' => $t->name_en,
                'description_ar' => $t->description_ar,
                'description_en' => $t->description_en,
                'preview_url' => $previewUrl,
                'demo_url' => $t->demo_url,
                // City is the only region link the admin actually controls (in the
                // template form). Drive the filter tags from it so no stale/seeded
                // region (e.g. "المنطقة الوسطى") shows up unless it was assigned.
                'city_ar' => $t->city_ar,
                'city_en' => $t->city_en,
                'is_coming_soon' => (bool) ($t->is_coming_soon ?? false) || !(bool) $t->is_active,
            ];
        })
        ->values();

    return \Inertia\Inertia::render('public/Templates', [
        'templates' => $templates,
    ]);
})->name('templates');

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
// Flashes `locale_switched` so PageController::show knows the user
// explicitly chose this locale and skips its default-AR override
// for the redirected request.
Route::get('/locale/{locale}', function ($locale) {
    if (in_array($locale, ['ar', 'en'])) {
        session()->put('locale', $locale);
        session()->flash('locale_switched', true);
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
    Route::post('payment', [SetupController::class, 'initiatePayment'])->name('payment.initiate');
    Route::get('payment-callback', [SetupController::class, 'paymentCallback'])->name('payment.callback');

    Route::get('pending', [SetupController::class, 'pending'])->name('pending');
    Route::get('complete', [SetupController::class, 'complete'])->name('complete');
});

// ─── Payment Webhooks (no auth, CSRF excluded in bootstrap/app.php) ──
Route::post('/webhooks/payment/setup', [SetupController::class, 'paymentWebhook'])->name('setup.payment.webhook');
Route::post('/webhooks/payment/renewal', [RenewalController::class, 'paymentWebhook'])->name('renewal.payment.webhook');

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
Route::post('/page/{slug}/submit', [PageController::class, 'submit'])->name('page.submit');

// ─── Contact Form (public) ─────────────────────────────────
Route::post('/contact', [\App\Http\Controllers\ContactController::class, 'store'])->name('contact.store');
Route::post('/hotel/{tenantSlug}/contact', [\App\Http\Controllers\ContactController::class, 'store'])->name('tenant.contact.store');

// ─── Public Review Submission ───────────────────────────────
Route::get('/hotel/{tenantSlug}/review', [ReviewSubmissionController::class, 'show'])->name('review.show');
Route::post('/hotel/{tenantSlug}/review', [ReviewSubmissionController::class, 'store'])->name('review.store');
Route::get('/review/{token}', [ReviewSubmissionController::class, 'showByToken'])->name('review.thanks');

// ─── Public Service Booking ─────────────────────────────────
Route::get('/hotel/{tenantSlug}/services/{service}/book', [\App\Http\Controllers\ServiceBookingController::class, 'show'])->name('service.booking.show');
Route::post('/hotel/{tenantSlug}/services/{service}/book', [\App\Http\Controllers\ServiceBookingController::class, 'store'])->name('service.booking.store');

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
        Route::post('site-sections', [SiteSectionController::class, 'store'])->name('site-sections.store');
        Route::post('site-sections/reorder', [SiteSectionController::class, 'reorder'])->name('site-sections.reorder');
        Route::post('site-sections/{siteSection}/toggle', [SiteSectionController::class, 'toggle'])->name('site-sections.toggle');
        Route::delete('site-sections/{siteSection}', [SiteSectionController::class, 'destroy'])->name('site-sections.destroy');

        // Contact Settings
        Route::get('contact-settings', [ContactSettingController::class, 'edit'])->name('contact-settings.edit');
        Route::put('contact-settings', [ContactSettingController::class, 'update'])->name('contact-settings.update');

        // Hotel Settings
        Route::get('hotel-settings', [HotelSettingController::class, 'edit'])->name('hotel-settings.edit');
        Route::put('hotel-settings', [HotelSettingController::class, 'update'])->name('hotel-settings.update');

        // Unified Establishment Account page (tabs: overview / profile / renewal / domain / invoices)
        Route::get('account', [AccountController::class, 'index'])->name('account.index');

        // OTP gate for sensitive account operations (profile / subdomain)
        Route::post('account/otp/request', [OtpController::class, 'request'])->name('account.otp.request');
        Route::post('account/otp/verify', [OtpController::class, 'verify'])->name('account.otp.verify');

        // Establishment regulatory documents
        Route::post('account/documents', [DocumentController::class, 'store'])->name('account.documents.store');
        Route::delete('account/documents/{document}', [DocumentController::class, 'destroy'])->name('account.documents.destroy');

        // System Settings (tenant-level branding/identity, mirrors super-admin/site-settings)
        Route::get('system-settings', [SystemSettingController::class, 'edit'])->name('system-settings.edit');
        Route::put('system-settings', [SystemSettingController::class, 'update'])->name('system-settings.update');

        // Unified live-preview branding editor — consolidates logo, hero image,
        // hero text, colors, footer, social, and all site_texts in one screen.
        Route::get('site-branding', [SiteBrandingController::class, 'index'])->name('site-branding.index');
        Route::post('site-branding', [SiteBrandingController::class, 'update'])->name('site-branding.update');

        // Reports
        Route::get('reports/financial', [ReportController::class, 'financial'])->name('reports.financial');
        Route::get('reports/subscriptions', [ReportController::class, 'subscriptions'])->name('reports.subscriptions');

        // Support (conversations with super-admin)
        Route::get('support', [\App\Http\Controllers\ClientAdmin\SupportController::class, 'index'])->name('support.index');
        Route::get('support/create', [\App\Http\Controllers\ClientAdmin\SupportController::class, 'create'])->name('support.create');
        Route::post('support', [\App\Http\Controllers\ClientAdmin\SupportController::class, 'store'])->name('support.store');
        Route::get('support/{conversation}', [\App\Http\Controllers\ClientAdmin\SupportController::class, 'show'])->name('support.show');
        Route::post('support/{conversation}/reply', [\App\Http\Controllers\ClientAdmin\SupportController::class, 'reply'])->name('support.reply');

        // Service Bookings (inbox)
        Route::get('service-bookings', [\App\Http\Controllers\ClientAdmin\ServiceBookingController::class, 'index'])->name('service-bookings.index');
        Route::post('service-bookings/{booking}/status', [\App\Http\Controllers\ClientAdmin\ServiceBookingController::class, 'updateStatus'])->name('service-bookings.status');

        // Contact Messages inbox
        Route::get('contact-messages', [\App\Http\Controllers\ClientAdmin\ContactMessageController::class, 'index'])->name('contact-messages.index');
        Route::post('contact-messages/{message}/read', [\App\Http\Controllers\ClientAdmin\ContactMessageController::class, 'markRead'])->name('contact-messages.read');

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
        Route::get('services/{service}/required-fields', [ServiceController::class, 'requiredFields'])->name('services.required-fields');
        Route::post('services/{service}/required-fields', [ServiceController::class, 'saveRequiredFields'])->name('services.required-fields.save');
        Route::delete('service-images/{image}', [ServiceController::class, 'destroyImage'])->name('services.images.destroy');

        // Renewal
        Route::get('renewal', [RenewalController::class, 'index'])->name('renewal.index');
        Route::post('renewal', [RenewalController::class, 'store'])->name('renewal.store');
        Route::post('renewal/payment', [RenewalController::class, 'initiatePayment'])->name('renewal.payment.initiate');
        Route::get('renewal/payment-callback', [RenewalController::class, 'paymentCallback'])->name('renewal.payment.callback');
        Route::post('renewal/apply-discount', [RenewalController::class, 'applyDiscount'])->name('renewal.apply-discount');

        // Reviews
        Route::get('reviews', [ClientReviewController::class, 'index'])->name('reviews.index');
        Route::get('reviews/form', [ClientReviewController::class, 'form'])->name('reviews.form');
        Route::post('reviews/form', [ClientReviewController::class, 'saveForm'])->name('reviews.form.save');
        Route::get('reviews/{review}', [ClientReviewController::class, 'show'])->name('reviews.show');
        Route::post('reviews/{review}/publish', [ClientReviewController::class, 'togglePublished'])->name('reviews.publish');
        Route::post('reviews/{review}/reply', [ClientReviewController::class, 'reply'])->name('reviews.reply');

        // Review popup (7-day satisfaction check)
        Route::post('review-popup', [\App\Http\Controllers\ClientAdmin\ReviewPopupController::class, 'submit'])->name('review-popup.submit');
        Route::post('review-popup/dismiss', [\App\Http\Controllers\ClientAdmin\ReviewPopupController::class, 'dismiss'])->name('review-popup.dismiss');

        // Domain management
        Route::get('domain', [DomainController::class, 'show'])->name('domain.show');
        Route::post('domain', [DomainController::class, 'save'])->name('domain.save');
        Route::post('domain/verify', [DomainController::class, 'verify'])->name('domain.verify');
        Route::post('domain/subdomain', [DomainController::class, 'updateSubdomain'])->name('domain.subdomain');

        // Invoices (read-only for client, + receipt upload + template picker)
        Route::get('invoices', [InvoiceController::class, 'index'])->name('invoices.index');
        Route::get('invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf'])->name('invoices.pdf');
        Route::get('invoices/{invoice}/preview', [InvoiceController::class, 'preview'])->name('invoices.preview');
        Route::post('invoices/{invoice}/receipt', [InvoiceController::class, 'uploadReceipt'])->name('invoices.receipt');
        Route::post('invoices/{invoice}/template', [InvoiceController::class, 'updateTemplate'])->name('invoices.template');

        // Integrations
        Route::get('integrations', [IntegrationController::class, 'index'])->name('integrations.index');
        Route::post('integrations/google-analytics', [IntegrationController::class, 'saveGoogleAnalytics'])->name('integrations.google-analytics.save');
        Route::post('integrations/{provider}/toggle', [IntegrationController::class, 'toggle'])->name('integrations.toggle');

        // Staff Management
        Route::middleware('can:staff.view')->group(function () {
            Route::get('staff', [StaffController::class, 'index'])->name('staff.index');
            Route::get('staff/create', [StaffController::class, 'create'])->middleware('can:staff.create')->name('staff.create');
            Route::post('staff', [StaffController::class, 'store'])->middleware('can:staff.create')->name('staff.store');
            Route::get('staff/{user}/edit', [StaffController::class, 'edit'])->middleware('can:staff.edit')->name('staff.edit');
            Route::put('staff/{user}', [StaffController::class, 'update'])->middleware('can:staff.edit')->name('staff.update');
            Route::delete('staff/{user}', [StaffController::class, 'destroy'])->middleware('can:staff.delete')->name('staff.destroy');
            Route::post('staff/{user}/reset-password', [StaffController::class, 'resetPassword'])->middleware('can:staff.edit')->name('staff.reset-password');
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
