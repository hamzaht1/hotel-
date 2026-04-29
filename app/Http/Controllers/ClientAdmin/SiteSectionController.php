<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\SiteSection;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SiteSectionController extends Controller
{
    public function index()
    {
        $sections = SiteSection::orderBy('sort_order')->get();
        $existing = $sections->pluck('section_name')->all();
        $missing = array_values(array_diff(SiteSection::AVAILABLE, $existing));

        return Inertia::render('client-admin/site-sections/index', [
            'sections' => $sections,
            'availableToAdd' => $missing,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'section_name' => 'required|string|in:' . implode(',', SiteSection::AVAILABLE),
        ]);

        $exists = SiteSection::where('section_name', $validated['section_name'])->exists();
        if ($exists) {
            return back()->with('error', 'Section already exists');
        }

        $maxOrder = SiteSection::max('sort_order') ?? 0;

        SiteSection::create([
            'section_name' => $validated['section_name'],
            'is_active' => true,
            'sort_order' => $maxOrder + 1,
        ]);

        return back()->with('success', 'Section added');
    }

    public function destroy(SiteSection $siteSection)
    {
        $siteSection->delete();

        return back()->with('success', 'Section removed');
    }

    public function toggle(SiteSection $siteSection)
    {
        $siteSection->update(['is_active' => !$siteSection->is_active]);

        return back()->with('success', 'Section ' . ($siteSection->is_active ? 'activated' : 'deactivated'));
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:site_sections,id',
            'items.*.sort_order' => 'required|integer',
        ]);

        foreach ($request->items as $item) {
            SiteSection::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return back()->with('success', 'Order updated');
    }
}
