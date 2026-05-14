import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, useForm, usePage } from '@inertiajs/react'
import { Save, Monitor, Tablet, Smartphone, RefreshCw, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useStorageUrl } from '@/lib/storage'

// ─── Types ──────────────────────────────────────────────────────────────────

interface SiteTextRow {
    id?: number
    section: string
    key: string
    value_ar: string | null
    value_en: string | null
}

interface Settings {
    identity: { site_name_ar: string; site_name_en: string; site_logo: string | null; site_logo_dark: string | null; site_favicon: string | null }
    colors: { primary_color: string; secondary_color: string; accent_color: string; dark_primary_color: string; dark_secondary_color: string; dark_accent_color: string }
    typography: { font_family: string }
    hero: { hero_title_ar: string; hero_title_en: string; hero_subtitle_ar: string; hero_subtitle_en: string }
    footer: { footer_text_ar: string; footer_text_en: string }
    social: { social_twitter: string; social_instagram: string; social_linkedin: string; social_facebook: string }
    media: { hero_image: string | null }
}

interface Props {
    tenant: { id: number; slug: string; name: string }
    settings: Settings
    siteTexts: Record<string, SiteTextRow[]>
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PREVIEW_MESSAGE_TYPE = 'tenant-site-branding-preview'
const PREVIEW_READY_TYPE = 'tenant-site-branding-preview-ready'

type Viewport = 'desktop' | 'tablet' | 'mobile'
const VIEWPORT_WIDTHS: Record<Viewport, string> = { desktop: '100%', tablet: '768px', mobile: '375px' }

const FONT_OPTIONS = ['Cairo', 'Almarai', 'Tajawal', 'Amiri', 'Public Sans']

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'تخصيص الموقع', href: '/client-admin/site-branding' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result))
        r.onerror = reject
        r.readAsDataURL(file)
    })
}

