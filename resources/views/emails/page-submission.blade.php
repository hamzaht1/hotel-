<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                    <tr>
                        <td style="background:linear-gradient(135deg,#01004C,#5A5ECD);padding:24px 32px;">
                            <h1 style="color:#fff;font-size:20px;margin:0;">New form submission</h1>
                            <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">
                                {{ $page->title_en ?: $page->title_ar }}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px 32px;">
                            <p style="font-size:13px;color:#666;margin:0 0 16px;">
                                Submitted {{ $submission->created_at->format('d M Y H:i') }}
                                @if($submission->ip) · IP: {{ $submission->ip }}@endif
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                                @foreach($fields as $field)
                                    @php
                                        $key = $field['key'] ?? '';
                                        $label = $field['label_en'] ?: $field['label_ar'] ?: $key;
                                        $value = $submission->data[$key] ?? null;
                                    @endphp
                                    <tr>
                                        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#666;width:40%;vertical-align:top;">
                                            {{ $label }}
                                        </td>
                                        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#222;">
                                            @if(is_array($value))
                                                {{ implode(', ', $value) }}
                                            @elseif(is_string($value) && str_starts_with($value, 'submissions/'))
                                                <a href="{{ asset('storage/' . $value) }}" style="color:#5A5ECD;">{{ basename($value) }}</a>
                                            @else
                                                {{ $value ?? '—' }}
                                            @endif
                                        </td>
                                    </tr>
                                @endforeach
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 32px;background:#fafafa;font-size:12px;color:#999;text-align:center;">
                            This is an automated notification from Diyafah.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
