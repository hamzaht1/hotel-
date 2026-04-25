<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Plan;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        // ─── Time range ──────────────────────────────────────
        [$from, $to, $rangeKey] = $this->resolveRange($request->input('range', 'this_month'));

        $base = Invoice::query()->with([
            'tenant:id,name,email,plan_id',
            'tenant.planModel:id,slug,name_ar,name_en',
            'salesRep:id,name',
        ]);

        if ($from && $to) {
            $base->whereBetween('issue_date', [$from->toDateString(), $to->toDateString()]);
        }

        // ─── KPIs (on full range, not filtered) ──────────────
        $stats = [
            'successful' => (clone $base)->where('status', 'paid')->count(),
            'failed' => (clone $base)->whereIn('status', ['overdue', 'cancelled'])->count(),
            'pending' => (clone $base)->whereIn('status', ['draft', 'sent'])->count(),
            'refunded' => (clone $base)->where('status', 'refunded')->count(),
            'total_revenue' => (float) (clone $base)->where('status', 'paid')->sum('total'),
            'total_commission' => (float) (clone $base)->where('status', 'paid')->sum('commission_amount'),
            'net_profit' => 0.0,
        ];
        $stats['net_profit'] = $stats['total_revenue'] - $stats['total_commission'];

        // ─── Filters ─────────────────────────────────────────
        $query = clone $base;

        if ($status = $request->status) {
            match ($status) {
                'successful' => $query->where('status', 'paid'),
                'pending' => $query->whereIn('status', ['draft', 'sent']),
                'failed' => $query->whereIn('status', ['overdue', 'cancelled']),
                'refunded' => $query->where('status', 'refunded'),
                default => null,
            };
        }

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhere('external_client_name', 'like', "%{$search}%")
                    ->orWhereHas('tenant', fn ($t) => $t->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->plan_id && $request->plan_id !== 'all') {
            $query->whereHas('tenant', fn ($t) => $t->where('plan_id', $request->plan_id));
        }

        if ($request->payment_method && $request->payment_method !== 'all') {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->export) {
            return $this->export($query, $request->export);
        }

        $transactions = $query->latest('issue_date')->paginate(25)->withQueryString();

        // Add derived flags
        $transactions->getCollection()->transform(function ($inv) {
            $inv->derived_status = match (true) {
                $inv->status === 'paid' => 'successful',
                in_array($inv->status, ['overdue', 'cancelled']) => 'failed',
                $inv->status === 'refunded' => 'refunded',
                default => 'pending',
            };
            $inv->has_commission = (float) $inv->commission_amount > 0;
            $inv->client_name = $inv->tenant?->name ?? $inv->external_client_name ?? '—';
            $inv->plan_name = $inv->tenant?->planModel?->name_ar ?? '—';
            return $inv;
        });

        return Inertia::render('super-admin/transactions/index', [
            'transactions' => $transactions,
            'stats' => $stats,
            'range' => ['key' => $rangeKey],
            'filters' => $request->only(['search', 'status', 'plan_id', 'payment_method', 'range']),
            'plans' => Plan::orderBy('sort_order')->get(['id', 'slug', 'name_ar', 'name_en']),
        ]);
    }

    public function destroy(Invoice $invoice)
    {
        if ($invoice->status === 'paid') {
            return back()->with('error', 'لا يمكن حذف عملية ناجحة');
        }
        $invoice->items()->delete();
        $invoice->delete();
        return back()->with('success', 'تم حذف العملية');
    }

    public function pause(Invoice $invoice)
    {
        $invoice->update(['status' => 'draft']);
        return back()->with('success', 'تم إيقاف العملية');
    }

    public function receipt(Invoice $invoice)
    {
        $invoice->load('tenant', 'items');
        $pdf = Pdf::loadView('invoices.default', ['invoice' => $invoice])->setPaper('A4');
        return $pdf->download("receipt-{$invoice->invoice_number}.pdf");
    }

    private function resolveRange(string $key): array
    {
        $now = now();
        return match ($key) {
            'today' => [$now->copy()->startOfDay(), $now->copy()->endOfDay(), 'today'],
            'this_week' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek(), 'this_week'],
            'this_year' => [$now->copy()->startOfYear(), $now->copy()->endOfYear(), 'this_year'],
            'all' => [null, null, 'all'],
            default => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth(), 'this_month'],
        };
    }

    private function export($query, string $format)
    {
        $rows = $query->get();
        $headers = ['#', 'Plan', 'Date', 'Client', 'Status', 'Commission', 'Method', 'Amount'];
        $records = $rows->map(fn ($inv) => [
            $inv->invoice_number,
            $inv->tenant?->planModel?->name_en ?? '—',
            $inv->issue_date?->toDateString(),
            $inv->tenant?->name ?? $inv->external_client_name ?? '—',
            $inv->status,
            (float) $inv->commission_amount > 0 ? 'Yes' : 'No',
            $inv->payment_method ?? '—',
            $inv->total,
        ]);

        return match ($format) {
            'csv' => response()->streamDownload(function () use ($headers, $records) {
                $out = fopen('php://output', 'w');
                fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
                fputcsv($out, $headers);
                foreach ($records as $r) fputcsv($out, $r);
                fclose($out);
            }, 'transactions.csv'),
            'excel' => response()->streamDownload(function () use ($headers, $records) {
                $out = fopen('php://output', 'w');
                fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
                fputcsv($out, $headers);
                foreach ($records as $r) fputcsv($out, $r);
                fclose($out);
            }, 'transactions.xls', ['Content-Type' => 'application/vnd.ms-excel']),
            'pdf' => Pdf::loadView('exports.tenants', ['headers' => $headers, 'records' => $records])
                ->setPaper('A4', 'landscape')
                ->download('transactions.pdf'),
            default => abort(400),
        };
    }
}
