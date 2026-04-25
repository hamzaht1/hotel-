<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Template;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlansTemplatesController extends Controller
{
    public function index(Request $request)
    {
        $plansQuery = Plan::query()->withCount('tenants');

        if ($search = $request->search) {
            $plansQuery->where(function ($q) use ($search) {
                $q->where('name_ar', 'like', "%{$search}%")
                    ->orWhere('name_en', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($status = $request->status) {
            match ($status) {
                'active' => $plansQuery->where('is_active', true)->where('is_coming_soon', false),
                'inactive' => $plansQuery->where('is_active', false),
                'coming_soon' => $plansQuery->where('is_coming_soon', true),
                default => null,
            };
        }

        if ($request->plan_filter && $request->plan_filter !== 'all') {
            $plansQuery->where('slug', $request->plan_filter);
        }

        $plans = $plansQuery->orderBy('sort_order')->get();

        $templates = Template::withCount('tenants')->orderBy('sort_order')->get();

        // ─── KPIs ─────────────────────────────────────────────
        $totalTenants = \App\Models\Tenant::count();
        $stats = [
            'active_plans' => Plan::where('is_active', true)->where('is_coming_soon', false)->count(),
            'inactive_plans' => Plan::where('is_active', false)->orWhere('is_coming_soon', true)->count(),
            'total_plans' => Plan::count(),
            // Count tenants grouped by plan slug (dynamic, shows top 3 plans)
            'by_plan' => Plan::withCount('tenants')->orderByDesc('tenants_count')->take(3)->get(['id', 'slug', 'name_ar', 'name_en', 'tenants_count']),
            'total_tenants' => $totalTenants,
            'active_templates' => Template::where('is_active', true)->count(),
            'inactive_templates' => Template::where('is_active', false)->count(),
            'coming_soon_templates' => Template::where('is_coming_soon', true)->count(),
            'total_templates' => Template::count(),
        ];

        return Inertia::render('super-admin/plans-templates/index', [
            'plans' => $plans,
            'templates' => $templates,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'plan_filter', 'tab']),
        ]);
    }
}
