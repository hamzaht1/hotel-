import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { usePage } from '@inertiajs/react'

// Shape of the overrides the super-admin Site Branding page can stream into
// the live preview iframe. Every field is optional — the bridge only sends
// the slices the user has actually edited so far.
export type PreviewOverrides = {
  identity?: Partial<{
    site_name_ar: string
    site_name_en: string
    site_logo: string | null
    site_logo_dark: string | null
    site_favicon: string | null
  }>
  colors?: Partial<{
    primary_color: string
    secondary_color: string
  }>
  typography?: Partial<{ font_family: string }>
  hero?: Partial<{
    hero_title_ar: string
    hero_title_en: string
    hero_subtitle_ar: string
    hero_subtitle_en: string
    hero_cta_ar: string
    hero_cta_en: string
  }>
  why_us?: Partial<{ why_us_title_ar: string; why_us_title_en: string }>
  how_we_work?: Partial<{ how_we_work_title_ar: string; how_we_work_title_en: string }>
  hotels_section?: Partial<{
    hotels_title_ar: string
    hotels_title_en: string
    hotels_subtitle_ar: string
    hotels_subtitle_en: string
    hotels_description_ar: string
    hotels_description_en: string
  }>
  testimonials_section?: Partial<{
    testimonials_title_ar: string
    testimonials_title_en: string
    testimonials_subtitle_ar: string
    testimonials_subtitle_en: string
  }>
  contact_section?: Partial<{
    contact_title_ar: string
    contact_title_en: string
    contact_subtitle_ar: string
    contact_subtitle_en: string
    contact_methods_title_ar: string
    contact_methods_title_en: string
    contact_button_text_ar: string
    contact_button_text_en: string
  }>
  contact_info?: Partial<{
    contact_address_ar: string
    contact_address_en: string
    contact_email: string
    contact_phone: string
  }>
  footer?: Partial<{
    footer_text_ar: string
    footer_text_en: string
    footer_business_number_ar: string
    footer_business_number_en: string
  }>
  social?: Partial<{
    social_twitter: string
    social_instagram: string
    social_linkedin: string
    social_facebook: string
  }>
}

export type ServerSiteSettings = {
  identity?: { site_name_ar?: string; site_name_en?: string; site_logo?: string | null; site_logo_dark?: string | null; site_favicon?: string | null }
  colors?: { primary_color?: string; secondary_color?: string }
  typography?: { font_family?: string }
  hero?: Record<string, string | null | undefined>
  why_us?: Record<string, string | null | undefined>
  how_we_work?: Record<string, string | null | undefined>
  hotels_section?: Record<string, string | null | undefined>
  testimonials_section?: Record<string, string | null | undefined>
  contact_section?: Record<string, string | null | undefined>
  contact_info?: Record<string, string | null | undefined>
  footer?: Record<string, string | null | undefined>
  social?: Record<string, string | null | undefined>
}

const PREVIEW_MESSAGE_TYPE = 'site-branding-preview'
const PREVIEW_READY_TYPE = 'site-branding-preview-ready'

const PreviewOverridesContext = createContext<PreviewOverrides | null>(null)

function isPreviewMode(): boolean {
  if (typeof window === 'undefined') return false
  if (window.parent === window) return false
  try {
    return new URLSearchParams(window.location.search).get('preview') === '1'
  } catch {
    return false
  }
}

// Mounted once at the top of the public layout. Listens for postMessage edits
// from the parent (super-admin) window and exposes them via context.
export function PreviewOverridesProvider({ children }: PropsWithChildren) {
  const [overrides, setOverrides] = useState<PreviewOverrides | null>(null)

  useEffect(() => {
    if (!isPreviewMode()) return

    const handler = (event: MessageEvent) => {
      if (event.source !== window.parent) return
      const data = event.data as { type?: string; overrides?: PreviewOverrides } | null
      if (!data || data.type !== PREVIEW_MESSAGE_TYPE) return
      setOverrides(data.overrides ?? {})
    }

    window.addEventListener('message', handler)
    // Tell the parent we are ready to receive the current draft state.
    window.parent.postMessage({ type: PREVIEW_READY_TYPE }, '*')

    return () => window.removeEventListener('message', handler)
  }, [])

  return (
    <PreviewOverridesContext.Provider value={overrides}>
      {children}
    </PreviewOverridesContext.Provider>
  )
}

export function usePreviewOverrides(): PreviewOverrides | null {
  return useContext(PreviewOverridesContext)
}

// Merges server-side site settings with any in-flight preview overrides so
// public components stay agnostic about whether they're rendering live edits
// or persisted state.
export function useSiteSettings(): ServerSiteSettings {
  const pageProps = usePage().props as { siteSettings?: ServerSiteSettings }
  const overrides = usePreviewOverrides()

  return useMemo(() => {
    const base = pageProps.siteSettings ?? {}
    if (!overrides) return base

    const merge = <T extends object>(a: T | undefined, b: Partial<T> | undefined): T | undefined => {
      if (!a && !b) return undefined
      return { ...(a ?? {}), ...(b ?? {}) } as T
    }

    return {
      identity: merge(base.identity, overrides.identity),
      colors: merge(base.colors, overrides.colors),
      typography: merge(base.typography, overrides.typography),
      hero: merge(base.hero, overrides.hero),
      why_us: merge(base.why_us, overrides.why_us),
      how_we_work: merge(base.how_we_work, overrides.how_we_work),
      hotels_section: merge(base.hotels_section, overrides.hotels_section),
      testimonials_section: merge(base.testimonials_section, overrides.testimonials_section),
      contact_section: merge(base.contact_section, overrides.contact_section),
      contact_info: merge(base.contact_info, overrides.contact_info),
      footer: merge(base.footer, overrides.footer),
      social: merge(base.social, overrides.social),
    }
  }, [pageProps.siteSettings, overrides])
}
