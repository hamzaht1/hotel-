<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\Quote;
use App\Support\ActivityLogger;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

/**
 * Client-facing quotes: the establishment sees the quotes the super-admin
 * has sent it and can accept or refuse them. Drafts are never exposed.
 */
class QuoteController extends Controller
{
    public function index()
    {
        $tenantId = app('current_tenant_id');

        $quotes = Quote::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['sent', 'accepted', 'refused', 'expired'])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('client-admin/quotes/index', [
            'quotes' => $quotes,
        ]);
    }

    public function show(Quote $quote)
    {
        $this->authorizeQuote($quote);

        return Inertia::render('client-admin/quotes/show', [
            'quote' => $quote->load('items'),
        ]);
    }

    public function accept(Quote $quote)
    {
        $this->authorizeQuote($quote);

        if (!$quote->isActionable()) {
            return back()->with('error', 'لا يمكن تنفيذ هذا الإجراء على عرض السعر');
        }

        $quote->update([
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);

        ActivityLogger::log('quote.accepted', "Quote {$quote->quote_number} accepted by client", [], $quote);

        return back()->with('success', 'تم قبول عرض السعر');
    }

    public function refuse(Quote $quote)
    {
        $this->authorizeQuote($quote);

        if (!$quote->isActionable()) {
            return back()->with('error', 'لا يمكن تنفيذ هذا الإجراء على عرض السعر');
        }

        $quote->update([
            'status' => 'refused',
            'refused_at' => now(),
        ]);

        ActivityLogger::log('quote.refused', "Quote {$quote->quote_number} refused by client", [], $quote);

        return back()->with('success', 'تم رفض عرض السعر');
    }

    public function downloadPdf(Quote $quote)
    {
        $this->authorizeQuote($quote);

        ActivityLogger::log('quote.downloaded', "Quote {$quote->quote_number} downloaded", [], $quote);

        return $this->renderPdf($quote)->download("quote-{$quote->quote_number}.pdf");
    }

    public function preview(Quote $quote)
    {
        $this->authorizeQuote($quote);

        return $this->renderPdf($quote)->stream("quote-{$quote->quote_number}.pdf");
    }

    private function authorizeQuote(Quote $quote): void
    {
        if ($quote->tenant_id !== app('current_tenant_id')) {
            abort(403);
        }

        // Drafts belong to the super-admin's working area only.
        if ($quote->status === 'draft') {
            abort(404);
        }
    }

    private function renderPdf(Quote $quote): \Barryvdh\DomPDF\PDF
    {
        $quote->load('tenant', 'items');

        $template = $quote->pdf_template ?: 'default';
        $view = view()->exists("quotes.{$template}") ? "quotes.{$template}" : 'quotes.default';

        $pdf = Pdf::loadView($view, [
            'quote' => $quote,
            'settings' => \App\Models\InvoiceSetting::current(),
            'banks' => \App\Models\BankAccount::orderByDesc('is_default')->get(),
            'defaultTerms' => \App\Models\TermsTemplate::where('is_default', true)->first(),
            'logoUrl' => $this->absoluteLogoUrl(),
        ]);
        $pdf->setPaper('A4');

        return $pdf;
    }

    private function absoluteLogoUrl(): ?string
    {
        $path = \App\Models\SiteSetting::get('site_logo');
        if (!$path) {
            return null;
        }
        try {
            return \Illuminate\Support\Facades\Storage::disk('public')->url($path);
        } catch (\Throwable) {
            return null;
        }
    }
}
