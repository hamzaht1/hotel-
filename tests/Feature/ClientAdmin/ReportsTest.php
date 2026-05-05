<?php

use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create(['payment_status' => 'approved']);
    $this->user = User::factory()->clientAdmin($this->tenant->id)->create();
});

// ─── Subscription Report ───────────────────────────────────

test('client admin can access subscription report', function () {
    $this->actingAs($this->user)
        ->get('/client-admin/reports/subscriptions')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('client-admin/reports/Subscriptions')
            ->has('subscription')
            ->has('subscription.plan')
            ->has('subscription.is_active')
            ->has('subscription.days_remaining')
        );
});

// ─── Support (conversations) ───────────────────────────────

test('client admin can access support index', function () {
    $this->actingAs($this->user)
        ->get('/client-admin/support')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('client-admin/support/index')
            ->has('conversations')
            ->has('stats')
        );
});

test('client admin can create a new support request', function () {
    $this->actingAs($this->user)
        ->post('/client-admin/support', [
            'category' => 'support',
            'subject' => 'Test subject',
            'body' => 'This is a test message',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('conversations', [
        'tenant_id' => $this->tenant->id,
        'client_name' => $this->user->name,
        'category' => 'support',
        'subject' => 'Test subject',
        'status' => 'new',
        'source' => 'support',
    ]);

    $this->assertDatabaseHas('conversation_messages', [
        'sender_type' => 'tenant',
        'body' => 'This is a test message',
    ]);
});

test('client admin can create requests with different categories', function () {
    foreach (['support', 'complaint', 'inquiry', 'technical'] as $category) {
        $this->actingAs($this->user)
            ->post('/client-admin/support', [
                'category' => $category,
                'subject' => "Test $category",
                'body' => "Body for $category",
            ])
            ->assertRedirect();
    }

    expect(Conversation::where('tenant_id', $this->tenant->id)->count())->toBe(4);
});

test('support request validation requires subject, body and valid category', function () {
    $this->actingAs($this->user)
        ->post('/client-admin/support', [
            'category' => 'invalid',
            'subject' => '',
            'body' => '',
        ])
        ->assertSessionHasErrors(['subject', 'body', 'category']);
});

test('client admin can reply to an existing conversation', function () {
    $conversation = Conversation::create([
        'tenant_id' => $this->tenant->id,
        'category' => 'support',
        'status' => 'in_progress',
        'subject' => 'Open ticket',
        'source' => 'support',
        'created_by_user_id' => $this->user->id,
        'client_name' => $this->user->name,
        'last_message_at' => now(),
    ]);
    ConversationMessage::create([
        'conversation_id' => $conversation->id,
        'sender_type' => 'admin',
        'sender_name' => 'Agent',
        'body' => 'How can I help?',
    ]);

    $this->actingAs($this->user)
        ->post("/client-admin/support/{$conversation->id}/reply", [
            'body' => 'Thanks, here are the details',
        ])
        ->assertRedirect();

    expect($conversation->fresh()->messages()->count())->toBe(2);
});

test('client admin can create a request with image attachment', function () {
    Storage::fake('public');

    $this->actingAs($this->user)
        ->post('/client-admin/support', [
            'category' => 'technical',
            'subject' => 'Bug report',
            'body' => 'See screenshot',
            'attachments' => [UploadedFile::fake()->image('bug.png')],
        ])
        ->assertRedirect();

    $conversation = Conversation::where('tenant_id', $this->tenant->id)->first();
    expect($conversation)->not->toBeNull();

    $message = $conversation->messages()->first();
    expect($message->attachments()->count())->toBe(1);

    $att = $message->attachments->first();
    Storage::disk('public')->assertExists($att->path);
});

// ─── Guest access denied ───────────────────────────────────

test('guest cannot access reports or support', function () {
    $this->get('/client-admin/reports/subscriptions')->assertRedirect('/login');
    $this->get('/client-admin/support')->assertRedirect('/login');
});
