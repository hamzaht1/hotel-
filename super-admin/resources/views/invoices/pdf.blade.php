<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DejaVu Sans', sans-serif; font-size: 12px; color: #333; direction: ltr; padding: 30px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid #01004C; padding-bottom: 20px; }
    .brand { font-size: 24px; font-weight: bold; color: #01004C; }
    .brand-sub { font-size: 11px; color: #666; margin-top: 4px; }
    .invoice-title { font-size: 20px; font-weight: bold; color: #01004C; text-align: right; }
    .invoice-number { font-size: 13px; color: #555; text-align: right; margin-top: 4px; }
    .meta-table { width: 100%; margin-bottom: 25px; }
    .meta-table td { padding: 6px 10px; font-size: 12px; }
    .meta-table .label { font-weight: bold; color: #01004C; width: 140px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th { background: #01004C; color: white; padding: 10px 8px; text-align: left; font-size: 11px; }
    .items-table td { padding: 8px; border-bottom: 1px solid #e0e0e0; font-size: 11px; }
    .items-table tr:nth-child(even) { background: #f8f9fc; }
    .totals { width: 300px; margin-left: auto; margin-right: 0; }
    .totals td { padding: 6px 10px; font-size: 12px; }
    .totals .label { font-weight: bold; text-align: left; }
    .totals .value { text-align: right; }
    .totals .grand-total { font-size: 16px; font-weight: bold; color: #01004C; border-top: 2px solid #01004C; }
    .notes { margin-top: 20px; padding: 12px; background: #f5f5f5; border-radius: 6px; font-size: 11px; }
    .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
    .status-badge { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
    .status-draft { background: #e0e0e0; color: #555; }
    .status-sent { background: #fef3c7; color: #92400e; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-overdue { background: #fee2e2; color: #991b1b; }
</style>
</head>
<body>

<table style="width:100%; margin-bottom: 30px; border-bottom: 3px solid #01004C; padding-bottom: 20px;">
    <tr>
        <td style="width:50%;">
            <div class="brand">Diyafah</div>
            <div class="brand-sub">Hotel Automation Platform</div>
        </td>
        <td style="width:50%; text-align: right;">
            <div class="invoice-title">Invoice</div>
            <div class="invoice-number">#{{ $invoice->invoice_number }}</div>
            <div style="margin-top: 4px;">
                <span class="status-badge status-{{ $invoice->status }}">{{ $invoice->status }}</span>
            </div>
        </td>
    </tr>
</table>

<table class="meta-table">
    <tr>
        <td class="label">Customer:</td>
        <td>{{ $invoice->tenant->name }}</td>
        <td class="label">Issue date:</td>
        <td>{{ $invoice->issue_date->format('Y-m-d') }}</td>
    </tr>
    <tr>
        <td class="label">Email:</td>
        <td>{{ $invoice->tenant->email }}</td>
        <td class="label">Due date:</td>
        <td>{{ $invoice->due_date->format('Y-m-d') }}</td>
    </tr>
    <tr>
        <td class="label">Type:</td>
        <td>{{ ucfirst($invoice->type) }}</td>
        <td class="label">Payment method:</td>
        <td>{{ $invoice->payment_method ?? '—' }}</td>
    </tr>
</table>

<table class="items-table">
    <thead>
        <tr>
            <th>#</th>
            <th>Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit price</th>
            <th style="text-align: right;">Total</th>
        </tr>
    </thead>
    <tbody>
        @foreach($invoice->items as $i => $item)
        <tr>
            <td>{{ $i + 1 }}</td>
            <td>{{ $item->description_en ?: $item->description_ar }}</td>
            <td style="text-align: center;">{{ $item->quantity }}</td>
            <td style="text-align: right;">{{ number_format($item->unit_price, 2) }} SAR</td>
            <td style="text-align: right;">{{ number_format($item->total, 2) }} SAR</td>
        </tr>
        @endforeach
    </tbody>
</table>

<table class="totals">
    <tr>
        <td class="label">Subtotal:</td>
        <td class="value">{{ number_format($invoice->amount, 2) }} SAR</td>
    </tr>
    @if($invoice->discount > 0)
    <tr>
        <td class="label">Discount:</td>
        <td class="value">-{{ number_format($invoice->discount, 2) }} SAR</td>
    </tr>
    @endif
    <tr>
        <td class="label">VAT ({{ $invoice->tax_rate }}%):</td>
        <td class="value">{{ number_format($invoice->tax_amount, 2) }} SAR</td>
    </tr>
    <tr>
        <td class="label grand-total">Grand total:</td>
        <td class="value grand-total">{{ number_format($invoice->total, 2) }} SAR</td>
    </tr>
</table>

@if($invoice->notes_en || $invoice->notes_ar)
<div class="notes">
    <p><strong>Notes:</strong> {{ $invoice->notes_en ?: $invoice->notes_ar }}</p>
</div>
@endif

<div class="footer">
    <p>Diyafah Platform · Invoice {{ $invoice->invoice_number }}</p>
</div>

</body>
</html>
