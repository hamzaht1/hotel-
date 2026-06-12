import { Palette } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
    value: string;
    onChange: (html: string) => void;
    dir?: 'rtl' | 'ltr';
    placeholder?: string;
    /** Max VISIBLE characters (text content, markup excluded). */
    maxLength?: number;
    minHeight?: number;
}

// Same palette as the full rich-text editor so colours stay consistent.
const COLORS = ['#1e293b', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

const INSERT_TYPES = [
    'insertText',
    'insertCompositionText',
    'insertFromPaste',
    'insertFromDrop',
    'insertParagraph',
    'insertLineBreak',
    'insertFromYank',
    'insertReplacementText',
];

/**
 * Restricted rich-text editor for the room "short description": the ONLY
 * formatting offered is text colour. Bold/italic/lists/headings are
 * unavailable, input is hard-capped at `maxLength` VISIBLE characters (paste is
 * truncated, typing past the cap is blocked) and a live counter is shown.
 * The server independently sanitises to colour-only and re-checks the cap.
 */
export default function ColorTextEditor({ value, onChange, dir = 'ltr', placeholder, maxLength = 120, minHeight = 80 }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    // Starts as null (not `value`) so the FIRST sync always injects the stored
    // text into the contentEditable — otherwise edit mode shows an empty field.
    const lastHtml = useRef<string | null>(null);
    const [showColors, setShowColors] = useState(false);
    const [count, setCount] = useState(0);

    // Sync external value (initial load / reset) without echoing our own edits.
    useEffect(() => {
        if (ref.current && value !== lastHtml.current) {
            ref.current.innerHTML = value || '';
            lastHtml.current = value;
            setCount((ref.current.textContent || '').length);
        }
    }, [value]);

    // Initial count on mount.
    useEffect(() => {
        setCount((ref.current?.textContent || '').length);
    }, []);

    // Block growth past the cap. Native `beforeinput` is more reliable than the
    // React synthetic event for this. Replacing a non-collapsed selection is
    // allowed (it can't grow the text), so the field stays editable when full.
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const handler = (e: Event) => {
            const ev = e as InputEvent;
            if (!INSERT_TYPES.includes(ev.inputType)) return;
            const sel = window.getSelection();
            const collapsed = !sel || sel.isCollapsed;
            if (collapsed && (el.textContent || '').length >= maxLength) {
                e.preventDefault();
            }
        };
        el.addEventListener('beforeinput', handler);
        return () => el.removeEventListener('beforeinput', handler);
    }, [maxLength]);

    function placeCaretEnd(el: HTMLElement) {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
    }

    function emit() {
        const el = ref.current;
        if (!el) return;
        // Safety net: hard-truncate if something slipped past the cap (e.g. IME).
        if ((el.textContent || '').length > maxLength) {
            el.textContent = (el.textContent || '').slice(0, maxLength);
            placeCaretEnd(el);
        }
        const html = el.innerHTML;
        lastHtml.current = html;
        setCount((el.textContent || '').length);
        onChange(html);
    }

    function handlePaste(e: React.ClipboardEvent) {
        e.preventDefault();
        const el = ref.current;
        if (!el) return;
        const text = e.clipboardData.getData('text/plain'); // strip all formatting
        const sel = window.getSelection();
        const selLen = sel && !sel.isCollapsed ? sel.toString().length : 0;
        const remaining = maxLength - ((el.textContent || '').length - selLen);
        if (remaining <= 0) return;
        document.execCommand('insertText', false, text.slice(0, remaining));
        emit();
    }

    function applyColor(c: string) {
        const el = ref.current;
        if (!el) return;
        el.focus();

        const sel = window.getSelection();
        // If the user hasn't selected anything (collapsed caret), colour the
        // WHOLE field so a single click visibly changes the text colour —
        // otherwise foreColor would only affect text typed afterwards.
        if (!sel || sel.isCollapsed || !el.contains(sel.anchorNode)) {
            const range = document.createRange();
            range.selectNodeContents(el);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }

        // Emit CSS (<span style="color">) rather than the legacy <font> tag;
        // both are kept by the server sanitizer, but CSS is cleaner.
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand('foreColor', false, c);
        setShowColors(false);
        emit();
    }

    const atLimit = count >= maxLength;

    return (
        <div>
            <div className="overflow-hidden rounded-md border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                {/* Toolbar — colour only */}
                <div className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/30 px-2 py-1.5 text-muted-foreground">
                    <div className="relative">
                        <button
                            type="button"
                            aria-label="Text color"
                            title="Text color"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setShowColors((s) => !s)}
                            className="rounded p-1.5 transition hover:bg-muted hover:text-foreground"
                        >
                            <Palette className="h-4 w-4" />
                        </button>
                        {showColors && (
                            <div className="absolute z-20 mt-1 grid grid-cols-4 gap-1 rounded-lg border bg-popover p-2 shadow-md">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => applyColor(c)}
                                        className="h-6 w-6 rounded-full border"
                                        style={{ backgroundColor: c }}
                                        aria-label={c}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Editable area */}
                <div
                    ref={ref}
                    contentEditable
                    dir={dir}
                    data-placeholder={placeholder}
                    onInput={emit}
                    onBlur={emit}
                    onPaste={handlePaste}
                    role="textbox"
                    aria-multiline="false"
                    className="rte-content w-full px-3 py-2 text-sm outline-none"
                    style={{ minHeight }}
                    suppressContentEditableWarning
                />
            </div>

            {/* Live character counter */}
            <div className={`mt-1 text-end text-xs ${atLimit ? 'font-medium text-red-500' : 'text-muted-foreground'}`}>
                {count} / {maxLength}
            </div>
        </div>
    );
}
