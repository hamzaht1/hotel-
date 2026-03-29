<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; direction: rtl; padding: 20px; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px;">
        <h1 style="color: #01004C; font-size: 22px; margin-bottom: 20px;">فاتورة جديدة من ضيافة</h1>

        <p>مرحباً {{ $admin->name }}،</p>

        <p>تم إصدار فاتورة جديدة لمنشأتك:</p>

        <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">رقم الفاتورة:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">{{ $invoice->invoice_number }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">المبلغ الإجمالي:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">{{ number_format($invoice->total, 2) }} SAR</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">تاريخ الاستحقاق:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">{{ $invoice->due_date->format('Y/m/d') }}</td>
            </tr>
        </table>

        <p>يرجى تسديد المبلغ قبل تاريخ الاستحقاق لتجنب أي تأخير في الخدمة.</p>

        <p style="margin-top: 30px; color: #666; font-size: 12px;">
            منصة ضيافة — Diyafah Platform
        </p>
    </div>
</body>
</html>
