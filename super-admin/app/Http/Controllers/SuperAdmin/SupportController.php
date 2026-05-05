<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\ConversationMessageAttachment;
use App\Services\AiSuggestionService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class SupportController extends Controller
{
    public function index(Request $request)
    {
        $query = Conversation::query()
            ->with(['tenant:id,name,logo_url', 'assignedTo:id,name', 'latestMessage'])
            ->withCount('messages');

        if ($request->category && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        $tab = $request->tab ?? 'all';
        if ($tab === 'new') {
            $query->where('status', Conversation::STATUS_NEW);
        } elseif ($tab === 'in_progress') {
            $query->where('status', Conversation::STATUS_IN_PROGRESS);
        } elseif ($tab === 'mine') {
            $query->where('assigned_to_user_id', $request->user()->id);
        } elseif ($tab === 'closed') {
            $query->where('status', Conversation::STATUS_CLOSED);
        }

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('subject', 'like', "%{$s}%")
                  ->orWhere('client_name', 'like', "%{$s}%")
                  ->orWhereHas('tenant', fn ($t) => $t->where('name', 'like', "%{$s}%"));
            });
        }

        $conversations = $query->orderByDesc('last_message_at')->paginate(20)->withQueryString();

        $selected = null;
        if ($request->conversation) {
            $selected = Conversation::with(['tenant:id,name,logo_url', 'assignedTo:id,name', 'messages.sender:id,name', 'messages.attachments'])
                ->find($request->conversation);

            if ($selected) {
                $selected->messages()
                    ->where('sender_type', ConversationMessage::SENDER_TENANT)
                    ->whereNull('read_at')
                    ->update(['read_at' => Carbon::now()]);
                $selected->update(['admin_unread_count' => 0]);
            }
        }

        $stats = $this->stats();

        return Inertia::render('super-admin/support/index', [
            'conversations' => $conversations,
            'selected' => $selected,
            'stats' => $stats,
            'filters' => $request->only(['category', 'tab', 'search']),
        ]);
    }

    public function reply(Request $request, Conversation $conversation)
    {
        $data = $request->validate([
            'body' => 'required|string|max:5000',
            'attachments' => 'nullable|array|max:10',
            'attachments.*' => 'file|max:20480',
        ]);

        $user = $request->user();

        $message = ConversationMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => ConversationMessage::SENDER_ADMIN,
            'sender_user_id' => $user->id,
            'sender_name' => $user->name,
            'body' => $data['body'],
        ]);

        $this->storeAttachments($message, $request->file('attachments') ?? []);

        $conversation->update([
            'status' => $conversation->status === Conversation::STATUS_NEW
                ? Conversation::STATUS_IN_PROGRESS
                : $conversation->status,
            'assigned_to_user_id' => $conversation->assigned_to_user_id ?? $user->id,
            'last_message_at' => Carbon::now(),
            'tenant_unread_count' => $conversation->tenant_unread_count + 1,
        ]);

        return back()->with('success', 'تم إرسال الرد');
    }

    public function aiSuggestions(Request $request, Conversation $conversation, AiSuggestionService $service)
    {
        $conversation->load(['messages' => fn ($q) => $q->orderBy('created_at')->limit(20)]);

        $suggestions = $service->suggest($conversation);

        return response()->json(['suggestions' => $suggestions]);
    }

    /**
     * @param  array<int, UploadedFile>  $files
     */
    private function storeAttachments(ConversationMessage $message, array $files): void
    {
        foreach ($files as $file) {
            if (!$file instanceof UploadedFile) continue;
            $path = $file->store("conversations/{$message->conversation_id}", 'public');
            ConversationMessageAttachment::create([
                'conversation_message_id' => $message->id,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
            ]);
        }
    }

    public function take(Request $request, Conversation $conversation)
    {
        $user = $request->user();

        $conversation->update([
            'assigned_to_user_id' => $user->id,
            'status' => Conversation::STATUS_IN_PROGRESS,
        ]);

        return back()->with('success', 'تم استلام المحادثة');
    }

    public function updateStatus(Request $request, Conversation $conversation)
    {
        $data = $request->validate([
            'status' => 'required|in:new,in_progress,closed',
        ]);

        $conversation->update([
            'status' => $data['status'],
            'closed_at' => $data['status'] === Conversation::STATUS_CLOSED ? Carbon::now() : null,
        ]);

        return back()->with('success', 'تم تحديث الحالة');
    }

    private function stats(): array
    {
        $now = Carbon::now();
        $today = $now->copy()->startOfDay();

        $open = Conversation::whereIn('status', [Conversation::STATUS_NEW, Conversation::STATUS_IN_PROGRESS])->count();
        $resolvedToday = Conversation::where('status', Conversation::STATUS_CLOSED)
            ->where('closed_at', '>=', $today)->count();

        $avgResponseSeconds = $this->averageFirstResponseSeconds();

        return [
            'open' => $open,
            'resolved_today' => $resolvedToday,
            'avg_response_seconds' => $avgResponseSeconds,
            'satisfaction' => 4.8, // placeholder until ratings exist
            'by_category' => [
                'all' => Conversation::count(),
                'support' => Conversation::where('category', Conversation::CATEGORY_SUPPORT)->count(),
                'complaint' => Conversation::where('category', Conversation::CATEGORY_COMPLAINT)->count(),
                'inquiry' => Conversation::where('category', Conversation::CATEGORY_INQUIRY)->count(),
                'technical' => Conversation::where('category', Conversation::CATEGORY_TECHNICAL)->count(),
            ],
            'tabs' => [
                'all' => Conversation::count(),
                'new' => Conversation::where('status', Conversation::STATUS_NEW)->count(),
                'in_progress' => Conversation::where('status', Conversation::STATUS_IN_PROGRESS)->count(),
                'closed' => Conversation::where('status', Conversation::STATUS_CLOSED)->count(),
            ],
        ];
    }

    private function averageFirstResponseSeconds(): ?int
    {
        $sample = Conversation::query()
            ->whereIn('status', [Conversation::STATUS_IN_PROGRESS, Conversation::STATUS_CLOSED])
            ->orderByDesc('id')
            ->limit(50)
            ->with(['messages' => fn ($q) => $q->orderBy('created_at')->limit(2)])
            ->get();

        $totals = [];
        foreach ($sample as $c) {
            $msgs = $c->messages;
            $first = $msgs->first();
            $reply = $msgs->firstWhere('sender_type', ConversationMessage::SENDER_ADMIN);
            if ($first && $reply) {
                $totals[] = $first->created_at->diffInSeconds($reply->created_at);
            }
        }

        if (empty($totals)) return null;

        return (int) round(array_sum($totals) / count($totals));
    }
}
