<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

/**
 * Minimal allow-list HTML sanitizer for tenant-authored rich-text descriptions.
 * Keeps a small set of formatting tags, drops everything else (unwrapping it so
 * the text survives), and only allows the `color`, `text-align` and
 * `list-style-type` style properties. Built on ext-dom — no extra dependency.
 */
class HtmlSanitizer
{
    /** tag => list of attributes allowed on it */
    private const ALLOWED = [
        'p' => ['style'],
        'br' => [],
        'b' => [],
        'strong' => [],
        'i' => [],
        'em' => [],
        'u' => [],
        'h2' => ['style'],
        'ul' => ['style'],
        'ol' => ['style'],
        'li' => ['style'],
        'span' => ['style'],
        'div' => ['style'],
        // execCommand('foreColor') emits <font color="..."> when styleWithCSS is
        // off (the browser default), so keep it for text colour.
        'font' => ['color'],
        'a' => ['href'],
    ];

    /** tags removed entirely, content included */
    private const DROP = ['script', 'style', 'iframe', 'object', 'embed'];

    private const ALLOWED_STYLES = ['color', 'text-align', 'list-style-type'];

    /**
     * Color-only allow-list for the room "short description": text plus colour,
     * nothing else. Bold/italic/underline/headings/lists are unwrapped so only
     * the plain text (and its colour) survives — matching the restricted editor.
     */
    private const ALLOWED_COLOR_ONLY = [
        'p' => ['style'],
        'br' => [],
        'div' => ['style'],
        'span' => ['style'],
        'font' => ['color'],
    ];

    private const ALLOWED_COLOR_STYLES = ['color'];

    /**
     * Count of visible characters (tags stripped, entities decoded, non-breaking
     * spaces normalised). Used to enforce the 120-char short-description cap on
     * the server regardless of the surrounding markup.
     */
    public static function visibleLength(?string $html): int
    {
        if ($html === null || $html === '') {
            return 0;
        }

        $text = strip_tags($html);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = str_replace("\xC2\xA0", ' ', $text); // &nbsp; → space

        return mb_strlen($text);
    }

    /**
     * Sanitize keeping only colour formatting (see ALLOWED_COLOR_ONLY).
     */
    public static function cleanColorOnly(?string $html): ?string
    {
        return self::run($html, self::ALLOWED_COLOR_ONLY, self::ALLOWED_COLOR_STYLES);
    }

    public static function clean(?string $html): ?string
    {
        return self::run($html, self::ALLOWED, self::ALLOWED_STYLES);
    }

    private static function run(?string $html, array $allowed, array $allowedStyles): ?string
    {
        if ($html === null) {
            return null;
        }

        $html = trim($html);
        if ($html === '') {
            return '';
        }

        $doc = new DOMDocument();
        libxml_use_internal_errors(true);
        $doc->loadHTML(
            '<?xml encoding="utf-8"?><div id="__rte_root">' . $html . '</div>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
        );
        libxml_clear_errors();

        $root = $doc->getElementById('__rte_root');
        if (! $root) {
            return '';
        }

        self::sanitizeChildren($root, $allowed, $allowedStyles);

        $out = '';
        foreach (iterator_to_array($root->childNodes) as $child) {
            $out .= $doc->saveHTML($child);
        }

        return trim($out);
    }

    private static function sanitizeChildren(DOMNode $node, array $allowed, array $allowedStyles): void
    {
        foreach (iterator_to_array($node->childNodes) as $child) {
            self::sanitizeNode($child, $allowed, $allowedStyles);
        }
    }

    private static function sanitizeNode(DOMNode $node, array $allowed, array $allowedStyles): void
    {
        if ($node->nodeType === XML_COMMENT_NODE) {
            $node->parentNode?->removeChild($node);

            return;
        }

        if (! $node instanceof DOMElement) {
            return; // plain text — keep
        }

        $tag = strtolower($node->nodeName);

        if (in_array($tag, self::DROP, true)) {
            $node->parentNode?->removeChild($node);

            return;
        }

        // Sanitize descendants first.
        self::sanitizeChildren($node, $allowed, $allowedStyles);

        if (! array_key_exists($tag, $allowed)) {
            self::unwrap($node);

            return;
        }

        $allowedAttrs = $allowed[$tag];
        foreach (iterator_to_array($node->attributes ?? []) as $attr) {
            $name = strtolower($attr->nodeName);

            if (! in_array($name, $allowedAttrs, true)) {
                $node->removeAttribute($attr->nodeName);

                continue;
            }

            if ($name === 'style') {
                $clean = self::cleanStyle((string) $attr->nodeValue, $allowedStyles);
                if ($clean === '') {
                    $node->removeAttribute('style');
                } else {
                    $node->setAttribute('style', $clean);
                }
            } elseif ($name === 'href' && ! self::safeHref((string) $attr->nodeValue)) {
                $node->removeAttribute('href');
            } elseif ($name === 'color' && ! preg_match('/^(#[0-9a-f]{3,8}|[a-z]+|rgba?\([0-9,.\s]+\))$/i', trim((string) $attr->nodeValue))) {
                $node->removeAttribute('color');
            }
        }
    }

    private static function unwrap(DOMElement $el): void
    {
        $parent = $el->parentNode;
        if (! $parent) {
            return;
        }
        while ($el->firstChild) {
            $parent->insertBefore($el->firstChild, $el);
        }
        $parent->removeChild($el);
    }

    private static function cleanStyle(string $style, array $allowedStyles): string
    {
        $out = [];
        foreach (explode(';', $style) as $decl) {
            if (! str_contains($decl, ':')) {
                continue;
            }
            [$prop, $val] = array_map('trim', explode(':', $decl, 2));
            $prop = strtolower($prop);
            if (in_array($prop, $allowedStyles, true) && $val !== ''
                && ! preg_match('/url\(|expression|javascript:/i', $val)) {
                $out[] = $prop . ': ' . $val;
            }
        }

        return implode('; ', $out);
    }

    private static function safeHref(string $href): bool
    {
        $href = trim($href);

        return (bool) preg_match('#^(https?:|mailto:|tel:|/|\#)#i', $href);
    }
}
