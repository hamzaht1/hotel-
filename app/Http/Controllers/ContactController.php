<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\SupportMessage;
use App\Models\Tenant;
use Illuminate\Http\Request;

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

        // Mirror into support_messages as a non-deletable "contact" record so
        // admin/support views surface these alongside tickets.
        if ($tenantId) {
            SupportMessage::withoutGlobalScope('tenant')->create([
                'tenant_id' => $tenantId,
                'client_name' => $validated['name'],
                'client_email' => $validated['email'] ?? null,
                'type' => 'inquiry',
                'subject' => $validated['subject'] ?? 'Contact form submission',
                'message' => $validated['message'],
                'status' => 'open',
                'source' => SupportMessage::SOURCE_CONTACT,
                'is_read' => false,
            ]);
        }

        return back()->with('success', 'تم إرسال رسالتك بنجاح');
    }
}
