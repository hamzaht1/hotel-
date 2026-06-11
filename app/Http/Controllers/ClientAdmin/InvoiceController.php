<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Support\ActivityLogger;
use App\Support\ZatcaQr;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = app('current_tenant_id');

        $invoices = Invoice::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['sent', 'paid', 'overdue'])
            ->with('items')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('client-admin/invoices/index', [
            'invoices' => $invoices,
        ]);
    }

    public function downloadPdf(Invoice $invoice)
    {
        $this->authorizeInvoice($invoice);

        ActivityLogger::log('invoice.downloaded', "Invoice {$invoice->invoice_number} downloaded", [], $invoice);

        return $this->renderPdf($invoice)->download("invoice-{$invoice->invoice_number}.pdf");
    }

    /**
     * Stream the invoice inline (in-browser preview) instead of forcing a download.
     */
    public function preview(Invoice $invoice)
    {
        $this->authorizeInvoice($invoice);

        ActivityLogger::log('invoice.previewed', "Invoice {$invoice->invoice_number} previewed", [], $invoice);

        return $this->renderPdf($invoice)->stream("invoice-{$invoice->invoice_number}.pdf");
    }

    private function authorizeInvoice(Invoice $invoice): void
    {
        if ($invoice->tenant_id !== app('current_tenant_id')) {
            abort(403);
        }
    }

    /**
     * Build the DomPDF instance for an invoice, including the ZATCA QR.
     */
    private function renderPdf(Invoice $invoice): \Barryvdh\DomPDF\PDF
    {
        $invoice->load('tenant', 'items');

        // Same resolution as super-admin: explicit override wins, but 'default'
        // is treated as "follow the global setting" so changes on the templates
        // page propagate to existing invoices.
        $override = $invoice->pdf_template;
        $globalDefault = \App\Models\SiteSetting::get('default_invoice_pdf_template', 'default');
        $template = ($override && $override !== 'default') ? $override : $globalDefault;
        $view = view()->exists("invoices.{$template}") ? "invoices.{$template}" : 'invoices.default';

        $settings = \App\Models\InvoiceSetting::current();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($view, [
            'invoice' => $invoice,
            'settings' => $settings,
            'banks' => \App\Models\BankAccount::orderByDesc('is_default')->get(),
            'defaultTerms' => \App\Models\TermsTemplate::where('is_default', true)->first(),
            'logoUrl' => $this->absoluteLogoUrl(),
            'qr' => $this->buildZatcaQr($invoice, $settings),
        ]);
        $pdf->setPaper('A4');

        return $pdf;
    }

    /**
     * ZATCA-compliant QR (seller name, VAT number, timestamp, total, VAT total)
     * rendered as an SVG data URI. Seller = the platform (invoice settings).
     */
    private function buildZatcaQr(Invoice $invoice, \App\Models\InvoiceSetting $settings): ?string
    {
        $sellerName = $settings->company_name_ar ?: ($settings->company_name_en ?: 'Diyafah');
        $vatNumber = (string) ($settings->vat ?? '');
        $timestamp = ($invoice->paid_at ?? $invoice->issue_date)?->toIso8601String() ?? now()->toIso8601String();

        try {
            $payload = ZatcaQr::tlvBase64(
                $sellerName,
                $vatNumber,
                $timestamp,
                number_format((float) $invoice->total, 2, '.', ''),
                number_format((float) $invoice->tax_amount, 2, '.', ''),
            );

            return ZatcaQr::svgDataUri($payload);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('ZATCA QR generation failed: ' . $e->getMessage());
            return null;
        }
    }

    private function absoluteLogoUrl(): ?string
    {
        $path = \App\Models\SiteSetting::get('site_logo');
        if (!$path) return null;
        try {
            return \Illuminate\Support\Facades\Storage::disk('public')->url($path);
        } catch (\Throwable) {
            return null;
        }
    }

    public function updateTemplate(Request $request, Invoice $invoice)
    {
        $tenantId = app('current_tenant_id');

        if ($invoice->tenant_id !== $tenantId) {
            abort(403);
        }

        $validated = $request->validate([
            'pdf_template' => 'required|in:default,modern,classic',
        ]);

        $invoice->update(['pdf_template' => $validated['pdf_template']]);

        return back()->with('success', 'تم تحديث قالب الفاتورة');
    }

    public function uploadReceipt(Request $request, Invoice $invoice)
    {
        $tenantId = app('current_tenant_id');

        if ($invoice->tenant_id !== $tenantId) {
            abort(403);
        }

        if (!$invoice->requires_receipt) {
            return back()->with('error', 'لا يُطلب إيصال لهذه الفاتورة');
        }

        $request->validate([
            'receipt' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $path = $request->file('receipt')->store('invoice-receipts', 'public');

        $invoice->update([
            'receipt_upload_path' => $path,
        ]);

        return back()->with('success', 'تم رفع الإيصال بنجاح');
    }
}
