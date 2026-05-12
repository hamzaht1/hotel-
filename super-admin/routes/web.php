<?php

use App\Http\Controllers\SuperAdmin\DashboardController;
use App\Http\Controllers\SuperAdmin\DiscountCodeController;
use App\Http\Controllers\SuperAdmin\InvoiceController;
use App\Http\Controllers\SuperAdmin\InvoiceTemplateController;
use App\Http\Controllers\SuperAdmin\QuoteController;
use App\Http\Controllers\SuperAdmin\TemplateController;
use App\Http\Controllers\SuperAdmin\PlanController;
use App\Http\Controllers\SuperAdmin\TenantController;
use App\Http\Controllers\SuperAdmin\RenewalController;
use App\Http\Controllers\SuperAdmin\ReportController;
use App\Http\Controllers\SuperAdmin\ReviewController;
use App\Http\Controllers\SuperAdmin\IntegrationController;
use App\Http\Controllers\SuperAdmin\PageController;
use App\Http\Controllers\SuperAdmin\MenuController;
use App\Http\Controllers\SuperAdmin\SiteSettingController;
use Illuminate\Support\Facades\Route;

// ─── Locale Switcher ────────────────────────────────────────
Route::get('/locale/{locale}', function ($locale) {
    if (in_array($locale, ['ar', 'en'])) {
        session()->put('locale', $locale);
    }
    return back(status: 303);
})->name('locale.switch');

// ─── Auth Routes ────────────────────────────────────────────
require __DIR__.'/auth.php';
require __DIR__.'/settings.php';

// ─── Dashboard Redirect ─────────────────────────────────────
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/', fn () => redirect()->route('super-admin.dashboard'));
    Route::get('dashboard', fn () => redirect()->route('super-admin.dashboard'))
        ->name('dashboard');
});

