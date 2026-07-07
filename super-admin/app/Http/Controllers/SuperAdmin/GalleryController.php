<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SiteGalleryImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * Manages the public landing-page image galleries:
 *  - group=hotels → "Trusted Hotels" logo strip
 *  - group=footer → footer partner logos
 * Each image has a per-item display width (px). Rows live in the shared DB and
 * are read by the public (client) app.
 */
class GalleryController extends Controller
{
    public function index()
    {
        return Inertia::render('super-admin/gallery/index', [
            'images' => collect(SiteGalleryImage::GROUPS)->mapWithKeys(fn ($group) => [
                $group => SiteGalleryImage::where('group', $group)
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->get(['id', 'group', 'image_path', 'title', 'width', 'sort_order', 'is_active']),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'group' => 'required|in:' . implode(',', SiteGalleryImage::GROUPS),
            'image' => 'required|file|image|max:5120',
            'title' => 'nullable|string|max:255',
            'width' => 'nullable|integer|min:24|max:1000',
        ]);

        $path = $request->file('image')->store('site-gallery', 'public');

        SiteGalleryImage::create([
            'group' => $validated['group'],
            'image_path' => $path,
            'title' => $validated['title'] ?? null,
            'width' => $validated['width'] ?? 128,
            'sort_order' => (SiteGalleryImage::where('group', $validated['group'])->max('sort_order') ?? 0) + 1,
            'is_active' => true,
        ]);

        return back()->with('success', 'تمت إضافة الصورة');
    }

    public function update(Request $request, SiteGalleryImage $galleryImage)
    {
        $validated = $request->validate([
            'image' => 'nullable|file|image|max:5120',
            'title' => 'nullable|string|max:255',
            'width' => 'nullable|integer|min:24|max:1000',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            if ($galleryImage->image_path) {
                Storage::disk('public')->delete($galleryImage->image_path);
            }
            $galleryImage->image_path = $request->file('image')->store('site-gallery', 'public');
        }

        $galleryImage->fill(collect($validated)->except('image')->toArray());
        $galleryImage->save();

        return back()->with('success', 'تم تحديث الصورة');
    }

    public function destroy(SiteGalleryImage $galleryImage)
    {
        if ($galleryImage->image_path) {
            Storage::disk('public')->delete($galleryImage->image_path);
        }
        $galleryImage->delete();

        return back()->with('success', 'تم حذف الصورة');
    }
}
