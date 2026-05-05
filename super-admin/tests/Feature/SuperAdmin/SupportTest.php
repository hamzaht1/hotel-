<?php

use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->superAdmin()->create();
    $this->tenant = Tenant::factory()->create();
    $this->conversation = Conversation::create([
        'tenant_id' => $this->tenant->id,
        'category' => 'support',
        'status' => 'new',
        'subject' => 'Hello',
        'source' => 'support',
        'client_name' => 'Customer',
        'last_message_at' => now(),
    ]);
    ConversationMessage::create([
        'conversation_id' => $this->conversation->id,
        'sender_type' => 'tenant',
        'sender_name' => 'Customer',
        'body' => 'Need help with bookings',
    ]);
});

test('support index renders with stats and conversations', function () {
    $this->actingAs($this->admin)
        ->get('/super-admin/support')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/support/index')
            ->has('conversations.data', 1)
            ->has('stats.open')
            ->has('stats.by_category')
            ->has('stats.tabs')
        );
});

test('support index can select a conversation', function () {
    $this->actingAs($this->admin)
        ->get("/super-admin/support?conversation={$this->conversation->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('selected.id', $this->conversation->id)
            ->has('selected.messages', 1)
        );
});

test('admin can reply, status moves to in_progress and admin gets assigned', function () {
    $this->actingAs($this->admin)
        ->post("/super-admin/support/{$this->conversation->id}/reply", [
            'body' => 'Thanks for reaching out',
        ])
        ->assertRedirect();

    $this->conversation->refresh();
    expect($this->conversation->status)->toBe('in_progress');
    expect($this->conversation->assigned_to_user_id)->toBe($this->admin->id);
    expect($this->conversation->messages()->count())->toBe(2);
});

test('admin can take ownership of a conversation', function () {
    $this->actingAs($this->admin)
        ->post("/super-admin/support/{$this->conversation->id}/take")
        ->assertRedirect();

    $this->conversation->refresh();
    expect($this->conversation->assigned_to_user_id)->toBe($this->admin->id);
    expect($this->conversation->status)->toBe('in_progress');
});

test('admin can close a conversation', function () {
    $this->actingAs($this->admin)
        ->post("/super-admin/support/{$this->conversation->id}/status", ['status' => 'closed'])
        ->assertRedirect();

    $this->conversation->refresh();
    expect($this->conversation->status)->toBe('closed');
    expect($this->conversation->closed_at)->not->toBeNull();
});

test('admin reply with image attachment stores file', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->image('screenshot.png');

    $this->actingAs($this->admin)
        ->post("/super-admin/support/{$this->conversation->id}/reply", [
            'body' => 'See attached',
            'attachments' => [$file],
        ])
        ->assertRedirect();

    $message = $this->conversation->messages()->latest('id')->first();
    expect($message->attachments()->count())->toBe(1);

    $att = $message->attachments->first();
    Storage::disk('public')->assertExists($att->path);
    expect($att->mime_type)->toStartWith('image/');
});

test('reply rejects files over 20 MB', function () {
    Storage::fake('public');

    $tooBig = UploadedFile::fake()->create('huge.pdf', 25 * 1024); // 25 MB

    $this->actingAs($this->admin)
        ->post("/super-admin/support/{$this->conversation->id}/reply", [
            'body' => 'oversize',
            'attachments' => [$tooBig],
        ])
        ->assertSessionHasErrors('attachments.0');
});

test('ai suggestions endpoint returns array (mocked anthropic)', function () {
    config(['services.anthropic.api_key' => 'test-key']);

    Http::fake([
        'api.anthropic.com/*' => Http::response([
            'content' => [['type' => 'text', 'text' => "Reply 1\nReply 2\nReply 3"]],
        ], 200),
    ]);

    $this->actingAs($this->admin)
        ->postJson("/super-admin/support/{$this->conversation->id}/ai-suggestions")
        ->assertOk()
        ->assertJson(['suggestions' => ['Reply 1', 'Reply 2', 'Reply 3']]);
});

test('ai suggestions falls back when no api key', function () {
    config(['services.anthropic.api_key' => null]);

    $response = $this->actingAs($this->admin)
        ->postJson("/super-admin/support/{$this->conversation->id}/ai-suggestions")
        ->assertOk();

    expect($response->json('suggestions'))->toBeArray()->toHaveCount(3);
});
