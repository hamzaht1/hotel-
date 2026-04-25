<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Tenant;
use Illuminate\Http\Request;

class ReviewPopupController extends Controller
{
    /**
     * Record the response from the 7-day satisfaction popup.
     *
     * Creates a Review row (for the tenant's own admin feedback) and flags
     * the tenant so the popup doesn't show again.
     */
    public function submit(Request $request)
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
            'reason' => 'nullable|string|max:2000',
        ]);

        $user = $request->user();
        $tenant = $user->tenant;

        if (!$tenant) {
            abort(403);
        }

        Review::create([
            'tenant_id' => $tenant->id,
            'guest_name' => $user->name . ' (admin)',
            'guest_email' => $user->email,
            'rating' => $validated['rating'],
            'comment' => $validated['rating'] < 2
                ? ($validated['reason'] ?? $validated['comment'] ?? null)
                : ($validated['comment'] ?? null),
            'status' => $validated['rating'] < 2 ? Review::STATUS_NEEDS_FOLLOWUP : Review::STATUS_NEW,
            'is_published' => false,
        ]);

        $tenant->forceFill(['review_popup_shown_at' => now()])->save();

        return back()->with('success', 'شكراً لتقييمك!');
    }

    /**
     * Dismiss the popup without rating (marks as shown).
     */
    public function dismiss(Request $request)
    {
        $tenant = $request->user()?->tenant;

        if ($tenant) {
            $tenant->forceFill(['review_popup_shown_at' => now()])->save();
        }

        return back();
    }
}
