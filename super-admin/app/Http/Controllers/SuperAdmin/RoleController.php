<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RoleController extends Controller
{
    /**
     * Unified staff & roles page — returns employees list + roles matrix.
     */
    public function index(Request $request)
    {
        $tab = $request->input('tab') === 'permissions' ? 'permissions' : 'staff';

        $usersQuery = User::query()
            ->whereNull('tenant_id')
            ->whereIn('role', ['super_admin', 'staff'])
            ->with('roleModel:id,key,name_ar,name_en,is_system');

        if ($search = $request->search) {
            $usersQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('id', $search);
            });
        }

        if ($request->role_id && $request->role_id !== 'all') {
            $usersQuery->where('role_id', $request->role_id);
        }

        $users = $usersQuery->latest()->paginate(20)->withQueryString();
        $users->getCollection()->transform(function ($u) {
            $u->photo_url = $u->photo ? \Storage::disk('public')->url($u->photo) : null;
            return $u;
        });

        $roles = Role::query()
            ->whereNull('tenant_id')
            ->with('permissions:id,key')
            ->withCount('users')
            ->orderBy('is_system', 'desc')
            ->orderBy('name_en')
            ->get();

        $permissions = Permission::query()
            ->orderBy('group')
            ->orderBy('id')
            ->get(['id', 'key', 'name_ar', 'name_en', 'group']);

        return Inertia::render('super-admin/staff/index', [
            'tab' => $tab,
            'users' => $users,
            'roles' => $roles,
            'permissions' => $permissions,
            'filters' => $request->only(['search', 'role_id', 'tab']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:100',
            'name_en' => 'required|string|max:100',
            'key' => 'nullable|string|max:60',
            'permissions' => 'array',
            'permissions.*' => 'integer|exists:permissions,id',
        ]);

        $role = Role::create([
            'tenant_id' => null,
            'key' => ($validated['key'] ?? null) ?: Str::slug($validated['name_en']),
            'name_ar' => $validated['name_ar'],
            'name_en' => $validated['name_en'],
            'is_system' => false,
        ]);

        $role->permissions()->sync($validated['permissions'] ?? []);

        return back()->with('success', 'تم إنشاء الدور');
    }

    public function update(Request $request, Role $role)
    {
        if ($role->is_system && $request->boolean('change_identity')) {
            return back()->with('error', 'لا يمكن تعديل هوية الدور الأساسي');
        }

        $validated = $request->validate([
            'name_ar' => 'nullable|string|max:100',
            'name_en' => 'nullable|string|max:100',
            'permissions' => 'array',
            'permissions.*' => 'integer|exists:permissions,id',
        ]);

        $updates = array_filter([
            'name_ar' => $validated['name_ar'] ?? null,
            'name_en' => $validated['name_en'] ?? null,
        ]);
        if (!$role->is_system && !empty($updates)) {
            $role->update($updates);
        }

        if (array_key_exists('permissions', $validated)) {
            $role->permissions()->sync($validated['permissions']);
        }

        return back()->with('success', 'تم تحديث الدور');
    }

    public function destroy(Role $role)
    {
        if ($role->is_system) {
            return back()->with('error', 'لا يمكن حذف الدور الأساسي');
        }

        if ($role->users()->exists()) {
            return back()->with('error', 'هناك موظفون يستخدمون هذا الدور');
        }

        $role->permissions()->detach();
        $role->delete();

        return back()->with('success', 'تم حذف الدور');
    }
}
