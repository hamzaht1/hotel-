<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\RenewalRequest;
use App\Models\Tenant;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportsController extends Controller
{
    public function index(Request $request)
    {
        $tab = in_array($request->input('tab'), ['clients', 'invoices', 'requests']) ? $request->input('tab') : 'requests';

        // ─── Global KPIs (always shown, never filtered) ─────
        $kpis = [
            'total_clients' => Tenant::count(),
            'active_subscriptions' => Tenant::where('is_active', true)
                ->where('payment_status', 'approved')
                ->where(fn ($q) => $q->whereNull('subscription_ends_at')->orWhere('subscription_ends_at', '>=', now()))
                ->count(),
            'total_revenue' => (float) Invoice::where('status', 'paid')->sum('total'),
        ];

        $data = match ($tab) {
            'clients' => $this->clientsData($request),
            'invoices' => $this->invoicesData($request),
            default => $this->requestsData($request),
        };

        if ($request->export) {
            return $this->export($tab, $data['rows'], $request->export);
        }

        return Inertia::render('super-admin/reports/index', [
            'tab' => $tab,
            'kpis' => $kpis,
            'rows' => $data['rows_paginated'],
            'available_columns' => $data['columns'],
            'filters' => $request->only(['tab', 'search', 'status', 'plan_id', 'city', 'date_from', 'date_to', 'payment_method', 'per_page']),
            'plans' => Plan::orderBy('sort_order')->get(['id', 'slug', 'name_ar', 'name_en']),
        ]);
    }

    private function clientsData(Request $request): array
    {
        $query = Tenant::query()->with('planModel:id,slug,name_ar,name_en');

        $this->applyCommonFilters($query, $request);

        if ($city = $request->city) {
            $query->where(function ($q) use ($city) {
                $q->where('city', $city)->orWhere('template', $city);
            });
        }

        $query->leftJoinSub(
            Invoice::query()
                ->select('tenant_id')
                ->selectRaw("sum(total) filter (where status = 'paid') as total_paid")
                ->groupBy('tenant_id'),
            'inv',
            'inv.tenant_id',
            '=',
            'tenants.id',
        );

        $query->select('tenants.*', DB::raw('coalesce(inv.total_paid, 0) as total_paid'));

        $per = min(100, max(10, (int) $request->input('per_page', 25)));
        $rows = $query->latest('tenants.created_at')->paginate($per)->withQueryString();

        return [
            'rows_paginated' => $rows,
            'rows' => $rows->getCollection(),
            'columns' => [
                ['key' => 'id', 'label_ar' => 'الرقم التعريفي', 'label_en' => 'ID'],
                ['key' => 'name', 'label_ar' => 'اسم العميل', 'label_en' => 'Client'],
                ['key' => 'org_name_ar', 'label_ar' => 'اسم الفندق', 'label_en' => 'Hotel'],
                ['key' => 'email', 'label_ar' => 'البريد الإلكتروني', 'label_en' => 'Email'],
                ['key' => 'phone', 'label_ar' => 'رقم الجوال', 'label_en' => 'Phone'],
                ['key' => 'city', 'label_ar' => 'المدينة', 'label_en' => 'City'],
                ['key' => 'plan_name', 'label_ar' => 'الباقة', 'label_en' => 'Plan'],
                ['key' => 'created_at', 'label_ar' => 'تاريخ الانضمام', 'label_en' => 'Joined'],
                ['key' => 'total_paid', 'label_ar' => 'إجمالي المدفوعات', 'label_en' => 'Total paid'],
                ['key' => 'client_status', 'label_ar' => 'الحالة', 'label_en' => 'Status'],
                ['key' => 'payment_status', 'label_ar' => 'الدفع', 'label_en' => 'Payment'],
            ],
        ];
    }

    private function invoicesData(Request $request): array
    {
        $query = Invoice::query()->with(['tenant:id,name', 'tenant.planModel:id,slug,name_ar,name_en']);

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhere('external_client_name', 'like', "%{$search}%")
                    ->orWhereHas('tenant', fn ($t) => $t->where('name', 'like', "%{$search}%"));
            });
        }

        if ($status = $request->status) {
            $query->where('status', $status);
        }

        if ($method = $request->payment_method) {
            $query->where('payment_method', $method);
        }

        if ($dateFrom = $request->date_from) {
            $query->where('issue_date', '>=', $dateFrom);
        }
        if ($dateTo = $request->date_to) {
            $query->where('issue_date', '<=', $dateTo);
        }

        $per = min(100, max(10, (int) $request->input('per_page', 25)));
        $rows = $query->latest('issue_date')->paginate($per)->withQueryString();

        return [
            'rows_paginated' => $rows,
            'rows' => $rows->getCollection(),
            'columns' => [
                ['key' => 'invoice_number', 'label_ar' => 'رقم الفاتورة', 'label_en' => 'Invoice #'],
                ['key' => 'client_name', 'label_ar' => 'اسم العميل', 'label_en' => 'Client'],
                ['key' => 'plan_name', 'label_ar' => 'الباقة', 'label_en' => 'Plan'],
                ['key' => 'total', 'label_ar' => 'القيمة', 'label_en' => 'Amount'],
                ['key' => 'issue_date', 'label_ar' => 'تاريخ الإصدار', 'label_en' => 'Issue date'],
                ['key' => 'due_date', 'label_ar' => 'تاريخ الاستحقاق', 'label_en' => 'Due date'],
                ['key' => 'payment_method', 'label_ar' => 'وسيلة الدفع', 'label_en' => 'Method'],
                ['key' => 'status', 'label_ar' => 'الحالة', 'label_en' => 'Status'],
            ],
        ];
    }

    private function requestsData(Request $request): array
    {
        // A "request" is a tenant row enriched with its latest renewal.
        $query = Tenant::query()->with(['planModel:id,slug,name_ar,name_en']);

        $this->applyCommonFilters($query, $request);

        if ($city = $request->city) {
            $query->where(function ($q) use ($city) {
                $q->where('city', $city)->orWhere('template', $city);
            });
        }

        $per = min(100, max(10, (int) $request->input('per_page', 25)));
        $rows = $query->latest('tenants.created_at')->paginate($per)->withQueryString();

        return [
            'rows_paginated' => $rows,
            'rows' => $rows->getCollection(),
            'columns' => [
                ['key' => 'id', 'label_ar' => 'رقم الطلب', 'label_en' => 'Request #'],
                ['key' => 'name', 'label_ar' => 'اسم العميل', 'label_en' => 'Client'],
                ['key' => 'template', 'label_ar' => 'القالب', 'label_en' => 'Template'],
                ['key' => 'plan_name', 'label_ar' => 'الخطة', 'label_en' => 'Plan'],
                ['key' => 'city', 'label_ar' => 'المدينة', 'label_en' => 'City'],
                ['key' => 'created_at', 'label_ar' => 'تاريخ الطلب', 'label_en' => 'Date'],
                ['key' => 'client_status', 'label_ar' => 'الحالة', 'label_en' => 'Status'],
                ['key' => 'payment_status', 'label_ar' => 'الدفع', 'label_en' => 'Payment'],
            ],
        ];
    }

    private function applyCommonFilters($query, Request $request): void
    {
        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('tenants.name', 'like', "%{$search}%")
                    ->orWhere('tenants.email', 'like', "%{$search}%")
                    ->orWhere('tenants.phone', 'like', "%{$search}%");
            });
        }

        if ($status = $request->status) {
            $query->where('tenants.client_status', $status);
        }

        if ($request->plan_id) {
            $query->where('tenants.plan_id', $request->plan_id);
        }

        if ($request->date_from) {
            $query->whereDate('tenants.created_at', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('tenants.created_at', '<=', $request->date_to);
        }
    }

    private function export(string $tab, $rows, string $format)
    {
        $records = match ($tab) {
            'clients' => $rows->map(fn ($r) => [$r->id, $r->name, $r->org_name_ar ?? '', $r->email, $r->phone, $r->city ?? '', $r->planModel?->name_en ?? '', $r->created_at?->toDateString(), $r->total_paid ?? 0, $r->client_status, $r->payment_status]),
            'invoices' => $rows->map(fn ($inv) => [$inv->invoice_number, $inv->tenant?->name ?? $inv->external_client_name ?? '—', $inv->tenant?->planModel?->name_en ?? '—', $inv->total, $inv->issue_date?->toDateString(), $inv->due_date?->toDateString(), $inv->payment_method, $inv->status]),
            default => $rows->map(fn ($r) => [$r->id, $r->name, $r->template, $r->planModel?->name_en ?? '—', $r->city ?? '—', $r->created_at->toDateString(), $r->client_status, $r->payment_status]),
        };

        $headers = match ($tab) {
            'clients' => ['ID', 'Name', 'Hotel', 'Email', 'Phone', 'City', 'Plan', 'Joined', 'Total paid', 'Status', 'Payment'],
            'invoices' => ['Invoice #', 'Client', 'Plan', 'Amount', 'Issue', 'Due', 'Method', 'Status'],
            default => ['Request #', 'Client', 'Template', 'Plan', 'City', 'Date', 'Status', 'Payment'],
        };

        return match ($format) {
            'csv' => response()->streamDownload(function () use ($headers, $records) {
                $out = fopen('php://output', 'w');
                fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
                fputcsv($out, $headers);
                foreach ($records as $r) fputcsv($out, $r);
                fclose($out);
            }, "report-{$tab}.csv"),
            'excel' => response()->streamDownload(function () use ($headers, $records) {
                $out = fopen('php://output', 'w');
                fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
                fputcsv($out, $headers);
                foreach ($records as $r) fputcsv($out, $r);
                fclose($out);
            }, "report-{$tab}.xls", ['Content-Type' => 'application/vnd.ms-excel']),
            'pdf' => Pdf::loadView('exports.tenants', compact('headers', 'records'))
                ->setPaper('A4', 'landscape')
                ->download("report-{$tab}.pdf"),
            default => abort(400),
        };
    }
}
