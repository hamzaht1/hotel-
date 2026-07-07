import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, useForm, usePage } from '@inertiajs/react'
import { Save, Monitor, Tablet, Smartphone, RefreshCw, Upload, Plus } from 'lucide-react'
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

interface ContactData {
    whatsapp: string | null
    phone: string | null
    email: string | null
    address_ar: string | null
    address_en: string | null
    google_maps_url: string | null
    facebook: string | null
    instagram: string | null
    twitter: string | null
    tiktok: string | null
    snapchat: string | null
}

interface Props {
    tenant: { id: number; slug: string; name: string }
    settings: Settings
    siteTexts: Record<string, SiteTextRow[]>
    contact: ContactData
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PREVIEW_MESSAGE_TYPE = 'tenant-site-branding-preview'
const PREVIEW_READY_TYPE = 'tenant-site-branding-preview-ready'
const PREVIEW_SECTION_CLICK_TYPE = 'tenant-site-branding-section-click'

// Maps a clicked preview zone (data-preview-section) to the editor block — or
// generic text-group — that holds its fields, so we can scroll to it.
const SECTION_TO_EDITOR_ID: Record<string, string> = {
    hero: 'sec-hero',
    services: 'sec-services',
    additional_services: 'sec-additional-services',
    footer: 'sec-footer',
    contact: 'sec-contact',
    rooms: 'sec-text-rooms',
    testimonials: 'sec-text-testimonials',
    gallery: 'sec-text-gallery',
}

type Viewport = 'desktop' | 'tablet' | 'mobile'
const VIEWPORT_WIDTHS: Record<Viewport, string> = { desktop: '100%', tablet: '768px', mobile: '375px' }

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
    const { tenant, settings, siteTexts, contact } = usePage().props as unknown as Props
    const storageUrl = useStorageUrl()

    const flatTexts = useMemo(() => flattenSiteTexts(siteTexts), [siteTexts])

    const { data, setData, post, processing } = useForm({
        site_logo: null as File | null,
        site_logo_dark: null as File | null,
        hero_image: null as File | null,
        hero_image_2: null as File | null,
        additional_service_1_image: null as File | null,
        additional_service_2_image: null as File | null,
        additional_service_3_image: null as File | null,
        additional_service_4_image: null as File | null,
        services_item_1_image: null as File | null,
        services_item_2_image: null as File | null,
        services_item_3_image: null as File | null,
        services_item_4_image: null as File | null,
        services_item_5_image: null as File | null,
        services_item_6_image: null as File | null,
        social_twitter: settings.social.social_twitter ?? '',
        social_instagram: settings.social.social_instagram ?? '',
        social_linkedin: settings.social.social_linkedin ?? '',
        social_facebook: settings.social.social_facebook ?? '',
        texts: flatTexts as SiteTextRow[],
        contact: {
            whatsapp: contact?.whatsapp ?? '',
            phone: contact?.phone ?? '',
            email: contact?.email ?? '',
            address_ar: contact?.address_ar ?? '',
            address_en: contact?.address_en ?? '',
            google_maps_url: contact?.google_maps_url ?? '',
            facebook: contact?.facebook ?? '',
            instagram: contact?.instagram ?? '',
            twitter: contact?.twitter ?? '',
            tiktok: contact?.tiktok ?? '',
            snapchat: contact?.snapchat ?? '',
        },
    })

    const setContact = (patch: Partial<ContactData>) => {
        setData('contact', { ...data.contact, ...patch } as typeof data.contact)
    }

    const addTextRow = (section: string) => {
        const key = window.prompt(`نص جديد لقسم "${section}" — أدخل مفتاحاً (مثل: cta_label)`)
        if (!key) return
        if (data.texts.some((t) => t.section === section && t.key === key)) {
            window.alert('هذا المفتاح موجود مسبقاً')
            return
        }
        setData('texts', [...data.texts, { section, key, value_ar: '', value_en: '' }])
    }

