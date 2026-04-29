<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="500" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                    <tr>
                        <td style="background:linear-gradient(135deg,#01004C,#5A5ECD);padding:32px;text-align:center;">
                            <h1 style="color:#fff;font-size:28px;margin:0;">🎉 مبروك!</h1>
                            <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">تم تفعيل حسابك في ضيافة</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <p style="font-size:16px;color:#333;margin:0 0 8px;">
                                مرحباً <strong>{{ $admin->name }}</strong>،
                            </p>
                            <p style="font-size:14px;color:#666;margin:0 0 16px;">
                                يسعدنا إبلاغك بأنه تم تفعيل حسابك في منصة ضيافة.
                                يمكنك الآن البدء في إدارة منشأتك.
                            </p>

                            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:16px 0;">
                                <p style="margin:0 0 8px;font-size:14px;color:#333;">
                                    <strong>المنشأة:</strong> {{ $tenant->name }}
                                </p>
                                <p style="margin:0 0 8px;font-size:14px;color:#333;">
                                    <strong>الخطة:</strong> {{ $tenant->plan }}
                                </p>
                                <p style="margin:0;font-size:14px;color:#333;">
                                    <strong>صالح حتى:</strong> {{ $tenant->subscription_ends_at?->format('Y/m/d') }}
                                </p>
                            </div>

                            <div style="text-align:center;margin:24px 0;">
                                <a href="{{ url('/login') }}"
                                   style="display:inline-block;background:linear-gradient(135deg,#01004C,#5A5ECD);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:bold;">
                                    تسجيل الدخول الآن
                                </a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #eee;">
                            <p style="font-size:12px;color:#aaa;margin:0;">
                                &copy; {{ date('Y') }} Diyafah — نظام إدارة الفنادق
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
