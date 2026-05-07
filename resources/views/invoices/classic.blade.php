<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DejaVu Serif', serif; font-size: 12px; color: #1a1a1a; direction: ltr; padding: 50px; }
    .header { text-align: center; border-bottom: 2px double #333; padding-bottom: 20px; margin-bottom: 30px; }
    .brand { font-size: 26px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
    .brand-sub { font-size: 11px; color: #555; margin-top: 6px; font-style: italic; }
    .invoice-bar { text-align: center; margin-bottom: 25px; font-size: 18px; font-weight: 700; letter-spacing: 4px; }
    .meta-table { width: 100%; margin-bottom: 25px; border: 1px solid #333; }
    .meta-table td { padding: 8px 12px; font-size: 12px; border-bottom: 1px solid #ddd; }
    .meta-table .label { font-weight: 700; width: 160px; background: #f5f5f5; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #333; }
    .items-table th { background: #333; color: #fff; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .items-table td { padding: 10px; border-bottom: 1px solid #ddd; font-size: 12px; }
    .totals { width: 320px; margin-left: auto; margin-right: 0; border: 1px solid #333; }
    .totals td { padding: 8px 12px; font-size: 12px; border-bottom: 1px solid #ddd; }
    .totals .label { font-weight: 700; text-align: left; background: #f5f5f5; }
    .totals .grand-total { font-size: 16px; font-weight: 700; background: #333; color: #fff; }
    .notes { margin-top: 20px; padding: 14px; border: 1px dashed #333; font-size: 11px; font-style: italic; }
    .footer { margin-top: 50px; text-align: center; font-size: 11px; font-style: italic; border-top: 1px solid #333; padding-top: 16px; }
</style>
</head>
<body>
    <div class="header">
        <div class="brand">{{ $invoice->company_header ?? 'Diyafah' }}</div>
        <div class="brand-sub">{{ $invoice->tenant?->name ?? '' }}</div>
    </div>

    <div class="invoice-bar">INVOICE · {{ $invoice->invoice_number }}</div>

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
        <tr><td class="label">Status:</td><td>{{ strtoupper($invoice->status) }}</td></tr>
    </table>

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
        <tr><td class="label">Subtotal:</td><td>{{ number_format($invoice->amount, 2) }} SAR</td></tr>
        @if($invoice->discount > 0)
        <tr><td class="label">Discount:</td><td>-{{ number_format($invoice->discount, 2) }} SAR</td></tr>
        @endif
        <tr><td class="label">VAT ({{ $invoice->tax_rate }}%):</td><td>{{ number_format($invoice->tax_amount, 2) }} SAR</td></tr>
        <tr class="grand-total"><td class="label">Grand total:</td><td>{{ number_format($invoice->total, 2) }} SAR</td></tr>
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
