<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\FormTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FormBuilderController extends Controller
{
    public function index()
    {
        $templates = FormTemplate::query()
            ->latest()
            ->paginate(15);

        return Inertia::render('super-admin/form-builder/index', [
            'templates' => $templates,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'type' => 'required|string|in:subscription,contact,support,custom',
            'fields' => 'required|array',
            'fields.*.key' => 'required|string',
            'fields.*.type' => 'required|string|in:text,email,tel,number,select,textarea,checkbox,file',
            'fields.*.label_ar' => 'required|string',
            'fields.*.label_en' => 'required|string',
            'fields.*.required' => 'boolean',
            'fields.*.options' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        FormTemplate::create($validated);

        return redirect()->route('super-admin.form-builder.index')
            ->with('success', 'تم إنشاء النموذج بنجاح / Form template created successfully');
    }

    public function update(Request $request, FormTemplate $formTemplate)
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'type' => 'required|string|in:subscription,contact,support,custom',
            'fields' => 'required|array',
            'fields.*.key' => 'required|string',
            'fields.*.type' => 'required|string|in:text,email,tel,number,select,textarea,checkbox,file',
            'fields.*.label_ar' => 'required|string',
            'fields.*.label_en' => 'required|string',
            'fields.*.required' => 'boolean',
            'fields.*.options' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $formTemplate->update($validated);

        return redirect()->route('super-admin.form-builder.index')
            ->with('success', 'تم تحديث النموذج بنجاح / Form template updated successfully');
    }

    public function destroy(FormTemplate $formTemplate)
    {
        $formTemplate->delete();

        return redirect()->route('super-admin.form-builder.index')
            ->with('success', 'تم حذف النموذج بنجاح / Form template deleted successfully');
    }
}
