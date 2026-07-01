<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TemplateController extends Controller
{
    public function index()
    {
        $templates = Template::withCount('tenants')
            ->orderBy('sort_order')
            ->get();

        $stats = [
            'total' => Template::count(),
            'active' => Template::where('is_active', true)->count(),
            'inactive' => Template::where('is_active', false)->count(),
            'coming_soon' => Template::where('is_coming_soon', true)->count(),
        ];

        return Inertia::render('super-admin/templates/index', [
            'templates' => $templates,
            'stats' => $stats,
        ]);
    }

    public function create()
    {
        return Inertia::render('super-admin/templates/create');
    }

    public function store(Request $request)
    {
        $validated = $this->validateTemplate($request);

        $validated['key'] = Str::slug($validated['key']);

        if ($request->hasFile('preview_image')) {
            $validated['preview_image'] = $request->file('preview_image')->store('templates', 'public');
        }

        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['is_coming_soon'] = $validated['is_coming_soon'] ?? false;
        $validated['sort_order'] = $validated['sort_order'] ?? (Template::max('sort_order') + 1);

        Template::create($validated);

        return redirect()->route('super-admin.templates.index')
            ->with('success', 'تم إنشاء القالب');
    }

    public function edit(Template $template)
    {
        return Inertia::render('super-admin/templates/edit', [
            'template' => $template,
        ]);
    }

    public function update(Request $request, Template $template)
    {
        $validated = $this->validateTemplate($request, $template);

        $validated['key'] = Str::slug($validated['key']);

        if ($request->hasFile('preview_image')) {
            if ($template->preview_image) {
                Storage::disk('public')->delete($template->preview_image);
            }
            $validated['preview_image'] = $request->file('preview_image')->store('templates', 'public');
        } else {
            unset($validated['preview_image']);
        }

        $template->update($validated);

        return redirect()->route('super-admin.templates.index')
            ->with('success', 'تم تحديث القالب');
    }

    public function destroy(Template $template)
    {
        if ($template->tenants()->exists()) {
            return back()->with('error', 'لا يمكن حذف قالب مستخدم من قبل منشآت');
        }

        if ($template->preview_image) {
            Storage::disk('public')->delete($template->preview_image);
        }

        $template->delete();

        return back()->with('success', 'تم حذف القالب');
    }

    public function toggleStatus(Template $template)
    {
        $template->update(['is_active' => !$template->is_active]);

        return back()->with('success', $template->is_active ? 'تم تفعيل القالب' : 'تم تعطيل القالب');
    }

    public function updateSettings(Request $request, Template $template)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        $template->update(['settings' => $validated['settings']]);

        return back()->with('success', 'تم تحديث إعدادات القالب');
    }

    private function validateTemplate(Request $request, ?Template $template = null): array
    {
        $keyRule = ['required', 'string', 'max:50'];
        $keyRule[] = $template
            ? Rule::unique('templates', 'key')->ignore($template->id)
            : Rule::unique('templates', 'key');

        return $request->validate([
            'key' => $keyRule,
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'city_ar' => 'nullable|string|max:100',
            'city_en' => 'nullable|string|max:100',
            'description_ar' => 'nullable|string|max:1000',
            'description_en' => 'nullable|string|max:1000',
            // Enforce a consistent landscape preview so the cards line up. The
            // gallery renders every card at a 16:10 ratio, so require a decent
            // landscape image (recommended 1200×750).
            'preview_image' => 'nullable|file|image|max:4096|dimensions:min_width=1000,min_height=600',
            'demo_url' => 'nullable|url|max:500',
            'is_active' => 'boolean',
            'is_coming_soon' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);
    }
}
