// resources/js/components/public/templates/index.tsx
import React, { useMemo, useState } from 'react'
import SectionTitle from './SectionTitle'
import BrowseMoreButton from './BrowseMoreButton'
import BackgroundSection from './BackgroundSection'
import FiltersBar from './FiltersBar'
import TemplatesGrid from './TemplatesGrid'
import { FILTERS, TEMPLATES, type Region, type RegionOption, type TemplateItem } from './constants'
import { useLang } from '@/hooks/useLang'
import { useStorageUrl } from '@/lib/storage'

import AnimatedHeading from '@/components/motion/AnimatedHeading'

interface DbTemplate {
  id: number; key: string;
  name_ar: string; name_en: string;
  city_ar: string | null; city_en: string | null;
  description_ar: string | null; description_en: string | null;
  preview_image: string | null; demo_url: string | null;
  is_active: boolean; is_coming_soon: boolean;
}

interface Props {
  dbTemplates?: DbTemplate[]
}

// Map the tenant template key/city to the region chip used by the filter bar.
const KEY_TO_REGION: Record<string, RegionOption> = {
  madina: 'madinah', madinah: 'madinah',
  mecca: 'makkah', makkah: 'makkah',
  jeddah: 'hijaz', hijaz: 'hijaz',
  riyadh: 'central', central: 'central',
  sulamani: 'sulamani',
}

/**
 * Templates component - Template showcase section
 * Prefers server-provided templates; falls back to the static TEMPLATES.
 */
export default function Templates({ dbTemplates }: Props) {
  const { __ } = useLang()
  const storageUrl = useStorageUrl()

  const items: TemplateItem[] = useMemo(() => {
    if (!dbTemplates || dbTemplates.length === 0) return TEMPLATES
    return dbTemplates.map<TemplateItem>((t, i) => ({
      id: t.id,
      src: storageUrl(t.preview_image) ?? TEMPLATES[i % TEMPLATES.length].src,
      title: t.name_ar || t.name_en,
      region: KEY_TO_REGION[t.key] ?? 'madinah',
      templateSlug: t.is_active && !t.is_coming_soon ? t.key : undefined,
      comingSoon: t.is_coming_soon || !t.is_active,
    }))
  }, [dbTemplates, storageUrl])

  // Active filter state (use localized "all")
  const [active, setActive] = useState<Region>('all')

  // Filter templates based on active region (active is a key)
  const filtered = useMemo(() => {
    if (active === 'all') return items
    return items.filter((t) => t.region === active)
  }, [active, items])

  return (
    <section id="templates">
        
      {/* Section title */}
      <SectionTitle />

      {/* Main content with background */}
      <BackgroundSection>

        <div className="relative mx-auto w-full 2xl:max-w-full 2xl:px-22 px-4 py-12 sm:py-20">
          {/* Section heading */}
          <AnimatedHeading dir="up" delay={0.25}>
                      <h3 className="text-center py-6 sm:py-0 text-white text-3xl sm:text-5xl  3xl:text-7xl font-bold">
                        <span className='mx-2 text-public-secondary'>
                           {__("messages.section_titles.templates.title")} 
                        </span>
                         {__("messages.section_titles.templates.subtitle")} 
                      </h3>
          </AnimatedHeading>

          {/* Region filter bar */}
          <FiltersBar filters={FILTERS} active={active} onChange={setActive} />

          {/* Templates grid display */}
          <TemplatesGrid items={filtered} />

          {/* Browse more button */}
          
          <BrowseMoreButton href="/templates" label={__("messages.templates_section.browse_more")} />
        </div>
      </BackgroundSection>
    </section>
  )
}
