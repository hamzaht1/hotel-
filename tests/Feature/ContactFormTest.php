<?php

use App\Models\ContactMessage;
use App\Models\SupportMessage;
use App\Models\Tenant;

it('accepts a contact submission without tenant and stores a ContactMessage only', function () {
    $this->post('/contact', [
        'name' => 'Guest',
        'email' => 'guest@example.com',
        'message' => 'Hello',
    ])->assertRedirect();

    expect(ContactMessage::withoutGlobalScope('tenant')->count())->toBe(1);
    expect(SupportMessage::withoutGlobalScope('tenant')->count())->toBe(0);
});

it('mirrors tenant-scoped contact submissions into support_messages with source=contact', function () {
    $tenant = Tenant::create([
        'name' => 'Hotel',
        'slug' => 'mirror-hotel',
        'template' => 'madina',
        'email' => 'mirror@example.com',
        'is_active' => true,
    ]);

    $this->post("/hotel/{$tenant->slug}/contact", [
        'name' => 'Guest',
        'email' => 'guest@example.com',
        'message' => 'Hello',
    ])->assertRedirect();

    $support = SupportMessage::withoutGlobalScope('tenant')->first();
    expect($support)->not->toBeNull();
    expect($support->source)->toBe('contact');
    expect($support->tenant_id)->toBe($tenant->id);
});