// ─── Super Admin Routes ─────────────────────────────────────
// Both super_admin and staff (with role assigned) reach the super-admin area;
// finer-grained access is enforced by the assigned role's permissions.
Route::middleware(['auth', 'verified', 'role:super_admin,staff'])
    ->prefix('super-admin')
    ->name('super-admin.')
    ->group(function () {
        // Dashboard — every super-admin user can see it
        Route::middleware('permission:dashboard.view')->group(function () {
            Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
        });

        // Plans + Templates unified view (visible if either area is granted)
        Route::middleware('permission:plans.manage,templates.manage')->group(function () {
            Route::get('plans-templates', [\App\Http\Controllers\SuperAdmin\PlansTemplatesController::class, 'index'])->name('plans-templates.index');
        });

        // Plans
        Route::middleware('permission:plans.manage')->group(function () {
            Route::get('plans', [PlanController::class, 'index'])->name('plans.index');
            Route::get('plans/create', [PlanController::class, 'create'])->name('plans.create');
            Route::post('plans', [PlanController::class, 'store'])->name('plans.store');
            Route::get('plans/{plan}/edit', [PlanController::class, 'edit'])->name('plans.edit');
            Route::put('plans/{plan}', [PlanController::class, 'update'])->name('plans.update');
            Route::post('plans/{plan}/toggle', [PlanController::class, 'toggleStatus'])->name('plans.toggle');
        });

        // Discount Codes
        Route::middleware('permission:discount_codes.manage')->group(function () {
            Route::get('discount-codes', [DiscountCodeController::class, 'index'])->name('discount-codes.index');
            Route::get('discount-codes/create', [DiscountCodeController::class, 'create'])->name('discount-codes.create');
            Route::post('discount-codes', [DiscountCodeController::class, 'store'])->name('discount-codes.store');
            Route::get('discount-codes/{discountCode}/edit', [DiscountCodeController::class, 'edit'])->name('discount-codes.edit');
            Route::put('discount-codes/{discountCode}', [DiscountCodeController::class, 'update'])->name('discount-codes.update');
            Route::post('discount-codes/{discountCode}/toggle', [DiscountCodeController::class, 'toggleStatus'])->name('discount-codes.toggle');
        });

        // Templates
        Route::middleware('permission:templates.manage')->group(function () {
            Route::get('templates', [TemplateController::class, 'index'])->name('templates.index');
            Route::get('templates/create', [TemplateController::class, 'create'])->name('templates.create');
            Route::post('templates', [TemplateController::class, 'store'])->name('templates.store');
            Route::get('templates/{template}/edit', [TemplateController::class, 'edit'])->name('templates.edit');
            Route::post('templates/{template}', [TemplateController::class, 'update'])->name('templates.update');
            Route::delete('templates/{template}', [TemplateController::class, 'destroy'])->name('templates.destroy');
            Route::post('templates/{template}/toggle', [TemplateController::class, 'toggleStatus'])->name('templates.toggle');
            Route::put('templates/{template}/settings', [TemplateController::class, 'updateSettings'])->name('templates.settings');
        });

        // Invoices — static routes (index, export, create) registered BEFORE wildcard {invoice}
        // so Laravel doesn't bind "create"/"export.csv" as an id.
        Route::middleware('permission:invoices.view')->group(function () {
            Route::get('invoices', [InvoiceController::class, 'index'])->name('invoices.index');
            Route::get('invoices/export.csv', [InvoiceController::class, 'exportCsv'])->name('invoices.export');
        });
        Route::middleware('permission:invoices.create')->group(function () {
            Route::get('invoices/create', [InvoiceController::class, 'create'])->name('invoices.create');
            Route::post('invoices', [InvoiceController::class, 'store'])->name('invoices.store');
        });
        Route::middleware('permission:invoices.view')->group(function () {
            Route::get('invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
            Route::get('invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf'])->name('invoices.pdf');
        });
        Route::middleware('permission:invoices.edit')->group(function () {
            Route::get('invoices/{invoice}/edit', [InvoiceController::class, 'edit'])->name('invoices.edit');
            Route::put('invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');
            Route::post('invoices/{invoice}/lock', [InvoiceController::class, 'lock'])->name('invoices.lock');
            Route::post('invoices/{invoice}/unlock', [InvoiceController::class, 'unlock'])->name('invoices.unlock');
        });
        Route::post('invoices/{invoice}/send', [InvoiceController::class, 'send'])->middleware('permission:invoices.send')->name('invoices.send');
        Route::post('invoices/{invoice}/mark-paid', [InvoiceController::class, 'markAsPaid'])->middleware('permission:invoices.mark_paid')->name('invoices.mark-paid');
        Route::delete('invoices/{invoice}', [InvoiceController::class, 'destroy'])->middleware('permission:invoices.delete')->name('invoices.destroy');

        // Quotes — static routes (index, create) registered BEFORE wildcard {quote}
        // so Laravel doesn't bind "create" as an id.
        Route::middleware('permission:quotes.view')->group(function () {
            Route::get('quotes', [QuoteController::class, 'index'])->name('quotes.index');
            Route::get('quotes/export.csv', [QuoteController::class, 'exportCsv'])->name('quotes.export');
        });
        Route::middleware('permission:quotes.create')->group(function () {
            Route::get('quotes/create', [QuoteController::class, 'create'])->name('quotes.create');
            Route::post('quotes', [QuoteController::class, 'store'])->name('quotes.store');
        });
        Route::middleware('permission:quotes.view')->group(function () {
            Route::get('quotes/{quote}', [QuoteController::class, 'show'])->name('quotes.show');
            Route::get('quotes/{quote}/pdf', [QuoteController::class, 'downloadPdf'])->name('quotes.pdf');
        });
        Route::middleware('permission:quotes.edit')->group(function () {
            Route::get('quotes/{quote}/edit', [QuoteController::class, 'edit'])->name('quotes.edit');
            Route::put('quotes/{quote}', [QuoteController::class, 'update'])->name('quotes.update');
            Route::post('quotes/{quote}/lock', [QuoteController::class, 'lock'])->name('quotes.lock');
            Route::post('quotes/{quote}/unlock', [QuoteController::class, 'unlock'])->name('quotes.unlock');
        });
        Route::post('quotes/{quote}/send', [QuoteController::class, 'send'])->middleware('permission:quotes.send')->name('quotes.send');
        Route::post('quotes/{quote}/mark-accepted', [QuoteController::class, 'markAccepted'])->middleware('permission:quotes.mark_accepted')->name('quotes.mark-accepted');
        Route::post('quotes/{quote}/mark-refused', [QuoteController::class, 'markRefused'])->middleware('permission:quotes.mark_refused')->name('quotes.mark-refused');
        Route::delete('quotes/{quote}', [QuoteController::class, 'destroy'])->middleware('permission:quotes.delete')->name('quotes.destroy');

        // Invoice templates — preview + set default
        Route::middleware('permission:invoices.view')->group(function () {
            Route::get('invoice-templates', [InvoiceTemplateController::class, 'index'])->name('invoice-templates.index');
            Route::get('invoice-templates/{template}/preview', [InvoiceTemplateController::class, 'preview'])->name('invoice-templates.preview');
        });
        Route::post('invoice-templates/default', [InvoiceTemplateController::class, 'setDefault'])
            ->middleware('permission:invoices.edit')
            ->name('invoice-templates.set-default');

        // Transactions
        Route::get('transactions', [\App\Http\Controllers\SuperAdmin\TransactionController::class, 'index'])->middleware('permission:transactions.view')->name('transactions.index');
        Route::get('transactions/{invoice}/receipt', [\App\Http\Controllers\SuperAdmin\TransactionController::class, 'receipt'])->middleware('permission:transactions.view')->name('transactions.receipt');
        Route::middleware('permission:transactions.manage')->group(function () {
            Route::delete('transactions/{invoice}', [\App\Http\Controllers\SuperAdmin\TransactionController::class, 'destroy'])->name('transactions.destroy');
            Route::post('transactions/{invoice}/pause', [\App\Http\Controllers\SuperAdmin\TransactionController::class, 'pause'])->name('transactions.pause');
        });

        // Tenants (requests)
        // Tenants — static routes (index, create) registered BEFORE wildcard {tenant}
        // so Laravel doesn't bind "create" as an id.
        Route::middleware('permission:tenants.view')->group(function () {
            Route::get('tenants', [TenantController::class, 'index'])->name('tenants.index');
        });
        Route::middleware('permission:tenants.create')->group(function () {
            Route::get('tenants/create', [TenantController::class, 'create'])->name('tenants.create');
            Route::post('tenants', [TenantController::class, 'store'])->name('tenants.store');
        });
        Route::middleware('permission:tenants.view')->group(function () {
            Route::get('tenants/{tenant}', [TenantController::class, 'show'])->name('tenants.show');
        });
        Route::middleware('permission:tenants.edit')->group(function () {
            Route::get('tenants/{tenant}/edit', [TenantController::class, 'edit'])->name('tenants.edit');
            Route::put('tenants/{tenant}', [TenantController::class, 'update'])->name('tenants.update');
            Route::post('tenants/{tenant}/toggle', [TenantController::class, 'toggleStatus'])->name('tenants.toggle');
            Route::post('tenants/{tenant}/tags', [TenantController::class, 'syncTags'])->name('tenants.tags.sync');
        });
        Route::post('tenants/{tenant}/deploy', [TenantController::class, 'deploy'])->middleware('permission:tenants.deploy')->name('tenants.deploy');
        Route::post('tenants/{tenant}/approve', [TenantController::class, 'approvePayment'])->middleware('permission:tenants.approve')->name('tenants.approve');
        Route::post('tenants/{tenant}/reject', [TenantController::class, 'rejectPayment'])->middleware('permission:tenants.reject')->name('tenants.reject');
        Route::post('tenants/{tenant}/approve-renewal', [TenantController::class, 'approveRenewal'])->middleware('permission:renewals.approve')->name('tenants.approve-renewal');
        Route::post('tenants/{tenant}/reject-renewal', [TenantController::class, 'rejectRenewal'])->middleware('permission:renewals.reject')->name('tenants.reject-renewal');
        Route::delete('tenants/{tenant}', [TenantController::class, 'destroy'])->middleware('permission:tenants.delete')->name('tenants.destroy');
        Route::post('tenants/{tenant}/message', [TenantController::class, 'sendMessage'])->middleware('permission:tenants.message')->name('tenants.message');

        // Tags (request tags) — gated by tenant edit
        Route::middleware('permission:tenants.edit')->group(function () {
            Route::post('tags', [\App\Http\Controllers\SuperAdmin\TagController::class, 'store'])->name('tags.store');
            Route::put('tags/{tag}', [\App\Http\Controllers\SuperAdmin\TagController::class, 'update'])->name('tags.update');
            Route::delete('tags/{tag}', [\App\Http\Controllers\SuperAdmin\TagController::class, 'destroy'])->name('tags.destroy');
        });

        // Staff & Roles
        Route::middleware('permission:staff.view')->group(function () {
            Route::get('staff', [\App\Http\Controllers\SuperAdmin\RoleController::class, 'index'])->name('staff.index');
            Route::get('staff-export', [\App\Http\Controllers\SuperAdmin\StaffController::class, 'export'])->name('staff.export');
        });
        Route::post('staff', [\App\Http\Controllers\SuperAdmin\StaffController::class, 'store'])->middleware('permission:staff.create')->name('staff.store');
        Route::middleware('permission:staff.edit')->group(function () {
            Route::post('staff/{user}', [\App\Http\Controllers\SuperAdmin\StaffController::class, 'update'])->name('staff.update');
            Route::post('staff/{user}/toggle', [\App\Http\Controllers\SuperAdmin\StaffController::class, 'toggle'])->name('staff.toggle');
            Route::post('staff/{user}/reset-password', [\App\Http\Controllers\SuperAdmin\StaffController::class, 'resetPassword'])->name('staff.reset-password');
        });
        Route::delete('staff/{user}', [\App\Http\Controllers\SuperAdmin\StaffController::class, 'destroy'])->middleware('permission:staff.delete')->name('staff.destroy');
        Route::middleware('permission:roles.manage')->group(function () {
            Route::post('roles', [\App\Http\Controllers\SuperAdmin\RoleController::class, 'store'])->name('roles.store');
            Route::post('roles/{role}', [\App\Http\Controllers\SuperAdmin\RoleController::class, 'update'])->name('roles.update');
            Route::delete('roles/{role}', [\App\Http\Controllers\SuperAdmin\RoleController::class, 'destroy'])->name('roles.destroy');
        });

        // Clients — static routes (index, create) registered BEFORE wildcard {tenant}
        // so Laravel doesn't bind "create" as an id.
        Route::middleware('permission:clients.view')->group(function () {
            Route::get('clients', [\App\Http\Controllers\SuperAdmin\ClientController::class, 'index'])->name('clients.index');
        });
        Route::middleware('permission:clients.create')->group(function () {
            Route::get('clients/create', [\App\Http\Controllers\SuperAdmin\ClientController::class, 'create'])->name('clients.create');
            Route::post('clients', [\App\Http\Controllers\SuperAdmin\ClientController::class, 'store'])->name('clients.store');
        });
        Route::middleware('permission:clients.view')->group(function () {
            Route::get('clients/{tenant}', [\App\Http\Controllers\SuperAdmin\ClientController::class, 'show'])->name('clients.show');
        });
        Route::post('clients/{tenant}/tier', [\App\Http\Controllers\SuperAdmin\ClientController::class, 'setTier'])->middleware('permission:clients.set_tier')->name('clients.tier');
        Route::post('clients/{tenant}/status', [\App\Http\Controllers\SuperAdmin\ClientController::class, 'setStatus'])->middleware('permission:clients.set_status')->name('clients.status');
        Route::post('clients/{tenant}/message', [\App\Http\Controllers\SuperAdmin\ClientController::class, 'sendMessage'])->middleware('permission:tenants.message')->name('clients.message');

        // CMS Pages
        Route::middleware('permission:pages.manage')->group(function () {
            Route::get('pages', [PageController::class, 'index'])->name('pages.index');
            Route::get('pages/create', [PageController::class, 'create'])->name('pages.create');
            Route::post('pages', [PageController::class, 'store'])->name('pages.store');
            Route::get('pages/{page}/edit', [PageController::class, 'edit'])->name('pages.edit');
            Route::put('pages/{page}', [PageController::class, 'update'])->name('pages.update');
            Route::delete('pages/{page}', [PageController::class, 'destroy'])->name('pages.destroy');
            Route::get('pages/{page}/submissions', [\App\Http\Controllers\SuperAdmin\PageSubmissionController::class, 'index'])->name('pages.submissions.index');
            Route::get('pages/{page}/submissions/export', [\App\Http\Controllers\SuperAdmin\PageSubmissionController::class, 'export'])->name('pages.submissions.export');
            Route::delete('pages/{page}/submissions/{submission}', [\App\Http\Controllers\SuperAdmin\PageSubmissionController::class, 'destroy'])->name('pages.submissions.destroy');
        });

        // Menus
        Route::middleware('permission:menus.manage')->group(function () {
            Route::get('menus', [MenuController::class, 'index'])->name('menus.index');
            Route::put('menus/{location}', [MenuController::class, 'update'])->name('menus.update');
        });

        // Site Settings
        Route::middleware('permission:site_settings.edit')->group(function () {
            Route::get('site-settings', [SiteSettingController::class, 'index'])->name('site-settings.index');
            Route::put('site-settings', [SiteSettingController::class, 'update'])->name('site-settings.update');
        });

        // Integrations
        Route::middleware('permission:integrations.manage')->group(function () {
            Route::get('integrations', [IntegrationController::class, 'index'])->name('integrations.index');
            Route::put('integrations/{provider}', [IntegrationController::class, 'update'])->name('integrations.update');
        });

        // Renewals
        Route::get('renewals', [RenewalController::class, 'index'])->middleware('permission:renewals.view')->name('renewals.index');
        Route::post('renewals/{renewal}/approve', [RenewalController::class, 'approve'])->middleware('permission:renewals.approve')->name('renewals.approve');
        Route::post('renewals/{renewal}/reject', [RenewalController::class, 'reject'])->middleware('permission:renewals.reject')->name('renewals.reject');

        // Unified Reports page
        Route::get('reports', [\App\Http\Controllers\SuperAdmin\ReportsController::class, 'index'])->middleware('permission:reports.view')->name('reports.index');

        // Reviews
        Route::middleware('permission:reviews.view')->group(function () {
            Route::get('reviews', [ReviewController::class, 'index'])->name('reviews.index');
            Route::get('reviews/{review}', [ReviewController::class, 'show'])->name('reviews.show');
        });
        Route::middleware('permission:reviews.moderate')->group(function () {
            Route::post('reviews/{review}/status', [ReviewController::class, 'updateStatus'])->name('reviews.status');
            Route::post('reviews/{review}/approve', [ReviewController::class, 'approve'])->name('reviews.approve');
            Route::post('reviews/{review}/notify', [ReviewController::class, 'notify'])->name('reviews.notify');
        });
        Route::post('reviews/{review}/reply', [ReviewController::class, 'reply'])->middleware('permission:reviews.reply')->name('reviews.reply');

        // Detailed reports
        Route::get('reports/financial', [ReportController::class, 'financial'])->middleware('permission:reports.financial')->name('reports.financial');
        Route::get('reports/subscriptions', [ReportController::class, 'subscriptions'])->middleware('permission:reports.subscriptions')->name('reports.subscriptions');

        // Support center (conversations with all tenants)
        Route::middleware('permission:reports.messages')->group(function () {
            Route::get('support', [\App\Http\Controllers\SuperAdmin\SupportController::class, 'index'])->name('support.index');
            Route::post('support/{conversation}/reply', [\App\Http\Controllers\SuperAdmin\SupportController::class, 'reply'])->name('support.reply');
            Route::post('support/{conversation}/take', [\App\Http\Controllers\SuperAdmin\SupportController::class, 'take'])->name('support.take');
            Route::post('support/{conversation}/status', [\App\Http\Controllers\SuperAdmin\SupportController::class, 'updateStatus'])->name('support.status');
            Route::post('support/{conversation}/ai-suggestions', [\App\Http\Controllers\SuperAdmin\SupportController::class, 'aiSuggestions'])->name('support.ai-suggestions');

            Route::get('broadcasts', [\App\Http\Controllers\SuperAdmin\BroadcastController::class, 'index'])->name('broadcasts.index');
            Route::get('broadcasts/create', [\App\Http\Controllers\SuperAdmin\BroadcastController::class, 'create'])->name('broadcasts.create');
            Route::post('broadcasts', [\App\Http\Controllers\SuperAdmin\BroadcastController::class, 'store'])->name('broadcasts.store');
            Route::post('broadcasts/{broadcast}/send', [\App\Http\Controllers\SuperAdmin\BroadcastController::class, 'send'])->name('broadcasts.send');
        });
    });
