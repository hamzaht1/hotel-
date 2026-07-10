@php
    $rtl = ($invoice->pdf_locale ?? 'en') === 'ar';
    $dir = $rtl ? 'rtl' : 'ltr';
    $lang = $rtl ? 'ar' : 'en';
    $L = fn (string $en, string $ar) => $rtl ? $ar : $en;
    $itemDesc = fn ($item) => $rtl
        ? ($item->description_ar ?: $item->description_en)
        : ($item->description_en ?: $item->description_ar);
    $statusLabel = $rtl ? [
        'draft' => 'مسودة',
        'sent' => 'مرسلة',
        'paid' => 'مدفوعة',
        'overdue' => 'متأخرة',
        'cancelled' => 'ملغاة',
    ] : [
        'draft' => 'DRAFT',
        'sent' => 'SENT',
        'paid' => 'PAID',
        'overdue' => 'OVERDUE',
        'cancelled' => 'CANCELLED',
    ];
    $typeLabel = $rtl ? [
        'subscription' => 'اشتراك',
        'setup' => 'إعداد',
        'addon' => 'إضافي',
    ] : [
        'subscription' => 'Subscription',
        'setup' => 'Setup',
        'addon' => 'Add-on',
    ];
    $currency = $rtl ? 'ر.س' : 'SAR';

    $s = $settings ?? null;
    $companyName = $s ? ($rtl ? ($s->company_name_ar ?: $s->company_name_en) : ($s->company_name_en ?: $s->company_name_ar)) : null;
    $companyAddress = $s ? ($rtl ? ($s->address_ar ?: $s->address_en) : ($s->address_en ?: $s->address_ar)) : null;
    $defaultBank = ($banks ?? collect())->first();
    $terms = $defaultTerms ?? null;
    $termsBody = $terms ? ($rtl ? ($terms->content_ar ?: $terms->content_en) : ($terms->content_en ?: $terms->content_ar)) : null;
    $logo = $logoUrl ?? null;
