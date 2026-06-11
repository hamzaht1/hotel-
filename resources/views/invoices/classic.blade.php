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
    // 'DejaVu Serif' has no Arabic coverage; fall back to Sans for AR.
    $bodyFont = $rtl ? 'DejaVu Sans' : 'DejaVu Serif';
@endphp
<!DOCTYPE html>
<html dir="{{ $dir }}" lang="{{ $lang }}">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: '{{ $bodyFont }}', serif; font-size: 12px; color: #1a1a1a; direction: {{ $dir }}; padding: 50px; }
    .header { text-align: center; border-bottom: 2px double #333; padding-bottom: 20px; margin-bottom: 30px; }
    .brand { font-size: 26px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
    .brand-sub { font-size: 11px; color: #555; margin-top: 6px; font-style: italic; }
    .invoice-bar { text-align: center; margin-bottom: 25px; font-size: 18px; font-weight: 700; letter-spacing: 4px; }
    .meta-table { width: 100%; margin-bottom: 25px; border: 1px solid #333; }
    .meta-table td { padding: 8px 12px; font-size: 12px; border-bottom: 1px solid #ddd; }
    .meta-table .label { font-weight: 700; width: 160px; background: #f5f5f5; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #333; }
    .items-table th { background: #333; color: #fff; padding: 10px; text-align: {{ $rtl ? 'right' : 'left' }}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .items-table td { padding: 10px; border-bottom: 1px solid #ddd; font-size: 12px; }
    .totals { width: 320px; {{ $rtl ? 'margin-right: auto; margin-left: 0;' : 'margin-left: auto; margin-right: 0;' }} border: 1px solid #333; }
    .totals td { padding: 8px 12px; font-size: 12px; border-bottom: 1px solid #ddd; }
    .totals .label { font-weight: 700; text-align: {{ $rtl ? 'right' : 'left' }}; background: #f5f5f5; }
    .totals .grand-total { font-size: 16px; font-weight: 700; background: #333; color: #fff; }
    .notes { margin-top: 20px; padding: 14px; border: 1px dashed #333; font-size: 11px; font-style: italic; }
    .footer { margin-top: 50px; text-align: center; font-size: 11px; font-style: italic; border-top: 1px solid #333; padding-top: 16px; }
</style>
</head>
<body>
    <div class="header">
        <div class="brand">{{ $invoice->company_header ?? ($rtl ? 'ضيافة' : 'Diyafah') }}</div>
        <div class="brand-sub">{{ $invoice->tenant?->name ?? $invoice->external_client_name ?? '' }}</div>
    </div>

    <div class="invoice-bar">{{ $L('INVOICE', 'فاتورة') }} · {{ $invoice->invoice_number }}</div>

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
        <tr><td class="label">{{ $L('Status:', 'الحالة:') }}</td><td>{{ $statusLabel[$invoice->status] ?? $invoice->status }}</td></tr>
    </table>

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
        <tr><td class="label">{{ $L('Subtotal:', 'المجموع الفرعي:') }}</td><td style="text-align: {{ $rtl ? 'left' : 'right' }};">{{ number_format($invoice->amount, 2) }} {{ $currency }}</td></tr>
        @if($invoice->discount > 0)
        <tr><td class="label">{{ $L('Discount:', 'الخصم:') }}</td><td style="text-align: {{ $rtl ? 'left' : 'right' }};">-{{ number_format($invoice->discount, 2) }} {{ $currency }}</td></tr>
        @endif
        <tr><td class="label">{{ $L('VAT', 'ض. القيمة المضافة') }} ({{ $invoice->tax_rate }}%):</td><td style="text-align: {{ $rtl ? 'left' : 'right' }};">{{ number_format($invoice->tax_amount, 2) }} {{ $currency }}</td></tr>
        <tr class="grand-total"><td class="label">{{ $L('Grand total:', 'الإجمالي الكلي:') }}</td><td style="text-align: {{ $rtl ? 'left' : 'right' }};">{{ number_format($invoice->total, 2) }} {{ $currency }}</td></tr>
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
        <div style="font-size: 9px; color: #777; margin-top: 4px;">{{ $L('Scan to verify (ZATCA)', 'امسح للتحقق (هيئة الزكاة والضريبة)') }}</div>
    </div>
    @endif

    <div class="footer">
        {{ $invoice->company_header ?? ($rtl ? 'ضيافة' : 'Diyafah') }} · {{ $L('Thank you for your business', 'شكراً لتعاملكم معنا') }}
    </div>
</body>
</html>
