<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\RenewalRequest;
use App\Models\RequestTag;
use App\Models\Tenant;
use App\Models\User;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TenantController extends Controller
{
    public function index(Request $request)
    {
        // ─── Stats cards (computed against the full, unfiltered set) ───
        $stats = $this->computeStats();

        // ─── Build unified query (tenants + latest renewal) ────────
        $query = Tenant::query()
            ->with([
                'planModel:id,name_ar,name_en,slug,price',
                'tags:id,label,color',
            ])
            ->withCount('users')
            ->leftJoinSub(
                RenewalRequest::query()
                    ->select('tenant_id')
                    ->selectRaw('count(*) filter (where status = ?) as pending_count', ['pending'])
                    ->selectRaw('max(created_at) as last_request_at')
                    // Status of the most recent renewal request, so a rejected
                    // renewal is reflected in the row status (not shown as completed).
                    ->selectRaw('(array_agg(status ORDER BY created_at DESC))[1] as last_request_status')
                    ->groupBy('tenant_id'),
                'req_stats',
                'req_stats.tenant_id',
                '=',
                'tenants.id',
            )
            ->select('tenants.*', 'req_stats.pending_count', 'req_stats.last_request_at', 'req_stats.last_request_status');

        // ─── Search (name / email / domain / invoice number) ───────
        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('tenants.name', 'like', "%{$search}%")
                    ->orWhere('tenants.email', 'like', "%{$search}%")
                    ->orWhere('tenants.domain', 'like', "%{$search}%")
                    ->orWhere('tenants.custom_domain', 'like', "%{$search}%")
                    ->orWhere('tenants.slug', 'like', "%{$search}%")
                    ->orWhereExists(function ($sub) use ($search) {
                        $sub->select(DB::raw(1))
                            ->from('invoices')
                            ->whereColumn('invoices.tenant_id', 'tenants.id')
                            ->where('invoices.invoice_number', 'like', "%{$search}%");
                    });
            });
        }

        // ─── Filter by derived status ──────────────────────────────
        if ($status = $request->status) {
            $this->applyStatusFilter($query, $status);
        }

        if ($template = $request->template) {
            $query->where('tenants.template', $template);
        }

        if ($paymentMethod = $request->payment_method) {
            $query->where('tenants.payment_method', $paymentMethod);
        }

        if ($planId = $request->plan_id) {
            $query->where('tenants.plan_id', $planId);
        }

        if ($dateFrom = $request->date_from) {
            $query->whereDate('tenants.created_at', '>=', $dateFrom);
        }
        if ($dateTo = $request->date_to) {
            $query->whereDate('tenants.created_at', '<=', $dateTo);
        }

        if ($request->export) {
            return $this->export($query, $request->export);
        }

        $tenants = $query->latest('tenants.created_at')->paginate(20)->withQueryString();

        return Inertia::render('super-admin/tenants/index', [
            'tenants' => $tenants,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'template', 'payment_method', 'plan_id', 'date_from', 'date_to']),
            'plans' => Plan::orderBy('sort_order')->get(['id', 'name_ar', 'name_en', 'slug']),
            'tags' => RequestTag::orderBy('label')->get(['id', 'label', 'color']),
        ]);
    }

    private function computeStats(): array
    {
        $now = now();
        return [
            'total' => Tenant::count(),
            'completed' => Tenant::where('is_active', true)
                ->where('payment_status', 'approved')
                ->where(fn ($q) => $q->whereNull('subscription_ends_at')->orWhere('subscription_ends_at', '>=', $now))
                ->count(),
            'pending' => Tenant::where('payment_status', 'pending')->count()
                + RenewalRequest::where('status', 'pending')->count(),
            'expired' => Tenant::whereNotNull('subscription_ends_at')
                ->where('subscription_ends_at', '<', $now)
                ->count(),
            'rejected' => Tenant::where('payment_status', 'rejected')->count(),
            'inactive' => Tenant::where('is_active', false)
                ->whereNotIn('payment_status', ['pending', 'rejected'])
                ->count(),
        ];
    }

    private function applyStatusFilter($query, string $status): void
    {
        $now = now();
        match ($status) {
            'completed' => $query
                ->where('tenants.is_active', true)
                ->where('tenants.payment_status', 'approved')
                ->where(fn ($q) => $q->whereNull('tenants.subscription_ends_at')->orWhere('tenants.subscription_ends_at', '>=', $now)),
            'pending' => $query->where(function ($q) {
                $q->where('tenants.payment_status', 'pending')
                    ->orWhere('req_stats.pending_count', '>', 0);
            }),
            'expired' => $query
                ->whereNotNull('tenants.subscription_ends_at')
                ->where('tenants.subscription_ends_at', '<', $now),
            'rejected' => $query->where('tenants.payment_status', 'rejected'),
            'inactive' => $query->where('tenants.is_active', false)
                ->whereNotIn('tenants.payment_status', ['pending', 'rejected']),
            default => null,
        };
    }

    private function export($query, string $format): StreamedResponse|\Illuminate\Http\Response
    {
        $rows = $query->latest('tenants.created_at')->get();
        $headers = ['ID', 'Name', 'Email', 'Domain', 'Template', 'Plan', 'Status', 'Payment', 'Subscription Start', 'Subscription End', 'Created'];

        $records = $rows->map(fn ($t) => [
            $t->id,
            $t->name,
            $t->email,
            $t->custom_domain ?: $t->domain,
            $t->template,
            $t->planModel?->name_en,
            $t->payment_status,
            $t->payment_method,
            $t->subscription_starts_at?->toDateString(),
            $t->subscription_ends_at?->toDateString(),
            $t->created_at->toDateTimeString(),
        ]);

        return match ($format) {
            'csv' => $this->streamCsv($headers, $records, 'tenants.csv'),
            'excel' => $this->streamCsv($headers, $records, 'tenants.xls', "application/vnd.ms-excel"),
            'pdf' => $this->streamPdf($headers, $records),
            default => abort(400, 'Unsupported export format'),
        };
    }

    private function streamCsv(array $headers, $records, string $filename, string $mime = 'text/csv'): StreamedResponse
    {
        return response()->streamDownload(function () use ($headers, $records) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM for Excel
            fputcsv($out, $headers);
            foreach ($records as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, $filename, ['Content-Type' => $mime]);
    }

    private function streamPdf(array $headers, $records): \Illuminate\Http\Response
    {
        $html = view('exports.tenants', ['headers' => $headers, 'records' => $records])->render();
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'landscape');
        return $pdf->download('tenants.pdf');
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
            'plan_id' => 'nullable|exists:plans,id',
            'subscription_starts_at' => 'nullable|date',
            'subscription_ends_at' => 'nullable|date|after:subscription_starts_at',
            'is_active' => 'boolean',
            'logo' => 'nullable|file|image|max:2048',
            'admin_name' => 'nullable|string|max:255',
            'admin_email' => 'nullable|email|unique:users,email',
            'admin_password' => 'nullable|string|min:8',
            'payment_method' => 'nullable|in:bank_transfer,moyasar,tap,manual',
            'payment_status' => 'nullable|in:pending,approved,rejected',
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

        $tenant = Tenant::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['slug']),
            'domain' => $validated['domain'] ?? null,
            'subdomain' => $validated['subdomain'] ?? null,
            'template' => $validated['template'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'plan_id' => $validated['plan_id'] ?? null,
            'subscription_starts_at' => $validated['subscription_starts_at'] ?? null,
            'subscription_ends_at' => $validated['subscription_ends_at'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'logo' => $logoPath,
            'payment_method' => $validated['payment_method'] ?? 'manual',
            'payment_status' => $validated['payment_status'] ?? 'approved',
            'bank_transfer_receipt' => $receiptPath,
            'payment_notes' => $validated['payment_notes'] ?? null,
        ]);

        if (!empty($validated['admin_email']) && !empty($validated['admin_password'])) {
            User::create([
                'name' => $validated['admin_name'] ?? $validated['name'],
                'email' => $validated['admin_email'],
                'password' => $validated['admin_password'],
                'tenant_id' => $tenant->id,
                'role' => 'client_admin',
            ]);
        }

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

    public function show(Tenant $tenant)
    {
        $tenant->load('users:id,tenant_id,name,email,phone,photo,role,created_at', 'planModel:id,name_ar,name_en,slug,price', 'tags:id,label,color', 'approver:id,name', 'deployer:id,name');

        $primaryUser = $tenant->users->firstWhere('role', 'client_admin');

        $latestInvoice = \App\Models\Invoice::where('tenant_id', $tenant->id)
            ->latest('issue_date')
            ->first();

        $renewals = \App\Models\RenewalRequest::where('tenant_id', $tenant->id)
            ->with('processedByUser:id,name')
            ->orderBy('created_at')
            ->get();
        $latestRenewal = $renewals->last();

        $completedRequestsCount = \App\Models\Tenant::where('email', $primaryUser?->email ?? '---never---')
            ->where('payment_status', 'approved')
            ->count();

        $activity = $this->buildActivity($tenant, $renewals);

        return Inertia::render('super-admin/tenants/show', [
            'tenant' => $tenant,
            'primary_user' => $primaryUser,
            'latest_invoice' => $latestInvoice,
            'latest_renewal' => $latestRenewal,
            'completed_requests_count' => $completedRequestsCount,
            'activity' => $activity,
            'deployment' => [
                'url' => $tenant->deploymentUrl(),
                'subdomain' => $tenant->subdomain,
                'base_domain' => env('TENANT_BASE_DOMAIN', ''),
            ],
        ]);
    }

    /**
     * Chronological activity log. Each payment/renewal gets its OWN entries with
     * its own real dates — the timeline no longer mixes tenant-level and
     * latest-renewal dates (which produced out-of-order, stale entries).
     *
     * @param  \Illuminate\Support\Collection<int, \App\Models\RenewalRequest>  $renewals
     */
    private function buildActivity(Tenant $tenant, \Illuminate\Support\Collection $renewals): array
    {
        $ts = fn ($d) => $d instanceof \Carbon\Carbon ? $d->toDateTimeString() : ($d ? (string) $d : null);
        $events = [];

        $events[] = [
            'label_ar' => 'تم إنشاء الطلب',
            'label_en' => 'Request created',
            'date' => $ts($tenant->created_at),
            'type' => 'created',
            'actor' => null,
        ];

        // Initial subscription payment (distinct from later renewals).
        if ($tenant->payment_status === 'approved' && ($tenant->approved_at || $tenant->subscription_starts_at)) {
            $events[] = [
                'label_ar' => 'تم تأكيد الدفع الأولي',
                'label_en' => 'Initial payment confirmed',
                'date' => $ts($tenant->approved_at ?? $tenant->subscription_starts_at),
                'type' => 'payment',
                'actor' => $tenant->approver?->name,
            ];
        } elseif ($tenant->payment_status === 'pending') {
            $events[] = [
                'label_ar' => 'قيد المراجعة',
                'label_en' => 'Under review',
                'date' => $ts($tenant->created_at),
                'type' => 'review',
                'actor' => null,
            ];
        }

        // One record per renewal request, using its own dates/status.
        foreach ($renewals as $r) {
            $events[] = [
                'label_ar' => 'طلب تجديد قيد المراجعة',
                'label_en' => 'Renewal request — under review',
                'date' => $ts($r->requested_at ?? $r->created_at),
                'type' => 'review',
                'actor' => null,
            ];

            if ($r->status === 'approved') {
                $events[] = [
                    'label_ar' => 'تم تأكيد دفع التجديد',
                    'label_en' => 'Renewal payment confirmed',
                    'date' => $ts($r->processed_at ?? $r->updated_at),
                    'type' => 'payment',
                    'actor' => $r->processedByUser?->name,
                ];
            } elseif ($r->status === 'rejected') {
                $events[] = [
                    'label_ar' => 'تم رفض طلب التجديد',
                    'label_en' => 'Renewal request rejected',
                    'date' => $ts($r->processed_at ?? $r->updated_at),
                    'type' => 'completed',
                    'actor' => $r->processedByUser?->name,
                ];
            }
        }

        // Sort chronologically so the timeline reads left-to-right in real order.
        usort($events, fn ($a, $b) => strcmp((string) $a['date'], (string) $b['date']));

        return $events;
    }

    public function destroy(Tenant $tenant)
    {
        $tenant->tags()->detach();
        $tenant->delete();

        return redirect()->route('super-admin.tenants.index')->with('success', 'تم حذف الطلب');
    }

    public function sendMessage(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        DB::transaction(function () use ($validated, $tenant, $request) {
            $conversation = Conversation::create([
                'tenant_id' => $tenant->id,
                'category' => Conversation::CATEGORY_SUPPORT,
                'status' => Conversation::STATUS_NEW,
                'subject' => $validated['subject'],
                'source' => Conversation::SOURCE_SUPPORT,
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

    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => ['required', 'string', 'max:255', Rule::unique('tenants')->ignore($tenant)],
            'domain' => ['nullable', 'string', 'max:255', Rule::unique('tenants')->ignore($tenant)],
            'subdomain' => ['nullable', 'string', 'max:255', Rule::unique('tenants')->ignore($tenant)],
            'template' => 'required|string|max:50',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
            'plan_id' => 'required|exists:plans,id',
            'subscription_starts_at' => 'nullable|date',
            'subscription_ends_at' => 'nullable|date|after:subscription_starts_at',
            'is_active' => 'boolean',
            'admin_notes' => 'nullable|string|max:5000',
            'payment_method' => 'nullable|in:bank_transfer,moyasar,tap,manual,credit_card,mada,apple_pay',
            'payment_status' => 'nullable|in:pending,approved,rejected',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'integer|exists:request_tags,id',
        ]);

        $validated['slug'] = Str::slug($validated['slug']);
        $tagIds = $validated['tag_ids'] ?? null;
        unset($validated['tag_ids']);

        $tenant->update($validated);

        if ($tagIds !== null) {
            $tenant->tags()->sync($tagIds);
        }

        return back()->with('success', 'Tenant updated successfully');
    }

    /**
     * Approve the most recent pending renewal request for this tenant.
     * Extends the subscription by one year and creates the invoice.
     */
    public function approveRenewal(Tenant $tenant)
    {
        $renewal = $tenant->renewalRequests()->where('status', 'pending')->latest()->first();

        if (!$renewal) {
            return back()->with('error', 'لا يوجد طلب تجديد معلق');
        }

        $plan = $renewal->plan_id ? Plan::find($renewal->plan_id) : $tenant->planModel;

        $currentEnd = $tenant->subscription_ends_at;
        $newStart = $currentEnd && $currentEnd->isFuture() ? $currentEnd->copy() : now();
        $newEnd = $newStart->copy()->addYear();

        $tenant->update([
            'is_active' => true,
            'payment_status' => 'approved',
            'plan_id' => $plan?->id ?? $tenant->plan_id,
            'subscription_starts_at' => $tenant->subscription_starts_at ?? $newStart,
            'subscription_ends_at' => $newEnd,
        ]);

        $renewal->update([
            'status' => 'approved',
            'processed_at' => now(),
            'processed_by' => request()->user()?->id,
        ]);

        if ($plan) {
            $alreadyInvoiced = Invoice::where('tenant_id', $tenant->id)
                ->where('notes_en', 'like', "%Renewal #{$renewal->id}%")
                ->exists();
            if (!$alreadyInvoiced) {
                app(InvoiceService::class)->createRenewalInvoice($tenant, $renewal->fresh(), $plan);
            }
        }

        return back()->with('success', 'تم قبول طلب التجديد');
    }

    public function rejectRenewal(Request $request, Tenant $tenant)
    {
        $renewal = $tenant->renewalRequests()->where('status', 'pending')->latest()->first();

        if (!$renewal) {
            return back()->with('error', 'لا يوجد طلب تجديد معلق');
        }

        $validated = $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $renewal->update([
            'status' => 'rejected',
            'notes' => $validated['rejection_reason'] ?? null,
            'processed_at' => now(),
            'processed_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'تم رفض طلب التجديد');
    }

    public function syncTags(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'tag_ids' => 'array',
            'tag_ids.*' => 'integer|exists:request_tags,id',
        ]);

        $tenant->tags()->sync($validated['tag_ids'] ?? []);

        return back()->with('success', 'Tags updated');
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
            'approved_by' => request()->user()?->id,
            'approved_at' => now(),
        ]);

        $plan = $tenant->plan_id ? Plan::find($tenant->plan_id) : null;
        if ($plan && !Invoice::where('tenant_id', $tenant->id)->where('type', 'subscription')->exists()) {
            app(InvoiceService::class)->createInitialInvoice($tenant, $plan);
        }

        $admin = User::where('tenant_id', $tenant->id)->where('role', 'client_admin')->first();
        if ($admin) {
            \App\Support\Mailer::sendIfConfigured(
                $admin->email,
                fn () => new \App\Mail\PaymentApprovedMail($tenant, $admin),
                'tenant approval'
            );
        }

        return back()->with('success', 'تم تفعيل المنشأة بنجاح');
    }

    /**
     * Mark the tenant site as deployed: ensure subdomain is set,
     * activate it, record the deployer + timestamp. Returns the live URL.
     */
    public function deploy(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'subdomain' => 'nullable|string|alpha_dash|max:60',
        ]);

        $subdomain = $validated['subdomain'] ?? $tenant->subdomain;
        if (!$subdomain) {
            $subdomain = Str::slug($tenant->slug);
        }

        // Make sure the chosen subdomain is unique across other tenants.
        if (Tenant::where('subdomain', $subdomain)->where('id', '!=', $tenant->id)->exists()) {
            return back()->with('error', 'هذا النطاق الفرعي مستخدم بالفعل');
        }

        $tenant->update([
            'subdomain' => $subdomain,
            'is_active' => true,
            'deployed_at' => now(),
            'deployed_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'تم نشر الموقع بنجاح: ' . $tenant->fresh()->deploymentUrl());
    }

    public function rejectPayment(Request $request, Tenant $tenant)
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $tenant->update([
            'payment_status' => 'rejected',
            'payment_notes' => $request->rejection_reason,
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
        ]);

        return back()->with('success', 'تم رفض طلب الدفع');
    }
}
