<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PlanController extends Controller
{
    public function index(Request $request)
    {
        $plans = Plan::query()
            ->when($request->search, fn ($q, $s) => $q->where('name_ar', 'like', "%{$s}%")->orWhere('name_en', 'like', "%{$s}%"))
            ->when($request->status !== null, function ($q) use ($request) {
                $q->where('is_active', $request->status === 'active');
            })
            ->withCount('tenants')
            ->orderBy('sort_order')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('super-admin/plans/index', [
            'plans' => $plans,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create()
    {
        return Inertia::render('super-admin/plans/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'slug' => 'required|string|max:100|unique:plans,slug',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'billing_cycle' => 'required|in:monthly,yearly',
            'features_ar' => 'nullable|array',
            'features_ar.*' => 'string|max:500',
            'features_en' => 'nullable|array',
            'features_en.*' => 'string|max:500',
            'limits' => 'nullable|array',
            'icon' => 'nullable|string|max:255',
            'variant' => 'nullable|in:light,solid,soft',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['slug']);

        Plan::create($validated);

        return redirect()->route('super-admin.plans.index')
            ->with('success', 'تم إنشاء الباقة بنجاح');
    }

    public function edit(Plan $plan)
    {
        return Inertia::render('super-admin/plans/edit', [
            'plan' => $plan,
        ]);
    }

    public function update(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'slug' => ['required', 'string', 'max:100', Rule::unique('plans')->ignore($plan)],
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'billing_cycle' => 'required|in:monthly,yearly',
            'features_ar' => 'nullable|array',
            'features_ar.*' => 'string|max:500',
            'features_en' => 'nullable|array',
            'features_en.*' => 'string|max:500',
            'limits' => 'nullable|array',
            'icon' => 'nullable|string|max:255',
            'variant' => 'nullable|in:light,solid,soft',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['slug']);
        $plan->update($validated);

        return redirect()->route('super-admin.plans.index')
            ->with('success', 'تم تحديث الباقة بنجاح');
    }

    public function toggleStatus(Plan $plan)
    {
        $plan->update(['is_active' => !$plan->is_active]);

        return back()->with('success', $plan->is_active ? 'تم تفعيل الباقة' : 'تم تعطيل الباقة');
    }
}
