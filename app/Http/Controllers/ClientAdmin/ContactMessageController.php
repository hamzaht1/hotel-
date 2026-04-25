<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContactMessageController extends Controller
{
    public function index(Request $request)
    {
        $messages = ContactMessage::query()
            ->when($request->search, fn ($q, $s) => $q->where(function ($q2) use ($s) {
                $q2->where('name', 'like', "%{$s}%")
                    ->orWhere('message', 'like', "%{$s}%");
            }))
            ->when($request->unread_only === '1', fn ($q) => $q->where('is_read', false))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('client-admin/contact-messages/index', [
            'messages' => $messages,
            'filters' => $request->only(['search', 'unread_only']),
            'stats' => [
                'total' => ContactMessage::count(),
                'unread' => ContactMessage::where('is_read', false)->count(),
            ],
        ]);
    }

    public function markRead(ContactMessage $message)
    {
        $this->authorizeTenant($message);

        $message->update(['is_read' => true]);

        return back()->with('success', 'تم تعليم الرسالة كمقروءة');
    }

    private function authorizeTenant(ContactMessage $message): void
    {
        if ($message->tenant_id !== app('current_tenant_id')) {
            abort(403);
        }
    }
}
