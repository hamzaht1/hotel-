<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\SiteSetting;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        syncLangFiles('messages');

        return Inertia::render('public/Home', [
            'plans' => Plan::where('is_active', true)->orderBy('sort_order')->get(),
            'siteSettings' => SiteSetting::getAllGrouped(),
        ]);
    }
}