@endphp
<!DOCTYPE html>
<html dir="{{ $dir }}" lang="{{ $lang }}">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DejaVu Sans', sans-serif; font-size: 12px; color: #333; direction: {{ $dir }}; padding: 30px; }
    .brand { font-size: 24px; font-weight: bold; color: #01004C; }
    .brand-sub { font-size: 11px; color: #666; margin-top: 4px; }
    .invoice-title { font-size: 20px; font-weight: bold; color: #01004C; text-align: {{ $rtl ? 'left' : 'right' }}; }
    .invoice-number { font-size: 13px; color: #555; text-align: {{ $rtl ? 'left' : 'right' }}; margin-top: 4px; }
    .meta-table { width: 100%; margin-bottom: 25px; }
    .meta-table td { padding: 6px 10px; font-size: 12px; }
    .meta-table .label { font-weight: bold; color: #01004C; width: 140px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th { background: #01004C; color: white; padding: 10px 8px; text-align: {{ $rtl ? 'right' : 'left' }}; font-size: 11px; }
    .items-table td { padding: 8px; border-bottom: 1px solid #e0e0e0; font-size: 11px; }
    .items-table tr:nth-child(even) { background: #f8f9fc; }
    .totals { width: 300px; {{ $rtl ? 'margin-right: auto; margin-left: 0;' : 'margin-left: auto; margin-right: 0;' }} }
    .totals td { padding: 6px 10px; font-size: 12px; }
    .totals .label { font-weight: bold; text-align: {{ $rtl ? 'right' : 'left' }}; }
    .totals .value { text-align: {{ $rtl ? 'left' : 'right' }}; }
    .totals .grand-total { font-size: 16px; font-weight: bold; color: #01004C; border-top: 2px solid #01004C; }
    .notes { margin-top: 20px; padding: 12px; background: #f5f5f5; border-radius: 6px; font-size: 11px; }
    .bank-info { margin-top: 18px; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 11px; }
    .bank-info .title { font-weight: bold; color: #01004C; margin-bottom: 6px; }
    .terms { margin-top: 18px; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 11px; white-space: pre-wrap; }
    .terms .title { font-weight: bold; color: #01004C; margin-bottom: 6px; }
    .company-info { font-size: 10px; color: #666; margin-top: 6px; line-height: 1.5; }
    .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
    .status-badge { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 10px; font-weight: bold; }
    .status-draft { background: #e0e0e0; color: #555; }
    .status-sent { background: #fef3c7; color: #92400e; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-overdue { background: #fee2e2; color: #991b1b; }
    .logo { max-height: 60px; max-width: 160px; }
</style>
</head>
<body>

<table style="width:100%; margin-bottom: 30px; border-bottom: 3px solid #01004C; padding-bottom: 20px;">
    <tr>
        <td style="width:60%;">
            @if((!$s || $s->pdf_show_logo) && !empty($logo))
                <img src="{{ $logo }}" alt="Logo" class="logo" />
            @endif
            <div class="brand">{{ $companyName ?: ($invoice->company_header ?? ($rtl ? 'ضيافة' : 'Diyafah')) }}</div>
            <div class="brand-sub">{{ $L('Hotel Automation Platform', 'منصة أتمتة الفنادق') }}</div>
            @if($s && $s->pdf_show_company_info)
                <div class="company-info">
                    @if($companyAddress){{ $companyAddress }}<br>@endif
                    @if($s->phone){{ $L('Tel:', 'هاتف:') }} {{ $s->phone }}@endif
                    @if($s->email) · {{ $s->email }}@endif
                    @if($s->website) · {{ $s->website }}@endif
                    @if($s && $s->pdf_show_cr && $s->cr)<br>{{ $L('CR:', 'س.ت:') }} {{ $s->cr }}@endif
                    @if($s && $s->pdf_show_vat && $s->vat) · {{ $L('VAT:', 'ر.ض:') }} {{ $s->vat }}@endif
                </div>
            @endif
        </td>
        <td style="width:40%; text-align: {{ $rtl ? 'left' : 'right' }};">
            <div class="invoice-title">{{ $L('Invoice', 'فاتورة') }}</div>
            <div class="invoice-number">#{{ $invoice->invoice_number }}</div>
            <div style="margin-top: 4px;">
                <span class="status-badge status-{{ $invoice->status }}">{{ $statusLabel[$invoice->status] ?? $invoice->status }}</span>
            </div>
        </td>
    </tr>
</table>

@if(!$s || $s->pdf_show_customer_info)
<table class="meta-table">
    <tr>
        <td class="label">{{ $L('Customer:', 'العميل:') }}</td>
        <td>{{ $invoice->tenant?->name ?? $invoice->external_client_name }}</td>
        <td class="label">{{ $L('Issue date:', 'تاريخ الإصدار:') }}</td>
        <td>{{ $invoice->issue_date->format('Y-m-d') }}</td>
    </tr>
    <tr>
        <td class="label">{{ $L('Email:', 'البريد:') }}</td>
        <td>{{ $invoice->tenant?->email ?? $invoice->external_client_email }}</td>
        <td class="label">{{ $L('Due date:', 'تاريخ الاستحقاق:') }}</td>
        <td>{{ $invoice->due_date->format('Y-m-d') }}</td>
    </tr>
    <tr>
        <td class="label">{{ $L('Type:', 'النوع:') }}</td>
        <td>{{ $typeLabel[$invoice->type] ?? ucfirst($invoice->type) }}</td>
        <td class="label">{{ $L('Payment method:', 'طريقة الدفع:') }}</td>
        <td>{{ $invoice->payment_method ?? '—' }}</td>
    </tr>
</table>
@endif

<table class="items-table">
    <thead>
        <tr>
            <th>#</th>
            <th>{{ $L('Description', 'الوصف') }}</th>
            <th style="text-align: center;">{{ $L('Qty', 'الكمية') }}</th>
            <th style="text-align: {{ $rtl ? 'left' : 'right' }};">{{ $L('Unit price', 'سعر الوحدة') }}</th>
            @if(!$s || $s->pdf_show_discount_column)
                <th style="text-align: {{ $rtl ? 'left' : 'right' }};">{{ $L('Discount', 'الخصم') }}</th>
            @endif
            <th style="text-align: {{ $rtl ? 'left' : 'right' }};">{{ $L('Total', 'الإجمالي') }}</th>
        </tr>
    </thead>
    <tbody>
        @foreach($invoice->items as $i => $item)
        <tr>
            <td>{{ $i + 1 }}</td>
            <td>{{ $itemDesc($item) }}</td>
            <td style="text-align: center;">{{ $item->quantity }}</td>
            <td style="text-align: {{ $rtl ? 'left' : 'right' }};">{{ number_format($item->unit_price, 2) }} {{ $currency }}</td>
            @if(!$s || $s->pdf_show_discount_column)
                <td style="text-align: {{ $rtl ? 'left' : 'right' }};">{{ number_format($item->discount ?? 0, 2) }} {{ $currency }}</td>
            @endif
            <td style="text-align: {{ $rtl ? 'left' : 'right' }};">{{ number_format($item->total, 2) }} {{ $currency }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

<table class="totals">
    <tr>
        <td class="label">{{ $L('Subtotal:', 'المجموع الفرعي:') }}</td>
        <td class="value">{{ number_format($invoice->amount, 2) }} {{ $currency }}</td>
    </tr>
    @if($invoice->discount > 0)
    <tr>
        <td class="label">{{ $L('Discount:', 'الخصم:') }}</td>
        <td class="value">-{{ number_format($invoice->discount, 2) }} {{ $currency }}</td>
    </tr>
    @endif
    @if((!$s || $s->pdf_show_vat) && (float) $invoice->tax_rate > 0)
    <tr>
        <td class="label">{{ $L('VAT', 'ض. القيمة المضافة') }} ({{ $invoice->tax_rate }}%):</td>
        <td class="value">{{ number_format($invoice->tax_amount, 2) }} {{ $currency }}</td>
    </tr>
    @endif
    <tr>
        <td class="label grand-total">{{ $L('Grand total:', 'الإجمالي الكلي:') }}</td>
        <td class="value grand-total">{{ number_format($invoice->total, 2) }} {{ $currency }}</td>
    </tr>
</table>

@if(!empty($qr))
<div style="clear: both; margin-top: 18px; text-align: center;">
    <img src="{{ $qr }}" alt="ZATCA QR" style="width: 120px; height: 120px;" />
    <div style="font-size: 9px; color: #999; margin-top: 4px;">{{ $L('Scan to verify (ZATCA)', 'امسح للتحقق (هيئة الزكاة والضريبة)') }}</div>
</div>
@endif

@if($s && $s->pdf_show_bank_info && $defaultBank)
<div class="bank-info">
    <div class="title">{{ $L('Bank details', 'البيانات البنكية') }}</div>
    {{ $rtl ? ($defaultBank->bank_name_ar ?: $defaultBank->bank_name_en) : ($defaultBank->bank_name_en ?: $defaultBank->bank_name_ar) }}
    @if($defaultBank->account_holder) · {{ $defaultBank->account_holder }}@endif
    <br>
    @if($defaultBank->iban){{ $L('IBAN:', 'الآيبان:') }} {{ $defaultBank->iban }}@endif
    @if($defaultBank->account_number) · {{ $L('Acc:', 'حساب:') }} {{ $defaultBank->account_number }}@endif
    @if($defaultBank->swift) · SWIFT: {{ $defaultBank->swift }}@endif
</div>
@endif

@php
    $noteBody = $rtl
        ? ($invoice->notes_ar ?: $invoice->notes_en)
        : ($invoice->notes_en ?: $invoice->notes_ar);
@endphp
@if((!$s || $s->pdf_show_notes) && $noteBody)
<div class="notes">
    <p><strong>{{ $L('Notes:', 'ملاحظات:') }}</strong> {{ $noteBody }}</p>
</div>
@endif

@if((!$s || $s->pdf_show_terms) && $termsBody)
<div class="terms">
    <div class="title">{{ $L('Terms & conditions', 'الشروط والأحكام') }}</div>
    {{ $termsBody }}
</div>
@endif

@if(!$s || $s->pdf_show_footer)
<div class="footer">
    <p>{{ $s && $s->footer_line ? $s->footer_line : $L('Diyafah Platform · Invoice', 'منصة ضيافة · فاتورة') . ' ' . $invoice->invoice_number }}</p>
</div>
@endif

</body>
</html>
