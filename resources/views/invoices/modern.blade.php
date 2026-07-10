@php
    $rtl = ($invoice->pdf_locale ?? 'en') === 'ar';
    $dir = $rtl ? 'rtl' : 'ltr';
    $lang = $rtl ? 'ar' : 'en';
    $L = fn (string $en, string $ar) => $rtl ? $ar : $en;
    $itemDesc = fn ($item) => $rtl
        ? ($item->description_ar ?: $item->description_en)
        : ($item->description_en ?: $item->description_ar);
    $statusLabel = $rtl ? [
        'draft' => 'مسودة', 'sent' => 'مرسلة', 'paid' => 'مدفوعة', 'overdue' => 'متأخرة', 'cancelled' => 'ملغاة',
    ] : [
        'draft' => 'DRAFT', 'sent' => 'SENT', 'paid' => 'PAID', 'overdue' => 'OVERDUE', 'cancelled' => 'CANCELLED',
    ];
    $currency = $rtl ? 'ر.س' : 'SAR';
@endphp
<!DOCTYPE html>
<html dir="{{ $dir }}" lang="{{ $lang }}">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DejaVu Sans', sans-serif; font-size: 12px; color: #1f2937; direction: {{ $dir }}; padding: 40px; background: #fff; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .brand { font-size: 28px; font-weight: 700; }
    .brand-sub { font-size: 12px; opacity: 0.85; margin-top: 6px; }
    .invoice-title { font-size: 36px; font-weight: 700; letter-spacing: -1px; text-align: {{ $rtl ? 'left' : 'right' }}; }
    .invoice-number { font-size: 13px; opacity: 0.85; text-align: {{ $rtl ? 'left' : 'right' }}; margin-top: 4px; }
    .meta-card { background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 25px; }
    .meta-table { width: 100%; }
    .meta-table td { padding: 5px 8px; font-size: 12px; }
    .meta-table .label { font-weight: 600; color: #6b7280; width: 140px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th { background: #f3f4f6; color: #374151; padding: 12px; text-align: {{ $rtl ? 'right' : 'left' }}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .items-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
    .totals { width: 320px; {{ $rtl ? 'margin-right: auto; margin-left: 0;' : 'margin-left: auto; margin-right: 0;' }} background: #f9fafb; border-radius: 12px; padding: 16px; }
    .totals td { padding: 6px 10px; font-size: 12px; }
    .totals .label { font-weight: 600; text-align: {{ $rtl ? 'right' : 'left' }}; color: #6b7280; }
    .totals .value { text-align: {{ $rtl ? 'left' : 'right' }}; font-weight: 500; }
    .totals .grand-total { font-size: 18px; font-weight: 700; color: #6366f1; border-top: 2px solid #e5e7eb; padding-top: 10px; }
    .notes { margin-top: 20px; padding: 14px; background: #eff6ff; {{ $rtl ? 'border-right' : 'border-left' }}: 3px solid #6366f1; border-radius: 8px; font-size: 11px; color: #1e3a8a; }
    .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #9ca3af; }
    .status-badge { display: inline-block; padding: 4px 14px; border-radius: 999px; font-size: 10px; font-weight: 700; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-sent { background: #fef3c7; color: #92400e; }
    .status-draft { background: #e5e7eb; color: #374151; }
    .status-overdue { background: #fee2e2; color: #991b1b; }
</style>
</head>
<body>
    <div class="header">
        <table style="width: 100%;"><tr>
            <td>
                <div class="brand">{{ $invoice->company_header ?? ($rtl ? 'ضيافة' : 'Diyafah') }}</div>
                <div class="brand-sub">{{ $invoice->tenant?->name ?? $invoice->external_client_name ?? '' }}</div>
            </td>
            <td style="text-align: {{ $rtl ? 'left' : 'right' }};">
                <div class="invoice-title">{{ $L('INVOICE', 'فاتورة') }}</div>
                <div class="invoice-number">#{{ $invoice->invoice_number }}</div>
            </td>
        </tr></table>
    </div>

    <div class="meta-card">
        <table class="meta-table">
            <tr><td class="label">{{ $L('Customer:', 'العميل:') }}</td><td>{{ $invoice->tenant?->name ?? $invoice->external_client_name }}</td></tr>
            <tr><td class="label">{{ $L('Email:', 'البريد:') }}</td><td>{{ $invoice->tenant?->email ?? $invoice->external_client_email }}</td></tr>
            @if($invoice->tax_number)
            <tr><td class="label">{{ $L('Tax number:', 'الرقم الضريبي:') }}</td><td>{{ $invoice->tax_number }}</td></tr>
            @endif
            @if($invoice->billing_address)
            <tr><td class="label">{{ $L('Address:', 'العنوان:') }}</td><td>{{ $invoice->billing_address }}</td></tr>
            @endif
            <tr><td class="label">{{ $L('Issue date:', 'تاريخ الإصدار:') }}</td><td>{{ $invoice->issue_date?->format('Y-m-d') }}</td></tr>
            <tr><td class="label">{{ $L('Due date:', 'تاريخ الاستحقاق:') }}</td><td>{{ $invoice->due_date?->format('Y-m-d') }}</td></tr>
            <tr><td class="label">{{ $L('Status:', 'الحالة:') }}</td><td><span class="status-badge status-{{ $invoice->status }}">{{ $statusLabel[$invoice->status] ?? $invoice->status }}</span></td></tr>
        </table>
    </div>

    <table class="items-table">
        <thead><tr>
            <th>{{ $L('Description', 'الوصف') }}</th>
            <th style="text-align: center;">{{ $L('Qty', 'الكمية') }}</th>
            <th style="text-align: {{ $rtl ? 'left' : 'right' }};">{{ $L('Unit price', 'سعر الوحدة') }}</th>
            <th style="text-align: {{ $rtl ? 'left' : 'right' }};">{{ $L('Total', 'الإجمالي') }}</th>
        </tr></thead>
        <tbody>
        @foreach($invoice->items as $item)
            <tr>
                <td>{{ $itemDesc($item) }}</td>
                <td style="text-align: center;">{{ $item->quantity }}</td>
                <td style="text-align: {{ $rtl ? 'left' : 'right' }};">{{ number_format($item->unit_price, 2) }}</td>
                <td style="text-align: {{ $rtl ? 'left' : 'right' }};">{{ number_format($item->total, 2) }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr><td class="label">{{ $L('Subtotal:', 'المجموع الفرعي:') }}</td><td class="value">{{ number_format($invoice->amount, 2) }} {{ $currency }}</td></tr>
        @if($invoice->discount > 0)
        <tr><td class="label">{{ $L('Discount:', 'الخصم:') }}</td><td class="value">-{{ number_format($invoice->discount, 2) }} {{ $currency }}</td></tr>
        @endif
        @if((float) $invoice->tax_rate > 0)<tr><td class="label">{{ $L('VAT', 'ض. القيمة المضافة') }} ({{ $invoice->tax_rate }}%):</td><td class="value">{{ number_format($invoice->tax_amount, 2) }} {{ $currency }}</td></tr>@endif
        <tr class="grand-total"><td class="label">{{ $L('Grand total:', 'الإجمالي الكلي:') }}</td><td class="value">{{ number_format($invoice->total, 2) }} {{ $currency }}</td></tr>
    </table>

    @php
        $noteBody = $rtl
            ? ($invoice->notes_ar ?: $invoice->notes_en)
            : ($invoice->notes_en ?: $invoice->notes_ar);
    @endphp
    @if($noteBody || $invoice->footer_notes)
        <div class="notes">
            @if($noteBody)<div>{{ $noteBody }}</div>@endif
            @if($invoice->footer_notes)<div style="margin-top: 6px;">{{ $invoice->footer_notes }}</div>@endif
        </div>
    @endif

    @if(!empty($qr))
    <div style="text-align: center; margin-top: 18px;">
        <img src="{{ $qr }}" alt="ZATCA QR" style="width: 120px; height: 120px;" />
        <div style="font-size: 9px; color: #9ca3af; margin-top: 4px;">{{ $L('Scan to verify (ZATCA)', 'امسح للتحقق (هيئة الزكاة والضريبة)') }}</div>
    </div>
    @endif

    <div class="footer">
        {{ $invoice->company_header ?? ($rtl ? 'ضيافة' : 'Diyafah') }} · {{ $L('Thank you for your business', 'شكراً لتعاملكم معنا') }}
    </div>
</body>
</html>
