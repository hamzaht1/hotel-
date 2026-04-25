<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:30',
            'role_id' => 'nullable|exists:roles,id',
            'password' => 'required|string|min:8|confirmed',
            'photo' => 'nullable|file|image|max:2048',
            'send_password_by_email' => 'boolean',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('staff-photos', 'public');
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'photo' => $photoPath,
            'password' => Hash::make($validated['password']),
            'role' => 'staff',
            'role_id' => $validated['role_id'] ?? null,
            'tenant_id' => null,
            'is_active' => true,
        ]);

        if ($validated['send_password_by_email'] ?? false) {
            try {
                \Illuminate\Support\Facades\Mail::raw(
                    "Welcome {$user->name}. Your temporary password is: {$validated['password']}",
                    fn ($m) => $m->to($user->email)->subject('Your Diyafah account')
                );
            } catch (\Throwable $e) {
                // Email failure is non-fatal — admin can reset later.
            }
        }

        return back()->with('success', 'تم إضافة الموظف');
    }

    public function update(Request $request, User $user)
    {
        if ($user->role === 'super_admin' && $request->user()->id !== $user->id) {
            abort(403, 'Cannot modify another super admin');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user)],
            'phone' => 'nullable|string|max:30',
            'role_id' => 'nullable|exists:roles,id',
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

        return back()->with('success', 'تم تحديث الموظف');
    }

    public function toggle(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'لا يمكنك تعطيل حسابك');
        }

        $user->update(['is_active' => !$user->is_active]);

        return back()->with('success', $user->is_active ? 'تم تفعيل الموظف' : 'تم تعطيل الموظف');
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'لا يمكنك حذف حسابك');
        }

        if ($user->role === 'super_admin') {
            return back()->with('error', 'لا يمكن حذف المشرف العام');
        }

        if ($user->photo) {
            Storage::disk('public')->delete($user->photo);
        }
        $user->delete();

        return back()->with('success', 'تم حذف الموظف');
    }

    public function resetPassword(Request $request, User $user)
    {
        $validated = $request->validate([
            'password' => 'nullable|string|min:8',
            'send_by_email' => 'boolean',
        ]);

        $newPassword = $validated['password'] ?? Str::random(10);
        $user->update(['password' => Hash::make($newPassword)]);

        if ($validated['send_by_email'] ?? false) {
            try {
                \Illuminate\Support\Facades\Mail::raw(
                    "Hello {$user->name}, your new password is: {$newPassword}",
                    fn ($m) => $m->to($user->email)->subject('Password reset — Diyafah')
                );
            } catch (\Throwable $e) {
                // swallow
            }
        }

        return back()->with([
            'success' => 'تم إعادة تعيين كلمة المرور',
            'new_password' => $newPassword,
        ]);
    }

    public function export(Request $request)
    {
        $users = User::query()
            ->whereIn('role', ['super_admin', 'staff'])
            ->with('roleModel:id,name_ar,name_en,key')
            ->get();

        $headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Created'];

        return response()->streamDownload(function () use ($users, $headers) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($out, $headers);
            foreach ($users as $u) {
                fputcsv($out, [
                    $u->id,
                    $u->name,
                    $u->email,
                    $u->phone,
                    $u->roleModel?->name_en ?? $u->role,
                    $u->is_active ? 'active' : 'inactive',
                    $u->created_at->toDateTimeString(),
                ]);
            }
            fclose($out);
        }, 'staff.csv');
    }
}
