<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\Page;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MenuController extends Controller
{
    public function index()
    {
        $headerMenu = Menu::where('location', 'header')->first();
        $footerMenu = Menu::where('location', 'footer')->first();
        $pages = Page::published()->orderBy('sort_order')->get(['id', 'title_ar', 'title_en', 'slug']);

        return Inertia::render('super-admin/menus/index', [
            'headerMenu' => $headerMenu ? $headerMenu->items : [],
            'footerMenu' => $footerMenu ? $footerMenu->items : [],
            'pages' => $pages,
        ]);
    }

    public function update(Request $request, string $location)
    {
        if (!in_array($location, ['header', 'footer'])) {
            abort(404);
        }

        $validated = $request->validate([
            'items' => 'array',
            'items.*.label_ar' => 'required|string|max:255',
            'items.*.label_en' => 'required|string|max:255',
            'items.*.type' => 'required|in:page,section,external',
            'items.*.page_id' => 'nullable|integer|exists:pages,id',
            'items.*.section_anchor' => 'nullable|string|max:100',
            'items.*.url' => 'nullable|string|max:500',
            'items.*.is_visible' => 'boolean',
            'items.*.parent_index' => 'nullable|integer|min:0',
        ]);

        Menu::updateOrCreate(
            ['location' => $location],
            ['items' => $validated['items']],
        );

        return back()->with('success', 'تم تحديث القائمة بنجاح');
    }
}
