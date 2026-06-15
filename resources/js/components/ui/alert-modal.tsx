import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Lightweight, project-styled replacement for window.alert — an overlay + card
 * with a warning icon, message and an OK button. RTL-aware.
 */
export default function AlertModal({
    open,
    title,
    message,
    onClose,
}: {
    open: boolean;
    title?: string;
    message: string | null;
    onClose: () => void;
}) {
    if (!open || !message) return null;
    const isArabic = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
            <div
                role="alertdialog"
                aria-modal="true"
                dir={isArabic ? 'rtl' : 'ltr'}
                className="relative z-10 w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl"
            >
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <h3 className="text-base font-semibold">{title ?? (isArabic ? 'تنبيه' : 'Notice')}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label={isArabic ? 'إغلاق' : 'Close'}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{message}</p>

                <div className="mt-6 flex justify-end">
                    <Button type="button" onClick={onClose}>
                        {isArabic ? 'حسناً' : 'OK'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
