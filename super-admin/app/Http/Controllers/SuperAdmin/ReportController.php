<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    // ─── Support Messages Reports ──────────────────────────────

    public function messages(Request $request)
    {
        // Super admin sees support messages from all tenants
        // Using direct DB query since the model might have tenant scope
        $query = DB::table('support_messages')
            ->join('tenants', 'support_messages.tenant_id', '=', 'tenants.id')
            ->select('support_messages.*', 'tenants.name as tenant_name');

        if ($request->type) {
            $query->where('support_messages.type', $request->type);
        }
        if ($request->status) {
            $query->where('support_messages.status', $request->status);
        }
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('support_messages.client_name', 'like', "%{$request->search}%")
                  ->orWhere('support_messages.subject', 'like', "%{$request->search}%")
                  ->orWhere('tenants.name', 'like', "%{$request->search}%");
            });
        }

        $sortField = $request->sort ?? 'support_messages.created_at';
        $sortDir = $request->direction ?? 'desc';
        $query->orderBy($sortField, $sortDir);

        $messages = $query->paginate(20)->withQueryString();

        $stats = [
            'total' => DB::table('support_messages')->count(),
            'open' => DB::table('support_messages')->where('status', 'open')->count(),
            'in_progress' => DB::table('support_messages')->where('status', 'in_progress')->count(),
            'closed' => DB::table('support_messages')->where('status', 'closed')->count(),
            'by_type' => [
                'support' => DB::table('support_messages')->where('type', 'support')->count(),
                'complaint' => DB::table('support_messages')->where('type', 'complaint')->count(),
                'inquiry' => DB::table('support_messages')->where('type', 'inquiry')->count(),
                'technical' => DB::table('support_messages')->where('type', 'technical')->count(),
            ],
        ];

        return Inertia::render('super-admin/reports/Messages', [
            'messages' => $messages,
            'stats' => $stats,
            'filters' => $request->only(['type', 'status', 'search', 'sort', 'direction']),
        ]);
    }

    public function replyMessage(Request $request, int $id)
    {
        $request->validate(['reply' => 'required|string|max:2000']);

        DB::table('support_messages')->where('id', $id)->update([
            'reply' => $request->reply,
            'status' => 'in_progress',
            'assigned_to' => $request->user()->name,
            'updated_at' => now(),
        ]);

        return back()->with('success', 'تم إرسال الرد بنجاح');
    }

    public function updateStatus(Request $request, int $id)
    {
        $request->validate(['status' => 'required|in:open,in_progress,closed']);

        DB::table('support_messages')->where('id', $id)->update([
            'status' => $request->status,
            'updated_at' => now(),
        ]);

        return back()->with('success', 'تم تحديث الحالة');
    }
}
