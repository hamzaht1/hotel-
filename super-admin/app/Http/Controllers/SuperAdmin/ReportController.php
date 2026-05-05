<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    // ─── Financial Reports (all tenants) ───────────────────────

    public function financial(Request $request)
    {
        $query = Tenant::query();

        if ($request->date_from) {
            $query->where('created_at', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->where('created_at', '<=', $request->date_to . ' 23:59:59');
        }
        if ($request->payment_status) {
            $query->where('payment_status', $request->payment_status);
        }
        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $sortField = $request->sort ?? 'created_at';
        $sortDir = $request->direction ?? 'desc';
        $query->orderBy($sortField, $sortDir);

        $tenants = $query->paginate(20)->withQueryString();

        $stats = [
            'total_approved' => Tenant::where('payment_status', 'approved')->count(),
            'total_pending' => Tenant::where('payment_status', 'pending')->count(),
            'total_rejected' => Tenant::where('payment_status', 'rejected')->count(),
            'total_revenue' => 0, // Can be calculated from a payments table if needed
        ];

        return Inertia::render('super-admin/reports/Financial', [
            'tenants' => $tenants,
            'stats' => $stats,
            'filters' => $request->only(['date_from', 'date_to', 'payment_status', 'search', 'sort', 'direction']),
        ]);
    }

    // ─── Subscription Reports ──────────────────────────────────

    public function subscriptions(Request $request)
    {
        $query = Tenant::query()->with('planModel:id,name_ar,name_en,slug');

        if ($request->plan_id) {
            $query->where('plan_id', $request->plan_id);
        }
        if ($request->status) {
            $query->where('is_active', $request->status === 'active');
        }
        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $sortField = $request->sort ?? 'created_at';
        $sortDir = $request->direction ?? 'desc';
        $query->orderBy($sortField, $sortDir);

        $tenants = $query->paginate(20)->withQueryString();

        // Add days_remaining to each tenant
        $tenants->getCollection()->transform(function ($tenant) {
            $tenant->days_remaining = $tenant->subscription_ends_at
                ? now()->diffInDays($tenant->subscription_ends_at, false)
                : null;
            return $tenant;
        });

        $stats = [
            'total_active' => Tenant::where('is_active', true)->count(),
            'total_pending' => Tenant::where('payment_status', 'pending')->count(),
            'total_expired' => Tenant::where('subscription_ends_at', '<', now())->count(),
            'expiring_soon' => Tenant::where('subscription_ends_at', '>', now())
                ->where('subscription_ends_at', '<', now()->addMonth())->count(),
            'by_plan' => Plan::withCount('tenants')->orderBy('sort_order')->get(['id', 'name_ar', 'name_en', 'slug', 'tenants_count']),
        ];

        return Inertia::render('super-admin/reports/Subscriptions', [
            'tenants' => $tenants,
            'stats' => $stats,
            'plans' => Plan::orderBy('sort_order')->get(['id', 'name_ar', 'name_en', 'slug']),
            'filters' => $request->only(['plan_id', 'status', 'search', 'sort', 'direction']),
        ]);
    }

}
