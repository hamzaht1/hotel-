<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\RenewalRequest;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RenewalController extends Controller
{
    public function index(Request $request)
    {
        $renewals = RenewalRequest::query()
            ->with('tenant', 'plan')
            ->when($request->status && $request->status !== 'all', function ($q) use ($request) {
                $q->where('status', $request->status);
            })
            ->when($request->payment_method && $request->payment_method !== 'all', function ($q) use ($request) {
                $q->where('payment_method', $request->payment_method);
            })
            ->latest('requested_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('super-admin/renewals/index', [
            'renewals' => $renewals,
            'filters' => $request->only(['status', 'payment_method']),
        ]);
    }

    public function approve(RenewalRequest $renewal)
    {
        $renewal->update([
            'status' => 'approved',
            'processed_at' => now(),
            'processed_by' => auth()->id(),
        ]);

        $tenant = $renewal->tenant;

        // Extend subscription: +1 year from current end date, or from now if already expired
        $baseDate = $tenant->subscription_ends_at && $tenant->subscription_ends_at->isFuture()
            ? $tenant->subscription_ends_at
            : now();

        $tenant->update([
            'subscription_starts_at' => $tenant->subscription_starts_at ?? now(),
            'subscription_ends_at' => $baseDate->copy()->addYear(),
            'is_active' => true,
        ]);

        $plan = $renewal->plan_id ? Plan::find($renewal->plan_id) : null;
        if ($plan) {
            app(InvoiceService::class)->createRenewalInvoice($tenant, $renewal->fresh(), $plan);
        }

        return back()->with('success', 'تم قبول طلب التجديد وتمديد الاشتراك بنجاح');
    }

    public function reject(Request $request, RenewalRequest $renewal)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $renewal->update([
            'status' => 'rejected',
            'processed_at' => now(),
            'processed_by' => auth()->id(),
            'notes' => $request->reason,
        ]);

        return back()->with('success', 'تم رفض طلب التجديد');
    }
}
