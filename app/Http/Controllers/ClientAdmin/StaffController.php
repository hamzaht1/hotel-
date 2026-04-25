<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class StaffController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = app('current_tenant_id');

        $staff = User::query()
            ->where('tenant_id', $tenantId)
            ->where('id', '!=', $request->user()->id)
            ->with('roleModel:id,name_ar,name_en,key')
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"))
            ->when($request->role_id, fn ($q, $id) => $q->where('role_id', $id))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $roles = $this->getAvailableRoles($tenantId);

        return Inertia::render('client-admin/staff/index', [
            'staff' => $staff,
            'roles' => $roles,
            'filters' => $request->only(['search', 'role_id']),
        ]);
    }

    public function create()
    {
        $roles = $this->getAvailableRoles(app('current_tenant_id'));

        return Inertia::render('client-admin/staff/create', [
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = app('current_tenant_id');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:30',
            'password' => 'required|string|min:8',
            'role_id' => 'required|exists:roles,id',
            'photo' => 'nullable|file|image|max:2048',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('staff-photos', 'public');
        }

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'photo' => $photoPath,
            'password' => Hash::make($validated['password']),
            'tenant_id' => $tenantId,
            'role' => 'staff',
            'role_id' => $validated['role_id'],
        ]);

        return redirect()->route('client-admin.staff.index')
            ->with('success', 'تم إضافة الموظف بنجاح');
    }

    public function edit(User $user)
    {
        $tenantId = app('current_tenant_id');

        if ($user->tenant_id !== $tenantId) {
            abort(403);
        }

        $roles = $this->getAvailableRoles($tenantId);

        return Inertia::render('client-admin/staff/edit', [
            'staffMember' => $user->load('roleModel:id,name_ar,name_en,key'),
            'roles' => $roles,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $tenantId = app('current_tenant_id');

        if ($user->tenant_id !== $tenantId) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user)],
            'phone' => 'nullable|string|max:30',
            'role_id' => 'required|exists:roles,id',
            'photo' => 'nullable|file|image|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            if ($user->photo) {
                Storage::disk('public')->delete($user->photo);
            }
            $validated['photo'] = $request->file('photo')->store('staff-photos', 'public');
        } else {
            unset($validated['photo']);
        }

        $user->update($validated);

        return redirect()->route('client-admin.staff.index')
            ->with('success', 'تم تحديث بيانات الموظف بنجاح');
    }

    public function resetPassword(Request $request, User $user)
    {
        $tenantId = app('current_tenant_id');

        if ($user->tenant_id !== $tenantId) {
            abort(403);
        }

        if ($user->id === $request->user()->id) {
            return back()->with('error', 'لا يمكنك إعادة تعيين كلمة مرورك هنا');
        }

        $validated = $request->validate([
            'password' => 'nullable|string|min:8',
        ]);

        $newPassword = $validated['password'] ?? Str::random(10);
        $user->update(['password' => Hash::make($newPassword)]);

        // Surface the generated password in the flash so the admin can share it.
        return back()->with([
            'success' => 'تم إعادة تعيين كلمة المرور',
            'new_password' => $newPassword,
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        $tenantId = app('current_tenant_id');

        if ($user->tenant_id !== $tenantId) {
            abort(403);
        }

        if ($user->id === $request->user()->id) {
            return back()->with('error', 'لا يمكنك حذف حسابك الخاص');
        }

        $user->delete();

        return redirect()->route('client-admin.staff.index')
            ->with('success', 'تم حذف الموظف بنجاح');
    }

    private function getAvailableRoles(int $tenantId): \Illuminate\Support\Collection
    {
        return Role::where(function ($q) use ($tenantId) {
            $q->whereNull('tenant_id')
              ->orWhere('tenant_id', $tenantId);
        })
        ->where('key', '!=', 'super_admin')
        ->orderBy('is_system', 'desc')
        ->orderBy('name_ar')
        ->get(['id', 'name_ar', 'name_en', 'key', 'is_system']);
    }
}
