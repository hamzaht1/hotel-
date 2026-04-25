<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\ReviewForm;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $reviews = Review::query()
            ->when($request->search, fn ($q, $s) => $q->where(function ($q2) use ($s) {
                $q2->where('guest_name', 'like', "%{$s}%")
                    ->orWhere('comment', 'like', "%{$s}%");
            }))
            ->when($request->status, function ($q, $status) {
                if ($status === 'positive') {
                    $q->positive();
                } elseif ($status === 'negative') {
                    $q->negative();
                } else {
                    $q->where('status', $status);
                }
            })
            ->when($request->published !== null && $request->published !== '', function ($q) use ($request) {
                $q->where('is_published', $request->published === '1' || $request->published === 'true');
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $stats = [
            'total' => Review::count(),
            'average' => round(Review::avg('rating') ?? 0, 2),
            'published' => Review::where('is_published', true)->count(),
            'positive' => Review::positive()->count(),
            'negative' => Review::negative()->count(),
        ];

        return Inertia::render('client-admin/reviews/index', [
            'reviews' => $reviews,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'published']),
        ]);
    }

    public function show(Review $review)
    {
        $this->authorizeTenant($review);

        return Inertia::render('client-admin/reviews/show', [
            'review' => $review,
        ]);
    }

    public function togglePublished(Review $review)
    {
        $this->authorizeTenant($review);

        $review->update(['is_published' => !$review->is_published]);

        return back()->with('success', $review->is_published ? 'تم النشر' : 'تم الإخفاء');
    }

    public function reply(Request $request, Review $review)
    {
        $this->authorizeTenant($review);

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

    public function form()
    {
        $form = ReviewForm::with('fields')->first();

        return Inertia::render('client-admin/reviews/form', [
            'form' => $form,
        ]);
    }

    public function saveForm(Request $request)
    {
        $validated = $request->validate([
            'title_ar' => 'required|string|max:255',
            'title_en' => 'required|string|max:255',
            'intro_ar' => 'nullable|string|max:2000',
            'intro_en' => 'nullable|string|max:2000',
            'is_active' => 'boolean',
            'fields' => 'array',
            'fields.*.key' => 'required|string|max:100',
            'fields.*.label_ar' => 'required|string|max:255',
            'fields.*.label_en' => 'required|string|max:255',
            'fields.*.type' => 'required|in:text,textarea,rating,select,checkbox',
            'fields.*.options' => 'nullable|array',
            'fields.*.is_required' => 'boolean',
            'fields.*.sort_order' => 'nullable|integer|min:0',
        ]);

        $form = ReviewForm::firstOrNew([]);
        $form->fill([
            'title_ar' => $validated['title_ar'],
            'title_en' => $validated['title_en'],
            'intro_ar' => $validated['intro_ar'] ?? null,
            'intro_en' => $validated['intro_en'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);
        $form->save();

        $form->fields()->delete();
        foreach ($validated['fields'] ?? [] as $i => $field) {
            $form->fields()->create([
                'key' => $field['key'],
                'label_ar' => $field['label_ar'],
                'label_en' => $field['label_en'],
                'type' => $field['type'],
                'options' => $field['options'] ?? null,
                'is_required' => $field['is_required'] ?? false,
                'sort_order' => $field['sort_order'] ?? $i,
            ]);
        }

        return back()->with('success', 'تم حفظ نموذج المراجعة');
    }

    private function authorizeTenant(Review $review): void
    {
        if ($review->tenant_id !== app('current_tenant_id')) {
            abort(403);
        }
    }
}
