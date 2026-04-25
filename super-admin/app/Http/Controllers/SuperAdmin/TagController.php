<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\RequestTag;
use Illuminate\Http\Request;

class TagController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'label' => 'required|string|max:60',
            'color' => 'nullable|string|max:20|regex:/^#[0-9a-fA-F]{6}$/',
        ]);

        RequestTag::create([
            'label' => $validated['label'],
            'color' => $validated['color'] ?? '#6366f1',
        ]);

        return back()->with('success', 'Tag created');
    }

    public function update(Request $request, RequestTag $tag)
    {
        $validated = $request->validate([
            'label' => 'required|string|max:60',
            'color' => 'nullable|string|max:20|regex:/^#[0-9a-fA-F]{6}$/',
        ]);

        $tag->update([
            'label' => $validated['label'],
            'color' => $validated['color'] ?? $tag->color,
        ]);

        return back()->with('success', 'Tag updated');
    }

    public function destroy(RequestTag $tag)
    {
        $tag->tenants()->detach();
        $tag->delete();

        return back()->with('success', 'Tag deleted');
    }
}