// Flatten the grouped site_texts (object keyed by section) into a flat array
// the form submits, while letting the editor render section blocks.
function flattenSiteTexts(grouped: Record<string, SiteTextRow[]>): SiteTextRow[] {
    return Object.values(grouped).flat()
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SiteBranding() {
    const { tenant, settings, siteTexts } = usePage().props as unknown as Props
    const storageUrl = useStorageUrl()

    const flatTexts = useMemo(() => flattenSiteTexts(siteTexts), [siteTexts])

    const { data, setData, post, processing } = useForm({
        site_logo: null as File | null,
        hero_image: null as File | null,
        hero_title_ar: settings.hero.hero_title_ar ?? '',
        hero_title_en: settings.hero.hero_title_en ?? '',
        hero_subtitle_ar: settings.hero.hero_subtitle_ar ?? '',
        hero_subtitle_en: settings.hero.hero_subtitle_en ?? '',
        primary_color: settings.colors.primary_color || '#0E1738',
        secondary_color: settings.colors.secondary_color || '#B48A4A',
        accent_color: settings.colors.accent_color || '',
        font_family: settings.typography.font_family || 'Cairo',
        footer_text_ar: settings.footer.footer_text_ar ?? '',
        footer_text_en: settings.footer.footer_text_en ?? '',
        social_twitter: settings.social.social_twitter ?? '',
        social_instagram: settings.social.social_instagram ?? '',
        social_linkedin: settings.social.social_linkedin ?? '',
        social_facebook: settings.social.social_facebook ?? '',
        texts: flatTexts as SiteTextRow[],
    })

    // Data URLs for staged image uploads — sent to the iframe so the live
    // preview shows the new image before it's actually persisted.
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
    const [heroImagePreviewUrl, setHeroImagePreviewUrl] = useState<string | null>(null)

    // Preview iframe
    const iframeRef = useRef<HTMLIFrameElement | null>(null)
    const [viewport, setViewport] = useState<Viewport>('desktop')
    const [iframeNonce, setIframeNonce] = useState(0)
    const [iframeOrigin, setIframeOrigin] = useState<string | null>(null)
    const previewUrl = `/hotel/${tenant.slug}?preview=1&_nonce=${iframeNonce}`

    // Build the textsByGroup view from the flat data for rendering
    const textsByGroup = useMemo(() => {
        const out: Record<string, SiteTextRow[]> = {}
        data.texts.forEach((t) => {
            if (!out[t.section]) out[t.section] = []
            out[t.section].push(t)
        })
        return out
    }, [data.texts])

    const updateText = (idx: number, patch: Partial<SiteTextRow>) => {
        setData('texts', data.texts.map((t, i) => (i === idx ? { ...t, ...patch } : t)))
    }

    // ── Overrides streamed to the iframe ────────────────────────────────────
    const overrides = useMemo(() => {
        const siteTextsMap: Record<string, Record<string, { value_ar: string; value_en: string }>> = {}
        data.texts.forEach((t) => {
            if (!siteTextsMap[t.section]) siteTextsMap[t.section] = {}
            siteTextsMap[t.section][t.key] = {
                value_ar: t.value_ar ?? '',
                value_en: t.value_en ?? '',
            }
        })

        return {
            identity: {
                site_logo: logoPreviewUrl ?? settings.identity.site_logo ?? null,
            },
            media: {
                hero_image: heroImagePreviewUrl ?? settings.media.hero_image ?? null,
            },
            colors: {
                primary_color: data.primary_color,
                secondary_color: data.secondary_color,
                accent_color: data.accent_color,
            },
            typography: { font_family: data.font_family },
            hero: {
                hero_title_ar: data.hero_title_ar,
                hero_title_en: data.hero_title_en,
                hero_subtitle_ar: data.hero_subtitle_ar,
                hero_subtitle_en: data.hero_subtitle_en,
            },
            footer: {
                footer_text_ar: data.footer_text_ar,
                footer_text_en: data.footer_text_en,
            },
            social: {
                social_twitter: data.social_twitter,
                social_instagram: data.social_instagram,
                social_linkedin: data.social_linkedin,
                social_facebook: data.social_facebook,
            },
            siteTexts: siteTextsMap,
        }
    }, [data, logoPreviewUrl, heroImagePreviewUrl, settings.identity.site_logo, settings.media.hero_image])

    useEffect(() => { setIframeOrigin(null) }, [iframeNonce])

    useEffect(() => {
        if (!iframeOrigin) return
        const win = iframeRef.current?.contentWindow
        if (!win) return
        win.postMessage({ type: PREVIEW_MESSAGE_TYPE, overrides }, iframeOrigin)
    }, [overrides, iframeOrigin])

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.source !== iframeRef.current?.contentWindow) return
            const data = event.data as { type?: string } | null
            if (!data || data.type !== PREVIEW_READY_TYPE) return
            setIframeOrigin(event.origin)
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [])

    // ── Handlers ────────────────────────────────────────────────────────────

    const onLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null
        setData('site_logo', file)
        setLogoPreviewUrl(file ? await fileToDataUrl(file) : null)
    }

    const onHeroImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null
        setData('hero_image', file)
        setHeroImagePreviewUrl(file ? await fileToDataUrl(file) : null)
    }

    const submit = (e: FormEvent) => {
        e.preventDefault()
        post(route('client-admin.site-branding.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setLogoPreviewUrl(null)
                setHeroImagePreviewUrl(null)
                setIframeNonce((n) => n + 1) // reload iframe to pick up new file URLs
            },
        })
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="تخصيص الموقع" />

            <form onSubmit={submit} className="grid h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-[420px_1fr] gap-3 p-3">
                {/* ─── Editor column ────────────────────────────────────── */}
                <div className="flex flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="flex items-center justify-between border-b p-3">
                        <h1 className="text-base font-bold">تخصيص الموقع</h1>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                            <Save className="h-3.5 w-3.5" /> حفظ
                        </button>
                    </div>

                    <div className="space-y-4 overflow-y-auto p-3">
                        <Section title="الشعار">
                            <FileField
                                label="ارفع شعار جديد"
                                accept="image/*"
                                onChange={onLogoChange}
                                preview={logoPreviewUrl ?? storageUrl(settings.identity.site_logo) ?? null}
                            />
                        </Section>

                        <Section title="صورة الـ Hero">
                            <FileField
                                label="ارفع صورة الخلفية"
                                accept="image/*"
                                onChange={onHeroImageChange}
                                preview={heroImagePreviewUrl ?? storageUrl(settings.media.hero_image) ?? null}
                            />
                        </Section>

                        <Section title="نص الـ Hero">
                            <TextField label="العنوان (عربي)" value={data.hero_title_ar} onChange={(v) => setData('hero_title_ar', v)} dir="rtl" />
                            <TextField label="Title (EN)" value={data.hero_title_en} onChange={(v) => setData('hero_title_en', v)} />
                            <TextField label="العنوان الفرعي (عربي)" value={data.hero_subtitle_ar} onChange={(v) => setData('hero_subtitle_ar', v)} dir="rtl" />
                            <TextField label="Subtitle (EN)" value={data.hero_subtitle_en} onChange={(v) => setData('hero_subtitle_en', v)} />
                        </Section>

                        <Section title="الألوان والخط">
                            <ColorField label="اللون الرئيسي" value={data.primary_color} onChange={(v) => setData('primary_color', v)} />
                            <ColorField label="اللون الفرعي" value={data.secondary_color} onChange={(v) => setData('secondary_color', v)} />
                            <ColorField label="لون التمييز" value={data.accent_color} onChange={(v) => setData('accent_color', v)} />
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">الخط</label>
                                <select
                                    value={data.font_family}
                                    onChange={(e) => setData('font_family', e.target.value)}
                                    className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                                >
                                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                        </Section>

                        <Section title="التذييل">
                            <TextField label="نص التذييل (عربي)" value={data.footer_text_ar} onChange={(v) => setData('footer_text_ar', v)} dir="rtl" />
                            <TextField label="Footer text (EN)" value={data.footer_text_en} onChange={(v) => setData('footer_text_en', v)} />
                        </Section>

                        <Section title="الشبكات الاجتماعية">
                            <TextField label="Twitter / X" value={data.social_twitter} onChange={(v) => setData('social_twitter', v)} />
                            <TextField label="Instagram" value={data.social_instagram} onChange={(v) => setData('social_instagram', v)} />
                            <TextField label="LinkedIn" value={data.social_linkedin} onChange={(v) => setData('social_linkedin', v)} />
                            <TextField label="Facebook" value={data.social_facebook} onChange={(v) => setData('social_facebook', v)} />
                        </Section>

                        {Object.keys(textsByGroup).length > 0 && (
                            <Section title="نصوص الصفحة (حسب القسم)">
                                {Object.entries(textsByGroup).map(([section, rows]) => (
                                    <div key={section} className="rounded-md border p-2">
                                        <div className="mb-2 text-xs font-bold uppercase text-muted-foreground">{section}</div>
                                        {rows.map((row) => {
                                            const idx = data.texts.findIndex((t) => t.section === row.section && t.key === row.key)
                                            return (
                                                <div key={`${row.section}.${row.key}`} className="mb-2 space-y-1">
                                                    <div className="text-[10px] text-muted-foreground">{row.key}</div>
                                                    <input
                                                        type="text"
                                                        dir="rtl"
                                                        placeholder="عربي"
                                                        value={row.value_ar ?? ''}
                                                        onChange={(e) => updateText(idx, { value_ar: e.target.value })}
                                                        className="w-full rounded border bg-background px-2 py-1 text-xs"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="English"
                                                        value={row.value_en ?? ''}
                                                        onChange={(e) => updateText(idx, { value_en: e.target.value })}
                                                        className="w-full rounded border bg-background px-2 py-1 text-xs"
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </Section>
                        )}
                    </div>
                </div>

                {/* ─── Preview column ───────────────────────────────────── */}
                <div className="flex flex-col overflow-hidden rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between border-b bg-card p-2">
                        <div className="flex gap-1">
                            <ViewportButton current={viewport} value="desktop" onClick={setViewport} Icon={Monitor} />
                            <ViewportButton current={viewport} value="tablet" onClick={setViewport} Icon={Tablet} />
                            <ViewportButton current={viewport} value="mobile" onClick={setViewport} Icon={Smartphone} />
                        </div>
                        <button
                            type="button"
                            onClick={() => setIframeNonce((n) => n + 1)}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
                            title="إعادة التحميل"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-3">
                        <div
                            className="mx-auto h-full overflow-hidden rounded-lg border bg-background shadow"
                            style={{ width: VIEWPORT_WIDTHS[viewport] }}
                        >
                            <iframe
                                ref={iframeRef}
                                key={iframeNonce}
                                src={previewUrl}
                                title="معاينة الموقع"
                                className="h-full w-full"
                            />
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    )
}

// ─── UI bits ────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2 rounded-md border bg-background p-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
            <div className="space-y-2">{children}</div>
        </div>
    )
}

function TextField({ label, value, onChange, dir }: { label: string; value: string; onChange: (v: string) => void; dir?: 'rtl' | 'ltr' }) {
    return (
        <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{label}</label>
            <input
                type="text"
                dir={dir}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            />
        </div>
    )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={value || '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    dir="ltr"
                    className="flex-1 rounded-md border bg-background px-2 py-1.5 font-mono text-xs"
                />
            </div>
        </div>
    )
}

function FileField({ label, accept, onChange, preview }: { label: string; accept: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void; preview: string | null }) {
    return (
        <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-accent">
                <Upload className="h-3.5 w-3.5" />
                <span>{label}</span>
                <input type="file" accept={accept} onChange={onChange} className="hidden" />
            </label>
            {preview && (
                <img src={preview} alt="" className="max-h-24 w-full rounded border bg-white object-contain p-1" />
            )}
        </div>
    )
}

function ViewportButton({ current, value, onClick, Icon }: { current: Viewport; value: Viewport; onClick: (v: Viewport) => void; Icon: React.ComponentType<{ className?: string }> }) {
    return (
        <button
            type="button"
            onClick={() => onClick(value)}
            className={`rounded-md border px-2 py-1 text-xs ${current === value ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
            title={value}
        >
            <Icon className="h-3.5 w-3.5" />
        </button>
    )
}
