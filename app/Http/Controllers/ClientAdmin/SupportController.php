<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\ConversationMessageAttachment;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class SupportController extends Controller
{
    public function index(Request $request)
    {
        $query = Conversation::query()->withCount('messages')->with('latestMessage');

        if ($request->category && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        $tab = $request->tab ?? 'all';
        if ($tab === 'mine') {
            $query->where('source', Conversation::SOURCE_SUPPORT);
        }

        $conversations = $query->orderByDesc('last_message_at')->paginate(50)->withQueryString();

        $stats = [
            'open' => Conversation::whereIn('status', [Conversation::STATUS_NEW, Conversation::STATUS_IN_PROGRESS])->count(),
            'resolved' => Conversation::where('status', Conversation::STATUS_CLOSED)->count(),
            'avg_response_seconds' => $this->averageFirstResponseSeconds(),
            'tabs' => [
                'all' => Conversation::count(),
                'mine' => Conversation::where('source', Conversation::SOURCE_SUPPORT)->count(),
            ],
        ];

        return Inertia::render('client-admin/support/index', [
            'conversations' => $conversations,
            'stats' => $stats,
            'filters' => $request->only(['category', 'tab']),
        ]);
    }

    public function create()
    {
        return Inertia::render('client-admin/support/create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category' => 'required|in:support,complaint,inquiry,technical',
            'subject' => 'required|string|max:255',
            'body' => 'required|string|max:5000',
            'attachments' => 'nullable|array|max:10',
            'attachments.*' => 'file|max:20480', // 20 MB
        ]);

        $user = $request->user();

        $conversation = Conversation::create([
            'tenant_id' => $user->tenant_id,
            'category' => $data['category'],
            'status' => Conversation::STATUS_NEW,
            'subject' => $data['subject'],
            'source' => Conversation::SOURCE_SUPPORT,
            'created_by_user_id' => $user->id,
            'client_name' => $user->name,
            'client_email' => $user->email,
            'last_message_at' => Carbon::now(),
            'admin_unread_count' => 1,
        ]);

        $message = ConversationMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => ConversationMessage::SENDER_TENANT,
            'sender_user_id' => $user->id,
            'sender_name' => $user->name,
            'body' => $data['body'],
        ]);

        $this->storeAttachments($message, $request->file('attachments') ?? []);

        return redirect()->route('client-admin.support.show', $conversation->id)
            ->with('success', 'تم إرسال طلبك بنجاح');
    }

    public function show(Request $request, Conversation $conversation)
    {
        $conversation->messages()
            ->where('sender_type', ConversationMessage::SENDER_ADMIN)
            ->whereNull('read_at')
            ->update(['read_at' => Carbon::now()]);
        $conversation->update(['tenant_unread_count' => 0]);

        $conversation->load(['assignedTo:id,name', 'messages.attachments']);

        return Inertia::render('client-admin/support/show', [
            'conversation' => $conversation,
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
            'sender_type' => ConversationMessage::SENDER_TENANT,
            'sender_user_id' => $user->id,
            'sender_name' => $user->name,
            'body' => $data['body'],
        ]);

        $this->storeAttachments($message, $request->file('attachments') ?? []);

        $conversation->update([
            'last_message_at' => Carbon::now(),
            'admin_unread_count' => $conversation->admin_unread_count + 1,
            'status' => $conversation->status === Conversation::STATUS_CLOSED
                ? Conversation::STATUS_IN_PROGRESS
                : $conversation->status,
        ]);

        return back()->with('success', 'تم إرسال الرد');
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

    private function averageFirstResponseSeconds(): ?int
    {
        $sample = Conversation::query()
            ->whereIn('status', [Conversation::STATUS_IN_PROGRESS, Conversation::STATUS_CLOSED])
            ->orderByDesc('id')->limit(50)
            ->with(['messages' => fn ($q) => $q->orderBy('created_at')->limit(2)])
            ->get();

        $totals = [];
        foreach ($sample as $c) {
            $first = $c->messages->first();
            $reply = $c->messages->firstWhere('sender_type', ConversationMessage::SENDER_ADMIN);
            if ($first && $reply) $totals[] = $first->created_at->diffInSeconds($reply->created_at);
        }
        if (empty($totals)) return null;
        return (int) round(array_sum($totals) / count($totals));
    }
}
