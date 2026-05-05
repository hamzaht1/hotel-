<?php

use App\Models\Broadcast;
use App\Models\Conversation;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->superAdmin()->create();
});

test('broadcasts index renders', function () {
    $this->actingAs($this->admin)
        ->get('/super-admin/broadcasts')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('super-admin/broadcasts/index'));
});

test('broadcast targeting all hotels creates conversations for each active tenant', function () {
    Tenant::factory()->count(3)->create(['is_active' => true]);
    Tenant::factory()->create(['is_active' => false]);

    $this->actingAs($this->admin)
        ->post('/super-admin/broadcasts', [
            'target_type' => 'all',
            'target_filter' => [],
            'subject' => 'Maintenance window',
            'body' => 'We will perform scheduled maintenance tonight.',
        ])
        ->assertRedirect();

    $broadcast = Broadcast::first();
    expect($broadcast)->not->toBeNull();
    expect($broadcast->sent_at)->not->toBeNull();
    expect($broadcast->recipient_count)->toBe(3);

    expect(Conversation::where('source', 'broadcast')->count())->toBe(3);
    expect(Conversation::where('broadcast_id', $broadcast->id)->count())->toBe(3);
});

test('broadcast targeting by plan only sends to that plan', function () {
    $plan = Plan::factory()->create();
    Tenant::factory()->count(2)->create(['is_active' => true, 'plan_id' => $plan->id]);
    Tenant::factory()->count(2)->create(['is_active' => true, 'plan_id' => null]);

    $this->actingAs($this->admin)
        ->post('/super-admin/broadcasts', [
            'target_type' => 'plan',
            'target_filter' => ['plan_id' => $plan->id],
            'subject' => 'Plan-specific',
            'body' => 'Body',
        ])
        ->assertRedirect();

    expect(Broadcast::first()->recipient_count)->toBe(2);
});

test('broadcast targeting by city only sends to that city', function () {
    Tenant::factory()->count(2)->create(['is_active' => true, 'city' => 'Riyadh']);
    Tenant::factory()->count(3)->create(['is_active' => true, 'city' => 'Jeddah']);

    $this->actingAs($this->admin)
        ->post('/super-admin/broadcasts', [
            'target_type' => 'city',
            'target_filter' => ['city' => 'Riyadh'],
            'subject' => 'City-specific',
            'body' => 'Body',
        ])
        ->assertRedirect();

    expect(Broadcast::first()->recipient_count)->toBe(2);
});

test('scheduled broadcast does not dispatch immediately', function () {
    Tenant::factory()->count(2)->create(['is_active' => true]);

    $this->actingAs($this->admin)
        ->post('/super-admin/broadcasts', [
            'target_type' => 'all',
            'subject' => 'Scheduled',
            'body' => 'Body',
            'scheduled_at' => now()->addHour()->toDateTimeString(),
        ])
        ->assertRedirect();

    $broadcast = Broadcast::first();
    expect($broadcast->sent_at)->toBeNull();
    expect($broadcast->recipient_count)->toBe(0);
    expect(Conversation::where('source', 'broadcast')->count())->toBe(0);
});

test('manual send dispatches a previously-scheduled broadcast', function () {
    Tenant::factory()->count(2)->create(['is_active' => true]);

    $broadcast = Broadcast::create([
        'sender_user_id' => $this->admin->id,
        'sender_name' => $this->admin->name,
        'target_type' => 'all',
        'subject' => 'X',
        'body' => 'Y',
        'scheduled_at' => now()->addDay(),
    ]);

    $this->actingAs($this->admin)
        ->post("/super-admin/broadcasts/{$broadcast->id}/send")
        ->assertRedirect();

    $broadcast->refresh();
    expect($broadcast->sent_at)->not->toBeNull();
    expect($broadcast->recipient_count)->toBe(2);
});

test('cannot send a broadcast twice', function () {
    Tenant::factory()->count(1)->create(['is_active' => true]);

    $broadcast = Broadcast::create([
        'sender_user_id' => $this->admin->id,
        'sender_name' => $this->admin->name,
        'target_type' => 'all',
        'subject' => 'X',
        'body' => 'Y',
        'sent_at' => now(),
        'recipient_count' => 1,
    ]);

    $this->actingAs($this->admin)
        ->post("/super-admin/broadcasts/{$broadcast->id}/send")
        ->assertRedirect()
        ->assertSessionHas('error');
});
