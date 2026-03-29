<?php

namespace App\Http\Controllers;

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
                'layout',
            ]),
        ]);
    }
}
