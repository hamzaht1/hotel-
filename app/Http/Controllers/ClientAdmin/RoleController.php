<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index()
    {
        $tenantId = app('current_tenant_id');

        $roles = Role::where(function ($q) use ($tenantId) {
            $q->whereNull('tenant_id')
              ->orWhere('tenant_id', $tenantId);
        })
        ->where('key', '!=', 'super_admin')
        ->withCount('users')
        ->with('permissions:id,key')
        ->orderBy('is_system', 'desc')
        ->orderBy('name_ar')
        ->get();

        $permissions = Permission::orderBy('group')->orderBy('id')->get(['id', 'key', 'name_ar', 'name_en', 'group']);

        return Inertia::render('client-admin/roles/index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = app('current_tenant_id');

        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'key' => 'required|string|max:100',
            'permissions' => 'required|array|min:1',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role = Role::create([
            'tenant_id' => $tenantId,
            'key' => $validated['key'],
            'name_ar' => $validated['name_ar'],
            'name_en' => $validated['name_en'],
            'is_system' => false,
        ]);

        $role->permissions()->sync($validated['permissions']);

        return back()->with('success', 'تم إنشاء الدور بنجاح');
    }

    public function update(Request $request, Role $role)
    {
        $tenantId = app('current_tenant_id');

        if ($role->is_system) {
            return back()->with('error', 'لا يمكن تعديل الأدوار الأساسية');
        }

        if ($role->tenant_id !== $tenantId) {
            abort(403);
        }

        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'permissions' => 'required|array|min:1',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role->update([
            'name_ar' => $validated['name_ar'],
            'name_en' => $validated['name_en'],
        ]);

        $role->permissions()->sync($validated['permissions']);

        return back()->with('success', 'تم تحديث الدور بنجاح');
    }

    public function destroy(Role $role)
    {
        $tenantId = app('current_tenant_id');

        if ($role->is_system) {
            return back()->with('error', 'لا يمكن حذف الأدوار الأساسية');
        }

        if ($role->tenant_id !== $tenantId) {
            abort(403);
        }

        if ($role->users()->count() > 0) {
            return back()->with('error', 'لا يمكن حذف دور مرتبط بموظفين');
        }

        $role->permissions()->detach();
        $role->delete();

        return back()->with('success', 'تم حذف الدور بنجاح');
    }
}
