<?php

namespace App\Http\Controllers;

use App\Mail\SetupOtpMail;
use App\Models\Plan;
use App\Models\Template;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TapPaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SetupController extends Controller
{
    // ─── Step 1: Plan ──────────────────────────────────────────

    public function plan()
    {
        syncLangFiles('messages');
        return Inertia::render('public/setup/Plan', [
            'setup' => session('setup', []),
            'plans' => Plan::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    public function storePlan(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'plan_id' => 'required|exists:plans,id',
        ]);

        $plan = Plan::findOrFail($data['plan_id']);

        if ($plan->is_coming_soon) {
            return back()->withErrors(['plan_id' => 'هذه الباقة غير متوفرة بعد، اختر باقة أخرى.']);
        }

        $setup = session('setup', []);
        $setup['plan_id'] = $plan->id;
        $setup['plan_key'] = $plan->slug;
        $setup['plan_name'] = $plan->name_ar;
        session(['setup' => $setup]);

        return redirect()->route('setup.template');
    }

    // ─── Step 2: Template ──────────────────────────────────────

    public function template()
    {
        syncLangFiles('messages');
        return Inertia::render('public/setup/Template', [
            'setup' => session('setup', []),
            'dbTemplates' => Template::where('is_active', true)
                ->orderBy('sort_order')
                ->get([
                    'id', 'key', 'name_ar', 'name_en', 'city_ar', 'city_en',
                    'description_ar', 'description_en', 'preview_image',
                    'demo_url', 'is_coming_soon',
                ]),
        ]);
    }

    public function storeTemplate(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'template_id' => 'required|string|max:50',
            'template_title' => 'required|string|max:100',
        ]);

        $template = Template::where('key', $data['template_id'])
            ->when(ctype_digit((string) $data['template_id']), fn ($q) => $q->orWhere('id', (int) $data['template_id']))
            ->first();

        if ($template && $template->is_coming_soon) {
            return back()->withErrors(['template_id' => 'هذا القالب غير متوفر بعد، اختر قالبًا آخر.']);
        }

        $setup = session('setup', []);
        $setup['template_id'] = $data['template_id'];
        $setup['template_title'] = $data['template_title'];
        session(['setup' => $setup]);

        return redirect()->route('setup.org');
    }

    // ─── Step 3: Organization ──────────────────────────────────

    public function org()
    {
        syncLangFiles('messages');
        return Inertia::render('public/setup/Org', [
            'setup' => session('setup', []),
        ]);
    }

    public function storeOrg(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'org_name_ar' => 'required|string|max:255',
            'org_name_en' => 'required|string|max:255',
        ]);

        $slug = Str::slug($data['org_name_en']);

        // Check slug uniqueness
        if (Tenant::where('slug', $slug)->exists()) {
            return back()->withErrors(['org_name_en' => 'هذا الاسم مستخدم بالفعل. اختر اسمًا آخر.']);
        }

        $setup = session('setup', []);
        $setup['org_name_ar'] = $data['org_name_ar'];
        $setup['org_name_en'] = $data['org_name_en'];
        $setup['slug'] = $slug;
        $setup['site_url'] = "www.{$slug}.com";
        session(['setup' => $setup]);

        return redirect()->route('setup.account');
    }

    // ─── Step 4: Account ───────────────────────────────────────

    public function account()
    {
        syncLangFiles('messages');
        return Inertia::render('public/setup/Account', [
            'setup' => session('setup', []),
        ]);
    }

    public function storeAccount(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'username' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        $setup = session('setup', []);
        $setup['username'] = $data['username'];
        $setup['email'] = $data['email'];
        $setup['password'] = $data['password'];

        // Generate OTP
        $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $setup['otp_code'] = $otpCode;
        $setup['otp_expires_at'] = now()->addMinutes(10)->toISOString();

        session(['setup' => $setup]);

        // Send OTP email
        try {
            Mail::to($data['email'])->send(new SetupOtpMail(
                otpCode: $otpCode,
                userName: $data['username'],
            ));
        } catch (\Exception $e) {
            // Log error but don't block — in dev, OTP is in session
            \Log::warning('OTP email failed: ' . $e->getMessage());
        }

        return redirect()->route('setup.verifyOtp');
    }

    // ─── Step 5: Verify OTP ────────────────────────────────────

    public function verifyOtp()
    {
        syncLangFiles('messages');
        $setup = session('setup', []);

        if (empty($setup['email'])) {
            return redirect()->route('setup.account');
        }

        return Inertia::render('public/setup/VerifyOtp', [
            'email' => $setup['email'] ?? '',
            'debugOtp' => config('app.debug') ? ($setup['otp_code'] ?? null) : null,
        ]);
    }

    public function checkOtp(Request $request): RedirectResponse
    {
        $request->validate([
            'otp' => 'required|string|size:6',
        ]);

        $setup = session('setup', []);

        if (empty($setup['otp_code'])) {
            return back()->withErrors(['otp' => 'لم يتم إرسال رمز التحقق. أعد المحاولة.']);
        }

        // Check expiry
        if (now()->isAfter($setup['otp_expires_at'])) {
            return back()->withErrors(['otp' => 'انتهت صلاحية رمز التحقق. أعد الإرسال.']);
        }

        // Check code
        if ($request->otp !== $setup['otp_code']) {
            return back()->withErrors(['otp' => 'رمز التحقق غير صحيح.']);
        }

        $setup['otp_verified'] = true;
        session(['setup' => $setup]);

        return redirect()->route('setup.review');
    }

    public function resendOtp(): RedirectResponse
    {
        $setup = session('setup', []);

        if (empty($setup['email'])) {
            return redirect()->route('setup.account');
        }

        $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $setup['otp_code'] = $otpCode;
        $setup['otp_expires_at'] = now()->addMinutes(10)->toISOString();
        session(['setup' => $setup]);

        try {
            Mail::to($setup['email'])->send(new SetupOtpMail(
                otpCode: $otpCode,
                userName: $setup['username'] ?? '',
            ));
        } catch (\Exception $e) {
            \Log::warning('OTP resend failed: ' . $e->getMessage());
        }

        return back()->with('success', 'تم إعادة إرسال رمز التحقق.');
    }

    // ─── Step 6: Review ────────────────────────────────────────

    public function review()
    {
        syncLangFiles('messages');
        $setup = session('setup', []);

        if (empty($setup['otp_verified'])) {
            return redirect()->route('setup.verifyOtp');
        }

        return Inertia::render('public/setup/Review', [
            'setup' => $setup,
        ]);
    }

    // ─── Step 7: Payment Method ──────────────────────────────────

    public function paymentMethod()
    {
        syncLangFiles('messages');
        $setup = session('setup', []);

        if (empty($setup['otp_verified'])) {
            return redirect()->route('setup.verifyOtp');
        }

        $plan = Plan::find($setup['plan_id'] ?? null);

        return Inertia::render('public/setup/PaymentMethod', [
            'setup' => $setup,
            'planPrice' => $plan ? (float) $plan->price : 0,
            'tapPublicKey' => config('tap.public_key'),
            'bankDetails' => [
                'bank_name_ar' => 'البنك الأهلي السعودي',
                'bank_name_en' => 'Saudi National Bank (SNB)',
                'account_name' => 'Diyafah Platform',
                'iban' => 'SA0000000000000000000000',
                'account_number' => '0000000000',
                'swift' => 'NCBKSAJE',
            ],
        ]);
    }

    /**
     * Store payment via bank transfer (manual).
     */
    public function storePayment(Request $request): RedirectResponse
    {
        $request->validate([
            'receipt' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'payment_notes' => 'nullable|string|max:500',
        ]);

        $setup = session('setup', []);

        if (empty($setup['otp_verified']) || empty($setup['email'])) {
            return redirect()->route('setup.account');
        }

        $receiptPath = $request->file('receipt')->store('bank-receipts', 'public');

        $tenant = $this->createTenantFromSetup($setup, [
            'payment_status' => 'pending',
            'payment_method' => 'bank_transfer',
            'bank_transfer_receipt' => $receiptPath,
            'payment_notes' => $request->payment_notes,
        ]);

        $this->createTenantDefaults($tenant, $setup);

        session()->forget('setup');

        return redirect()->route('setup.pending');
    }

    /**
     * Initiate a Tap payment charge.
     */
    public function initiateTapPayment(Request $request)
    {
        $setup = session('setup', []);

        if (empty($setup['otp_verified']) || empty($setup['email'])) {
            return redirect()->route('setup.account');
        }

        $plan = Plan::find($setup['plan_id'] ?? null);
        if (!$plan) {
            return back()->withErrors(['payment' => 'الباقة غير موجودة']);
        }

        $tap = new TapPaymentService();

        $result = $tap->createCharge([
            'amount' => (float) $plan->price,
            'description' => "Diyafah - {$plan->name_en} Plan Subscription",
            'customer_name' => $setup['username'] ?? '',
            'customer_email' => $setup['email'],
            'reference' => 'setup_' . Str::random(10),
            'order_id' => 'setup_ord_' . Str::random(10),
            'metadata' => [
                'type' => 'setup',
                'plan_id' => $plan->id,
                'email' => $setup['email'],
            ],
            'redirect_url' => route('setup.tap.callback'),
            'webhook_url' => route('setup.tap.webhook'),
        ]);

        if (!$result['success']) {
            return back()->withErrors(['payment' => 'فشل في بدء عملية الدفع. حاول مرة أخرى.']);
        }

        // Store charge ID in session for verification
        $setup['tap_charge_id'] = $result['charge_id'];
        session(['setup' => $setup]);

        return Inertia::location($result['redirect_url']);
    }

    /**
     * Handle Tap redirect callback after payment.
     */
    public function tapCallback(Request $request)
    {
        $tapId = $request->query('tap_id');
        $setup = session('setup', []);

        if (!$tapId || empty($setup['otp_verified'])) {
            return redirect()->route('setup.paymentMethod')
                ->withErrors(['payment' => 'عملية الدفع غير صالحة']);
        }

        $tap = new TapPaymentService();
        $charge = $tap->retrieveCharge($tapId);

        if (!$charge['success'] || $charge['status'] !== 'CAPTURED') {
            return redirect()->route('setup.paymentMethod')
                ->withErrors(['payment' => 'لم يتم إكمال الدفع. حاول مرة أخرى.']);
        }

        // Payment successful — create tenant as auto-approved
        $tenant = $this->createTenantFromSetup($setup, [
            'payment_status' => 'approved',
            'payment_method' => 'tap',
            'tap_charge_id' => $charge['charge_id'],
            'tap_transaction_id' => $charge['transaction_id'],
            'is_active' => true,
            'subscription_starts_at' => now(),
            'subscription_ends_at' => now()->addYear(),
        ]);

        $this->createTenantDefaults($tenant, $setup);

        // Send approval email
        $admin = User::where('tenant_id', $tenant->id)->where('role', 'client_admin')->first();
        if ($admin) {
            try {
                Mail::to($admin->email)->send(
                    new \App\Mail\PaymentApprovedMail($tenant, $admin)
                );
            } catch (\Exception $e) {
                Log::warning('Tap approval email failed: ' . $e->getMessage());
            }
        }

        session()->forget('setup');

        return redirect()->route('setup.complete');
    }

    /**
     * Handle Tap webhook (server-to-server confirmation).
     */
    public function tapWebhook(Request $request)
    {
        $chargeId = $request->input('id');
        $status = $request->input('status');

        Log::info('Tap webhook received', ['charge_id' => $chargeId, 'status' => $status]);

        if ($status === 'CAPTURED' && $chargeId) {
            // Find tenant by tap_charge_id and activate if still pending
            $tenant = Tenant::where('tap_charge_id', $chargeId)
                ->where('payment_status', 'pending')
                ->first();

            if ($tenant) {
                $tenant->update([
                    'payment_status' => 'approved',
                    'is_active' => true,
                    'subscription_starts_at' => now(),
                    'subscription_ends_at' => now()->addYear(),
                ]);
            }
        }

        return response()->json(['status' => 'ok']);
    }

    // ─── Setup Complete (after Tap payment) ────────────────────

    public function complete()
    {
        syncLangFiles('messages');
        return Inertia::render('public/setup/Complete');
    }

    // ─── Pending Approval Page (bank transfer) ─────────────────

    public function pending()
    {
        syncLangFiles('messages');
        return Inertia::render('public/setup/Pending');
    }

    // ─── Helper: Create Tenant ─────────────────────────────────

    private function createTenantFromSetup(array $setup, array $paymentFields): Tenant
    {
        $tenant = Tenant::create(array_merge([
            'name' => $setup['org_name_en'] ?? $setup['org_name_ar'],
            'slug' => $setup['slug'],
            'subdomain' => $setup['slug'],
            'template' => $this->resolveTemplateSlug($setup['template_id'] ?? 'madina'),
            'email' => $setup['email'],
            'plan_id' => $setup['plan_id'] ?? null,
            'plan' => $setup['plan_key'] ?? 'basic',
            'is_active' => false,
            'org_name_ar' => $setup['org_name_ar'] ?? null,
            'org_name_en' => $setup['org_name_en'] ?? null,
            'subscription_starts_at' => null,
            'subscription_ends_at' => null,
        ], $paymentFields));

        return $tenant;
    }

    private function createTenantDefaults(Tenant $tenant, array $setup): void
    {
        // Create default site sections
        $sections = ['hero', 'rooms', 'services', 'gallery', 'testimonials', 'partners', 'contact'];
        foreach ($sections as $i => $section) {
            $tenant->siteSections()->create([
                'section_name' => $section,
                'is_active' => true,
                'sort_order' => $i,
            ]);
        }

        // Create default hotel settings
        $tenant->hotelSettings()->create([
            'hotel_name_ar' => $setup['org_name_ar'] ?? '',
            'hotel_name_en' => $setup['org_name_en'] ?? '',
            'description_ar' => '',
            'description_en' => '',
            'star_rating' => 5,
            'currency' => 'SAR',
            'timezone' => 'Asia/Riyadh',
        ]);

        // Create default contact settings
        $tenant->contactSettings()->create([
            'email' => $setup['email'],
        ]);

        // Create user
        $user = User::create([
            'name' => $setup['username'],
            'email' => $setup['email'],
            'password' => Hash::make($setup['password']),
            'role' => 'client_admin',
            'tenant_id' => $tenant->id,
            'otp_verified' => true,
        ]);

        $user->markEmailAsVerified();
    }

    private function resolveTemplateSlug(string $value): string
    {
        // If already a valid slug, return as-is
        $validSlugs = ['madina', 'riyadh'];
        if (in_array($value, $validSlugs)) {
            return $value;
        }

        // Map numeric IDs to slugs (from constants.ts)
        $idMap = [
            '1' => 'madina',
            '2' => 'riyadh',
        ];

        return $idMap[$value] ?? 'madina';
    }
}
