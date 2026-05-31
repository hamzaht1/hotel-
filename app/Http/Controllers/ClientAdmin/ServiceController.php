<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServiceFeature;
use App\Models\ServiceImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $services = Service::query()
            ->with('category:id,name_ar,name_en', 'images', 'features')
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
        $categories = ServiceCategory::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name_ar', 'name_en', 'type']);

        return Inertia::render('client-admin/services/create', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateService($request);

        $featuredPath = null;
        if ($request->hasFile('featured_image')) {
            $featuredPath = $request->file('featured_image')->store('services', 'public');
        }

        $service = Service::create(array_merge(
            $this->extractServiceData($validated),
            [
                'featured_image' => $featuredPath,
                'sort_order' => Service::max('sort_order') + 1,
            ],
        ));

        $this->persistFeatures($service, $validated['features'] ?? []);
        $this->persistImages($service, $request->file('images', []));

        return redirect()
            ->route('client-admin.services.index')
            ->with('success', 'تم إنشاء الخدمة بنجاح');
    }

    public function edit(Service $service)
    {
        $this->authorizeTenant($service);

        $categories = ServiceCategory::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name_ar', 'name_en', 'type']);

        return Inertia::render('client-admin/services/edit', [
            'service' => $service->load('images', 'features'),
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, Service $service)
    {
        $this->authorizeTenant($service);

        $validated = $this->validateService($request);

        $data = $this->extractServiceData($validated);

        if ($request->hasFile('featured_image')) {
            if ($service->featured_image) {
                Storage::disk('public')->delete($service->featured_image);
            }
            $data['featured_image'] = $request->file('featured_image')->store('services', 'public');
        }

        $service->update($data);

        $this->persistFeatures($service, $validated['features'] ?? []);
        $this->persistImages($service, $request->file('images', []));

        return redirect()
            ->route('client-admin.services.index')
            ->with('success', 'تم تحديث الخدمة بنجاح');
    }

    public function destroy(Service $service)
    {
        $this->authorizeTenant($service);

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

    public function destroyImage(ServiceImage $image)
    {
        $this->authorizeTenant($image->service);

        Storage::disk('public')->delete($image->image_path);
        $image->delete();

        return back()->with('success', 'تم حذف الصورة');
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

    private function validateService(Request $request): array
    {
        return $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'category_id' => 'nullable|exists:service_categories,id',
            'short_description_ar' => 'nullable|string|max:500',
            'short_description_en' => 'nullable|string|max:500',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'internal_notes' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'billing_method' => 'nullable|in:once,per_night,per_hour,per_minute,time_window',
            'duration_hours' => 'nullable|integer|min:0|max:999',
            'duration_minutes' => 'nullable|integer|min:0|max:59',
            'time_window_from' => 'nullable|regex:/^\d{2}:\d{2}$/',
            'time_window_to' => 'nullable|regex:/^\d{2}:\d{2}$/',
            'party_size' => 'nullable|integer|min:1|max:9999',
            'capacity' => 'nullable|integer|min:1|max:999',
            'room_type' => 'nullable|string|max:100',
            'custom_subtype_ar' => 'nullable|string|max:100',
            'custom_subtype_en' => 'nullable|string|max:100',
            'duration' => 'nullable|string|max:100',
            'featured_image' => 'nullable|file|image|max:4096',
            'text_color' => 'nullable|string|max:7',
            'images' => 'nullable|array|max:6',
            'images.*' => 'file|image|max:4096',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'booking_channel' => 'nullable|in:whatsapp,email',
            'whatsapp_number' => 'nullable|string|max:30',
            'whatsapp_message_ar' => 'nullable|string|max:1000',
            'whatsapp_message_en' => 'nullable|string|max:1000',
            'booking_email' => 'nullable|email|max:150',
            'features' => 'nullable|array',
            'features.*.key' => 'required|string|max:100',
            'features.*.label_ar' => 'required|string|max:255',
            'features.*.label_en' => 'required|string|max:255',
            'features.*.icon' => 'nullable|string|max:10',
        ]);
    }

    private function extractServiceData(array $validated): array
    {
        return collect($validated)
            ->except(['features', 'images', 'featured_image'])
            ->merge([
                'is_active' => $validated['is_active'] ?? true,
                'is_featured' => $validated['is_featured'] ?? false,
                'booking_channel' => $validated['booking_channel'] ?? 'whatsapp',
                'billing_method' => $validated['billing_method'] ?? 'once',
            ])
            ->toArray();
    }

    private function persistFeatures(Service $service, array $features): void
    {
        $service->features()->delete();

        foreach (array_values($features) as $i => $feature) {
            ServiceFeature::create([
                'service_id' => $service->id,
                'key' => $feature['key'],
                'label_ar' => $feature['label_ar'],
                'label_en' => $feature['label_en'],
                'icon' => $feature['icon'] ?? null,
                'sort_order' => $i,
            ]);
        }
    }

    private function persistImages(Service $service, array $files): void
    {
        $startOrder = ($service->images()->max('sort_order') ?? -1) + 1;

        foreach ($files as $i => $file) {
            $path = $file->store('services', 'public');
            ServiceImage::create([
                'service_id' => $service->id,
                'image_path' => $path,
                'sort_order' => $startOrder + $i,
            ]);
        }
    }

    private function authorizeTenant(Service $service): void
    {
        if ($service->tenant_id !== app('current_tenant_id')) {
            abort(403);
        }
    }
}
