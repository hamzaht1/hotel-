<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\RenewalRequest;
use App\Models\Tenant;
use App\Models\Template;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        // ─── Time range filter ─────────────────────────────────
        // Default to "all" so the clients directory lists every client on load.
        // A month-scoped default silently hid clients registered in earlier months
        // (e.g. approved requests), making the page look empty.
        [$from, $to, $rangeKey] = $this->resolveRange($request->input('range', 'all'));

        $base = Tenant::query()->with(['planModel:id,name_ar,name_en,slug']);

        if ($from && $to) {
            $base->whereBetween('created_at', [$from, $to]);
        }

        // ─── Compute tier for every tenant (join paid invoices count) ─
        $base->leftJoinSub(
            Invoice::query()
                ->select('tenant_id')
                ->selectRaw("count(*) filter (where status = 'paid') as paid_invoices_count")
                ->selectRaw('count(*) as total_invoices_count')
                ->groupBy('tenant_id'),
            'inv_stats',
            'inv_stats.tenant_id',
            '=',
            'tenants.id',
        )->select('tenants.*', DB::raw('coalesce(inv_stats.paid_invoices_count, 0) as paid_invoices_count'), DB::raw('coalesce(inv_stats.total_invoices_count, 0) as total_invoices_count'));

        // ─── Stats (tier counts + total) — run against the same range ─
        $allForStats = (clone $base)->get();
        $tierCounts = ['platinum' => 0, 'gold' => 0, 'silver' => 0, 'bronze' => 0];
        foreach ($allForStats as $t) {
            $tierCounts[$t->getTier()]++;
        }
        $stats = array_merge($tierCounts, ['total' => $allForStats->count()]);

        // ─── Filters ───────────────────────────────────────────
        $query = clone $base;

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('tenants.name', 'like', "%{$search}%")
                    ->orWhere('tenants.email', 'like', "%{$search}%")
                    ->orWhere('tenants.phone', 'like', "%{$search}%")
                    ->orWhere('tenants.org_name_ar', 'like', "%{$search}%")
                    ->orWhere('tenants.org_name_en', 'like', "%{$search}%")
                    ->orWhere('tenants.id', $search);
            });
        }

        if ($city = $request->city) {
            if ($city !== 'all') {
                $query->where(function ($q) use ($city) {
                    $q->where('tenants.city', $city)->orWhere('tenants.template', $city);
                });
            }
        }

        if ($plan = $request->plan_id) {
            $query->where('tenants.plan_id', $plan);
        }

        if ($status = $request->status) {
            $query->where('tenants.client_status', $status);
        }

        if ($sort = $request->sort) {
            $dir = $request->direction === 'asc' ? 'asc' : 'desc';
            $allowed = ['id', 'name', 'email', 'created_at', 'plan_id', 'client_status'];
            if (in_array($sort, $allowed)) {
                $query->orderBy("tenants.{$sort}", $dir);
            }
        } else {
            $query->latest('tenants.created_at');
        }

        if ($request->export) {
            return $this->export($query, $request->export);
        }

        $perPage = min(100, max(10, (int) $request->input('per_page', 25)));
        $tenants = $query->paginate($perPage)->withQueryString();

        // Filter by computed tier (post-pagination) — since tier is derived.
        // For accurate filtering we reassign `tenants.data` in-place.
        if ($tierFilter = $request->tier) {
            if ($tierFilter !== 'all') {
                $filtered = $tenants->getCollection()->filter(fn ($t) => $t->getTier() === $tierFilter);
                $tenants->setCollection($filtered->values());
            }
        }

        // Attach computed tier + derived fields for the frontend
        $tenants->getCollection()->transform(function ($t) {
            $t->tier = $t->getTier();
            $t->tier_is_override = !empty($t->tier_override);
            $t->logo_url = $t->logo ? \Storage::disk('public')->url($t->logo) : null;
            $t->hotel_name = $t->org_name_ar ?? $t->org_name_en ?? $t->name;
            return $t;
        });

        return Inertia::render('super-admin/clients/index', [
            'tenants' => $tenants,
            'stats' => $stats,
            'range' => ['key' => $rangeKey],
            'filters' => $request->only(['search', 'city', 'tier', 'plan_id', 'status', 'range', 'sort', 'direction', 'per_page']),
            'plans' => Plan::orderBy('sort_order')->get(['id', 'name_ar', 'name_en', 'slug']),
            'cities' => $this->availableCities(),
        ]);
    }

    public function show(Tenant $tenant)
    {
        $tenant->load(['planModel:id,name_ar,name_en,slug,price']);
        $tenant->loadCount(['invoices']);

        $primaryUser = User::where('tenant_id', $tenant->id)->where('role', 'client_admin')->first();

        // Establishment / registration data the client filled in — lives in the
        // main app's hotel_settings table (no model in this app, so query directly).
        $establishment = DB::table('hotel_settings')
            ->where('tenant_id', $tenant->id)
            ->first([
                'hotel_name_ar', 'hotel_name_en', 'first_name', 'last_name',
                'responsible_position', 'commercial_activity', 'branches_count',
                'cr_number', 'cr_expiry', 'vat_number',
                'license_number', 'license_expiry',
                'municipality_license_number', 'municipality_license_expiry',
            ]);

        $invoices = Invoice::where('tenant_id', $tenant->id)
            ->latest('issue_date')
            ->get(['id', 'invoice_number', 'type', 'status', 'total', 'issue_date', 'due_date', 'payment_method', 'paid_at']);

        $renewals = RenewalRequest::where('tenant_id', $tenant->id)
            ->latest('created_at')
            ->get(['id', 'plan_id', 'status', 'payment_method', 'created_at', 'processed_at']);

        // support_messages was replaced by conversations + conversation_messages
        // (migration 2026_05_04_000002). Flatten conversations into the legacy
        // shape the frontend (super-admin/clients/show.tsx) still expects.
        $messages = Conversation::where('tenant_id', $tenant->id)
            ->with('latestMessage')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Conversation $c) => [
                'id' => $c->id,
                'client_name' => $c->client_name ?? '',
                'subject' => $c->subject,
                'message' => $c->latestMessage?->body ?? '',
                'status' => $c->status,
                'is_urgent' => false,
                'source' => $c->source,
                'created_at' => $c->created_at?->toIso8601String(),
            ])
            ->values();

        $reviews = \App\Models\Review::where('tenant_id', $tenant->id)
            ->orderByDesc('created_at')
            ->get(['id', 'guest_name', 'rating', 'comment', 'status', 'created_at']);

        $paid = $tenant->invoices()->where('status', 'paid')->count();
        $tenant->paid_invoices_count = $paid;
        $tenant->tier = $tenant->getTier();
        $tenant->logo_url = $tenant->logo ? \Storage::disk('public')->url($tenant->logo) : null;

        return Inertia::render('super-admin/clients/show', [
            'tenant' => $tenant,
            'primary_user' => $primaryUser,
            'establishment' => $establishment,
            'invoices' => $invoices,
            'renewals' => $renewals,
            'messages' => $messages,
            'reviews' => $reviews,
            'stats' => [
                'invoices_count' => $tenant->invoices_count,
                'paid_count' => $paid,
                'days_remaining' => $tenant->days_remaining,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('super-admin/clients/create', [
            'plans' => Plan::where('is_active', true)->orderBy('sort_order')->get(['id', 'name_ar', 'name_en', 'slug']),
            'templates' => Template::where('is_active', true)->orderBy('sort_order')->get(['id', 'key', 'name_ar', 'name_en']),
            'cities' => $this->availableCities(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:30',
            'hotel_name' => 'required|string|max:255',
            'plan_id' => 'required|exists:plans,id',
            'template' => 'required|string|max:50',
            'password' => 'required|string|min:8',
            'logo' => 'nullable|file|image|max:2048',
            'city' => 'nullable|string|max:100',
            'payment_method' => 'nullable|in:manual,bank_transfer,moyasar,tap,credit_card,mada,apple_pay',
            'payment_status' => 'nullable|in:pending,approved,rejected',
            'client_status' => 'nullable|in:active,frozen,banned',
            'tier_override' => 'nullable|in:bronze,silver,gold,platinum',
            'bank_transfer_receipt' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'payment_notes' => 'nullable|string|max:500',
        ]);

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('tenant-logos', 'public');
        }

        $receiptPath = null;
        if ($request->hasFile('bank_transfer_receipt')) {
            $receiptPath = $request->file('bank_transfer_receipt')->store('bank-receipts', 'public');
        }

        $slug = Str::slug($validated['hotel_name']);
        $suffix = 0;
        $baseSlug = $slug;
        while (Tenant::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . (++$suffix);
        }

        $paymentStatus = $validated['payment_status'] ?? 'approved';
        $isApproved = $paymentStatus === 'approved';

        $tenant = Tenant::create([
            'name' => $validated['hotel_name'],
            'slug' => $slug,
            'template' => $validated['template'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'plan_id' => $validated['plan_id'],
            'is_active' => $isApproved,
            'client_status' => $validated['client_status'] ?? 'active',
            'tier_override' => $validated['tier_override'] ?? null,
            'payment_status' => $paymentStatus,
            'payment_method' => $validated['payment_method'] ?? 'manual',
            'bank_transfer_receipt' => $receiptPath,
            'payment_notes' => $validated['payment_notes'] ?? null,
            'approved_by' => $isApproved ? $request->user()?->id : null,
            'approved_at' => $isApproved ? now() : null,
            'logo' => $logoPath,
            'city' => $validated['city'] ?? null,
            'org_name_ar' => $validated['hotel_name'],
            'org_name_en' => $validated['hotel_name'],
            'subscription_starts_at' => $isApproved ? now() : null,
            'subscription_ends_at' => $isApproved ? now()->addYear() : null,
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'tenant_id' => $tenant->id,
            'role' => 'client_admin',
        ]);

        return redirect()->route('super-admin.clients.index')->with('success', 'تم إضافة العميل بنجاح');
    }

    public function setTier(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'tier' => 'nullable|in:bronze,silver,gold,platinum',
        ]);

        $tenant->update(['tier_override' => $validated['tier'] ?? null]);

        return back()->with('success', 'Tier updated');
    }

    public function setStatus(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'client_status' => 'required|in:active,frozen,banned',
        ]);

        $tenant->update(['client_status' => $validated['client_status']]);

        return back()->with('success', 'Status updated');
    }

    public function sendMessage(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
            'is_urgent' => 'boolean',
        ]);

        DB::transaction(function () use ($validated, $tenant, $request) {
            $conversation = Conversation::create([
                'tenant_id' => $tenant->id,
                'category' => Conversation::CATEGORY_SUPPORT,
                'status' => Conversation::STATUS_NEW,
                'subject' => $validated['subject'],
                // Platform-originated message → lands in the client's "من ضيافة"
                // section, not their own "طلباتي" requests.
                'source' => Conversation::SOURCE_PLATFORM,
                'created_by_user_id' => $request->user()->id,
                'client_name' => $request->user()->name,
                'client_email' => $request->user()->email,
                'last_message_at' => now(),
                'tenant_unread_count' => 1,
            ]);

            ConversationMessage::create([
                'conversation_id' => $conversation->id,
                'sender_type' => ConversationMessage::SENDER_ADMIN,
                'sender_user_id' => $request->user()->id,
                'sender_name' => $request->user()->name,
                'body' => $validated['message'],
            ]);
        });

        return back()->with('success', 'تم إرسال الرسالة');
    }

    private function availableCities(): array
    {
        return [
            ['key' => 'madina', 'label_ar' => 'المدينة المنورة', 'label_en' => 'Madinah'],
            ['key' => 'mecca', 'label_ar' => 'مكة المكرمة', 'label_en' => 'Mecca'],
            ['key' => 'riyadh', 'label_ar' => 'الرياض', 'label_en' => 'Riyadh'],
            ['key' => 'jeddah', 'label_ar' => 'جدة', 'label_en' => 'Jeddah'],
            ['key' => 'hejaz', 'label_ar' => 'الحجاز', 'label_en' => 'Hejaz'],
            ['key' => 'central', 'label_ar' => 'الوسطى', 'label_en' => 'Central'],
        ];
    }

    private function resolveRange(string $key): array
    {
        $now = now();
        return match ($key) {
            'today' => [$now->copy()->startOfDay(), $now->copy()->endOfDay(), 'today'],
            'this_week' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek(), 'this_week'],
            'this_year' => [$now->copy()->startOfYear(), $now->copy()->endOfYear(), 'this_year'],
            'all' => [null, null, 'all'],
            default => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth(), 'this_month'],
        };
    }

    private function export($query, string $format)
    {
        $rows = $query->get();

        $headers = ['ID', 'Name', 'Email', 'Phone', 'Hotel', 'City', 'Template', 'Plan', 'Status', 'Tier', 'Invoices', 'Registered'];
        $records = $rows->map(fn ($t) => [
            $t->id,
            $t->name,
            $t->email,
            $t->phone,
            $t->org_name_ar ?? $t->org_name_en ?? '',
            $t->city ?? $t->template,
            $t->template,
            $t->planModel?->name_en,
            $t->client_status,
            $t->getTier(),
            $t->total_invoices_count ?? 0,
            $t->created_at->toDateTimeString(),
        ]);

        return match ($format) {
            'csv' => response()->streamDownload(function () use ($headers, $records) {
                $out = fopen('php://output', 'w');
                fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
                fputcsv($out, $headers);
                foreach ($records as $r) fputcsv($out, $r);
                fclose($out);
            }, 'clients.csv'),
            'excel' => response()->streamDownload(function () use ($headers, $records) {
                $out = fopen('php://output', 'w');
                fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
                fputcsv($out, $headers);
                foreach ($records as $r) fputcsv($out, $r);
                fclose($out);
            }, 'clients.xls', ['Content-Type' => 'application/vnd.ms-excel']),
            'pdf' => (function () use ($headers, $records) {
                $html = view('exports.tenants', compact('headers', 'records'))->render();
                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('A4', 'landscape');
                return $pdf->download('clients.pdf');
            })(),
            default => abort(400),
        };
    }
}
