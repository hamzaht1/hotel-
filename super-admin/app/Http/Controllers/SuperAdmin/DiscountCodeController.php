<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\DiscountCode;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DiscountCodeController extends Controller
{
    public function index(Request $request)
    {
        $codes = DiscountCode::query()
            ->with('plan:id,name_ar,name_en')
            ->when($request->search, fn ($q, $s) => $q->where('code', 'like', "%{$s}%"))
            ->when($request->status !== null, function ($q) use ($request) {
                $q->where('is_active', $request->status === 'active');
            })
            ->when($request->plan_id, fn ($q, $id) => $q->where('plan_id', $id))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('super-admin/discount-codes/index', [
            'codes' => $codes,
            'plans' => Plan::where('is_active', true)->orderBy('sort_order')->get(['id', 'name_ar', 'name_en']),
            'filters' => $request->only(['search', 'status', 'plan_id']),
        ]);
    }

    public function create()
    {
        return Inertia::render('super-admin/discount-codes/create', [
            'plans' => Plan::where('is_active', true)->orderBy('sort_order')->get(['id', 'name_ar', 'name_en']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:discount_codes,code',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'plan_id' => 'nullable|exists:plans,id',
            'max_uses' => 'nullable|integer|min:1',
            // valid_from can be in the past — lets admins record historical codes.
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after:valid_from',
            // Note: no "after_or_equal:today" rule so past dates are accepted.
            'is_active' => 'boolean',
        ]);

        $validated['code'] = Str::upper($validated['code']);

        DiscountCode::create($validated);

        return redirect()->route('super-admin.discount-codes.index')
            ->with('success', 'تم إنشاء كود الخصم بنجاح');
    }

    public function edit(DiscountCode $discountCode)
    {
        return Inertia::render('super-admin/discount-codes/edit', [
            'discountCode' => $discountCode->load('plan:id,name_ar,name_en'),
            'plans' => Plan::where('is_active', true)->orderBy('sort_order')->get(['id', 'name_ar', 'name_en']),
        ]);
    }

    public function update(Request $request, DiscountCode $discountCode)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('discount_codes')->ignore($discountCode)],
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'plan_id' => 'nullable|exists:plans,id',
            'max_uses' => 'nullable|integer|min:1',
            // valid_from can be in the past — lets admins record historical codes.
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after:valid_from',
            // Note: no "after_or_equal:today" rule so past dates are accepted.
            'is_active' => 'boolean',
        ]);

        $validated['code'] = Str::upper($validated['code']);
        $discountCode->update($validated);

        return redirect()->route('super-admin.discount-codes.index')
            ->with('success', 'تم تحديث كود الخصم بنجاح');
    }

    public function toggleStatus(DiscountCode $discountCode)
    {
        $discountCode->update(['is_active' => !$discountCode->is_active]);

        return back()->with('success', $discountCode->is_active ? 'تم تفعيل كود الخصم' : 'تم تعطيل كود الخصم');
    }
}
