<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\RenewalRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RenewalController extends Controller
{
    public function index()
    {
        $tenant = app('current_tenant');
        $planModel = $tenant->plan_id ? \App\Models\Plan::find($tenant->plan_id) : null;

        $renewals = RenewalRequest::where('tenant_id', $tenant->id)
            ->latest('requested_at')
            ->get();

        $hasPendingRequest = $renewals->where('status', 'pending')->isNotEmpty();

        return Inertia::render('client-admin/renewal/index', [
            'tenant' => [
                'name' => $tenant->name,
                'subscription_starts_at' => $tenant->subscription_starts_at?->toDateString(),
                'subscription_ends_at' => $tenant->subscription_ends_at?->toDateString(),
                'is_active' => $tenant->is_active,
                'plan' => $planModel ? [
                    'name_ar' => $planModel->name_ar,
                    'name_en' => $planModel->name_en,
                    'price' => $planModel->price,
                ] : null,
            ],
            'renewals' => $renewals,
            'canRenew' => !$hasPendingRequest,
        ]);
    }

    public function store(Request $request)
    {
        $tenant = app('current_tenant');

        // Check for existing pending request
        $hasPending = RenewalRequest::where('tenant_id', $tenant->id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPending) {
            return back()->with('error', 'لديك طلب تجديد قيد المراجعة بالفعل');
        }

        $validated = $request->validate([
            'receipt' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'notes' => 'nullable|string|max:1000',
        ]);

        $receiptPath = $request->file('receipt')->store('renewal-receipts', 'public');

        RenewalRequest::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $tenant->plan_id,
            'status' => 'pending',
            'receipt_path' => $receiptPath,
            'notes' => $validated['notes'] ?? null,
            'requested_at' => now(),
        ]);

        return back()->with('success', 'تم إرسال طلب التجديد بنجاح');
    }
}
