import { Bold, Italic, List, Heading2 } from 'lucide-react';
import { forwardRef, useImperativeHandle, useRef } from 'react';

interface Props extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
    value: string;
    onChange: (next: string) => void;
}

/**
 * Textarea wrapped in a small markdown toolbar (bold / italic / bullet
 * list / heading-2). The buttons inject the corresponding markdown
 * syntax around the current selection — output stays plain text so the
 * existing storage and rendering paths keep working.
 */
const RichTextarea = forwardRef<HTMLTextAreaElement, Props>(function RichTextarea(
    { value, onChange, className = '', rows = 4, ...rest },
    forwardedRef,
) {
    const ref = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(forwardedRef, () => ref.current as HTMLTextAreaElement);

    function applyWrap(prefix: string, suffix = prefix) {
        const el = ref.current;
        if (!el) return;
        const start = el.selectionStart ?? value.length;
        const end = el.selectionEnd ?? value.length;
        const sel = value.slice(start, end);
        const next = value.slice(0, start) + prefix + sel + suffix + value.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
            el.focus();
            const a = start + prefix.length;
            const b = end + prefix.length;
            el.setSelectionRange(a, b);
        });
    }

    function applyLinePrefix(prefix: string) {
        const el = ref.current;
        if (!el) return;
        const start = el.selectionStart ?? 0;
        const before = value.slice(0, start);
        const lineStart = before.lastIndexOf('\n') + 1;
        const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
        onChange(next);
        requestAnimationFrame(() => {
            el.focus();
            const pos = start + prefix.length;
            el.setSelectionRange(pos, pos);
        });
    }

    return (
        <div className="overflow-hidden rounded-md border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <div className="flex items-center justify-end gap-1 border-b border-input bg-muted/30 px-2 py-1.5 text-muted-foreground">
                <ToolbarButton onClick={() => applyLinePrefix('## ')} aria-label="Heading 2">
                    <Heading2 className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => applyLinePrefix('- ')} aria-label="Bullet list">
                    <List className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => applyWrap('_')} aria-label="Italic">
                    <Italic className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => applyWrap('**')} aria-label="Bold">
                    <Bold className="h-3.5 w-3.5" />
                </ToolbarButton>
            </div>
            <textarea
                ref={ref}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                className={`w-full resize-y bg-transparent px-3 py-2 text-sm outline-none ${className}`}
                {...rest}
            />
        </div>
    );
});

function ToolbarButton({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            {...rest}
            className="rounded p-1 transition hover:bg-muted hover:text-foreground"
        >
            {children}
        </button>
    );
}

export default RichTextarea;
