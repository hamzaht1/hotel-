<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
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
        $tenantId = app('current_tenant_id');

        if ($invoice->tenant_id !== $tenantId) {
            abort(403);
        }

        $invoice->load('tenant', 'items');

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('invoices.pdf', ['invoice' => $invoice]);
        $pdf->setPaper('A4');

        return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
    }
}
