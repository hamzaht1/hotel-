<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvoiceTemplateController extends Controller
{
    public function index()
    {
        return Inertia::render('super-admin/invoice-templates/index', [
            'templates' => array_map(
                fn ($key, $label) => ['key' => $key, 'label' => $label],
                array_keys(Invoice::PDF_TEMPLATES),
                array_values(Invoice::PDF_TEMPLATES),
            ),
            'defaultTemplate' => SiteSetting::get('default_invoice_pdf_template', 'default'),
        ]);
    }

    public function setDefault(Request $request)
    {
        $validated = $request->validate([
            'template' => 'required|in:default,modern,classic',
        ]);

        SiteSetting::set('default_invoice_pdf_template', $validated['template']);

        return back()->with('success', 'تم تحديث القالب الافتراضي');
    }

    public function preview(string $template)
    {
        abort_unless(array_key_exists($template, Invoice::PDF_TEMPLATES), 404);

        // Build an in-memory sample so the preview doesn't depend on any DB row.
        $invoice = $this->sampleInvoice();

        $view = view()->exists("invoices.{$template}") ? "invoices.{$template}" : 'invoices.default';

        return view($view, [
            'invoice' => $invoice,
            'settings' => \App\Models\InvoiceSetting::current(),
            'banks' => \App\Models\BankAccount::orderByDesc('is_default')->get(),
            'defaultTerms' => \App\Models\TermsTemplate::where('is_default', true)->first(),
            'logoUrl' => null,
        ]);
    }

    private function sampleInvoice(): Invoice
    {
        $invoice = new Invoice([
            'invoice_number' => 'INV-PREVIEW-0001',
            'type' => 'subscription',
            'status' => 'sent',
            'amount' => 1000.00,
            'tax_rate' => 15.00,
            'tax_amount' => 142.50,
            'discount' => 50.00,
            'total' => 1092.50,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'payment_method' => 'bank_transfer',
            'company_header' => 'Diyafah',
            'tax_number' => '300000000000003',
            'billing_address' => 'Riyadh, KSA',
            'notes_ar' => 'هذا نموذج معاينة فقط.',
            'notes_en' => 'This is a preview sample only.',
        ]);
        $invoice->id = 0;
        $invoice->exists = false;
        // Provide a fake tenant via setRelation so the blades' tenant?->name calls work.
        $invoice->setRelation('tenant', new \App\Models\Tenant([
            'name' => 'Sample Tenant',
            'email' => 'sample@example.com',
        ]));
        // Items collection with a couple of fake rows.
        $invoice->setRelation('items', collect([
            (object) ['description_ar' => 'اشتراك شهري', 'description_en' => 'Monthly subscription', 'quantity' => 1, 'unit_price' => 800.00, 'total' => 800.00],
            (object) ['description_ar' => 'تركيب', 'description_en' => 'Setup', 'quantity' => 1, 'unit_price' => 200.00, 'total' => 200.00],
        ]));

        return $invoice;
    }
}
