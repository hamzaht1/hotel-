import { Fragment, type ReactNode } from 'react'
import TemplateLayout from '@/layouts/TemplateLayout'
import HeroSection from './HeroSection'
import RoomsSection from './RoomsSection'
import ServicesSection from './ServicesSection'
import PartnersSection from './PartnersSection'
import TestimonialsSection from './TestimonialsSection'
import GallerySection from './GallerySection'
import GallerySlider from './GallerySlider'
import ContactSection from './ContactSection'
import { useTemplateT } from '@/hooks/useTemplateTranslations'
import {
  TenantPreviewOverridesProvider,
  useMergedSiteTexts,
} from '@/hooks/use-tenant-preview-overrides'

interface Props {
  tenant?: any;
  hotelSettings?: any;
  contactSettings?: any;
  rooms?: any[];
  services?: any[];
  gallery?: any[];
  reviews?: any[];
  siteTexts?: Record<string, any>;
  activeSections?: string[];
  templateTranslations?: any;
  locale?: string;
}

/**
 * قالب الرياض - قالب فندق احترافي مستوحى من العاصمة السعودية
 * Riyadh Template - Professional hotel template inspired by the Saudi capital
 */
export default function Riyadh(props: Props) {
  return (
    <TenantPreviewOverridesProvider>
      <RiyadhInner {...props} />
    </TenantPreviewOverridesProvider>
  )
}

function RiyadhInner({ tenant, hotelSettings, contactSettings, rooms, services, gallery, reviews, activeSections, locale }: Props) {
  const t = useTemplateT()
  const mergedTexts = useMergedSiteTexts()

  const sectionMap: Record<string, ReactNode> = {
    hero: <HeroSection hotelSettings={hotelSettings} siteTexts={mergedTexts} />,
    rooms: <RoomsSection rooms={rooms} />,
    services: <ServicesSection services={services} />,
    partners: <PartnersSection />,
    testimonials: <TestimonialsSection reviews={reviews} />,
    gallery: <GallerySection gallery={gallery} />,
    contact: <ContactSection contactSettings={contactSettings} tenant={tenant} />,
  }

  const useDynamic = Array.isArray(activeSections) && activeSections.length > 0

  return (
    <TemplateLayout
      title={hotelSettings?.hotel_name_ar || t('template.riyadh.title', 'قالب الرياض - فندق فاخر')}
      description={hotelSettings?.description_ar || t('template.riyadh.description', 'قالب موقع فندق فاخر مستوحى من هوية العاصمة الرياض')}
      templateName={hotelSettings?.hotel_name_en || t('template.riyadh.name', 'قالب الرياض')}
    >
      <div className="template--riyadh overflow-hidden bg-background dark:bg-black text-foreground dark:text-white">
        {useDynamic ? (
          activeSections!.map((name, i) =>
            sectionMap[name] ? <Fragment key={`${name}-${i}`}>{sectionMap[name]}</Fragment> : null
          )
        ) : (
          <>
            {sectionMap.hero}
            {sectionMap.rooms}
            {sectionMap.services}
            {sectionMap.partners}
            {sectionMap.testimonials}
            {sectionMap.gallery}
            {sectionMap.contact}
          </>
        )}

        <GallerySlider gallery={gallery} />
      </div>
    </TemplateLayout>
  )
}
