<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Quote;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class QuoteController extends Controller
{
    public function index(Request $request)
    {
        $quotes = Quote::query()
            ->with('tenant:id,name,email')
            ->when($request->search, fn ($q, $s) => $q->where(function ($q2) use ($s) {
                $q2->whereHas('tenant', fn ($t) => $t->where('name', 'like', "%{$s}%"))
                    ->orWhere('quote_number', 'like', "%{$s}%")
                    ->orWhere('external_client_name', 'like', "%{$s}%");
            }))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->tenant_id, fn ($q, $id) => $q->where('tenant_id', $id))
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total_quotes' => Quote::count(),
            'total_accepted' => (float) Quote::where('status', 'accepted')->sum('total'),
            'total_pending' => (float) Quote::whereIn('status', ['draft', 'sent'])->sum('total'),
            'total_expired' => (float) Quote::where('status', 'sent')->where('valid_until', '<', now())->sum('total'),
            'accepted_count' => Quote::where('status', 'accepted')->count(),
            'pending_count' => Quote::whereIn('status', ['draft', 'sent'])->count(),
            'expired_count' => Quote::where('status', 'sent')->where('valid_until', '<', now())->count(),
            'refused_count' => Quote::where('status', 'refused')->count(),
        ];

        return Inertia::render('super-admin/quotes/index', [
            'quotes' => $quotes,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'tenant_id', 'type']),
        ]);
    }

    public function create()
    {
        return Inertia::render('super-admin/quotes/create', [
            'tenants' => Tenant::where('is_active', true)->orderBy('name')->get(['id', 'name', 'email', 'phone', 'org_name_ar', 'plan_id']),
            'plans' => \App\Models\Plan::orderBy('sort_order')->get(['id', 'slug', 'name_ar', 'name_en']),
            'salesReps' => User::where('role', 'super_admin')->orWhere('role', 'staff')->orderBy('name')->get(['id', 'name']),
            'nextNumber' => Quote::generateNumber(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateQuote($request);

        $quote = Quote::create(array_merge($this->mapQuoteData($validated), [
            'quote_number' => Quote::generateNumber(),
            'status' => 'draft',
            'amount' => 0,
            'tax_amount' => 0,
            'tax_amount_2' => 0,
            'total' => 0,
        ]));

        foreach ($validated['items'] as $item) {
            $quote->items()->create([
                'description_ar' => $item['description_ar'],
                'description_en' => $item['description_en'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total' => $item['quantity'] * $item['unit_price'],
            ]);
        }

        $quote->calculateTotals();

        return redirect()->route('super-admin.quotes.show', $quote)
            ->with('success', 'تم إنشاء عرض السعر بنجاح');
    }

    public function show(Quote $quote)
    {
        return Inertia::render('super-admin/quotes/show', [
            'quote' => $quote->load('tenant:id,name,email,phone,org_name_ar,org_name_en', 'items'),
        ]);
    }

    public function edit(Quote $quote)
    {
        if ($quote->isLocked()) {
            return back()->with('error', 'لا يمكن تعديل عرض سعر مقبول أو مرفوض أو مقفل');
        }

        $tenants = Tenant::where('is_active', true)->orderBy('name')->get(['id', 'name', 'email']);

        return Inertia::render('super-admin/quotes/edit', [
            'quote' => $quote->load('items'),
            'tenants' => $tenants,
        ]);
    }

    public function update(Request $request, Quote $quote)
    {
        if ($quote->isLocked()) {
            return back()->with('error', 'لا يمكن تعديل عرض سعر مقبول أو مرفوض أو مقفل');
        }

        $validated = $this->validateQuote($request);

        $quote->update($this->mapQuoteData($validated));

        $quote->items()->delete();

        foreach ($validated['items'] as $item) {
            $quote->items()->create([
                'description_ar' => $item['description_ar'],
                'description_en' => $item['description_en'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total' => $item['quantity'] * $item['unit_price'],
            ]);
        }

        $quote->calculateTotals();

        return redirect()->route('super-admin.quotes.show', $quote)
            ->with('success', 'تم تحديث عرض السعر بنجاح');
    }

    public function send(Quote $quote)
    {
        $quote->update(['status' => 'sent']);

        return back()->with('success', 'تم إرسال عرض السعر بنجاح');
    }

    public function markAccepted(Quote $quote)
    {
        $quote->update([
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);

        return back()->with('success', 'تم قبول عرض السعر');
    }

    public function markRefused(Quote $quote)
    {
        $quote->update([
            'status' => 'refused',
            'refused_at' => now(),
        ]);

        return back()->with('success', 'تم رفض عرض السعر');
    }

    public function exportCsv(Request $request)
    {
        $query = Quote::query()
            ->with('tenant:id,name,email')
            ->when($request->search, fn ($q, $s) => $q->where(function ($q2) use ($s) {
                $q2->whereHas('tenant', fn ($t) => $t->where('name', 'like', "%{$s}%"))
                    ->orWhere('quote_number', 'like', "%{$s}%")
                    ->orWhere('external_client_name', 'like', "%{$s}%");
            }))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->tenant_id, fn ($q, $id) => $q->where('tenant_id', $id))
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->latest();

        $filename = 'quotes-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, [
                'Quote #', 'Client', 'Email', 'Type', 'Status',
                'Issue date', 'Valid until',
                'Subtotal', 'Discount', 'Tax', 'Total', 'Currency',
                'Accepted at', 'Refused at',
            ]);
            $query->chunk(500, function ($rows) use ($out) {
                foreach ($rows as $q) {
                    fputcsv($out, [
                        $q->quote_number,
                        $q->tenant?->name ?? $q->external_client_name,
                        $q->tenant?->email ?? $q->external_client_email,
                        $q->type,
                        $q->status,
                        optional($q->issue_date)->format('Y-m-d'),
                        optional($q->valid_until)->format('Y-m-d'),
                        $q->amount,
                        $q->discount,
                        $q->tax_amount,
                        $q->total,
                        'SAR',
                        optional($q->accepted_at)->format('Y-m-d H:i'),
                        optional($q->refused_at)->format('Y-m-d H:i'),
                    ]);
                }
            });
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function downloadPdf(Quote $quote)
    {
        $quote->load('tenant', 'items');

        $template = $quote->pdf_template ?: 'default';
        $view = view()->exists("quotes.{$template}") ? "quotes.{$template}" : 'quotes.default';

        $pdf = Pdf::loadView($view, ['quote' => $quote]);
        $pdf->setPaper('A4');

        return $pdf->download("quote-{$quote->quote_number}.pdf");
    }

    public function destroy(Quote $quote)
    {
        if ($quote->isLocked()) {
            return back()->with('error', 'لا يمكن حذف عرض سعر مقبول أو مرفوض أو مقفل');
        }

        $quote->items()->delete();
        $quote->delete();

        return redirect()->route('super-admin.quotes.index')
            ->with('success', 'تم حذف عرض السعر');
    }

    public function lock(Quote $quote)
    {
        $quote->update(['locked_at' => now()]);

        return back()->with('success', 'تم قفل عرض السعر');
    }

    public function unlock(Quote $quote)
    {
        $quote->update(['locked_at' => null]);

        return back()->with('success', 'تم فتح عرض السعر');
    }

    private function validateQuote(Request $request): array
    {
        return $request->validate([
            'tenant_id' => 'nullable|exists:tenants,id',
            'external_client_name' => 'nullable|string|max:255',
            'external_client_email' => 'nullable|email|max:255',
            'external_client_phone' => 'nullable|string|max:30',
            'external_client_address' => 'nullable|string|max:1000',
            'type' => 'required|in:subscription,setup,addon',
            'issue_date' => 'required|date',
            'valid_until' => 'required|date|after_or_equal:issue_date',
            'tax_rate' => 'required|numeric|min:0|max:100',
            'tax_rate_2' => 'nullable|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'notes_ar' => 'nullable|string|max:1000',
            'notes_en' => 'nullable|string|max:1000',
            'client_notes' => 'nullable|string|max:2000',
            'payment_terms' => 'nullable|string|max:2000',
            'company_header' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:100',
            'billing_address' => 'nullable|string|max:1000',
            'footer_notes' => 'nullable|string|max:1000',
            'bank_name' => 'nullable|string|max:255',
            'bank_country' => 'nullable|string|max:100',
            'bank_iban' => 'nullable|string|max:60',
            'payment_method' => 'nullable|string|max:50',
            'sales_rep_id' => 'nullable|exists:users,id',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            'pdf_template' => 'nullable|in:default,modern,classic',
            'items' => 'required|array|min:1',
            'items.*.description_ar' => 'required|string|max:500',
            'items.*.description_en' => 'required|string|max:500',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);
    }

    private function mapQuoteData(array $v): array
    {
        return [
            'tenant_id' => $v['tenant_id'] ?? null,
            'external_client_name' => $v['external_client_name'] ?? null,
            'external_client_email' => $v['external_client_email'] ?? null,
            'external_client_phone' => $v['external_client_phone'] ?? null,
            'external_client_address' => $v['external_client_address'] ?? null,
            'type' => $v['type'],
            'tax_rate' => $v['tax_rate'],
            'tax_rate_2' => $v['tax_rate_2'] ?? 0,
            'discount' => $v['discount'] ?? 0,
            'discount_percent' => $v['discount_percent'] ?? 0,
            'issue_date' => $v['issue_date'],
            'valid_until' => $v['valid_until'],
            'notes_ar' => $v['notes_ar'] ?? null,
            'notes_en' => $v['notes_en'] ?? null,
            'client_notes' => $v['client_notes'] ?? null,
            'payment_terms' => $v['payment_terms'] ?? null,
            'company_header' => $v['company_header'] ?? null,
            'tax_number' => $v['tax_number'] ?? null,
            'billing_address' => $v['billing_address'] ?? null,
            'footer_notes' => $v['footer_notes'] ?? null,
            'bank_name' => $v['bank_name'] ?? null,
            'bank_country' => $v['bank_country'] ?? null,
            'bank_iban' => $v['bank_iban'] ?? null,
            'payment_method' => $v['payment_method'] ?? null,
            'sales_rep_id' => $v['sales_rep_id'] ?? null,
            'commission_rate' => $v['commission_rate'] ?? 0,
            'pdf_template' => $v['pdf_template'] ?? 'default',
        ];
    }
}
