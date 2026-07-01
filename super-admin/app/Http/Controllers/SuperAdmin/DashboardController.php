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
use Illuminate\Support\Facades\Schema;
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

        // ─── KPI cards (resilient against partial migrations) ────
        // Tables added in later sprints (reviews, conversation_messages, etc.) may
        // not exist on environments that haven't run the main-app migrations
        // yet. Guard each metric so the dashboard still renders.
        $stats = [
            'total_clients' => Schema::hasTable('tenants') ? Tenant::count() : 0,
            'total_sites' => Schema::hasTable('tenants') ? Tenant::where('is_active', true)->count() : 0,
            'total_revenue' => Schema::hasTable('invoices')
                ? (float) Invoice::where('status', 'paid')->sum('total')
                : 0.0,
            'total_messages' => Schema::hasTable('conversation_messages')
                ? DB::table('conversation_messages')->count()
                : 0,
            'satisfaction' => Schema::hasTable('reviews')
                ? round((float) (Review::avg('rating') ?? 0), 2)
                : 0,
            'total_templates' => Schema::hasTable('templates') ? Template::count() : 0,
        ];

        // ─── Recent renewal requests ─────────────────────────────
        $recentRequests = Schema::hasTable('renewal_requests')
            ? RenewalRequest::query()
                ->with('tenant:id,name')
                ->latest('created_at')
                ->take(3)
                ->get(['id', 'tenant_id', 'status', 'created_at'])
            : collect();

        // ─── Recent payments (paid invoices) ─────────────────────
        $recentPayments = Schema::hasTable('invoices')
            ? Invoice::query()
                ->with('tenant:id,name')
                ->where('status', 'paid')
                ->latest('paid_at')
                ->take(3)
                ->get(['id', 'tenant_id', 'invoice_number', 'total', 'paid_at', 'payment_method'])
            : collect();

        // ─── New clients ─────────────────────────────────────────
        $newClients = Schema::hasTable('tenants')
            ? Tenant::query()
                ->latest('created_at')
                ->take(5)
                ->get(['id', 'name', 'template', 'created_at'])
            : collect();

        // ─── Revenue time series (grouped by day for this month, by month for this year) ─
        $revenueSeries = Schema::hasTable('invoices') ? $this->buildRevenueSeries($from, $to) : [];

        // ─── Top templates (by tenant count) ─────────────────────
        $topTemplates = Schema::hasTable('templates')
            ? Template::query()
                ->withCount('tenants')
                ->orderByDesc('tenants_count')
                ->take(3)
                ->get(['id', 'key', 'name_ar', 'name_en', 'preview_image'])
            : collect();

        // ─── Top payment methods ─────────────────────────────────
        $topPaymentMethods = Schema::hasTable('invoices')
            ? Invoice::query()
                ->whereNotNull('payment_method')
                ->select('payment_method', DB::raw('count(*) as count'), DB::raw('sum(total) as total'))
                ->groupBy('payment_method')
                ->orderByDesc('count')
                ->get()
                ->map(fn ($row) => [
                    'method' => $row->payment_method,
                    'count' => (int) $row->count,
                    'total' => (float) $row->total,
                ])
            : collect();

        // ─── Client distribution by region (using template as city proxy) ─
        $byRegion = Schema::hasTable('tenants')
            ? Tenant::query()
                ->select('template', DB::raw('count(*) as count'))
                ->groupBy('template')
                ->get()
                ->map(fn ($row) => [
                    'key' => $row->template,
                    'count' => (int) $row->count,
                ])
                ->values()
            : collect();

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

        // Revenue is realised when an invoice is actually paid, so the series is
        // keyed by paid_at (not issue_date) — that's when the subscription money
        // lands and where the spike should appear on the timeline.
        $driver = DB::connection()->getDriverName();
        $bucketExpr = match (true) {
            $driver === 'pgsql' && $groupByMonth => "to_char(paid_at, 'YYYY-MM')",
            $driver === 'pgsql' => "to_char(paid_at, 'YYYY-MM-DD')",
            $driver === 'sqlite' && $groupByMonth => "strftime('%Y-%m', paid_at)",
            $driver === 'sqlite' => "strftime('%Y-%m-%d', paid_at)",
            $groupByMonth => "DATE_FORMAT(paid_at, '%Y-%m')",
            default => "DATE_FORMAT(paid_at, '%Y-%m-%d')",
        };

        $totals = Invoice::query()
            ->where('status', 'paid')
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$from, $to])
            ->select(DB::raw("{$bucketExpr} as bucket"), DB::raw('sum(total) as total'))
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        // No revenue in the range → let the frontend show its empty state.
        if ($totals->isEmpty()) {
            return [];
        }

        // Emit a continuous timeline across the whole period so days/months
        // without revenue render as 0 instead of being dropped — otherwise the
        // chart collapses to a flat, undated line that hides when revenue
        // actually occurred.
        $series = [];
        $cursor = $groupByMonth ? $from->copy()->startOfMonth() : $from->copy()->startOfDay();
        while ($cursor <= $to) {
            $key = $cursor->format($groupByMonth ? 'Y-m' : 'Y-m-d');
            $series[] = ['date' => $key, 'total' => (float) $totals->get($key, 0)];
            $groupByMonth ? $cursor->addMonth() : $cursor->addDay();
        }

        return $series;
    }

}
