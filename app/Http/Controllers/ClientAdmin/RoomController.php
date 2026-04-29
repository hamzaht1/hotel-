<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\RoomImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        $rooms = Room::query()
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('name_ar', 'like', "%{$s}%")->orWhere('name_en', 'like', "%{$s}%");
            }))
            ->with('images')
            ->orderBy('sort_order')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('client-admin/rooms/index', [
            'rooms' => $rooms,
            'filters' => $request->only(['type', 'search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('client-admin/rooms/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'type' => 'required|in:standard,deluxe,suite,family',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'capacity' => 'required|integer|min:1',
            'amenities' => 'nullable|array',
            'amenities.*' => 'string',
            'is_active' => 'nullable',
            'featured_image' => 'nullable|file|image|max:5120',
            'images' => 'nullable|array',
            'images.*' => 'file|image|max:5120',
        ]);

        $validated['amenities'] = $request->input('amenities', []);
        $validated['is_active'] = $request->boolean('is_active');

        if ($request->hasFile('featured_image')) {
            $validated['featured_image'] = $request->file('featured_image')->store('rooms', 'public');
        }

        $room = Room::create($validated);

        // Handle additional images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $image) {
                $path = $image->store('rooms', 'public');
                $room->images()->create([
                    'path' => $path,
                    'sort_order' => $index,
                ]);
            }
        }

        return redirect()->route('client-admin.rooms.index')
            ->with('success', 'Room created successfully');
    }

    public function edit(Room $room)
    {
        return Inertia::render('client-admin/rooms/edit', [
            'room' => $room->load('images'),
        ]);
    }

    public function update(Request $request, Room $room)
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'type' => 'required|in:standard,deluxe,suite,family',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'capacity' => 'required|integer|min:1',
            'amenities' => 'nullable|array',
            'amenities.*' => 'string',
            'is_active' => 'nullable',
            'featured_image' => 'nullable|file|image|max:5120',
            'new_images' => 'nullable|array',
            'new_images.*' => 'file|image|max:5120',
            'delete_images' => 'nullable|array',
            'delete_images.*' => 'integer|exists:room_images,id',
        ]);

        $validated['amenities'] = $request->input('amenities', []);
        $validated['is_active'] = $request->boolean('is_active');

        if ($request->hasFile('featured_image')) {
            // Delete old image
            if ($room->featured_image) {
                Storage::disk('public')->delete($room->featured_image);
            }
            $validated['featured_image'] = $request->file('featured_image')->store('rooms', 'public');
        }

        $room->update($validated);

        // Delete images if requested
        if (!empty($validated['delete_images'])) {
            $imagesToDelete = RoomImage::whereIn('id', $validated['delete_images'])
                ->where('room_id', $room->id)
                ->get();

            foreach ($imagesToDelete as $image) {
                Storage::disk('public')->delete($image->path);
                $image->delete();
            }
        }

        // Add new images
        if ($request->hasFile('new_images')) {
            $maxSort = $room->images()->max('sort_order') ?? -1;
            foreach ($request->file('new_images') as $index => $image) {
                $path = $image->store('rooms', 'public');
                $room->images()->create([
                    'path' => $path,
                    'sort_order' => $maxSort + $index + 1,
                ]);
            }
        }

        return redirect()->route('client-admin.rooms.index')
            ->with('success', 'Room updated successfully');
    }

    public function destroy(Room $room)
    {
        // Delete images from storage
        if ($room->featured_image) {
            Storage::disk('public')->delete($room->featured_image);
        }
        foreach ($room->images as $image) {
            Storage::disk('public')->delete($image->path);
        }

        $room->delete();

        return back()->with('success', 'Room deleted successfully');
    }
}
