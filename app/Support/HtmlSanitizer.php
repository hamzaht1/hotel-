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

    public static function clean(?string $html): ?string
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

        self::sanitizeChildren($root);

        $out = '';
        foreach (iterator_to_array($root->childNodes) as $child) {
            $out .= $doc->saveHTML($child);
        }

        return trim($out);
    }

    private static function sanitizeChildren(DOMNode $node): void
    {
        foreach (iterator_to_array($node->childNodes) as $child) {
            self::sanitizeNode($child);
        }
    }

    private static function sanitizeNode(DOMNode $node): void
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
        self::sanitizeChildren($node);

        if (! array_key_exists($tag, self::ALLOWED)) {
            self::unwrap($node);

            return;
        }

        $allowedAttrs = self::ALLOWED[$tag];
        foreach (iterator_to_array($node->attributes ?? []) as $attr) {
            $name = strtolower($attr->nodeName);

            if (! in_array($name, $allowedAttrs, true)) {
                $node->removeAttribute($attr->nodeName);

                continue;
            }

            if ($name === 'style') {
                $clean = self::cleanStyle((string) $attr->nodeValue);
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

    private static function cleanStyle(string $style): string
    {
        $out = [];
        foreach (explode(';', $style) as $decl) {
            if (! str_contains($decl, ':')) {
                continue;
            }
            [$prop, $val] = array_map('trim', explode(':', $decl, 2));
            $prop = strtolower($prop);
            if (in_array($prop, self::ALLOWED_STYLES, true) && $val !== ''
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
