<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تنبيه انتهاء الاشتراك</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="500" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#01004C,#5A5ECD);padding:32px;text-align:center;">
                            <h1 style="color:#fff;font-size:28px;margin:0;">ضيافة</h1>
                            <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Diyafah</p>
                        </td>
                    </tr>
                    <!-- Urgency Banner -->
                    <tr>
                        <td style="padding:0;">
                            @if($daysRemaining <= 1)
                                <div style="background:#dc2626;color:#fff;padding:12px;text-align:center;font-weight:bold;font-size:16px;">
                                    ⚠️ تنبيه عاجل — اشتراكك ينتهي غداً!
                                </div>
                            @elseif($daysRemaining <= 7)
                                <div style="background:#f59e0b;color:#fff;padding:12px;text-align:center;font-weight:bold;font-size:16px;">
                                    ⏰ اشتراكك ينتهي خلال {{ $daysRemaining }} أيام
                                </div>
                            @else
                                <div style="background:#3b82f6;color:#fff;padding:12px;text-align:center;font-weight:bold;font-size:16px;">
                                    📋 تذكير: اشتراكك ينتهي خلال {{ $daysRemaining }} يوم
                                </div>
                            @endif
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:32px;">
                            <p style="font-size:16px;color:#333;margin:0 0 8px;">
                                مرحباً <strong>{{ $admin->name }}</strong>،
                            </p>
                            <p style="font-size:14px;color:#666;margin:0 0 24px;">
                                نود تذكيرك بأن اشتراك منشأتك سينتهي قريباً. يرجى تجديد الاشتراك لضمان استمرار الخدمة.
                            </p>

                            <!-- Details Card -->
                            <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:0 0 24px;border:1px solid #e5e7eb;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding:8px 0;font-size:14px;color:#666;">اسم المنشأة:</td>
                                        <td style="padding:8px 0;font-size:14px;color:#333;font-weight:bold;text-align:left;">{{ $tenant->name }}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:8px 0;font-size:14px;color:#666;border-top:1px solid #e5e7eb;">تاريخ الانتهاء:</td>
                                        <td style="padding:8px 0;font-size:14px;color:#333;font-weight:bold;text-align:left;border-top:1px solid #e5e7eb;">
                                            {{ $tenant->subscription_ends_at->format('Y-m-d') }}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:8px 0;font-size:14px;color:#666;border-top:1px solid #e5e7eb;">الأيام المتبقية:</td>
                                        <td style="padding:8px 0;font-size:14px;font-weight:bold;text-align:left;border-top:1px solid #e5e7eb;
                                            @if($daysRemaining <= 1) color:#dc2626;
                                            @elseif($daysRemaining <= 7) color:#f59e0b;
                                            @else color:#22c55e;
                                            @endif
                                        ">
                                            {{ $daysRemaining }} يوم
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align:center;margin:24px 0;">
                                <a href="{{ url('/client-admin/renewal') }}"
                                   style="display:inline-block;background:linear-gradient(135deg,#01004C,#5A5ECD);color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;">
                                    تجديد الاشتراك الآن
                                </a>
                            </div>

                            <p style="font-size:13px;color:#999;text-align:center;margin:24px 0 0;">
                                إذا كنت قد جددت اشتراكك بالفعل، يرجى تجاهل هذا البريد.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
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
