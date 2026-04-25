<?php

use App\Http\Controllers\SuperAdmin\DashboardController;
use App\Http\Controllers\SuperAdmin\DiscountCodeController;
use App\Http\Controllers\SuperAdmin\InvoiceController;
use App\Http\Controllers\SuperAdmin\FormBuilderController;
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
Route::middleware(['auth', 'verified', 'role:super_admin'])
    ->prefix('super-admin')
    ->name('super-admin.')
    ->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

        // Plans + Templates unified view
        Route::get('plans-templates', [\App\Http\Controllers\SuperAdmin\PlansTemplatesController::class, 'index'])->name('plans-templates.index');

        // Plans
        Route::get('plans', [PlanController::class, 'index'])->name('plans.index');
        Route::get('plans/create', [PlanController::class, 'create'])->name('plans.create');
        Route::post('plans', [PlanController::class, 'store'])->name('plans.store');
        Route::get('plans/{plan}/edit', [PlanController::class, 'edit'])->name('plans.edit');
        Route::put('plans/{plan}', [PlanController::class, 'update'])->name('plans.update');
        Route::post('plans/{plan}/toggle', [PlanController::class, 'toggleStatus'])->name('plans.toggle');

        // Discount Codes
        Route::get('discount-codes', [DiscountCodeController::class, 'index'])->name('discount-codes.index');
        Route::get('discount-codes/create', [DiscountCodeController::class, 'create'])->name('discount-codes.create');
        Route::post('discount-codes', [DiscountCodeController::class, 'store'])->name('discount-codes.store');
        Route::get('discount-codes/{discountCode}/edit', [DiscountCodeController::class, 'edit'])->name('discount-codes.edit');
        Route::put('discount-codes/{discountCode}', [DiscountCodeController::class, 'update'])->name('discount-codes.update');
        Route::post('discount-codes/{discountCode}/toggle', [DiscountCodeController::class, 'toggleStatus'])->name('discount-codes.toggle');

        // Form Builder
        Route::get('form-builder', [FormBuilderController::class, 'index'])->name('form-builder.index');
        Route::post('form-builder', [FormBuilderController::class, 'store'])->name('form-builder.store');
        Route::put('form-builder/{formTemplate}', [FormBuilderController::class, 'update'])->name('form-builder.update');
        Route::delete('form-builder/{formTemplate}', [FormBuilderController::class, 'destroy'])->name('form-builder.destroy');

        // Templates
        Route::get('templates', [TemplateController::class, 'index'])->name('templates.index');
        Route::get('templates/create', [TemplateController::class, 'create'])->name('templates.create');
        Route::post('templates', [TemplateController::class, 'store'])->name('templates.store');
        Route::get('templates/{template}/edit', [TemplateController::class, 'edit'])->name('templates.edit');
        Route::post('templates/{template}', [TemplateController::class, 'update'])->name('templates.update');
        Route::delete('templates/{template}', [TemplateController::class, 'destroy'])->name('templates.destroy');
        Route::post('templates/{template}/toggle', [TemplateController::class, 'toggleStatus'])->name('templates.toggle');
        Route::put('templates/{template}/settings', [TemplateController::class, 'updateSettings'])->name('templates.settings');

        // Invoices
        Route::get('invoices', [InvoiceController::class, 'index'])->name('invoices.index');
        Route::get('invoices/create', [InvoiceController::class, 'create'])->name('invoices.create');
        Route::post('invoices', [InvoiceController::class, 'store'])->name('invoices.store');
        Route::get('invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
        Route::get('invoices/{invoice}/edit', [InvoiceController::class, 'edit'])->name('invoices.edit');
        Route::put('invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');
        Route::post('invoices/{invoice}/send', [InvoiceController::class, 'send'])->name('invoices.send');
        Route::post('invoices/{invoice}/mark-paid', [InvoiceController::class, 'markAsPaid'])->name('invoices.mark-paid');
        Route::get('invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf'])->name('invoices.pdf');
        Route::delete('invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');
        Route::post('invoices/{invoice}/lock', [InvoiceController::class, 'lock'])->name('invoices.lock');
        Route::post('invoices/{invoice}/unlock', [InvoiceController::class, 'unlock'])->name('invoices.unlock');

        // Transactions (financial operations)
        Route::get('transactions', [\App\Http\Controllers\SuperAdmin\TransactionController::class, 'index'])->name('transactions.index');
        Route::delete('transactions/{invoice}', [\App\Http\Controllers\SuperAdmin\TransactionController::class, 'destroy'])->name('transactions.destroy');
        Route::post('transactions/{invoice}/pause', [\App\Http\Controllers\SuperAdmin\TransactionController::class, 'pause'])->name('transactions.pause');
        Route::get('transactions/{invoice}/receipt', [\App\Http\Controllers\SuperAdmin\TransactionController::class, 'receipt'])->name('transactions.receipt');

        // Tenants (unified "requests" view)
        Route::get('tenants', [TenantController::class, 'index'])->name('tenants.index');
        Route::get('tenants/create', [TenantController::class, 'create'])->name('tenants.create');
        Route::post('tenants', [TenantController::class, 'store'])->name('tenants.store');
        Route::get('tenants/{tenant}', [TenantController::class, 'show'])->name('tenants.show');
        Route::get('tenants/{tenant}/edit', [TenantController::class, 'edit'])->name('tenants.edit');
        Route::put('tenants/{tenant}', [TenantController::class, 'update'])->name('tenants.update');
        Route::post('tenants/{tenant}/toggle', [TenantController::class, 'toggleStatus'])->name('tenants.toggle');
        Route::post('tenants/{tenant}/approve', [TenantController::class, 'approvePayment'])->name('tenants.approve');
        Route::post('tenants/{tenant}/reject', [TenantController::class, 'rejectPayment'])->name('tenants.reject');
        Route::post('tenants/{tenant}/approve-renewal', [TenantController::class, 'approveRenewal'])->name('tenants.approve-renewal');
        Route::post('tenants/{tenant}/reject-renewal', [TenantController::class, 'rejectRenewal'])->name('tenants.reject-renewal');
        Route::post('tenants/{tenant}/tags', [TenantController::class, 'syncTags'])->name('tenants.tags.sync');
        Route::delete('tenants/{tenant}', [TenantController::class, 'destroy'])->name('tenants.destroy');
        Route::post('tenants/{tenant}/message', [TenantController::class, 'sendMessage'])->name('tenants.message');

        // Tags (request tags)
        Route::post('tags', [\App\Http\Controllers\SuperAdmin\TagController::class, 'store'])->name('tags.store');
        Route::put('tags/{tag}', [\App\Http\Controllers\SuperAdmin\TagController::class, 'update'])->name('tags.update');
        Route::delete('tags/{tag}', [\App\Http\Controllers\SuperAdmin\TagController::class, 'destroy'])->name('tags.destroy');

        // Staff & Roles (unified page)
        Route::get('staff', [\App\Http\Controllers\SuperAdmin\RoleController::class, 'index'])->name('staff.index');
        Route::post('staff', [\App\Http\Controllers\SuperAdmin\StaffController::class, 'store'])->name('staff.store');
        Route::post('staff/{user}', [\App\Http\Controllers\SuperAdmin\StaffController::class, 'update'])->name('staff.update');
        Route::post('staff/{user}/toggle', [\App\Http\Controllers\SuperAdmin\StaffController::class, 'toggle'])->name('staff.toggle');
        Route::delete('staff/{user}', [\App\Http\Controllers\SuperAdmin\StaffController::class, 'destroy'])->name('staff.destroy');
        Route::post('staff/{user}/reset-password', [\App\Http\Controllers\SuperAdmin\StaffController::class, 'resetPassword'])->name('staff.reset-password');
        Route::get('staff-export', [\App\Http\Controllers\SuperAdmin\StaffController::class, 'export'])->name('staff.export');
        Route::post('roles', [\App\Http\Controllers\SuperAdmin\RoleController::class, 'store'])->name('roles.store');
        Route::post('roles/{role}', [\App\Http\Controllers\SuperAdmin\RoleController::class, 'update'])->name('roles.update');
        Route::delete('roles/{role}', [\App\Http\Controllers\SuperAdmin\RoleController::class, 'destroy'])->name('roles.destroy');

        // Clients (distinct from requests — focuses on lifecycle / tiers)
        Route::get('clients', [\App\Http\Controllers\SuperAdmin\ClientController::class, 'index'])->name('clients.index');
        Route::get('clients/create', [\App\Http\Controllers\SuperAdmin\ClientController::class, 'create'])->name('clients.create');
        Route::post('clients', [\App\Http\Controllers\SuperAdmin\ClientController::class, 'store'])->name('clients.store');
        Route::get('clients/{tenant}', [\App\Http\Controllers\SuperAdmin\ClientController::class, 'show'])->name('clients.show');
        Route::post('clients/{tenant}/tier', [\App\Http\Controllers\SuperAdmin\ClientController::class, 'setTier'])->name('clients.tier');
        Route::post('clients/{tenant}/status', [\App\Http\Controllers\SuperAdmin\ClientController::class, 'setStatus'])->name('clients.status');
        Route::post('clients/{tenant}/message', [\App\Http\Controllers\SuperAdmin\ClientController::class, 'sendMessage'])->name('clients.message');

        // CMS Pages
        Route::get('pages', [PageController::class, 'index'])->name('pages.index');
        Route::get('pages/create', [PageController::class, 'create'])->name('pages.create');
        Route::post('pages', [PageController::class, 'store'])->name('pages.store');
        Route::get('pages/{page}/edit', [PageController::class, 'edit'])->name('pages.edit');
        Route::put('pages/{page}', [PageController::class, 'update'])->name('pages.update');
        Route::delete('pages/{page}', [PageController::class, 'destroy'])->name('pages.destroy');

        // Menus
        Route::get('menus', [MenuController::class, 'index'])->name('menus.index');
        Route::put('menus/{location}', [MenuController::class, 'update'])->name('menus.update');

        // Site Settings
        Route::get('site-settings', [SiteSettingController::class, 'index'])->name('site-settings.index');
        Route::put('site-settings', [SiteSettingController::class, 'update'])->name('site-settings.update');

        // Integrations
        Route::get('integrations', [IntegrationController::class, 'index'])->name('integrations.index');
        Route::put('integrations/{provider}', [IntegrationController::class, 'update'])->name('integrations.update');

        // Renewals
        Route::get('renewals', [RenewalController::class, 'index'])->name('renewals.index');
        Route::post('renewals/{renewal}/approve', [RenewalController::class, 'approve'])->name('renewals.approve');
        Route::post('renewals/{renewal}/reject', [RenewalController::class, 'reject'])->name('renewals.reject');

        // Unified Reports page
        Route::get('reports', [\App\Http\Controllers\SuperAdmin\ReportsController::class, 'index'])->name('reports.index');

        // Reviews
        Route::get('reviews', [ReviewController::class, 'index'])->name('reviews.index');
        Route::get('reviews/{review}', [ReviewController::class, 'show'])->name('reviews.show');
        Route::post('reviews/{review}/status', [ReviewController::class, 'updateStatus'])->name('reviews.status');
        Route::post('reviews/{review}/approve', [ReviewController::class, 'approve'])->name('reviews.approve');
        Route::post('reviews/{review}/notify', [ReviewController::class, 'notify'])->name('reviews.notify');
        Route::post('reviews/{review}/reply', [ReviewController::class, 'reply'])->name('reviews.reply');

        // Reports
        Route::get('reports/financial', [ReportController::class, 'financial'])->name('reports.financial');
        Route::get('reports/subscriptions', [ReportController::class, 'subscriptions'])->name('reports.subscriptions');
        Route::get('reports/messages', [ReportController::class, 'messages'])->name('reports.messages');
        Route::post('reports/messages/{id}/reply', [ReportController::class, 'replyMessage'])->name('reports.messages.reply');
        Route::post('reports/messages/{id}/status', [ReportController::class, 'updateStatus'])->name('reports.messages.status');
        Route::post('reports/messages/{id}/read', [ReportController::class, 'markRead'])->name('reports.messages.read');
        Route::post('reports/messages/{id}/urgent', [ReportController::class, 'toggleUrgent'])->name('reports.messages.urgent');
        Route::delete('reports/messages/{id}', [ReportController::class, 'deleteMessage'])->name('reports.messages.destroy');
    });
