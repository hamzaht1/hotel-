<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PageController extends Controller
{
    public function index(Request $request)
    {
        $pages = Page::query()
            ->when($request->search, fn ($q, $s) => $q->where('title_ar', 'like', "%{$s}%")->orWhere('title_en', 'like', "%{$s}%")->orWhere('slug', 'like', "%{$s}%"))
            ->when($request->status !== null && $request->status !== 'all', function ($q) use ($request) {
                $q->where('is_published', $request->status === 'published');
            })
            ->orderBy('sort_order')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('super-admin/pages/index', [
            'pages' => $pages,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create()
    {
        return Inertia::render('super-admin/pages/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title_ar' => 'required|string|max:255',
            'title_en' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:pages,slug',
            'url_label_ar' => 'nullable|string|max:255',
            'url_label_en' => 'nullable|string|max:255',
            'content_ar' => 'nullable|string',
            'content_en' => 'nullable|string',
            'meta_title_ar' => 'nullable|string|max:255',
            'meta_title_en' => 'nullable|string|max:255',
            'meta_description_ar' => 'nullable|string|max:500',
            'meta_description_en' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string|max:500',
            'og_image' => 'nullable|string|max:500',
            'attachments' => 'nullable|array',
            'is_published' => 'boolean',
            'sort_order' => 'integer|min:0',
            'layout' => 'required|string|in:default',
            'show_header' => 'boolean',
            'show_footer' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['slug']);

        Page::create($validated);

        return redirect()->route('super-admin.pages.index')
            ->with('success', 'تم إنشاء الصفحة بنجاح');
    }

    public function edit(Page $page)
    {
        return Inertia::render('super-admin/pages/edit', [
            'page' => $page,
        ]);
    }

    public function update(Request $request, Page $page)
    {
        $validated = $request->validate([
            'title_ar' => 'required|string|max:255',
            'title_en' => 'required|string|max:255',
            'slug' => ['required', 'string', 'max:255', Rule::unique('pages')->ignore($page)],
            'url_label_ar' => 'nullable|string|max:255',
            'url_label_en' => 'nullable|string|max:255',
            'content_ar' => 'nullable|string',
            'content_en' => 'nullable|string',
            'meta_title_ar' => 'nullable|string|max:255',
            'meta_title_en' => 'nullable|string|max:255',
            'meta_description_ar' => 'nullable|string|max:500',
            'meta_description_en' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string|max:500',
            'og_image' => 'nullable|string|max:500',
            'attachments' => 'nullable|array',
            'is_published' => 'boolean',
            'sort_order' => 'integer|min:0',
            'layout' => 'required|string|in:default',
            'show_header' => 'boolean',
            'show_footer' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['slug']);
        $page->update($validated);

        return redirect()->route('super-admin.pages.index')
            ->with('success', 'تم تحديث الصفحة بنجاح');
    }

    public function destroy(Page $page)
    {
        $page->delete();

        return redirect()->route('super-admin.pages.index')
            ->with('success', 'تم حذف الصفحة بنجاح');
    }
}
