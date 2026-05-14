<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\InvoiceSetting;
use App\Models\Plan;
use App\Models\SiteSetting;
use App\Models\Tenant;
use App\Models\TermsTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class InvoiceSettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('super-admin/invoice-settings/index', [
            'settings' => InvoiceSetting::current(),
            'branding' => [
                'site_logo' => SiteSetting::get('site_logo'),
                'primary_color' => SiteSetting::get('primary_color', '#0E1738'),
                'secondary_color' => SiteSetting::get('secondary_color', '#B48A4A'),
                'font_family' => SiteSetting::get('font_family', 'Tajawal'),
            ],
            'bankAccounts' => BankAccount::orderByDesc('is_default')->orderBy('id')->get(),
            'termsTemplates' => TermsTemplate::orderByDesc('is_default')->orderBy('id')->get(),
            'counters' => [
                'hotels' => Tenant::count(),
                'packages' => Plan::count(),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'company_name_ar' => 'nullable|string|max:255',
            'company_name_en' => 'nullable|string|max:255',
            'cr' => 'nullable|string|max:50',
            'vat' => 'nullable|string|max:50',
            'address_ar' => 'nullable|string|max:500',
            'address_en' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'footer_line' => 'nullable|string|max:500',

            'pdf_show_logo' => 'boolean',
            'pdf_show_company_info' => 'boolean',
            'pdf_show_bank_info' => 'boolean',
            'pdf_show_vat' => 'boolean',
            'pdf_show_customer_info' => 'boolean',
            'pdf_show_cr' => 'boolean',
            'pdf_show_terms' => 'boolean',
            'pdf_show_notes' => 'boolean',
            'pdf_show_discount_column' => 'boolean',
            'pdf_show_footer' => 'boolean',

            'primary_color' => 'nullable|string|max:20',
            'secondary_color' => 'nullable|string|max:20',
            'font_family' => 'nullable|string|max:100',
            'site_logo' => 'nullable|file|max:2048',
        ]);

        DB::transaction(function () use ($request, $validated) {
            $settings = InvoiceSetting::current();
            $settings->update(collect($validated)->except(['primary_color', 'secondary_color', 'font_family', 'site_logo'])->toArray());

            foreach (['primary_color', 'secondary_color', 'font_family'] as $key) {
                if (array_key_exists($key, $validated)) {
                    SiteSetting::set($key, $validated[$key]);
                }
            }

            if ($request->hasFile('site_logo')) {
                $old = SiteSetting::get('site_logo');
                if ($old) Storage::disk('public')->delete($old);
                SiteSetting::set('site_logo', $request->file('site_logo')->store('site', 'public'));
            }
        });

        return back()->with('success', 'تم حفظ الإعدادات');
    }

    public function storeBank(Request $request)
    {
        $validated = $request->validate([
            'bank_name_ar' => 'nullable|string|max:255',
            'bank_name_en' => 'nullable|string|max:255',
            'account_holder' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:50',
            'iban' => 'nullable|string|max:50',
            'swift' => 'nullable|string|max:20',
        ]);

        DB::transaction(function () use ($validated) {
            $bank = BankAccount::create($validated);
            if (!BankAccount::where('is_default', true)->exists()) {
                $bank->update(['is_default' => true]);
            }
        });

        return back()->with('success', 'تم إضافة الحساب');
    }

    public function updateBank(Request $request, BankAccount $bank)
    {
        $validated = $request->validate([
            'bank_name_ar' => 'nullable|string|max:255',
            'bank_name_en' => 'nullable|string|max:255',
            'account_holder' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:50',
            'iban' => 'nullable|string|max:50',
            'swift' => 'nullable|string|max:20',
        ]);

        $bank->update($validated);

        return back()->with('success', 'تم التحديث');
    }

    public function setDefaultBank(BankAccount $bank)
    {
        $bank->makeDefault();
        return back()->with('success', 'تم تعيين الحساب الافتراضي');
    }

    public function destroyBank(BankAccount $bank)
    {
        $bank->delete();
        return back()->with('success', 'تم الحذف');
    }

    public function storeTerms(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'content_ar' => 'nullable|string|max:10000',
            'content_en' => 'nullable|string|max:10000',
        ]);

        DB::transaction(function () use ($validated) {
            $terms = TermsTemplate::create($validated);
            if (!TermsTemplate::where('is_default', true)->exists()) {
                $terms->update(['is_default' => true]);
            }
        });

        return back()->with('success', 'تم إضافة القالب');
    }

    public function updateTerms(Request $request, TermsTemplate $terms)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'content_ar' => 'nullable|string|max:10000',
            'content_en' => 'nullable|string|max:10000',
        ]);

        $terms->update($validated);

        return back()->with('success', 'تم التحديث');
    }

    public function setDefaultTerms(TermsTemplate $terms)
    {
        $terms->makeDefault();
        return back()->with('success', 'تم تعيين القالب الافتراضي');
    }

    public function destroyTerms(TermsTemplate $terms)
    {
        $terms->delete();
        return back()->with('success', 'تم الحذف');
    }
}
