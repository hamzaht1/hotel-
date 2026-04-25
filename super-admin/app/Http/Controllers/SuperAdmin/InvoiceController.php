<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $invoices = Invoice::query()
            ->with('tenant:id,name,email')
            ->when($request->search, fn ($q, $s) => $q->where(function ($q2) use ($s) {
                $q2->whereHas('tenant', fn ($t) => $t->where('name', 'like', "%{$s}%"))
                    ->orWhere('invoice_number', 'like', "%{$s}%")
                    ->orWhere('external_client_name', 'like', "%{$s}%");
            }))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->tenant_id, fn ($q, $id) => $q->where('tenant_id', $id))
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->when($request->payment_method, fn ($q, $m) => $q->where('payment_method', $m))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total_invoices' => Invoice::count(),
            'total_paid' => (float) Invoice::where('status', 'paid')->sum('total'),
            'total_pending' => (float) Invoice::whereIn('status', ['draft', 'sent'])->sum('total'),
            'total_overdue' => (float) Invoice::where('status', 'sent')->where('due_date', '<', now())->sum('total'),
            'paid_count' => Invoice::where('status', 'paid')->count(),
            'pending_count' => Invoice::whereIn('status', ['draft', 'sent'])->count(),
            'overdue_count' => Invoice::where('status', 'sent')->where('due_date', '<', now())->count(),
            'cancelled_count' => Invoice::where('status', 'cancelled')->count(),
            'total_collected' => (float) Invoice::where('status', 'paid')->sum('total'),
        ];

        return Inertia::render('super-admin/invoices/index', [
            'invoices' => $invoices,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'tenant_id', 'type', 'payment_method']),
        ]);
    }

    public function create()
    {
        return Inertia::render('super-admin/invoices/create', [
            'tenants' => Tenant::where('is_active', true)->orderBy('name')->get(['id', 'name', 'email', 'phone', 'org_name_ar', 'plan_id']),
            'plans' => \App\Models\Plan::orderBy('sort_order')->get(['id', 'slug', 'name_ar', 'name_en']),
            'salesReps' => User::where('role', 'super_admin')->orWhere('role', 'staff')->orderBy('name')->get(['id', 'name']),
            'nextNumber' => Invoice::generateNumber(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateInvoice($request);

        $invoice = Invoice::create(array_merge($this->mapInvoiceData($validated), [
            'invoice_number' => Invoice::generateNumber(),
            'status' => 'draft',
            'amount' => 0,
            'tax_amount' => 0,
            'tax_amount_2' => 0,
            'total' => 0,
        ]));

        foreach ($validated['items'] as $item) {
            $invoice->items()->create([
                'description_ar' => $item['description_ar'],
                'description_en' => $item['description_en'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total' => $item['quantity'] * $item['unit_price'],
            ]);
        }

        $invoice->calculateTotals();

        return redirect()->route('super-admin.invoices.show', $invoice)
            ->with('success', 'تم إنشاء الفاتورة بنجاح');
    }

    public function show(Invoice $invoice)
    {
        return Inertia::render('super-admin/invoices/show', [
            'invoice' => $invoice->load('tenant:id,name,email,phone,org_name_ar,org_name_en', 'items'),
        ]);
    }

    public function edit(Invoice $invoice)
    {
        if ($invoice->isLocked()) {
            return back()->with('error', 'لا يمكن تعديل فاتورة مدفوعة أو مقفلة');
        }

        $tenants = Tenant::where('is_active', true)->orderBy('name')->get(['id', 'name', 'email']);

        return Inertia::render('super-admin/invoices/edit', [
            'invoice' => $invoice->load('items'),
            'tenants' => $tenants,
        ]);
    }

    public function update(Request $request, Invoice $invoice)
    {
        if ($invoice->isLocked()) {
            return back()->with('error', 'لا يمكن تعديل فاتورة مدفوعة أو مقفلة');
        }

        $validated = $this->validateInvoice($request);

        $invoice->update($this->mapInvoiceData($validated));

        $invoice->items()->delete();

        foreach ($validated['items'] as $item) {
            $invoice->items()->create([
                'description_ar' => $item['description_ar'],
                'description_en' => $item['description_en'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total' => $item['quantity'] * $item['unit_price'],
            ]);
        }

        $invoice->calculateTotals();

        return redirect()->route('super-admin.invoices.show', $invoice)
            ->with('success', 'تم تحديث الفاتورة بنجاح');
    }

    public function send(Invoice $invoice)
    {
        $invoice->update(['status' => 'sent']);

        $admin = User::where('tenant_id', $invoice->tenant_id)->where('role', 'client_admin')->first();
        if ($admin) {
            try {
                Mail::to($admin->email)->send(
                    new \App\Mail\InvoiceSentMail($invoice, $admin)
                );
            } catch (\Exception $e) {
                \Log::warning('Invoice email failed: ' . $e->getMessage());
            }
        }

        return back()->with('success', 'تم إرسال الفاتورة بنجاح');
    }

    public function markAsPaid(Request $request, Invoice $invoice)
    {
        $invoice->update([
            'status' => 'paid',
            'paid_at' => now(),
            'payment_method' => $request->input('payment_method', 'bank_transfer'),
        ]);

        return back()->with('success', 'تم تسجيل الدفع بنجاح');
    }

    public function downloadPdf(Invoice $invoice)
    {
        $invoice->load('tenant', 'items');

        $template = $invoice->pdf_template ?: 'default';
        $view = view()->exists("invoices.{$template}") ? "invoices.{$template}" : 'invoices.default';

        $pdf = Pdf::loadView($view, ['invoice' => $invoice]);
        $pdf->setPaper('A4');

        return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
    }

    public function destroy(Invoice $invoice)
    {
        if ($invoice->isLocked()) {
            return back()->with('error', 'لا يمكن حذف فاتورة مدفوعة أو مقفلة');
        }

        $invoice->items()->delete();
        $invoice->delete();

        return redirect()->route('super-admin.invoices.index')
            ->with('success', 'تم حذف الفاتورة');
    }

    public function lock(Invoice $invoice)
    {
        $invoice->update(['locked_at' => now()]);

        return back()->with('success', 'تم قفل الفاتورة');
    }

    public function unlock(Invoice $invoice)
    {
        if ($invoice->status === 'paid') {
            return back()->with('error', 'لا يمكن فتح فاتورة مدفوعة');
        }

        $invoice->update(['locked_at' => null]);

        return back()->with('success', 'تم فتح الفاتورة');
    }

    private function validateInvoice(Request $request): array
    {
        return $request->validate([
            'tenant_id' => 'nullable|exists:tenants,id',
            'external_client_name' => 'nullable|string|max:255',
            'external_client_email' => 'nullable|email|max:255',
            'external_client_phone' => 'nullable|string|max:30',
            'external_client_address' => 'nullable|string|max:1000',
            'type' => 'required|in:subscription,setup,addon',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
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
            'requires_receipt' => 'boolean',
            'has_receipt_toggle' => 'boolean',
            'pdf_template' => 'nullable|in:default,modern,classic',
            'items' => 'required|array|min:1',
            'items.*.description_ar' => 'required|string|max:500',
            'items.*.description_en' => 'required|string|max:500',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);
    }

    private function mapInvoiceData(array $v): array
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
            'due_date' => $v['due_date'],
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
            'requires_receipt' => $v['requires_receipt'] ?? false,
            'has_receipt_toggle' => $v['has_receipt_toggle'] ?? false,
            'pdf_template' => $v['pdf_template'] ?? 'default',
        ];
    }
}
