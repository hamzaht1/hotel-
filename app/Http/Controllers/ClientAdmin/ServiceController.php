<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $services = Service::query()
            ->with('category:id,name_ar,name_en', 'images')
            ->when($request->category_id, fn ($q, $id) => $q->where('category_id', $id))
            ->when($request->search, fn ($q, $s) => $q->where('name_ar', 'like', "%{$s}%")->orWhere('name_en', 'like', "%{$s}%"))
            ->orderBy('sort_order')
            ->paginate(12)
            ->withQueryString();

        $categories = ServiceCategory::orderBy('sort_order')->get(['id', 'name_ar', 'name_en']);

        return Inertia::render('client-admin/services/index', [
            'services' => $services,
            'categories' => $categories,
            'filters' => $request->only(['category_id', 'search']),
        ]);
    }

    public function create()
    {
        $categories = ServiceCategory::where('is_active', true)->orderBy('sort_order')->get(['id', 'name_ar', 'name_en']);

        return Inertia::render('client-admin/services/create', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'category_id' => 'nullable|exists:service_categories,id',
            'price' => 'required|numeric|min:0',
            'duration' => 'nullable|string|max:100',
            'video_url' => 'nullable|url|max:500',
            'featured_image' => 'nullable|file|image|max:2048',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        if ($request->hasFile('featured_image')) {
            $validated['featured_image'] = $request->file('featured_image')->store('services', 'public');
        }

        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['sort_order'] = $validated['sort_order'] ?? (Service::max('sort_order') + 1);

        $service = Service::create($validated);

        // Redirect to required-fields builder so the admin can configure what
        // data the guest must submit when booking this service.
        return redirect()
            ->route('client-admin.services.required-fields', $service)
            ->with('success', 'تم إنشاء الخدمة. قم بإعداد البيانات المطلوبة.');
    }

    public function requiredFields(Service $service)
    {
        $this->authorizeTenant($service);

        return Inertia::render('client-admin/services/required-fields', [
            'service' => $service->only(['id', 'name_ar', 'name_en', 'required_fields', 'accepts_bookings']),
        ]);
    }

    public function saveRequiredFields(Request $request, Service $service)
    {
        $this->authorizeTenant($service);

        $validated = $request->validate([
            'accepts_bookings' => 'boolean',
            'required_fields' => 'array',
            'required_fields.*.key' => 'required|string|max:100',
            'required_fields.*.label_ar' => 'required|string|max:255',
            'required_fields.*.label_en' => 'required|string|max:255',
            'required_fields.*.type' => 'required|in:text,textarea,number,date,tel,email,select,file,checkbox',
            'required_fields.*.options' => 'nullable|array',
            'required_fields.*.is_required' => 'boolean',
        ]);

        $service->update([
            'accepts_bookings' => $validated['accepts_bookings'] ?? false,
            'required_fields' => $validated['required_fields'] ?? [],
        ]);

        return back()->with('success', 'تم حفظ البيانات المطلوبة');
    }

    private function authorizeTenant(Service $service): void
    {
        if ($service->tenant_id !== app('current_tenant_id')) {
            abort(403);
        }
    }

    public function edit(Service $service)
    {
        $categories = ServiceCategory::where('is_active', true)->orderBy('sort_order')->get(['id', 'name_ar', 'name_en']);

        return Inertia::render('client-admin/services/edit', [
            'service' => $service->load('images'),
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'category_id' => 'nullable|exists:service_categories,id',
            'price' => 'required|numeric|min:0',
            'duration' => 'nullable|string|max:100',
            'video_url' => 'nullable|url|max:500',
            'featured_image' => 'nullable|file|max:2048',
            'is_active' => 'boolean',
        ]);

        if ($request->hasFile('featured_image')) {
            if ($service->featured_image) {
                Storage::disk('public')->delete($service->featured_image);
            }
            $validated['featured_image'] = $request->file('featured_image')->store('services', 'public');
        }

        $service->update($validated);

        return redirect()->route('client-admin.services.index')
            ->with('success', 'تم تحديث الخدمة بنجاح');
    }

    public function destroy(Service $service)
    {
        if ($service->featured_image) {
            Storage::disk('public')->delete($service->featured_image);
        }

        foreach ($service->images as $image) {
            Storage::disk('public')->delete($image->image_path);
        }

        $service->delete();

        return redirect()->route('client-admin.services.index')
            ->with('success', 'تم حذف الخدمة بنجاح');
    }
}
