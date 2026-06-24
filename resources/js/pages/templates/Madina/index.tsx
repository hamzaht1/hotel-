import { Fragment, type ReactNode } from 'react'
import MadinaLayout from '@/layouts/MadinaLayout'
import HeroSection from './Hero'
import RoomsSection from './Rooms'
import ServicesSection from './Services'
import PartnersSection from './Partners'
import AdditionalServicesSection from './AdditionalServices'
import TestimonialsSection from './Testimonials'
import GallerySlider from './Gallery'
import ContactSection from './Contact'
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
 * قالب المدينة - قالب فندق احترافي مستوحى من المدينة المنورة
 * يحتوي على جميع أقسام الموقع المطلوبة لفندق متكامل
 * Madina Template - Professional hotel template inspired by the Holy City of Madinah
 * Contains all required website sections for a complete hotel
 */
export default function Madina(props: Props) {
  return (
    <TenantPreviewOverridesProvider>
      <MadinaInner {...props} />
    </TenantPreviewOverridesProvider>
  )
}

function MadinaInner({ tenant, hotelSettings, contactSettings, rooms, services, gallery, reviews, activeSections, templateTranslations, locale }: Props) {
  const t = useTemplateT()
  // Pull the merged map so the editor can stream live text edits into the iframe.
  const mergedTexts = useMergedSiteTexts()

  const heroBlock = (
    <>
      <HeroSection siteTexts={mergedTexts} />
      <div className="w-full" style={{ height: '28px' }}>
        <svg
          viewBox="0 0 2707 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="madina-hero-bottom-wave w-full h-full"
          aria-hidden="true"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%' }}
        >
          <path
            d="M2707 0V41.9395C2699.15 21.2215 2679.13 6.4925 2655.66 6.49219C2628.88 6.49219 2606.57 25.6741 2601.74 51.0488H2599.8C2594.97 25.6743 2572.67 6.49246 2545.89 6.49219C2519.11 6.49219 2496.8 25.6742 2491.97 51.0488H2490.03C2485.2 25.6743 2462.9 6.49233 2436.12 6.49219C2409.34 6.49233 2387.03 25.6742 2382.2 51.0488H2380.26C2375.43 25.6744 2353.13 6.49254 2326.35 6.49219C2299.57 6.49219 2277.26 25.6741 2272.43 51.0488H2270.49C2265.66 25.6742 2243.36 6.49233 2216.58 6.49219C2189.79 6.49242 2167.49 25.6743 2162.66 51.0488H2160.72C2155.89 25.6743 2133.59 6.4924 2106.81 6.49219C2080.02 6.49219 2057.72 25.6741 2052.89 51.0488H2050.95C2046.12 25.6743 2023.82 6.49236 1997.04 6.49219C1970.25 6.49219 1947.95 25.6741 1943.12 51.0488H1941.18C1936.35 25.6742 1914.05 6.49233 1887.27 6.49219C1860.48 6.49234 1838.18 25.6742 1833.35 51.0488H1831.41C1826.6 25.7965 1804.49 6.67986 1777.88 6.49609C1751.27 6.68055 1729.16 25.7969 1724.36 51.0488H1722.42C1717.58 25.6742 1695.28 6.49234 1668.5 6.49219C1641.72 6.49251 1619.42 25.6743 1614.58 51.0488H1612.64C1607.81 25.6741 1585.51 6.49222 1558.73 6.49219C1531.95 6.49251 1509.65 25.6743 1504.82 51.0488H1502.88C1498.04 25.6741 1475.74 6.49219 1448.96 6.49219C1422.18 6.49259 1399.88 25.6744 1395.04 51.0488H1393.1C1388.27 25.6741 1365.97 6.49219 1339.19 6.49219C1312.41 6.49265 1290.11 25.6744 1285.27 51.0488H1283.33C1278.5 25.6742 1256.2 6.49229 1229.42 6.49219C1202.64 6.49251 1180.34 25.6743 1175.5 51.0488H1173.56C1168.73 25.6741 1146.43 6.49222 1119.65 6.49219C1092.87 6.49251 1070.57 25.6743 1065.73 51.0488H1063.79C1058.96 25.6741 1036.66 6.49219 1009.88 6.49219C983.097 6.49259 960.795 25.6744 955.964 51.0488H954.023C949.215 25.7966 927.104 6.68003 900.495 6.49609C873.887 6.68056 851.777 25.7969 846.969 51.0488H845.028C840.197 25.6742 817.895 6.49239 791.113 6.49219C764.332 6.49252 742.03 25.6744 737.198 51.0488H735.258C730.426 25.6741 708.124 6.49225 681.343 6.49219C654.561 6.49252 632.26 25.6744 627.429 51.0488H625.488C620.656 25.6741 598.354 6.49219 571.572 6.49219C544.791 6.4926 522.49 25.6744 517.658 51.0488H515.718C510.886 25.6741 488.583 6.49219 461.802 6.49219C435.021 6.49269 412.719 25.6745 407.888 51.0488H405.947C401.116 25.6742 378.814 6.49235 352.032 6.49219C325.251 6.49252 302.949 25.6744 298.117 51.0488H296.177C291.345 25.6741 269.043 6.49224 242.262 6.49219C215.48 6.49252 193.179 25.6744 188.348 51.0488H186.407C181.575 25.6741 159.273 6.49219 132.491 6.49219C105.71 6.49258 83.4088 25.6744 78.5771 51.0488H76.6367C71.8049 25.6741 49.5024 6.49219 22.7207 6.49219C14.6171 6.49234 6.92333 8.24865 0 11.4014V0H2707Z"
            fill="var(--madina-primary)"
            fillOpacity="0.46"
          />
        </svg>
      </div>
    </>
  )

  const sectionMap: Record<string, ReactNode> = {
    hero: heroBlock,
    rooms: <RoomsSection rooms={rooms} />,
    services: <ServicesSection services={services} />,
    partners: <PartnersSection />,
    testimonials: <TestimonialsSection reviews={reviews} />,
    gallery: <GallerySlider gallery={gallery} />,
    contact: <ContactSection contactSettings={contactSettings} tenant={tenant} />,
  }

  const useDynamic = Array.isArray(activeSections) && activeSections.length > 0

  return (
    <MadinaLayout
      title={t('template.madina.title', 'قالب المدينة - فندق مستوحى من المدينة المنورة')}
      description={t('template.madina.description', 'قالب موقع فندق مستوحى من هوية المدينة المنورة')}
    >
      {useDynamic ? (
        <>
          {activeSections!.map((name, i) =>
            sectionMap[name] ? <Fragment key={`${name}-${i}`}>{sectionMap[name]}</Fragment> : null
          )}
          <AdditionalServicesSection />
        </>
      ) : (
        <>
          {sectionMap.hero}
          {sectionMap.rooms}
          {sectionMap.services}
          {sectionMap.partners}
          <AdditionalServicesSection />
          {sectionMap.testimonials}
          {sectionMap.gallery}
          {sectionMap.contact}
        </>
      )}
    </MadinaLayout>
  )
}
