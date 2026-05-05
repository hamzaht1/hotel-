<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ContactController extends Controller
{
    public function store(Request $request, ?string $tenantSlug = null)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        $tenantId = null;
        if ($tenantSlug) {
            $tenant = Tenant::where('slug', $tenantSlug)->where('is_active', true)->first();
            $tenantId = $tenant?->id;
        }

        ContactMessage::withoutGlobalScope('tenant')->create([
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'subject' => $validated['subject'] ?? null,
            'message' => $validated['message'],
        ]);

        if ($tenantId) {
            $conversation = Conversation::withoutGlobalScope('tenant')->create([
                'tenant_id' => $tenantId,
                'category' => Conversation::CATEGORY_INQUIRY,
                'status' => Conversation::STATUS_NEW,
                'subject' => $validated['subject'] ?? 'Contact form submission',
                'source' => Conversation::SOURCE_CONTACT,
                'client_name' => $validated['name'],
                'client_email' => $validated['email'] ?? null,
                'last_message_at' => Carbon::now(),
                'admin_unread_count' => 1,
            ]);

            ConversationMessage::create([
                'conversation_id' => $conversation->id,
                'sender_type' => ConversationMessage::SENDER_TENANT,
                'sender_name' => $validated['name'],
                'body' => $validated['message'],
            ]);
        }

        return back()->with('success', 'تم إرسال رسالتك بنجاح');
    }
}
