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
            ->when($request->search, fn ($q, $s) => $q->whereHas('tenant', fn ($t) => $t->where('name', 'like', "%{$s}%"))
                ->orWhere('invoice_number', 'like', "%{$s}%"))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->tenant_id, fn ($q, $id) => $q->where('tenant_id', $id))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total_invoices' => Invoice::count(),
            'total_paid' => Invoice::where('status', 'paid')->sum('total'),
            'total_pending' => Invoice::whereIn('status', ['draft', 'sent'])->sum('total'),
            'total_overdue' => Invoice::where('status', 'sent')->where('due_date', '<', now())->sum('total'),
        ];

        return Inertia::render('super-admin/invoices/index', [
            'invoices' => $invoices,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'tenant_id']),
        ]);
    }

    public function create()
    {
        $tenants = Tenant::where('is_active', true)->orderBy('name')->get(['id', 'name', 'email']);

        return Inertia::render('super-admin/invoices/create', [
            'tenants' => $tenants,
            'nextNumber' => Invoice::generateNumber(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'type' => 'required|in:subscription,setup,addon',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
            'tax_rate' => 'required|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
            'notes_ar' => 'nullable|string|max:1000',
            'notes_en' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.description_ar' => 'required|string|max:500',
            'items.*.description_en' => 'required|string|max:500',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $invoice = Invoice::create([
            'tenant_id' => $validated['tenant_id'],
            'invoice_number' => Invoice::generateNumber(),
            'type' => $validated['type'],
            'status' => 'draft',
            'tax_rate' => $validated['tax_rate'],
            'discount' => $validated['discount'] ?? 0,
            'issue_date' => $validated['issue_date'],
            'due_date' => $validated['due_date'],
            'notes_ar' => $validated['notes_ar'] ?? null,
            'notes_en' => $validated['notes_en'] ?? null,
            'amount' => 0,
            'tax_amount' => 0,
            'total' => 0,
        ]);

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
        if ($invoice->status !== 'draft') {
            return back()->with('error', 'لا يمكن تعديل فاتورة تم إرسالها');
        }

        $tenants = Tenant::where('is_active', true)->orderBy('name')->get(['id', 'name', 'email']);

        return Inertia::render('super-admin/invoices/edit', [
            'invoice' => $invoice->load('items'),
            'tenants' => $tenants,
        ]);
    }

    public function update(Request $request, Invoice $invoice)
    {
        if ($invoice->status !== 'draft') {
            return back()->with('error', 'لا يمكن تعديل فاتورة تم إرسالها');
        }

        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'type' => 'required|in:subscription,setup,addon',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
            'tax_rate' => 'required|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
            'notes_ar' => 'nullable|string|max:1000',
            'notes_en' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.description_ar' => 'required|string|max:500',
            'items.*.description_en' => 'required|string|max:500',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $invoice->update([
            'tenant_id' => $validated['tenant_id'],
            'type' => $validated['type'],
            'tax_rate' => $validated['tax_rate'],
            'discount' => $validated['discount'] ?? 0,
            'issue_date' => $validated['issue_date'],
            'due_date' => $validated['due_date'],
            'notes_ar' => $validated['notes_ar'] ?? null,
            'notes_en' => $validated['notes_en'] ?? null,
        ]);

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

        $pdf = Pdf::loadView('invoices.pdf', ['invoice' => $invoice]);
        $pdf->setPaper('A4');

        return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
    }
}
