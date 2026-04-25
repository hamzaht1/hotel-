<?php

use App\Models\Review;
use App\Models\ReviewForm;
use App\Models\Tenant;

it('renders the public review page for an active tenant', function () {
    $tenant = Tenant::create([
        'name' => 'Test Hotel',
        'slug' => 'test-hotel',
        'template' => 'madina',
        'email' => 'hotel@example.com',
        'is_active' => true,
    ]);

    ReviewForm::create([
        'tenant_id' => $tenant->id,
        'title_ar' => 'تقييم الإقامة',
        'title_en' => 'Stay review',
        'is_active' => true,
    ]);

    $this->get("/hotel/{$tenant->slug}/review")->assertOk();
});

it('stores a public review and redirects to the thank-you page', function () {
    $tenant = Tenant::create([
        'name' => 'Test Hotel',
        'slug' => 'test-hotel-2',
        'template' => 'madina',
        'email' => 'hotel2@example.com',
        'is_active' => true,
    ]);

    $response = $this->post("/hotel/{$tenant->slug}/review", [
        'guest_name' => 'Ahmed',
        'guest_email' => 'ahmed@example.com',
        'rating' => 5,
        'comment' => 'Great stay',
    ]);

    $review = Review::withoutGlobalScope('tenant')->first();
    expect($review)->not->toBeNull();
    expect($review->rating)->toBe(5);
    expect($review->status)->toBe('new');
    expect($review->token)->not->toBeEmpty();

    $response->assertRedirect(route('review.thanks', ['token' => $review->token]));
});

it('rejects review submissions for inactive tenants', function () {
    $tenant = Tenant::create([
        'name' => 'Inactive',
        'slug' => 'inactive-hotel',
        'template' => 'madina',
        'email' => 'x@example.com',
        'is_active' => false,
    ]);

    $this->post("/hotel/{$tenant->slug}/review", [
        'guest_name' => 'X',
        'rating' => 5,
    ])->assertNotFound();
});
