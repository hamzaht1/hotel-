import InputError from '@/components/input-error';
import { Head, Form, Link } from '@inertiajs/react';
import { LoaderCircle, LogIn, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { usePage } from '@inertiajs/react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

const t: Record<string, Record<string, string>> = {
    title:          { ar: 'تسجيل الدخول', en: 'Log in' },
    subtitle:       { ar: 'أدخل بريدك الإلكتروني وكلمة المرور', en: 'Enter your email and password' },
    email:          { ar: 'البريد الإلكتروني', en: 'Email address' },
    password:       { ar: 'كلمة المرور', en: 'Password' },
    remember:       { ar: 'تذكرني', en: 'Remember me' },
    forgot:         { ar: 'نسيت كلمة المرور؟', en: 'Forgot password?' },
    login:          { ar: 'تسجيل الدخول', en: 'Log in' },
    no_account:     { ar: 'ليس لديك حساب؟', en: "Don't have an account?" },
    sign_up:        { ar: 'إنشاء حساب', en: 'Sign up' },
    back_home:      { ar: 'العودة للرئيسية', en: 'Back to home' },
    welcome:        { ar: 'مرحباً بعودتك', en: 'Welcome back' },
    welcome_desc:   { ar: 'لوحة تحكم الإدارة العليا', en: 'Super Admin Control Panel' },
};

function tr(key: string, locale: string) {
    return t[key]?.[locale] || t[key]?.['en'] || key;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { locale = 'ar', dir = 'rtl' } = usePage<{ locale: string; dir: string }>().props;
    const [showPassword, setShowPassword] = useState(false);
    const l = (key: string) => tr(key, locale);

    return (
        <>
            <Head title={l('title')} />

            <div className="flex min-h-screen" dir={dir}>
                {/* Left side - branding panel */}
                <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden"
                     style={{ background: 'linear-gradient(135deg, var(--public-primary, #01004C) 0%, var(--public-active, #5A5ECD) 50%, var(--public-secondary, #8689E3) 100%)' }}>
                    {/* Decorative circles */}
                    <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10" style={{ background: 'var(--public-secondary, #8689E3)' }} />
                    <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-10" style={{ background: 'var(--public-button, #027F84)' }} />
                    <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-5" style={{ background: '#fff' }} />

                    <div className="relative z-10 text-center px-12">
                        <Link href="/">
                            <img src="/logo.png" alt="Diyafah" className="h-28 w-28 mx-auto mb-8 drop-shadow-2xl" />
                        </Link>
                        <h2 className="text-3xl font-bold text-white mb-4">{l('welcome')}</h2>
                        <p className="text-white/80 text-lg max-w-md">{l('welcome_desc')}</p>

                        <div className="mt-12 flex items-center justify-center gap-3">
                            <div className="h-1 w-8 rounded-full bg-white/40" />
                            <div className="h-1 w-12 rounded-full bg-white" />
                            <div className="h-1 w-8 rounded-full bg-white/40" />
                        </div>
                    </div>
                </div>

                {/* Right side - login form */}
                <div className="flex w-full lg:w-1/2 items-center justify-center bg-background p-6 sm:p-12">
                    <div className="w-full max-w-md">
                        {/* Mobile logo */}
                        <div className="flex flex-col items-center mb-8 lg:hidden">
                            <Link href="/">
                                <img src="/logo.png" alt="Diyafah" className="h-20 w-20 mb-4" />
                            </Link>
                        </div>

                        {/* Title */}
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-foreground">{l('title')}</h1>
                            <p className="mt-2 text-sm text-muted-foreground">{l('subtitle')}</p>
                        </div>

                        {/* Status message */}
                        {status && (
                            <div className="mb-4 rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
                                {status}
                            </div>
                        )}

                        {/* Login form */}
                        <Form method="post" action={route('login')} resetOnSuccess={['password']} className="flex flex-col gap-5">
                            {({ processing, errors }) => (
                                <>
                                    {/* Email field */}
                                    <div>
                                        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                                            {l('email')}
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            placeholder="email@example.com"
                                            className="vuexy-input"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    {/* Password field */}
                                    <div>
                                        <div className="mb-1.5 flex items-center justify-between">
                                            <label htmlFor="password" className="text-sm font-medium text-foreground">
                                                {l('password')}
                                            </label>
                                            {canResetPassword && (
                                                <Link
                                                    href={route('password.request')}
                                                    className="text-xs font-semibold underline underline-offset-2 transition-colors hover:opacity-80"
                                                    style={{ color: 'var(--public-active, #5A5ECD)' }}
                                                    tabIndex={5}
                                                >
                                                    {l('forgot')}
                                                </Link>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="••••••••"
                                                className="vuexy-input"
                                                style={{ paddingInlineEnd: '2.5rem' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>

                                    {/* Remember me */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="remember"
                                            name="remember"
                                            type="checkbox"
                                            tabIndex={3}
                                            className="h-4 w-4 rounded border-gray-300 accent-[var(--public-active,#5A5ECD)]"
                                        />
                                        <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                                            {l('remember')}
                                        </label>
                                    </div>

                                    {/* Submit button */}
                                    <button
                                        type="submit"
                                        tabIndex={4}
                                        disabled={processing}
                                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                                        style={{ background: 'linear-gradient(135deg, var(--public-primary, #01004C), var(--public-active, #5A5ECD))' }}
                                    >
                                        {processing ? (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <LogIn className="h-4 w-4" />
                                        )}
                                        {l('login')}
                                    </button>

                                </>
                            )}
                        </Form>

                        {/* Back to home */}
                        <div className="mt-6 text-center">
                            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                ← {l('back_home')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
