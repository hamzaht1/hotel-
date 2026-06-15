import {
    Bold,
    Italic,
    Underline,
    Heading2,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Palette,
    Smile,
    Undo2,
    Redo2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
    value: string;
    onChange: (html: string) => void;
    dir?: 'rtl' | 'ltr';
    placeholder?: string;
    minHeight?: number;
}

// Bullet markers offered by the toolbar. CSS list-style-type accepts a quoted
// string for the custom glyphs (supported by modern browsers), so the same
// markup renders identically in the editor and on the public site.
const BULLET_STYLES: { label: string; value: string }[] = [
    { label: '•', value: 'disc' },
    { label: '○', value: 'circle' },
    { label: '▪', value: 'square' },
    { label: '✓', value: '"✓  "' },
    { label: '★', value: '"★  "' },
    { label: '→', value: '"→  "' },
    { label: '◆', value: '"◆  "' },
];

const COLORS = [
    '#000000', '#1e293b', '#475569', '#64748b', '#94a3b8',
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6',
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e',
];
const EMOJIS = ['😀', '😍', '👍', '🎉', '✨', '🌟', '🔥', '❤️', '✅', '📍', '🕒', '🏨', '🛏️', '🍽️', '🌊', '🏊', '🚗', '☕', '🎁', '🌴'];

export default function RichTextEditor({ value, onChange, dir = 'ltr', placeholder, minHeight = 140 }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    // Tracks the last HTML we emitted so the value→DOM sync below only runs for
    // *external* changes (initial load / reset), never echoing our own edits —
    // which would otherwise reset the caret to the start on every keystroke.
    // Starts as null (not `value`) so the FIRST sync always injects the stored
    // text into the contentEditable — otherwise edit mode shows an empty field.
    const lastHtml = useRef<string | null>(null);
    const [showColors, setShowColors] = useState(false);
    const [showEmojis, setShowEmojis] = useState(false);

    useEffect(() => {
        if (ref.current && value !== lastHtml.current) {
            ref.current.innerHTML = value || '';
            lastHtml.current = value;
        }
    }, [value]);

    function emit() {
        const html = ref.current?.innerHTML ?? '';
        lastHtml.current = html;
        onChange(html);
    }

    function exec(command: string, arg?: string) {
        ref.current?.focus();
        document.execCommand(command, false, arg);
        emit();
    }

    function applyBullet(style: string) {
        ref.current?.focus();
        document.execCommand('insertUnorderedList');
        const sel = window.getSelection();
        let node = (sel?.anchorNode as HTMLElement | null) ?? null;
        while (node && node.nodeName !== 'UL') node = node.parentElement;
        if (node) node.style.listStyleType = style;
        emit();
    }

    return (
        <div className="rounded-md border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 rounded-t-md border-b border-input bg-muted/30 px-2 py-1.5 text-muted-foreground">
                <Btn onClick={() => exec('bold')} label="Bold"><Bold className="h-4 w-4" /></Btn>
                <Btn onClick={() => exec('italic')} label="Italic"><Italic className="h-4 w-4" /></Btn>
                <Btn onClick={() => exec('underline')} label="Underline"><Underline className="h-4 w-4" /></Btn>
                <Sep />
                <Btn onClick={() => exec('formatBlock', 'H2')} label="Heading"><Heading2 className="h-4 w-4" /></Btn>
                <Btn onClick={() => exec('insertUnorderedList')} label="Bullet list"><List className="h-4 w-4" /></Btn>
                <Btn onClick={() => exec('insertOrderedList')} label="Numbered list"><ListOrdered className="h-4 w-4" /></Btn>
                <Sep />
                {BULLET_STYLES.map((b) => (
                    <Btn key={b.value} onClick={() => applyBullet(b.value)} label={`Bullet ${b.label}`}>
                        <span className="text-sm leading-none">{b.label}</span>
                    </Btn>
                ))}
                <Sep />
                <Btn onClick={() => exec('justifyLeft')} label="Align left"><AlignLeft className="h-4 w-4" /></Btn>
                <Btn onClick={() => exec('justifyCenter')} label="Align center"><AlignCenter className="h-4 w-4" /></Btn>
                <Btn onClick={() => exec('justifyRight')} label="Align right"><AlignRight className="h-4 w-4" /></Btn>
                <Sep />

                {/* Color */}
                <div className="relative">
                    <Btn onClick={() => { setShowColors((s) => !s); setShowEmojis(false); }} label="Text color"><Palette className="h-4 w-4" /></Btn>
                    {showColors && (
                        <div className="absolute z-20 mt-1 grid w-max grid-cols-10 gap-2 rounded-lg border bg-popover p-3 shadow-lg">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => { exec('foreColor', c); setShowColors(false); }}
                                    className="h-8 w-8 rounded-full border transition hover:scale-110"
                                    style={{ backgroundColor: c }}
                                    aria-label={c}
                                    title={c}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Emoji */}
                <div className="relative">
                    <Btn onClick={() => { setShowEmojis((s) => !s); setShowColors(false); }} label="Emoji"><Smile className="h-4 w-4" /></Btn>
                    {showEmojis && (
                        <div className="absolute z-20 mt-1 grid w-56 grid-cols-6 gap-1 rounded-lg border bg-popover p-2 shadow-md">
                            {EMOJIS.map((e) => (
                                <button
                                    key={e}
                                    type="button"
                                    onClick={() => { exec('insertText', e); setShowEmojis(false); }}
                                    className="rounded p-1 text-lg hover:bg-muted"
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <Sep />
                <Btn onClick={() => exec('undo')} label="Undo"><Undo2 className="h-4 w-4" /></Btn>
                <Btn onClick={() => exec('redo')} label="Redo"><Redo2 className="h-4 w-4" /></Btn>
            </div>

            {/* Editable area */}
            <div
                ref={ref}
                contentEditable
                dir={dir}
                data-placeholder={placeholder}
                onInput={emit}
                onBlur={emit}
                role="textbox"
                aria-multiline="true"
                className="rte-content w-full px-3 py-2 text-sm outline-none"
                style={{ minHeight }}
                suppressContentEditableWarning
            />
        </div>
    );
}

function Btn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
    // onMouseDown + preventDefault keeps the editor selection while clicking.
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className="rounded p-1.5 transition hover:bg-muted hover:text-foreground"
        >
            {children}
        </button>
    );
}

function Sep() {
    return <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />;
}
