<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Page;
use App\Models\RenewalRequest;
use App\Models\Review;
use App\Models\Template;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // ─── Period filter (default: this month) ─────────────────
        $range = $this->resolveRange($request->input('range', 'this_month'));
        [$from, $to] = [$range['from'], $range['to']];

        $tenantsInRange = Tenant::whereBetween('created_at', [$from, $to]);
        $invoicesInRange = Invoice::whereBetween('issue_date', [$from->toDateString(), $to->toDateString()]);

        // ─── KPI cards ───────────────────────────────────────────
        $stats = [
            'total_clients' => Tenant::count(),
            'total_sites' => Tenant::where('is_active', true)->count(),
            'total_revenue' => (float) Invoice::where('status', 'paid')->sum('total'),
            'total_messages' => DB::table('support_messages')->count(),
            'satisfaction' => round((float) (Review::avg('rating') ?? 0), 2),
            'total_templates' => Template::count(),
        ];

        // ─── Recent renewal requests ─────────────────────────────
        $recentRequests = RenewalRequest::query()
            ->with('tenant:id,name')
            ->latest('created_at')
            ->take(3)
            ->get(['id', 'tenant_id', 'status', 'created_at']);

        // ─── Recent payments (paid invoices) ─────────────────────
        $recentPayments = Invoice::query()
            ->with('tenant:id,name')
            ->where('status', 'paid')
            ->latest('paid_at')
            ->take(3)
            ->get(['id', 'tenant_id', 'invoice_number', 'total', 'paid_at', 'payment_method']);

        // ─── New clients ─────────────────────────────────────────
        $newClients = Tenant::query()
            ->latest('created_at')
            ->take(5)
            ->get(['id', 'name', 'template', 'created_at']);

        // ─── Revenue time series (grouped by day for this month, by month for this year) ─
        $revenueSeries = $this->buildRevenueSeries($from, $to);

        // ─── Top templates (by tenant count) ─────────────────────
        $topTemplates = Template::query()
            ->withCount('tenants')
            ->orderByDesc('tenants_count')
            ->take(3)
            ->get(['id', 'key', 'name_ar', 'name_en', 'preview_image']);

        // ─── Top payment methods ─────────────────────────────────
        $topPaymentMethods = Invoice::query()
            ->whereNotNull('payment_method')
            ->select('payment_method', DB::raw('count(*) as count'), DB::raw('sum(total) as total'))
            ->groupBy('payment_method')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row) => [
                'method' => $row->payment_method,
                'count' => (int) $row->count,
                'total' => (float) $row->total,
            ]);

        // ─── Client distribution by region (using template as city proxy) ─
        $byRegion = Tenant::query()
            ->select('template', DB::raw('count(*) as count'))
            ->groupBy('template')
            ->get()
            ->map(fn ($row) => [
                'key' => $row->template,
                'count' => (int) $row->count,
            ])
            ->values();

        return Inertia::render('super-admin/dashboard', [
            'stats' => $stats,
            'range' => [
                'key' => $range['key'],
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'recentRequests' => $recentRequests,
            'recentPayments' => $recentPayments,
            'newClients' => $newClients,
            'revenueSeries' => $revenueSeries,
            'topTemplates' => $topTemplates,
            'topPaymentMethods' => $topPaymentMethods,
            'byRegion' => $byRegion,
            'quickLinks' => [
                'requests' => route('super-admin.renewals.index'),
                'invoices' => route('super-admin.invoices.index'),
                'clients' => route('super-admin.tenants.index'),
            ],
        ]);
    }

    private function resolveRange(string $key): array
    {
        $now = now();
        return match ($key) {
            'this_week' => ['key' => 'this_week', 'from' => $now->copy()->startOfWeek(), 'to' => $now->copy()->endOfWeek()],
            'this_year' => ['key' => 'this_year', 'from' => $now->copy()->startOfYear(), 'to' => $now->copy()->endOfYear()],
            'last_month' => ['key' => 'last_month', 'from' => $now->copy()->subMonth()->startOfMonth(), 'to' => $now->copy()->subMonth()->endOfMonth()],
            default => ['key' => 'this_month', 'from' => $now->copy()->startOfMonth(), 'to' => $now->copy()->endOfMonth()],
        };
    }

    private function buildRevenueSeries(Carbon $from, Carbon $to): array
    {
        $diffDays = $from->diffInDays($to);
        $groupByMonth = $diffDays > 45;

        // Bucket expression — Postgres uses to_char, SQLite uses strftime
        $driver = DB::connection()->getDriverName();
        $bucketExpr = match (true) {
            $driver === 'pgsql' && $groupByMonth => "to_char(issue_date, 'YYYY-MM')",
            $driver === 'pgsql' => "to_char(issue_date, 'YYYY-MM-DD')",
            $driver === 'sqlite' && $groupByMonth => "strftime('%Y-%m', issue_date)",
            $driver === 'sqlite' => "strftime('%Y-%m-%d', issue_date)",
            $groupByMonth => "DATE_FORMAT(issue_date, '%Y-%m')",
            default => "DATE_FORMAT(issue_date, '%Y-%m-%d')",
        };

        $rows = Invoice::query()
            ->whereBetween('issue_date', [$from->toDateString(), $to->toDateString()])
            ->where('status', 'paid')
            ->select(DB::raw("{$bucketExpr} as bucket"), DB::raw('sum(total) as total'))
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->get();

        return $rows->map(fn ($r) => [
            'date' => $r->bucket,
            'total' => (float) $r->total,
        ])->all();
    }

}
