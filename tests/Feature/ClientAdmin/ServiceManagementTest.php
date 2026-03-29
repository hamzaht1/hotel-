<?php

use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\Tenant;
use App\Models\User;

function createClientAdminForServices(): array
{
    $tenant = Tenant::factory()->create();
    $user = User::factory()->clientAdmin($tenant->id)->create();

    // Set tenant context for BelongsToTenant trait
    app()->instance('current_tenant_id', $tenant->id);
    app()->instance('current_tenant', $tenant);

    return [$user, $tenant];
}

function createCategory(int $tenantId, array $overrides = []): ServiceCategory
{
    ServiceCategory::unguard();
    $category = ServiceCategory::create(array_merge([
        'tenant_id' => $tenantId,
        'name_ar' => 'خدمات السبا',
        'name_en' => 'Spa Services',
        'type' => 'spa',
        'is_active' => true,
        'sort_order' => 0,
    ], $overrides));
    ServiceCategory::reguard();
    return $category;
}

function createService(int $tenantId, int $categoryId, array $overrides = []): Service
{
    Service::unguard();
    $service = Service::create(array_merge([
        'tenant_id' => $tenantId,
        'category_id' => $categoryId,
        'name_ar' => 'مساج',
        'name_en' => 'Massage',
        'price' => 200.00,
        'is_active' => true,
        'sort_order' => 0,
    ], $overrides));
    Service::reguard();
    return $service;
}

// ─── Service Categories ────────────────────────────────────

test('client admin can list service categories', function () {
    [$user, $tenant] = createClientAdminForServices();
    createCategory($tenant->id);
    createCategory($tenant->id, ['name_en' => 'Restaurant', 'type' => 'restaurant']);

    $this->actingAs($user)
        ->get('/client-admin/service-categories')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('client-admin/service-categories/index')
            ->has('categories', 2)
        );
});

test('client admin can create a service category', function () {
    [$user, $tenant] = createClientAdminForServices();

    $this->actingAs($user)
        ->post('/client-admin/service-categories', [
            'name_ar' => 'صالة اجتماعات',
            'name_en' => 'Meeting Hall',
            'type' => 'hall',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('service_categories', [
        'tenant_id' => $tenant->id,
        'name_en' => 'Meeting Hall',
        'type' => 'hall',
    ]);
});

test('client admin cannot delete category with services', function () {
    [$user, $tenant] = createClientAdminForServices();
    $category = createCategory($tenant->id);
    createService($tenant->id, $category->id);

    $this->actingAs($user)
        ->delete("/client-admin/service-categories/{$category->id}")
        ->assertRedirect();

    $this->assertDatabaseHas('service_categories', ['id' => $category->id]);
});

// ─── Services ──────────────────────────────────────────────

test('client admin can list services', function () {
    [$user, $tenant] = createClientAdminForServices();
    $category = createCategory($tenant->id);
    createService($tenant->id, $category->id);
    createService($tenant->id, $category->id, ['name_en' => 'Sauna']);

    $this->actingAs($user)
        ->get('/client-admin/services')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('client-admin/services/index')
            ->has('services.data', 2)
        );
});

test('client admin can create a service', function () {
    [$user, $tenant] = createClientAdminForServices();
    $category = createCategory($tenant->id);

    $this->actingAs($user)
        ->post('/client-admin/services', [
            'name_ar' => 'جاكوزي',
            'name_en' => 'Jacuzzi',
            'description_ar' => 'وصف عربي',
            'description_en' => 'English description',
            'category_id' => $category->id,
            'price' => 350.00,
            'is_active' => true,
        ])
        ->assertRedirect(route('client-admin.services.index'));

    $this->assertDatabaseHas('services', [
        'tenant_id' => $tenant->id,
        'name_en' => 'Jacuzzi',
        'price' => 350.00,
    ]);
});

test('client admin can update a service', function () {
    [$user, $tenant] = createClientAdminForServices();
    $category = createCategory($tenant->id);
    $service = createService($tenant->id, $category->id);

    $this->actingAs($user)
        ->put("/client-admin/services/{$service->id}", [
            'name_ar' => 'مساج محدث',
            'name_en' => 'Updated Massage',
            'category_id' => $category->id,
            'price' => 300.00,
        ])
        ->assertRedirect(route('client-admin.services.index'));

    $service->refresh();
    expect($service->name_en)->toBe('Updated Massage')
        ->and((float) $service->price)->toBe(300.00);
});

test('client admin can delete a service', function () {
    [$user, $tenant] = createClientAdminForServices();
    $category = createCategory($tenant->id);
    $service = createService($tenant->id, $category->id);

    $this->actingAs($user)
        ->delete("/client-admin/services/{$service->id}")
        ->assertRedirect();

    $this->assertDatabaseMissing('services', ['id' => $service->id]);
});

test('services can be filtered by category', function () {
    [$user, $tenant] = createClientAdminForServices();
    $spa = createCategory($tenant->id, ['name_en' => 'Spa', 'type' => 'spa']);
    $restaurant = createCategory($tenant->id, ['name_en' => 'Restaurant', 'type' => 'restaurant']);

    createService($tenant->id, $spa->id, ['name_en' => 'Massage']);
    createService($tenant->id, $spa->id, ['name_en' => 'Sauna']);
    createService($tenant->id, $restaurant->id, ['name_en' => 'Breakfast']);

    $this->actingAs($user)
        ->get("/client-admin/services?category_id={$spa->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('services.data', 2));
});
