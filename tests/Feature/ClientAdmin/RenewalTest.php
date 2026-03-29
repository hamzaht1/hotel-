<?php

use App\Models\Plan;
use App\Models\RenewalRequest;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

function createClientAdminForRenewal(): array
{
    $plan = Plan::create([
        'slug' => 'basic',
        'name_ar' => 'أساسي',
        'name_en' => 'Basic',
        'price' => 500.00,
        'billing_cycle' => 'yearly',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $tenant = Tenant::factory()->create(['plan_id' => $plan->id]);
    $user = User::factory()->clientAdmin($tenant->id)->create();
    return [$user, $tenant];
}

// ─── View ──────────────────────────────────────────────────

test('client admin can view renewal page', function () {
    [$user, $tenant] = createClientAdminForRenewal();

    $this->actingAs($user)
        ->get('/client-admin/renewal')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('client-admin/renewal/index')
            ->has('tenant')
            ->has('canRenew')
        );
});

// ─── Submit Renewal ────────────────────────────────────────

test('client admin can submit renewal request with receipt', function () {
    Storage::fake('public');
    [$user, $tenant] = createClientAdminForRenewal();

    $this->actingAs($user)
        ->post('/client-admin/renewal', [
            'receipt' => UploadedFile::fake()->create('receipt.pdf', 100, 'application/pdf'),
            'notes' => 'Payment via bank transfer',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('renewal_requests', [
        'tenant_id' => $tenant->id,
        'status' => 'pending',
    ]);

    $renewal = RenewalRequest::where('tenant_id', $tenant->id)->first();
    expect($renewal->receipt_path)->not->toBeNull()
        ->and($renewal->notes)->toBe('Payment via bank transfer');
});

test('client admin cannot submit duplicate pending renewal', function () {
    Storage::fake('public');
    [$user, $tenant] = createClientAdminForRenewal();

    // Create an existing pending renewal
    RenewalRequest::create([
        'tenant_id' => $tenant->id,
        'plan_id' => $tenant->plan_id,
        'status' => 'pending',
        'receipt_path' => 'renewal-receipts/old.pdf',
        'requested_at' => now(),
    ]);

    $this->actingAs($user)
        ->post('/client-admin/renewal', [
            'receipt' => UploadedFile::fake()->create('receipt.pdf', 100, 'application/pdf'),
        ])
        ->assertRedirect();

    // Should still only have one pending request
    expect(RenewalRequest::where('tenant_id', $tenant->id)->where('status', 'pending')->count())->toBe(1);
});

test('validates receipt file required', function () {
    [$user] = createClientAdminForRenewal();

    $this->actingAs($user)
        ->post('/client-admin/renewal', [])
        ->assertSessionHasErrors('receipt');
});
