<?php

use App\Models\FormTemplate;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// ─── Index ─────────────────────────────────────────────────

test('super admin can list form templates', function () {
    $user = User::factory()->superAdmin()->create();

    FormTemplate::unguard();
    FormTemplate::create(['name_ar' => 'نموذج اتصال', 'name_en' => 'Contact Form', 'type' => 'contact', 'fields' => [['key' => 'name', 'type' => 'text', 'label_ar' => 'الاسم', 'label_en' => 'Name', 'required' => true]], 'is_active' => true]);
    FormTemplate::create(['name_ar' => 'نموذج اشتراك', 'name_en' => 'Subscription Form', 'type' => 'subscription', 'fields' => [['key' => 'email', 'type' => 'email', 'label_ar' => 'البريد', 'label_en' => 'Email', 'required' => true]], 'is_active' => true]);
    FormTemplate::reguard();

    $this->actingAs($user)
        ->get('/super-admin/form-builder')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/form-builder/index')
            ->has('templates.data', 2)
        );
});

// ─── Create ────────────────────────────────────────────────

test('super admin can create a form template with fields JSON', function () {
    $user = User::factory()->superAdmin()->create();

    $fields = [
        [
            'key' => 'full_name',
            'type' => 'text',
            'label_ar' => 'الاسم الكامل',
            'label_en' => 'Full Name',
            'required' => true,
        ],
        [
            'key' => 'email',
            'type' => 'email',
            'label_ar' => 'البريد الإلكتروني',
            'label_en' => 'Email',
            'required' => true,
        ],
        [
            'key' => 'message',
            'type' => 'textarea',
            'label_ar' => 'الرسالة',
            'label_en' => 'Message',
            'required' => false,
        ],
    ];

    $this->actingAs($user)
        ->post('/super-admin/form-builder', [
            'name_ar' => 'نموذج دعم',
            'name_en' => 'Support Form',
            'type' => 'support',
            'fields' => $fields,
            'is_active' => true,
        ])
        ->assertRedirect(route('super-admin.form-builder.index'));

    $this->assertDatabaseHas('form_templates', [
        'name_en' => 'Support Form',
        'type' => 'support',
    ]);

    $template = FormTemplate::where('name_en', 'Support Form')->first();
    expect($template->fields)->toHaveCount(3)
        ->and($template->fields[0]['key'])->toBe('full_name');
});

// ─── Update ────────────────────────────────────────────────

test('super admin can update a form template', function () {
    $user = User::factory()->superAdmin()->create();

    FormTemplate::unguard();
    $template = FormTemplate::create([
        'name_ar' => 'قديم',
        'name_en' => 'Old',
        'type' => 'contact',
        'fields' => [['key' => 'name', 'type' => 'text', 'label_ar' => 'الاسم', 'label_en' => 'Name', 'required' => true]],
        'is_active' => true,
    ]);
    FormTemplate::reguard();

    $updatedFields = [
        ['key' => 'name', 'type' => 'text', 'label_ar' => 'الاسم', 'label_en' => 'Name', 'required' => true],
        ['key' => 'phone', 'type' => 'tel', 'label_ar' => 'الهاتف', 'label_en' => 'Phone', 'required' => false],
    ];

    $this->actingAs($user)
        ->put("/super-admin/form-builder/{$template->id}", [
            'name_ar' => 'محدث',
            'name_en' => 'Updated',
            'type' => 'custom',
            'fields' => $updatedFields,
            'is_active' => true,
        ])
        ->assertRedirect(route('super-admin.form-builder.index'));

    $template->refresh();
    expect($template->name_en)->toBe('Updated')
        ->and($template->type)->toBe('custom')
        ->and($template->fields)->toHaveCount(2);
});

// ─── Delete ────────────────────────────────────────────────

test('super admin can delete a form template', function () {
    $user = User::factory()->superAdmin()->create();

    FormTemplate::unguard();
    $template = FormTemplate::create([
        'name_ar' => 'للحذف',
        'name_en' => 'To Delete',
        'type' => 'custom',
        'fields' => [['key' => 'x', 'type' => 'text', 'label_ar' => 'حقل', 'label_en' => 'Field', 'required' => false]],
        'is_active' => true,
    ]);
    FormTemplate::reguard();

    $this->actingAs($user)
        ->delete("/super-admin/form-builder/{$template->id}")
        ->assertRedirect(route('super-admin.form-builder.index'));

    $this->assertDatabaseMissing('form_templates', ['id' => $template->id]);
});
