<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Template;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TemplateController extends Controller
{
    public function index()
    {
        $templates = Template::withCount('tenants')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('super-admin/templates/index', [
            'templates' => $templates,
        ]);
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
}
