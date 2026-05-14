import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { usePage } from '@inertiajs/react'

// Shape of the overrides streamed from the client-admin Site Branding editor
// into the tenant's live-preview iframe. Every section is optional — the
// editor only sends the slices the user has actually edited so far.
export type TenantPreviewOverrides = {
  identity?: Partial<{
    site_logo: string | null
    site_logo_dark: string | null
    site_favicon: string | null
  }>
  media?: Partial<{ hero_image: string | null }>
  colors?: Partial<{
    primary_color: string
    secondary_color: string
    accent_color: string
  }>
  typography?: Partial<{ font_family: string }>
  hero?: Partial<{
    hero_title_ar: string
    hero_title_en: string
    hero_subtitle_ar: string
    hero_subtitle_en: string
  }>
  footer?: Partial<{
    footer_text_ar: string
    footer_text_en: string
  }>
  social?: Partial<{
    social_twitter: string
    social_instagram: string
    social_linkedin: string
    social_facebook: string
  }>
  // section -> key -> { value_ar, value_en }
  siteTexts?: Record<string, Record<string, { value_ar?: string; value_en?: string }>>
}

export type TenantSiteSettings = {
  identity?: Record<string, string | null | undefined>
  media?: Record<string, string | null | undefined>
  colors?: Record<string, string | null | undefined>
  typography?: Record<string, string | null | undefined>
  hero?: Record<string, string | null | undefined>
  footer?: Record<string, string | null | undefined>
  social?: Record<string, string | null | undefined>
}

const PREVIEW_MESSAGE_TYPE = 'tenant-site-branding-preview'
const PREVIEW_READY_TYPE = 'tenant-site-branding-preview-ready'

const TenantPreviewContext = createContext<TenantPreviewOverrides | null>(null)

function isPreviewMode(): boolean {
  if (typeof window === 'undefined') return false
  if (window.parent === window) return false
  try {
    return new URLSearchParams(window.location.search).get('preview') === '1'
  } catch {
    return false
  }
}

// Wrap the tenant template tree with this provider so every section can pick
// up live edits from the client-admin Site Branding page when /hotel/{slug}
// is rendered inside the editor's iframe (?preview=1).
export function TenantPreviewOverridesProvider({ children }: PropsWithChildren) {
  const [overrides, setOverrides] = useState<TenantPreviewOverrides | null>(null)

  useEffect(() => {
    if (!isPreviewMode()) return

    const handler = (event: MessageEvent) => {
      if (event.source !== window.parent) return
      const data = event.data as { type?: string; overrides?: TenantPreviewOverrides } | null
      if (!data || data.type !== PREVIEW_MESSAGE_TYPE) return
      setOverrides(data.overrides ?? {})
    }

    window.addEventListener('message', handler)
    // Announce we're mounted so the parent can capture our real origin and
    // start broadcasting the current draft (including after a refresh).
    window.parent.postMessage({ type: PREVIEW_READY_TYPE }, '*')

    return () => window.removeEventListener('message', handler)
  }, [])

  return (
    <TenantPreviewContext.Provider value={overrides}>
      {children}
    </TenantPreviewContext.Provider>
  )
}

export function useTenantPreviewOverrides(): TenantPreviewOverrides | null {
  return useContext(TenantPreviewContext)
}

// Merges the globally-shared `siteSettings` prop (from HandleInertiaRequests)
// with live overrides streamed from the editor iframe so templates can stay
// agnostic about preview mode.
export function useTenantSiteSettings(): TenantSiteSettings {
  const pageProps = usePage().props as { siteSettings?: TenantSiteSettings }
  const overrides = useTenantPreviewOverrides()

  return useMemo(() => {
    const base = pageProps.siteSettings ?? {}
    if (!overrides) return base

    const merge = <T extends object>(a: T | undefined, b: Partial<T> | undefined): T | undefined => {
      if (!a && !b) return undefined
      return { ...(a ?? {}), ...(b ?? {}) } as T
    }

    return {
      identity: merge(base.identity, overrides.identity),
      media: merge(base.media, overrides.media),
      colors: merge(base.colors, overrides.colors),
      typography: merge(base.typography, overrides.typography),
      hero: merge(base.hero, overrides.hero),
      footer: merge(base.footer, overrides.footer),
      social: merge(base.social, overrides.social),
    }
  }, [pageProps.siteSettings, overrides])
}

// Merges server-side siteTexts (grouped { section: { key: row } }) with live
// edits from the editor. Components that already accept a `siteTexts` prop
// (e.g. HeroSection) can be fed this merged map; everything downstream keeps
// working identically.
export type SiteTextsGrouped = Record<string, Record<string, { value_ar?: string | null; value_en?: string | null }>>

export function useMergedSiteTexts(): SiteTextsGrouped {
  const pageProps = usePage().props as { siteTexts?: SiteTextsGrouped }
  const overrides = useTenantPreviewOverrides()

  return useMemo(() => {
    const base: SiteTextsGrouped = pageProps.siteTexts ?? {}
    if (!overrides?.siteTexts) return base
    const out: SiteTextsGrouped = { ...base }
    for (const [section, keys] of Object.entries(overrides.siteTexts)) {
      out[section] = { ...(base[section] ?? {}) }
      for (const [key, val] of Object.entries(keys)) {
        out[section][key] = { ...(out[section][key] ?? {}), ...val }
      }
    }
    return out
  }, [pageProps.siteTexts, overrides])
}

// Merges server-side siteTexts (grouped { section: { key: SiteTextRow } } )
// with any live edits from the editor.
export function useTenantSiteText(section: string, key: string, locale: 'ar' | 'en' = 'ar'): string {
  type ServerRow = { value_ar?: string | null; value_en?: string | null }
  type ServerGrouped = Record<string, Record<string, ServerRow>>
  const pageProps = usePage().props as { siteTexts?: ServerGrouped }
  const overrides = useTenantPreviewOverrides()

  const base = pageProps.siteTexts?.[section]?.[key]
  const draft = overrides?.siteTexts?.[section]?.[key]

  const value = locale === 'ar'
    ? (draft?.value_ar ?? base?.value_ar ?? '')
    : (draft?.value_en ?? base?.value_en ?? '')

  return value ?? ''
}
