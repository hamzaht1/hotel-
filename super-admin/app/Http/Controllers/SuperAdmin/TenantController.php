<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TenantController extends Controller
{
    public function index(Request $request)
    {
        $tenants = Tenant::query()
            ->with('planModel:id,name_ar,name_en,slug')
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->when($request->status !== null, function ($q) use ($request) {
                $q->where('is_active', $request->status === 'active');
            })
            ->withCount('users')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('super-admin/tenants/index', [
            'tenants' => $tenants,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create()
    {
        return Inertia::render('super-admin/tenants/create', [
            'plans' => Plan::where('is_active', true)->orderBy('sort_order')->get(['id', 'name_ar', 'name_en', 'slug', 'price']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:tenants,slug',
            'domain' => 'nullable|string|max:255|unique:tenants,domain',
            'subdomain' => 'nullable|string|max:255|unique:tenants,subdomain',
            'template' => 'required|in:riyadh,madina',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
            'plan_id' => 'required|exists:plans,id',
            'subscription_starts_at' => 'nullable|date',
            'subscription_ends_at' => 'nullable|date|after:subscription_starts_at',
            'is_active' => 'boolean',
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:8',
        ]);

        $tenant = Tenant::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['slug']),
            'domain' => $validated['domain'] ?? null,
            'subdomain' => $validated['subdomain'] ?? null,
            'template' => $validated['template'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'plan_id' => $validated['plan_id'],
            'subscription_starts_at' => $validated['subscription_starts_at'] ?? null,
            'subscription_ends_at' => $validated['subscription_ends_at'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        User::create([
            'name' => $validated['admin_name'],
            'email' => $validated['admin_email'],
            'password' => $validated['admin_password'],
            'tenant_id' => $tenant->id,
            'role' => 'client_admin',
        ]);

        $defaultSections = ['hero', 'rooms', 'services', 'gallery', 'testimonials', 'partners', 'contact'];
        foreach ($defaultSections as $index => $section) {
            $tenant->siteSections()->create([
                'section_name' => $section,
                'is_active' => true,
                'sort_order' => $index,
            ]);
        }

        return redirect()->route('super-admin.tenants.index')
            ->with('success', 'Tenant created successfully');
    }

    public function edit(Tenant $tenant)
    {
        return Inertia::render('super-admin/tenants/edit', [
            'tenant' => $tenant->load('users', 'planModel'),
            'plans' => Plan::where('is_active', true)->orderBy('sort_order')->get(['id', 'name_ar', 'name_en', 'slug', 'price']),
        ]);
    }

    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => ['required', 'string', 'max:255', Rule::unique('tenants')->ignore($tenant)],
            'domain' => ['nullable', 'string', 'max:255', Rule::unique('tenants')->ignore($tenant)],
            'subdomain' => ['nullable', 'string', 'max:255', Rule::unique('tenants')->ignore($tenant)],
            'template' => 'required|in:riyadh,madina',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
            'plan_id' => 'required|exists:plans,id',
            'subscription_starts_at' => 'nullable|date',
            'subscription_ends_at' => 'nullable|date|after:subscription_starts_at',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['slug']);
        $tenant->update($validated);

        return redirect()->route('super-admin.tenants.index')
            ->with('success', 'Tenant updated successfully');
    }

    public function toggleStatus(Tenant $tenant)
    {
        $tenant->update(['is_active' => !$tenant->is_active]);

        return back()->with('success', $tenant->is_active ? 'Tenant activated' : 'Tenant deactivated');
    }

    public function approvePayment(Tenant $tenant)
    {
        $tenant->update([
            'payment_status' => 'approved',
            'is_active' => true,
            'subscription_starts_at' => now(),
            'subscription_ends_at' => now()->addYear(),
        ]);

        // Send approval email to tenant admin
        $admin = User::where('tenant_id', $tenant->id)->where('role', 'client_admin')->first();
        if ($admin) {
            try {
                \Illuminate\Support\Facades\Mail::to($admin->email)->send(
                    new \App\Mail\PaymentApprovedMail($tenant, $admin)
                );
            } catch (\Exception $e) {
                \Log::warning('Approval email failed: ' . $e->getMessage());
            }
        }

        return back()->with('success', 'تم تفعيل المنشأة بنجاح');
    }

    public function rejectPayment(Request $request, Tenant $tenant)
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $tenant->update([
            'payment_status' => 'rejected',
            'payment_notes' => $request->rejection_reason,
        ]);

        return back()->with('success', 'تم رفض طلب الدفع');
    }
}
