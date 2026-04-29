<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\GalleryImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class GalleryController extends Controller
{
    public function index(Request $request)
    {
        $images = GalleryImage::query()
            ->when($request->category, fn ($q, $c) => $q->where('category', $c))
            ->orderBy('sort_order')
            ->paginate(24)
            ->withQueryString();

        return Inertia::render('client-admin/gallery/index', [
            'images' => $images,
            'filters' => $request->only(['category']),
            'categories' => ['general', 'rooms', 'lobby', 'restaurant', 'pool', 'exterior'],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title_ar' => 'nullable|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'category' => 'required|in:general,rooms,lobby,restaurant,pool,exterior',
            'images' => 'required|array|min:1',
            'images.*' => 'file|image|max:5120',
        ]);

        $lastOrder = GalleryImage::max('sort_order') ?? 0;

        foreach ($request->file('images') as $index => $image) {
            $path = $image->store('gallery', 'public');
            GalleryImage::create([
                'title_ar' => $request->title_ar,
                'title_en' => $request->title_en,
                'path' => $path,
                'category' => $request->category,
                'sort_order' => $lastOrder + $index + 1,
                'is_active' => true,
            ]);
        }

        return back()->with('success', 'Images uploaded successfully');
    }

    public function update(Request $request, GalleryImage $galleryImage)
    {
        $validated = $request->validate([
            'title_ar' => 'nullable|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'category' => 'required|in:general,rooms,lobby,restaurant,pool,exterior',
            'is_active' => 'boolean',
        ]);

        $galleryImage->update($validated);

        return back()->with('success', 'Image updated successfully');
    }

    public function destroy(GalleryImage $galleryImage)
    {
        Storage::disk('public')->delete($galleryImage->path);
        $galleryImage->delete();

        return back()->with('success', 'Image deleted successfully');
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:gallery_images,id',
            'items.*.sort_order' => 'required|integer',
        ]);

        foreach ($request->items as $item) {
            GalleryImage::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return back()->with('success', 'Order updated');
    }
}