    // Data URLs for staged image uploads — sent to the iframe so the live
    // preview shows the new image before it's actually persisted.
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
    const [logoDarkPreviewUrl, setLogoDarkPreviewUrl] = useState<string | null>(null)
    const [heroImagePreviewUrl, setHeroImagePreviewUrl] = useState<string | null>(null)
    const [heroImage2PreviewUrl, setHeroImage2PreviewUrl] = useState<string | null>(null)
    // Per-item preview URLs for the 4 Additional Services slots. Keyed 1..4 to
    // mirror the controller's additional_service_N_image keys.
    const [additionalServicePreviewUrls, setAdditionalServicePreviewUrls] = useState<Record<number, string | null>>({
        1: null, 2: null, 3: null, 4: null,
    })
    // Same pattern for the 6 mock Services items.
    const [servicesItemPreviewUrls, setServicesItemPreviewUrls] = useState<Record<number, string | null>>({
        1: null, 2: null, 3: null, 4: null, 5: null, 6: null,
    })

    // Convenience accessors/setters for the dedicated Hero slide blocks. Each
    // slide's title and subtitle are stored as site_texts entries so the live
    // preview and the templates both pick them up via the existing channel.
    // Generic getter/setter on the flat `texts` array. The dedicated Hero and
    // Footer blocks both use this so the values flow through the same site_texts
    // pipeline (live preview, upsert on save).
    const getText = (section: string, key: string, field: 'value_ar' | 'value_en'): string => {
        const row = data.texts.find((t) => t.section === section && t.key === key)
        return (row?.[field] as string | null) ?? ''
    }
    const setText = (section: string, key: string, field: 'value_ar' | 'value_en', value: string) => {
        const idx = data.texts.findIndex((t) => t.section === section && t.key === key)
        if (idx >= 0) {
            setData('texts', data.texts.map((t, i) => (i === idx ? { ...t, [field]: value } : t)))
        } else {
            setData('texts', [...data.texts, { section, key, value_ar: '', value_en: '', [field]: value }])
        }
    }
    const getSlideText = (key: string, field: 'value_ar' | 'value_en') => getText('hero', key, field)
    const setSlideText = (key: string, field: 'value_ar' | 'value_en', value: string) => setText('hero', key, field, value)
    const getFooterText = (key: string, field: 'value_ar' | 'value_en') => getText('footer', key, field)
    const setFooterText = (key: string, field: 'value_ar' | 'value_en', value: string) => setText('footer', key, field, value)
    const getAddSvcText = (key: string, field: 'value_ar' | 'value_en') => getText('additional_services', key, field)
    const setAddSvcText = (key: string, field: 'value_ar' | 'value_en', value: string) => setText('additional_services', key, field, value)
    const getSvcText = (key: string, field: 'value_ar' | 'value_en') => getText('services', key, field)
    const setSvcText = (key: string, field: 'value_ar' | 'value_en', value: string) => setText('services', key, field, value)

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
                site_logo_dark: logoDarkPreviewUrl ?? settings.identity.site_logo_dark ?? null,
            },
            media: {
                hero_image: heroImagePreviewUrl ?? settings.media.hero_image ?? null,
                hero_image_2: heroImage2PreviewUrl ?? (settings.media as { hero_image_2?: string | null }).hero_image_2 ?? null,
                additional_service_1_image: additionalServicePreviewUrls[1] ?? (settings.media as Record<string, string | null>).additional_service_1_image ?? null,
                additional_service_2_image: additionalServicePreviewUrls[2] ?? (settings.media as Record<string, string | null>).additional_service_2_image ?? null,
                additional_service_3_image: additionalServicePreviewUrls[3] ?? (settings.media as Record<string, string | null>).additional_service_3_image ?? null,
                additional_service_4_image: additionalServicePreviewUrls[4] ?? (settings.media as Record<string, string | null>).additional_service_4_image ?? null,
                services_item_1_image: servicesItemPreviewUrls[1] ?? (settings.media as Record<string, string | null>).services_item_1_image ?? null,
                services_item_2_image: servicesItemPreviewUrls[2] ?? (settings.media as Record<string, string | null>).services_item_2_image ?? null,
                services_item_3_image: servicesItemPreviewUrls[3] ?? (settings.media as Record<string, string | null>).services_item_3_image ?? null,
                services_item_4_image: servicesItemPreviewUrls[4] ?? (settings.media as Record<string, string | null>).services_item_4_image ?? null,
                services_item_5_image: servicesItemPreviewUrls[5] ?? (settings.media as Record<string, string | null>).services_item_5_image ?? null,
                services_item_6_image: servicesItemPreviewUrls[6] ?? (settings.media as Record<string, string | null>).services_item_6_image ?? null,
            },
            social: {
                social_twitter: data.social_twitter,
                social_instagram: data.social_instagram,
                social_linkedin: data.social_linkedin,
                social_facebook: data.social_facebook,
            },
            siteTexts: siteTextsMap,
        }
    }, [data, logoPreviewUrl, logoDarkPreviewUrl, heroImagePreviewUrl, heroImage2PreviewUrl, additionalServicePreviewUrls, servicesItemPreviewUrls, settings.identity.site_logo, settings.identity.site_logo_dark, settings.media])

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
            const data = event.data as { type?: string; section?: string } | null
            if (!data) return
            if (data.type === PREVIEW_READY_TYPE) {
                setIframeOrigin(event.origin)
            } else if (data.type === PREVIEW_SECTION_CLICK_TYPE && data.section) {
                // Click-to-edit: scroll the matching editor block into view and
                // flash a highlight so the user immediately sees its fields.
                const id = SECTION_TO_EDITOR_ID[data.section]
                const el = id ? document.getElementById(id) : null
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    el.classList.add('ring-2', 'ring-primary')
                    const firstField = el.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
                    firstField?.focus({ preventScroll: true })
                    window.setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 1800)
                }
            }
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

    const onLogoDarkChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null
        setData('site_logo_dark', file)
        setLogoDarkPreviewUrl(file ? await fileToDataUrl(file) : null)
    }

    const onHeroImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null
        setData('hero_image', file)
        setHeroImagePreviewUrl(file ? await fileToDataUrl(file) : null)
    }

    const onHeroImage2Change = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null
        setData('hero_image_2', file)
        setHeroImage2PreviewUrl(file ? await fileToDataUrl(file) : null)
    }

    const onAdditionalServiceImageChange = async (slot: 1 | 2 | 3 | 4, e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null
        const fieldKey = `additional_service_${slot}_image` as 'additional_service_1_image'
        setData(fieldKey, file)
        const preview = file ? await fileToDataUrl(file) : null
        setAdditionalServicePreviewUrls((prev) => ({ ...prev, [slot]: preview }))
    }

    const onServicesItemImageChange = async (slot: 1 | 2 | 3 | 4 | 5 | 6, e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null
        const fieldKey = `services_item_${slot}_image` as 'services_item_1_image'
        setData(fieldKey, file)
        const preview = file ? await fileToDataUrl(file) : null
        setServicesItemPreviewUrls((prev) => ({ ...prev, [slot]: preview }))
    }

    const submit = (e: FormEvent) => {
        e.preventDefault()
        post(route('client-admin.site-branding.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setLogoPreviewUrl(null)
                setLogoDarkPreviewUrl(null)
                setHeroImagePreviewUrl(null)
                setHeroImage2PreviewUrl(null)
                setAdditionalServicePreviewUrls({ 1: null, 2: null, 3: null, 4: null })
                setServicesItemPreviewUrls({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null })
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
                                label="الشعار (الوضع الفاتح) · Logo (light)"
                                accept="image/*"
                                onChange={onLogoChange}
                                preview={logoPreviewUrl ?? storageUrl(settings.identity.site_logo) ?? null}
                            />
                            <FileField
                                label="الشعار (الوضع الداكن) · Logo (dark)"
                                accept="image/*"
                                onChange={onLogoDarkChange}
                                preview={logoDarkPreviewUrl ?? storageUrl(settings.identity.site_logo_dark) ?? null}
                            />
                            <p className="text-[11px] text-muted-foreground">
                                ⓘ يظهر الشعار الداكن تلقائياً عند تفعيل الوضع الداكن في الموقع.
                            </p>
                        </Section>

                        <Section id="sec-hero" title="الـ Hero — الشريحة الأولى">
                            <FileField
                                label="صورة الشريحة 1"
                                accept="image/*"
                                onChange={onHeroImageChange}
                                preview={heroImagePreviewUrl ?? storageUrl(settings.media.hero_image) ?? null}
                            />
                            <TextField label="العنوان (عربي)" value={getSlideText('title', 'value_ar')} onChange={(v) => setSlideText('title', 'value_ar', v)} dir="rtl" />
                            <TextField label="Title (EN)" value={getSlideText('title', 'value_en')} onChange={(v) => setSlideText('title', 'value_en', v)} />
                            <TextField label="العنوان الفرعي (عربي)" value={getSlideText('subtitle', 'value_ar')} onChange={(v) => setSlideText('subtitle', 'value_ar', v)} dir="rtl" />
                            <TextField label="Subtitle (EN)" value={getSlideText('subtitle', 'value_en')} onChange={(v) => setSlideText('subtitle', 'value_en', v)} />
                        </Section>

                        <Section title="الـ Hero — الشريحة الثانية">
                            <FileField
                                label="صورة الشريحة 2"
                                accept="image/*"
                                onChange={onHeroImage2Change}
                                preview={heroImage2PreviewUrl ?? storageUrl((settings.media as { hero_image_2?: string | null }).hero_image_2) ?? null}
                            />
                            <TextField label="العنوان (عربي)" value={getSlideText('title_2', 'value_ar')} onChange={(v) => setSlideText('title_2', 'value_ar', v)} dir="rtl" />
                            <TextField label="Title (EN)" value={getSlideText('title_2', 'value_en')} onChange={(v) => setSlideText('title_2', 'value_en', v)} />
                            <TextField label="العنوان الفرعي (عربي)" value={getSlideText('subtitle_2', 'value_ar')} onChange={(v) => setSlideText('subtitle_2', 'value_ar', v)} dir="rtl" />
                            <TextField label="Subtitle (EN)" value={getSlideText('subtitle_2', 'value_en')} onChange={(v) => setSlideText('subtitle_2', 'value_en', v)} />
                        </Section>

                        <Section id="sec-additional-services" title="الخدمات الأخرى · Additional Services">
                            <TextField label="عنوان القسم (عربي)" value={getAddSvcText('title', 'value_ar')} onChange={(v) => setAddSvcText('title', 'value_ar', v)} dir="rtl" />
                            <TextField label="Section title (EN)" value={getAddSvcText('title', 'value_en')} onChange={(v) => setAddSvcText('title', 'value_en', v)} />
                            <TextField label="وصف القسم (عربي)" value={getAddSvcText('description', 'value_ar')} onChange={(v) => setAddSvcText('description', 'value_ar', v)} dir="rtl" />
                            <TextField label="Section description (EN)" value={getAddSvcText('description', 'value_en')} onChange={(v) => setAddSvcText('description', 'value_en', v)} />

                            {([1, 2, 3, 4] as const).map((n) => (
                                <div key={n} className="rounded-md border p-2 space-y-2">
                                    <div className="text-xs font-bold uppercase text-muted-foreground">Service {n}</div>
                                    <FileField
                                        label={`صورة الخدمة ${n}`}
                                        accept="image/*"
                                        onChange={(e) => onAdditionalServiceImageChange(n, e)}
                                        preview={additionalServicePreviewUrls[n] ?? storageUrl((settings.media as Record<string, string | null>)[`additional_service_${n}_image`]) ?? null}
                                    />
                                    <TextField label="العنوان (عربي)" value={getAddSvcText(`service_${n}_title`, 'value_ar')} onChange={(v) => setAddSvcText(`service_${n}_title`, 'value_ar', v)} dir="rtl" />
                                    <TextField label="Title (EN)" value={getAddSvcText(`service_${n}_title`, 'value_en')} onChange={(v) => setAddSvcText(`service_${n}_title`, 'value_en', v)} />
                                    <TextField label="الوصف (عربي)" value={getAddSvcText(`service_${n}_description`, 'value_ar')} onChange={(v) => setAddSvcText(`service_${n}_description`, 'value_ar', v)} dir="rtl" />
                                    <TextField label="Description (EN)" value={getAddSvcText(`service_${n}_description`, 'value_en')} onChange={(v) => setAddSvcText(`service_${n}_description`, 'value_en', v)} />
                                </div>
                            ))}
                        </Section>

                        <Section id="sec-services" title="المساج · Services">
                            <TextField label="عنوان القسم (عربي)" value={getSvcText('title', 'value_ar')} onChange={(v) => setSvcText('title', 'value_ar', v)} dir="rtl" />
                            <TextField label="Section title (EN)" value={getSvcText('title', 'value_en')} onChange={(v) => setSvcText('title', 'value_en', v)} />
                            <TextField label="العنوان الفرعي (عربي)" value={getSvcText('subtitle', 'value_ar')} onChange={(v) => setSvcText('subtitle', 'value_ar', v)} dir="rtl" />
                            <TextField label="Subtitle (EN)" value={getSvcText('subtitle', 'value_en')} onChange={(v) => setSvcText('subtitle', 'value_en', v)} />
                            <TextField label="نص الخلفية (عربي)" value={getSvcText('background_title', 'value_ar')} onChange={(v) => setSvcText('background_title', 'value_ar', v)} dir="rtl" />
                            <TextField label="Background title (EN)" value={getSvcText('background_title', 'value_en')} onChange={(v) => setSvcText('background_title', 'value_en', v)} />

                            <p className="text-[11px] text-muted-foreground">
                                ⓘ هذه العناصر تظهر فقط إذا لم تنشئ خدمات حقيقية من صفحة الخدمات. أنشئ خدمات من <code>/client-admin/services</code> لاستبدالها.
                            </p>

                            {([1, 2, 3, 4, 5, 6] as const).map((n) => (
                                <div key={n} className="rounded-md border p-2 space-y-2">
                                    <div className="text-xs font-bold uppercase text-muted-foreground">Item {n}</div>
                                    <FileField
                                        label={`صورة ${n}`}
                                        accept="image/*"
                                        onChange={(e) => onServicesItemImageChange(n, e)}
                                        preview={servicesItemPreviewUrls[n] ?? storageUrl((settings.media as Record<string, string | null>)[`services_item_${n}_image`]) ?? null}
                                    />
                                    <TextField label="الاسم (عربي)" value={getSvcText(`item_${n}_title`, 'value_ar')} onChange={(v) => setSvcText(`item_${n}_title`, 'value_ar', v)} dir="rtl" />
                                    <TextField label="Name (EN)" value={getSvcText(`item_${n}_title`, 'value_en')} onChange={(v) => setSvcText(`item_${n}_title`, 'value_en', v)} />
                                    <TextField label="الوصف (عربي)" value={getSvcText(`item_${n}_description`, 'value_ar')} onChange={(v) => setSvcText(`item_${n}_description`, 'value_ar', v)} dir="rtl" />
                                    <TextField label="Description (EN)" value={getSvcText(`item_${n}_description`, 'value_en')} onChange={(v) => setSvcText(`item_${n}_description`, 'value_en', v)} />
                                </div>
                            ))}
                        </Section>

                        <Section id="sec-footer" title="التذييل · Footer">
                            <TextField label="العنوان (عربي)" value={getFooterText('title', 'value_ar')} onChange={(v) => setFooterText('title', 'value_ar', v)} dir="rtl" />
                            <TextField label="Title (EN)" value={getFooterText('title', 'value_en')} onChange={(v) => setFooterText('title', 'value_en', v)} />
                            <TextField label="الوصف (عربي)" value={getFooterText('description', 'value_ar')} onChange={(v) => setFooterText('description', 'value_ar', v)} dir="rtl" />
                            <TextField label="Description (EN)" value={getFooterText('description', 'value_en')} onChange={(v) => setFooterText('description', 'value_en', v)} />
                        </Section>

                        <Section title="الشبكات الاجتماعية">
                            <TextField label="Twitter / X" value={data.social_twitter} onChange={(v) => setData('social_twitter', v)} />
                            <TextField label="Instagram" value={data.social_instagram} onChange={(v) => setData('social_instagram', v)} />
                            <TextField label="LinkedIn" value={data.social_linkedin} onChange={(v) => setData('social_linkedin', v)} />
                            <TextField label="Facebook" value={data.social_facebook} onChange={(v) => setData('social_facebook', v)} />
                        </Section>

                        <Section id="sec-contact" title="معلومات الاتصال · Contact">
                            <TextField label="WhatsApp" value={data.contact.whatsapp} onChange={(v) => setContact({ whatsapp: v })} />
                            <TextField label="الهاتف · Phone" value={data.contact.phone} onChange={(v) => setContact({ phone: v })} />
                            <TextField label="البريد · Email" type="email" value={data.contact.email} onChange={(v) => setContact({ email: v })} />
                            <TextField label="العنوان (عربي)" value={data.contact.address_ar} onChange={(v) => setContact({ address_ar: v })} dir="rtl" />
                            <TextField label="Address (EN)" value={data.contact.address_en} onChange={(v) => setContact({ address_en: v })} />
                            <TextField label="رابط خرائط جوجل · Google Maps URL" value={data.contact.google_maps_url} onChange={(v) => setContact({ google_maps_url: v })} />
                            <TextField label="Facebook" value={data.contact.facebook} onChange={(v) => setContact({ facebook: v })} />
                            <TextField label="Instagram" value={data.contact.instagram} onChange={(v) => setContact({ instagram: v })} />
                            <TextField label="Twitter" value={data.contact.twitter} onChange={(v) => setContact({ twitter: v })} />
                            <TextField label="TikTok" value={data.contact.tiktok} onChange={(v) => setContact({ tiktok: v })} />
                            <TextField label="Snapchat" value={data.contact.snapchat} onChange={(v) => setContact({ snapchat: v })} />
                        </Section>

                        <Section title="نصوص الصفحة (حسب القسم)">
                            {Object.entries(textsByGroup).map(([section, rows]) => (
                                <div key={section} id={`sec-text-${section}`} className="rounded-md border p-2 scroll-mt-2 transition-shadow duration-300">
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="text-xs font-bold uppercase text-muted-foreground">{section}</div>
                                        <button
                                            type="button"
                                            onClick={() => addTextRow(section)}
                                            className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] hover:bg-accent"
                                        >
                                            <Plus className="h-3 w-3" /> مفتاح
                                        </button>
                                    </div>
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
                        <span className="hidden text-[11px] text-muted-foreground md:inline">
                            ✏️ انقر على أي منطقة في المعاينة لفتح حقولها
                        </span>
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

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
    return (
        <div id={id} className="space-y-2 rounded-md border bg-background p-3 scroll-mt-2 transition-shadow duration-300">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
            <div className="space-y-2">{children}</div>
        </div>
    )
}

function TextField({ label, value, onChange, dir, type }: { label: string; value: string; onChange: (v: string) => void; dir?: 'rtl' | 'ltr'; type?: string }) {
    return (
        <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{label}</label>
            <input
                type={type ?? 'text'}
                dir={dir}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            />
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
