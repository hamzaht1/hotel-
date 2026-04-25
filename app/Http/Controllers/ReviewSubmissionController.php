<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\ReviewForm;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReviewSubmissionController extends Controller
{
    /**
     * Show the review submission form for a given tenant slug.
     */
    public function show(string $tenantSlug)
    {
        $tenant = Tenant::where('slug', $tenantSlug)->where('is_active', true)->firstOrFail();

        app()->instance('current_tenant_id', $tenant->id);

        $form = ReviewForm::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->with('fields')
            ->first();

        return Inertia::render('public/Review', [
            'tenant' => $tenant->only(['id', 'name', 'slug', 'org_name_ar', 'org_name_en', 'logo']),
            'form' => $form,
        ]);
    }

    /**
     * Display a guest review by token (to confirm submission).
     */
    public function showByToken(string $token)
    {
        $review = Review::withoutGlobalScope('tenant')
            ->where('token', $token)
            ->with('tenant:id,name,slug')
            ->firstOrFail();

        return Inertia::render('public/ReviewThanks', [
            'review' => $review->only(['id', 'rating', 'comment', 'created_at', 'tenant']),
        ]);
    }

    public function store(Request $request, string $tenantSlug)
    {
        $tenant = Tenant::where('slug', $tenantSlug)->where('is_active', true)->firstOrFail();

        app()->instance('current_tenant_id', $tenant->id);

        $form = ReviewForm::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->with('fields')
            ->first();

        $validated = $request->validate([
            'guest_name' => 'required|string|max:255',
            'guest_email' => 'nullable|email|max:255',
            'guest_phone' => 'nullable|string|max:20',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:5000',
            'answers' => 'nullable|array',
        ]);

        $review = Review::create([
            'tenant_id' => $tenant->id,
            'review_form_id' => $form?->id,
            'guest_name' => $validated['guest_name'],
            'guest_email' => $validated['guest_email'] ?? null,
            'guest_phone' => $validated['guest_phone'] ?? null,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
            'answers' => $validated['answers'] ?? null,
        ]);

        return redirect()->route('review.thanks', ['token' => $review->token]);
    }
}
