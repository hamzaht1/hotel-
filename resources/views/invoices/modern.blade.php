<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DejaVu Sans', sans-serif; font-size: 12px; color: #1f2937; direction: ltr; padding: 40px; background: #fff; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .brand { font-size: 28px; font-weight: 700; }
    .brand-sub { font-size: 12px; opacity: 0.85; margin-top: 6px; }
    .invoice-title { font-size: 36px; font-weight: 700; letter-spacing: -1px; text-align: right; }
    .invoice-number { font-size: 13px; opacity: 0.85; text-align: right; margin-top: 4px; }
    .meta-card { background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 25px; }
    .meta-table { width: 100%; }
    .meta-table td { padding: 5px 8px; font-size: 12px; }
    .meta-table .label { font-weight: 600; color: #6b7280; width: 140px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th { background: #f3f4f6; color: #374151; padding: 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .items-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
    .totals { width: 320px; margin-left: auto; margin-right: 0; background: #f9fafb; border-radius: 12px; padding: 16px; }
    .totals td { padding: 6px 10px; font-size: 12px; }
    .totals .label { font-weight: 600; text-align: left; color: #6b7280; }
    .totals .value { text-align: right; font-weight: 500; }
    .totals .grand-total { font-size: 18px; font-weight: 700; color: #6366f1; border-top: 2px solid #e5e7eb; padding-top: 10px; }
    .notes { margin-top: 20px; padding: 14px; background: #eff6ff; border-left: 3px solid #6366f1; border-radius: 8px; font-size: 11px; color: #1e3a8a; }
    .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #9ca3af; }
    .status-badge { display: inline-block; padding: 4px 14px; border-radius: 999px; font-size: 10px; font-weight: 700; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-sent { background: #fef3c7; color: #92400e; }
    .status-draft { background: #e5e7eb; color: #374151; }
</style>
</head>
<body>
    <div class="header">
        <table style="width: 100%;"><tr>
            <td>
                <div class="brand">{{ $invoice->company_header ?? 'Diyafah' }}</div>
                <div class="brand-sub">{{ $invoice->tenant?->name ?? '' }}</div>
            </td>
            <td style="text-align: right;">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-number">#{{ $invoice->invoice_number }}</div>
            </td>
        </tr></table>
    </div>

    <div class="meta-card">
        <table class="meta-table">
            <tr><td class="label">Customer:</td><td>{{ $invoice->tenant?->name }}</td></tr>
            <tr><td class="label">Email:</td><td>{{ $invoice->tenant?->email }}</td></tr>
            @if($invoice->tax_number)
            <tr><td class="label">Tax number:</td><td>{{ $invoice->tax_number }}</td></tr>
            @endif
            @if($invoice->billing_address)
            <tr><td class="label">Address:</td><td>{{ $invoice->billing_address }}</td></tr>
            @endif
            <tr><td class="label">Issue date:</td><td>{{ $invoice->issue_date?->format('Y-m-d') }}</td></tr>
            <tr><td class="label">Due date:</td><td>{{ $invoice->due_date?->format('Y-m-d') }}</td></tr>
            <tr><td class="label">Status:</td><td><span class="status-badge status-{{ $invoice->status }}">{{ strtoupper($invoice->status) }}</span></td></tr>
        </table>
    </div>

    <table class="items-table">
        <thead><tr>
            <th>Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit price</th>
            <th style="text-align: right;">Total</th>
        </tr></thead>
        <tbody>
        @foreach($invoice->items as $item)
            <tr>
                <td>{{ $item->description_en ?: $item->description_ar }}</td>
                <td style="text-align: center;">{{ $item->quantity }}</td>
                <td style="text-align: right;">{{ number_format($item->unit_price, 2) }}</td>
                <td style="text-align: right;">{{ number_format($item->total, 2) }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr><td class="label">Subtotal:</td><td class="value">{{ number_format($invoice->amount, 2) }} SAR</td></tr>
        @if($invoice->discount > 0)
        <tr><td class="label">Discount:</td><td class="value">-{{ number_format($invoice->discount, 2) }} SAR</td></tr>
        @endif
        <tr><td class="label">VAT ({{ $invoice->tax_rate }}%):</td><td class="value">{{ number_format($invoice->tax_amount, 2) }} SAR</td></tr>
        <tr class="grand-total"><td class="label">Grand total:</td><td class="value">{{ number_format($invoice->total, 2) }} SAR</td></tr>
    </table>

    @if($invoice->notes_en || $invoice->notes_ar || $invoice->footer_notes)
        <div class="notes">
            @if($invoice->notes_en || $invoice->notes_ar)<div>{{ $invoice->notes_en ?: $invoice->notes_ar }}</div>@endif
            @if($invoice->footer_notes)<div style="margin-top: 6px;">{{ $invoice->footer_notes }}</div>@endif
        </div>
    @endif

    <div class="footer">
        {{ $invoice->company_header ?? 'Diyafah' }} · Thank you for your business
    </div>
</body>
</html>
