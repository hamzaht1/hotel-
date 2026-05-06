<?php

namespace App\Http\Controllers;

use App\Mail\PageSubmissionMail;
use App\Models\Menu;
use App\Models\Page;
use App\Models\PageSubmission;
use App\Models\User;
use App\Support\Mailer;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;

class PageController extends Controller
{
    public function show(string $slug)
    {
        $page = Page::published()->where('slug', $slug)->firstOrFail();

        return Inertia::render('public/Page', [
            'page' => $page->only([
                'id', 'slug', 'title_ar', 'title_en',
                'content_ar', 'content_en',
                'meta_description_ar', 'meta_description_en',
                'layout', 'show_header', 'show_footer', 'header_config',
                'form_fields', 'form_submit_label_ar', 'form_submit_label_en',
            ]),
            'headerMenu' => $page->show_header
                ? (optional(Menu::where('location', 'header')->first())->items ?? [])
                : [],
            'footerMenu' => $page->show_footer
                ? (optional(Menu::where('location', 'footer')->first())->items ?? [])
                : [],
        ]);
    }

    public function submit(Request $request, string $slug)
    {
        $page = Page::published()->where('slug', $slug)->firstOrFail();

        $fields = $page->form_fields ?? [];
        if (empty($fields)) {
            abort(404);
        }

        $rules = [];
        foreach ($fields as $field) {
            $key = $field['key'] ?? null;
            if (!$key) continue;

            $rule = $field['required'] ?? false ? 'required' : 'nullable';
            $rule .= match ($field['type'] ?? 'text') {
                'email' => '|email|max:255',
                'tel' => '|string|max:30',
                'number' => '|numeric',
                'textarea' => '|string|max:5000',
                'file' => '|file|max:20480',
                'checkbox' => '|array',
                default => '|string|max:1000',
            };
            $rules["data.{$key}"] = $rule;
        }

        $validated = $request->validate($rules);

        $data = [];
        foreach ($fields as $field) {
            $key = $field['key'] ?? null;
            if (!$key) continue;

            $value = $request->input("data.{$key}") ?? $request->file("data.{$key}");
            if ($value instanceof UploadedFile) {
                $data[$key] = $value->store("submissions/{$page->id}", 'public');
            } else {
                $data[$key] = $value;
            }
        }

        $submission = PageSubmission::create([
            'page_id' => $page->id,
            'tenant_id' => null,
            'data' => $data,
            'ip' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
        ]);

        $admin = User::where('role', 'super_admin')->first()
            ?? User::where('role', 'client_admin')->first();
        if ($admin) {
            Mailer::sendIfConfigured(
                $admin->email,
                fn () => new PageSubmissionMail($submission, $page),
                'page submission'
            );
        }

        return back()->with('success', 'Form submitted successfully');
    }
}
