<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Broadcast;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BroadcastController extends Controller
{
    public function index()
    {
        $broadcasts = Broadcast::query()
            ->with('sender:id,name')
            ->orderByDesc('created_at')
            ->paginate(20);

        return Inertia::render('super-admin/broadcasts/index', [
            'broadcasts' => $broadcasts,
        ]);
    }

    public function create()
    {
        return Inertia::render('super-admin/broadcasts/create', [
            'plans' => Plan::orderBy('sort_order')->get(['id', 'name_ar', 'name_en']),
            'cities' => Tenant::query()
                ->whereNotNull('city')
                ->where('city', '!=', '')
                ->distinct()
                ->orderBy('city')
                ->pluck('city'),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'target_type' => 'required|in:all,plan,city',
            'target_filter' => 'nullable|array',
            'target_filter.plan_id' => 'nullable|integer|exists:plans,id',
            'target_filter.city' => 'nullable|string|max:255',
            'subject' => 'required|string|max:255',
            'body' => 'required|string|max:5000',
            'scheduled_at' => 'nullable|date|after:now',
        ]);

        $user = $request->user();
        $scheduled = !empty($data['scheduled_at']);

        $broadcast = Broadcast::create([
            'sender_user_id' => $user->id,
            'sender_name' => $user->name,
            'target_type' => $data['target_type'],
            'target_filter' => $data['target_filter'] ?? null,
            'subject' => $data['subject'],
            'body' => $data['body'],
            'scheduled_at' => $data['scheduled_at'] ?? null,
        ]);

        if (!$scheduled) {
            $this->dispatch($broadcast);
        }

        return redirect()
            ->route('super-admin.broadcasts.index')
            ->with('success', $scheduled
                ? 'تم جدولة الإرسال'
                : 'تم إرسال الرسالة الجماعية لـ ' . $broadcast->fresh()->recipient_count . ' فندق'
            );
    }

    public function send(Request $request, Broadcast $broadcast)
    {
        if ($broadcast->sent_at) {
            return back()->with('error', 'هذا البث تم إرساله مسبقاً');
        }

        $this->dispatch($broadcast);

        return back()->with('success', 'تم الإرسال إلى ' . $broadcast->fresh()->recipient_count . ' فندق');
    }

    private function dispatch(Broadcast $broadcast): void
    {
        $tenants = $this->resolveTargets($broadcast);

        DB::transaction(function () use ($broadcast, $tenants) {
            $now = Carbon::now();
            foreach ($tenants as $tenant) {
                $conversation = Conversation::create([
                    'tenant_id' => $tenant->id,
                    'category' => Conversation::CATEGORY_INQUIRY,
                    'status' => Conversation::STATUS_NEW,
                    'subject' => $broadcast->subject,
                    'source' => Conversation::SOURCE_BROADCAST,
                    'broadcast_id' => $broadcast->id,
                    'last_message_at' => $now,
                    'tenant_unread_count' => 1,
                ]);

                ConversationMessage::create([
                    'conversation_id' => $conversation->id,
                    'sender_type' => ConversationMessage::SENDER_ADMIN,
                    'sender_user_id' => $broadcast->sender_user_id,
                    'sender_name' => $broadcast->sender_name,
                    'body' => $broadcast->body,
                ]);
            }

            $broadcast->update([
                'sent_at' => $now,
                'recipient_count' => $tenants->count(),
            ]);
        });
    }

    private function resolveTargets(Broadcast $broadcast)
    {
        $query = Tenant::query()->where('is_active', true);

        if ($broadcast->target_type === Broadcast::TARGET_PLAN) {
            $planId = $broadcast->target_filter['plan_id'] ?? null;
            if ($planId) $query->where('plan_id', $planId);
        } elseif ($broadcast->target_type === Broadcast::TARGET_CITY) {
            $city = $broadcast->target_filter['city'] ?? null;
            if ($city) $query->where('city', $city);
        }

        return $query->get(['id']);
    }
}
