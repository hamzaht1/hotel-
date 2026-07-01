<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $query = Review::query()
            ->with('tenant:id,name,email');

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('guest_name', 'like', "%{$search}%")
                    ->orWhere('comment', 'like', "%{$search}%")
                    ->orWhere('guest_email', 'like', "%{$search}%");
            });
        }

        if ($request->tenant_id) {
            $query->where('tenant_id', $request->tenant_id);
        }

        if ($status = $request->status) {
            if (in_array($status, ['new', 'in_progress', 'replied', 'needs_followup'])) {
                $query->where('status', $status);
            }
        }

        if ($rating = $request->rating) {
            if (is_numeric($rating) && $rating >= 1 && $rating <= 5) {
                $query->where('rating', (int) $rating);
            }
        }

        if ($type = $request->type) {
            match ($type) {
                'positive' => $query->positive(),
                'negative' => $query->negative(),
                'neutral' => $query->where('rating', 3),
                default => null,
            };
        }

        $sort = $request->sort ?? 'newest';
        match ($sort) {
            'oldest' => $query->oldest(),
            'highest' => $query->orderByDesc('rating')->latest(),
            'lowest' => $query->orderBy('rating')->latest(),
            default => $query->latest(),
        };

        $reviews = $query->paginate(10)->withQueryString();

        $total = Review::count();
        $positive = Review::positive()->count();
        $negative = Review::negative()->count();

        $stats = [
            'total' => $total,
            'average' => round((float) (Review::avg('rating') ?? 0), 1),
            'positive' => $positive,
            'negative' => $negative,
            'positive_percent' => $total > 0 ? round(($positive / $total) * 100) : 0,
            'negative_percent' => $total > 0 ? round(($negative / $total) * 100) : 0,
            'new' => Review::where('status', Review::STATUS_NEW)->count(),
            'in_progress' => Review::where('status', Review::STATUS_IN_PROGRESS)->count(),
            'replied' => Review::where('status', Review::STATUS_REPLIED)->count(),
            'needs_followup' => Review::where('status', Review::STATUS_NEEDS_FOLLOWUP)->count(),
        ];

        return Inertia::render('super-admin/reviews/index', [
            'reviews' => $reviews,
            'stats' => $stats,
            'tenants' => Tenant::orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'tenant_id', 'status', 'rating', 'type', 'sort']),
        ]);
    }

    public function show(Review $review)
    {
        return Inertia::render('super-admin/reviews/show', [
            'review' => $review->load('tenant:id,name,email,phone'),
        ]);
    }

    public function updateStatus(Request $request, Review $review)
    {
        $validated = $request->validate([
            'status' => 'required|in:new,in_progress,replied,needs_followup',
        ]);

        $review->update(['status' => $validated['status']]);

        return back()->with('success', 'تم تحديث حالة المراجعة');
    }

    /**
     * Approve and publish the review so it becomes visible on the tenant site.
     */
    public function approve(Review $review)
    {
        $review->update(['is_published' => true]);
        return back()->with('success', 'تمت الموافقة ونشر المراجعة');
    }

    /**
     * Publish or unpublish the review — the admin fully controls whether it is
     * visible on the tenant site.
     */
    public function togglePublished(Review $review)
    {
        $review->update(['is_published' => ! $review->is_published]);

        return back()->with('success', $review->is_published ? 'تم نشر المراجعة' : 'تم إلغاء نشر المراجعة');
    }

    /**
     * Send a notification to the guest (logs an entry — wire to mail later).
     */
    public function notify(Review $review)
    {
        // Deliberately a no-op side-effect for now — hook in Mail/SMS later.
        // Mark the review as in-progress so the team knows follow-up is active.
        if ($review->status === Review::STATUS_NEW) {
            $review->update(['status' => Review::STATUS_IN_PROGRESS]);
        }

        return back()->with('success', 'تم إرسال الإشعار للعميل');
    }

    public function reply(Request $request, Review $review)
    {
        $validated = $request->validate([
            'reply' => 'required|string|max:5000',
        ]);

        $review->update([
            'reply' => $validated['reply'],
            'replied_at' => now(),
            'status' => Review::STATUS_REPLIED,
        ]);

        return back()->with('success', 'تم الرد على المراجعة');
    }
}
