<?php

namespace App\Support;

use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

/**
 * Builds a ZATCA-compliant (Phase 1 / e-invoicing) QR payload and renders it as
 * an SVG data URI suitable for embedding in DomPDF invoice templates.
 *
 * The QR encodes a Base64 string of TLV (Tag-Length-Value) records:
 *   1 = Seller name
 *   2 = VAT registration number
 *   3 = Invoice timestamp (ISO 8601)
 *   4 = Invoice total (with VAT)
 *   5 = VAT total
 */
class ZatcaQr
{
    public static function tlvBase64(
        string $sellerName,
        string $vatNumber,
        string $timestampIso,
        string $total,
        string $vatAmount,
    ): string {
        $tlv = self::tag(1, $sellerName)
            . self::tag(2, $vatNumber)
            . self::tag(3, $timestampIso)
            . self::tag(4, $total)
            . self::tag(5, $vatAmount);

        return base64_encode($tlv);
    }

    /**
     * Render a Base64 TLV payload as an `data:image/svg+xml;base64,...` URI.
     */
    public static function svgDataUri(string $payload, int $size = 140): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle($size),
            new SvgImageBackEnd(),
        );

        $svg = (new Writer($renderer))->writeString($payload);

        return 'data:image/svg+xml;base64,' . base64_encode($svg);
    }

    private static function tag(int $tag, string $value): string
    {
        $bytes = (string) $value;

        return chr($tag) . chr(strlen($bytes)) . $bytes;
    }
}
