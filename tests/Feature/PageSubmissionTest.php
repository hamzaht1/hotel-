<?php

use App\Mail\PageSubmissionMail;
use App\Models\Page;
use App\Models\PageSubmission;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function makePage(array $overrides = []): Page
{
    return Page::create(array_merge([
        'slug' => 'contact',
        'title_ar' => 'تواصل',
        'title_en' => 'Contact',
        'content_ar' => '',
        'content_en' => '',
        'is_published' => true,
        'sort_order' => 0,
        'layout' => 'default',
        'show_header' => true,
        'show_footer' => true,
        'form_fields' => [
            ['key' => 'full_name', 'type' => 'text', 'label_ar' => 'الاسم', 'label_en' => 'Name', 'required' => true],
            ['key' => 'email', 'type' => 'email', 'label_ar' => 'البريد', 'label_en' => 'Email', 'required' => true],
            ['key' => 'message', 'type' => 'textarea', 'label_ar' => 'الرسالة', 'label_en' => 'Message', 'required' => false],
        ],
    ], $overrides));
}

test('public page exposes form_fields to the visitor', function () {
    makePage();

    $this->get('/page/contact')
        ->assertOk()
        ->assertInertia(fn ($p) => $p
            ->component('public/Page')
            ->has('page.form_fields', 3)
            ->where('page.form_fields.0.key', 'full_name')
        );
});

test('valid submission stores a row, sends notification mail', function () {
    Mail::fake();
    User::factory()->create(['role' => 'super_admin', 'email' => 'admin@example.com']);
    $page = makePage();

    $this->post('/page/contact/submit', [
        'data' => [
            'full_name' => 'Alice',
            'email' => 'alice@example.com',
            'message' => 'Hello!',
        ],
    ])->assertRedirect();

    $submission = PageSubmission::first();
    expect($submission)->not->toBeNull();
    expect($submission->page_id)->toBe($page->id);
    expect($submission->data['full_name'])->toBe('Alice');
    expect($submission->data['email'])->toBe('alice@example.com');

    Mail::assertSent(PageSubmissionMail::class);
});

test('missing required field is rejected with field error', function () {
    makePage();

    $this->post('/page/contact/submit', [
        'data' => [
            'full_name' => '',
            'email' => 'bob@example.com',
        ],
    ])->assertSessionHasErrors(['data.full_name']);

    expect(PageSubmission::count())->toBe(0);
});

test('file uploads are stored on the public disk and path is recorded', function () {
    Storage::fake('public');
    Mail::fake();

    makePage([
        'form_fields' => [
            ['key' => 'name', 'type' => 'text', 'label_ar' => '', 'label_en' => 'Name', 'required' => true],
            ['key' => 'cv', 'type' => 'file', 'label_ar' => '', 'label_en' => 'CV', 'required' => true],
        ],
    ]);

    $file = UploadedFile::fake()->create('cv.pdf', 200, 'application/pdf');

    $this->post('/page/contact/submit', [
        'data' => [
            'name' => 'Carol',
            'cv' => $file,
        ],
    ])->assertRedirect();

    $submission = PageSubmission::first();
    expect($submission->data['name'])->toBe('Carol');
    expect($submission->data['cv'])->toStartWith('submissions/');
    Storage::disk('public')->assertExists($submission->data['cv']);
});

test('files larger than 20 MB are rejected', function () {
    Storage::fake('public');
    makePage([
        'form_fields' => [
            ['key' => 'doc', 'type' => 'file', 'label_ar' => '', 'label_en' => 'Doc', 'required' => true],
        ],
    ]);

    $file = UploadedFile::fake()->create('big.pdf', 25 * 1024); // 25 MB

    $this->post('/page/contact/submit', [
        'data' => ['doc' => $file],
    ])->assertSessionHasErrors(['data.doc']);

    expect(PageSubmission::count())->toBe(0);
});

test('submitting on a page with no form fields returns 404', function () {
    Page::create([
        'slug' => 'about',
        'title_ar' => 'عن', 'title_en' => 'About',
        'content_ar' => '', 'content_en' => '',
        'is_published' => true, 'sort_order' => 0, 'layout' => 'default',
        'show_header' => true, 'show_footer' => true,
        'form_fields' => null,
    ]);

    $this->post('/page/about/submit', ['data' => []])->assertNotFound();
});
