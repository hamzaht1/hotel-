<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\Page;
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
            ]),
            'headerMenu' => $page->show_header
                ? (optional(Menu::where('location', 'header')->first())->items ?? [])
                : [],
            'footerMenu' => $page->show_footer
                ? (optional(Menu::where('location', 'footer')->first())->items ?? [])
                : [],
        ]);
    }
}
