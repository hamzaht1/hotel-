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
    .quote-bar { text-align: center; margin-bottom: 25px; font-size: 18px; font-weight: 700; letter-spacing: 4px; }
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
        <div class="brand">{{ $quote->company_header ?? 'Diyafah' }}</div>
        <div class="brand-sub">{{ $quote->tenant?->name ?? $quote->external_client_name ?? '' }}</div>
    </div>

    <div class="quote-bar">QUOTE · {{ $quote->quote_number }}</div>

    <table class="meta-table">
        <tr><td class="label">Customer:</td><td>{{ $quote->tenant?->name ?? $quote->external_client_name }}</td></tr>
        <tr><td class="label">Email:</td><td>{{ $quote->tenant?->email ?? $quote->external_client_email }}</td></tr>
        @if($quote->tax_number)
        <tr><td class="label">Tax number:</td><td>{{ $quote->tax_number }}</td></tr>
        @endif
        @if($quote->billing_address)
        <tr><td class="label">Address:</td><td>{{ $quote->billing_address }}</td></tr>
        @endif
        <tr><td class="label">Issue date:</td><td>{{ $quote->issue_date?->format('Y-m-d') }}</td></tr>
        <tr><td class="label">Valid until:</td><td>{{ $quote->valid_until?->format('Y-m-d') }}</td></tr>
        <tr><td class="label">Status:</td><td>{{ strtoupper($quote->status) }}</td></tr>
    </table>

    <table class="items-table">
        <thead><tr>
            <th>Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit price</th>
            <th style="text-align: right;">Total</th>
        </tr></thead>
        <tbody>
            @foreach($quote->items as $item)
            <tr>
                <td>{{ $item->description_en ?: $item->description_ar }}</td>
                <td style="text-align: center;">{{ $item->quantity }}</td>
                <td style="text-align: right;">{{ number_format($item->unit_price, 2) }} SAR</td>
                <td style="text-align: right;">{{ number_format($item->total, 2) }} SAR</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr><td class="label">Subtotal:</td><td style="text-align: right;">{{ number_format($quote->amount, 2) }} SAR</td></tr>
        @if($quote->discount > 0)
        <tr><td class="label">Discount:</td><td style="text-align: right;">-{{ number_format($quote->discount, 2) }} SAR</td></tr>
        @endif
        <tr><td class="label">VAT ({{ $quote->tax_rate }}%):</td><td style="text-align: right;">{{ number_format($quote->tax_amount, 2) }} SAR</td></tr>
        <tr><td class="label grand-total">Grand total:</td><td class="grand-total" style="text-align: right;">{{ number_format($quote->total, 2) }} SAR</td></tr>
    </table>

    @if($quote->notes_en || $quote->notes_ar)
    <div class="notes">
        <strong>Notes:</strong> {{ $quote->notes_en ?: $quote->notes_ar }}
    </div>
    @endif

    @if($quote->payment_terms)
    <div class="notes">
        <strong>Payment terms:</strong> {{ $quote->payment_terms }}
    </div>
    @endif

    <div class="footer">
        Diyafah Platform · Quote {{ $quote->quote_number }}
    </div>
</body>
</html>
