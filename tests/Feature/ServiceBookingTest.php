<?php

use App\Models\Service;
use App\Models\ServiceBooking;
use App\Models\Tenant;

function makeTenantWithService(array $requiredFields = [], bool $acceptsBookings = true): array
{
    $tenant = Tenant::create([
        'name' => 'Booking Hotel',
        'slug' => 'booking-hotel',
        'template' => 'madina',
        'email' => 'book@example.com',
        'is_active' => true,
    ]);

    app()->instance('current_tenant_id', $tenant->id);

    $service = Service::create([
        'tenant_id' => $tenant->id,
        'name_ar' => 'خدمة',
        'name_en' => 'Service',
        'price' => 100,
        'is_active' => true,
        'accepts_bookings' => $acceptsBookings,
        'required_fields' => $requiredFields,
    ]);

    app()->forgetInstance('current_tenant_id');

    return [$tenant, $service];
}

it('shows the booking page for a service accepting bookings', function () {
    [$tenant, $service] = makeTenantWithService();

    $this->get("/hotel/{$tenant->slug}/services/{$service->id}/book")->assertOk();
});

it('returns 404 if the service does not accept bookings', function () {
    [$tenant, $service] = makeTenantWithService([], false);

    $this->get("/hotel/{$tenant->slug}/services/{$service->id}/book")->assertNotFound();
});

it('validates required custom fields and stores the booking', function () {
    [$tenant, $service] = makeTenantWithService([
        ['key' => 'check_in', 'label_ar' => 'الوصول', 'label_en' => 'Check-in', 'type' => 'date', 'options' => null, 'is_required' => true],
    ]);

    // Missing custom field → validation fails.
    $this->post("/hotel/{$tenant->slug}/services/{$service->id}/book", [
        'guest_name' => 'G',
    ])->assertSessionHasErrors(['data.check_in']);

    // Complete request succeeds.
    $this->post("/hotel/{$tenant->slug}/services/{$service->id}/book", [
        'guest_name' => 'G',
        'guest_email' => 'g@example.com',
        'data' => ['check_in' => '2026-05-01'],
    ])->assertRedirect();

    $booking = ServiceBooking::withoutGlobalScope('tenant')->first();
    expect($booking)->not->toBeNull();
    expect($booking->data['check_in'])->toBe('2026-05-01');
    expect($booking->status)->toBe('new');
});
