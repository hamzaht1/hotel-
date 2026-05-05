<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    // ─── Financial Reports ─────────────────────────────────────

    public function financial(Request $request)
    {
        $query = Payment::query();

        if ($request->date_from) {
            $query->where('payment_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->where('payment_date', '<=', $request->date_to);
        }
        if ($request->payment_type) {
            $types = is_array($request->payment_type) ? $request->payment_type : explode(',', $request->payment_type);
            $query->whereIn('payment_type', $types);
        }
        if ($request->has_discount) {
            $query->where('discount', '>', 0);
        }
        if ($request->search) {
            $query->where('client_name', 'like', "%{$request->search}%");
        }

        $sortField = $request->sort ?? 'created_at';
        $sortDir = $request->direction ?? 'desc';
        $query->orderBy($sortField, $sortDir);

        $payments = $query->paginate(20)->withQueryString();

        // Aggregates (on all filtered, not just current page)
        $aggregateQuery = Payment::query();
        if ($request->date_from) $aggregateQuery->where('payment_date', '>=', $request->date_from);
        if ($request->date_to) $aggregateQuery->where('payment_date', '<=', $request->date_to);
        if ($request->payment_type) {
            $types = is_array($request->payment_type) ? $request->payment_type : explode(',', $request->payment_type);
            $aggregateQuery->whereIn('payment_type', $types);
        }
        if ($request->has_discount) $aggregateQuery->where('discount', '>', 0);

        $stats = [
            'total_collected' => (clone $aggregateQuery)->where('status', 'paid')->sum('amount'),
            'total_pending' => (clone $aggregateQuery)->where('status', 'pending')->sum('amount'),
            'total_overdue' => (clone $aggregateQuery)->where('status', 'overdue')->sum('amount'),
            'total_discount' => (clone $aggregateQuery)->sum('discount'),
            'count' => (clone $aggregateQuery)->count(),
        ];

        return Inertia::render('client-admin/reports/Financial', [
            'payments' => $payments,
            'stats' => $stats,
            'filters' => $request->only(['date_from', 'date_to', 'payment_type', 'has_discount', 'search', 'sort', 'direction']),
        ]);
    }

    // ─── Subscription Reports ──────────────────────────────────

    public function subscriptions(Request $request)
    {
        $tenant = app('current_tenant');

        return Inertia::render('client-admin/reports/Subscriptions', [
            'subscription' => [
                'plan' => $tenant->plan,
                'starts_at' => $tenant->subscription_starts_at,
                'ends_at' => $tenant->subscription_ends_at,
                'is_active' => $tenant->is_active,
                'payment_status' => $tenant->payment_status ?? 'pending',
                'days_remaining' => $tenant->subscription_ends_at
                    ? now()->diffInDays($tenant->subscription_ends_at, false)
                    : null,
            ],
        ]);
    }

}
