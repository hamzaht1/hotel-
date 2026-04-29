// resources/js/components/landing/Hotels.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HTMLAttributes } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, A11y } from 'swiper/modules'
import { HOTEL_LOGOS } from '@/data/public-data'
import { useLang } from '@/hooks/useLang'
import { useStorageUrl } from '@/lib/storage'
import 'swiper/css'

// Import hotel logo images
import logo1 from '@/assets/images/hotels-icons/logo1.svg'
import logo2 from '@/assets/images/hotels-icons/logo2.svg'
import logo3 from '@/assets/images/hotels-icons/logo3.svg'
import logo4 from '@/assets/images/hotels-icons/logo4.svg'
import logo5 from '@/assets/images/hotels-icons/logo5.svg'
import logo6 from '@/assets/images/hotels-icons/logo6.svg'
import logo7 from '@/assets/images/hotels-icons/logo7.svg'
import logo8 from '@/assets/images/hotels-icons/logo8.svg'

import AnimatedHeading from '@/components/motion/AnimatedHeading'
import AnimatedParagraph from '@/components/motion/AnimatedParagraph'

// Type definition for hotel logos
type Logo = { src: string; alt?: string; altKey?: string }

/**
 * LogoCard component - Displays a single hotel logo
 * @param src - Logo image source
 * @param alt - Alt text for accessibility
 */
function LogoCard({ src, alt, altKey }: Logo & HTMLAttributes<HTMLDivElement>) {
  const { __ } = useLang()

  const resolvedAlt = altKey ? __(altKey) : alt || ''

  return (
    <div className="flex items-center justify-center">
      <img src={src} alt={resolvedAlt} loading="lazy" className="max-w-full max-h-full object-contain" />
    </div>
  )
}

/**
 * Hotels component - Showcases partner hotels with logos
 * Displays a carousel of hotel logos on mobile and a grid on desktop,
 * along with a testimonial section showing trust indicators
 */
interface DbPartner {
  id: number; name: string;
  org_name_ar: string | null; org_name_en: string | null;
  logo: string | null;
}

export default function Hotels({ dbPartners }: { dbPartners?: DbPartner[] }) {
  const storageUrl = useStorageUrl()
  // Hotel logo images mapping — bundled fallbacks
  const hotelLogoImages = {
    '@/assets/images/hotels-icons/logo1.svg': logo1,
    '@/assets/images/hotels-icons/logo2.svg': logo2,
    '@/assets/images/hotels-icons/logo3.svg': logo3,
    '@/assets/images/hotels-icons/logo4.svg': logo4,
    '@/assets/images/hotels-icons/logo5.svg': logo5,
    '@/assets/images/hotels-icons/logo6.svg': logo6,
    '@/assets/images/hotels-icons/logo7.svg': logo7,
    '@/assets/images/hotels-icons/logo8.svg': logo8,
  }

  // Prefer DB-sourced active tenant logos, fall back to bundled placeholders.
  const transformedLogos = (dbPartners && dbPartners.length > 0)
    ? dbPartners.map((p) => ({
        src: storageUrl(p.logo) ?? '',
        alt: p.org_name_ar ?? p.name,
      }))
    : HOTEL_LOGOS.map(logo => ({
        ...logo,
        src: hotelLogoImages[logo.src as keyof typeof hotelLogoImages] || logo.src,
      }))

  const { __ } = useLang()

  // Logos for the avatar section at the bottom (first 3 logos)
  const avatarLogos = transformedLogos.slice(0, 3)

  return (
    <section id="hotels" className="text-center relative 
     py-12 sm:py-18">
      <div className="mx-auto max-w-7xl ">
        {/* Section title */}
        <AnimatedHeading dir="up" delay={0.30}>
          <h2 className="text-3xl sm:text-5xl    font-extrabold tracking-tight">
            <span className="text-public-primary">{__("messages.section_titles.hotels.title")}</span>
            <span className="text-public-active">{__("messages.section_titles.hotels.subtitle")}</span>
          </h2>
        </AnimatedHeading>
        {/* Section description */}
        <AnimatedParagraph dir="none" delay={0.60}>  
          <p className="mx-auto mt-2 md:mt-4 max-w-4xl text-base sm:text-2xl  text-black/70">
            {__("messages.section_titles.hotels.description")}
          </p>
        </AnimatedParagraph>
        {/* Mobile carousel view */}
        <div className="sm:hidden mt-8">
          {(() => {
            const slidesPerView = 2
            const slidesPerGroup = 2
            const canLoop = transformedLogos.length >= slidesPerView * 2 + 1

            return (
              <Swiper
                modules={[Autoplay, A11y]}
                dir={typeof document !== 'undefined'
                  ? (document.documentElement.getAttribute('dir') as 'rtl' | 'ltr') || 'rtl'
                  : 'rtl'}
                slidesPerView={slidesPerView}
                slidesPerGroup={slidesPerGroup}
                spaceBetween={12}
                loop={canLoop}
                rewind={!canLoop}
                watchOverflow
                autoplay={
                  canLoop
                    ? { delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }
                    : false
                }
                a11y={{ enabled: true }}
              >
                {transformedLogos.map((logo, i) => (
                  <SwiperSlide key={i} className="select-none">
                    <LogoCard {...logo} />
                  </SwiperSlide>
                ))}
              </Swiper>
            )
          })()}
        </div>

        {/* Desktop grid view */}
        <div className="hidden sm:grid md:mt-10 grid-cols-3 md:grid-cols-4 lg:grid-cols-8  gap-4">
          {transformedLogos.map((logo, i) => (
            <LogoCard key={i} {...logo} />
          ))}
        </div>

        {/* Trust indicators section */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Avatar logos stack */}
          <div className="flex items-center justify-center">
            {avatarLogos.map((logo, idx) => (
              <div
                key={idx}
                className={[
                  "inline-flex h-16 w-16 sm:h-10 sm:w-10 items-center justify-center rounded-full border bg-white ring-1 ring-black/10",
                  "-mx-2",            
                  idx === 1 ? "z-10 shadow-md" : "z-0",
                ].join(" ")}
                title="Hotel"
              >
                <img src={logo.src} alt={(logo as any).altKey ? __((logo as any).altKey as string) : ((logo as any).alt || '')} className="max-w-full max-h-full object-contain" />
              </div>
            ))}
          </div>

          {/* Trust message */}
          <p className="">
            {__("messages.section_titles.hotels.trust", { count: 50 })}
          </p>
        </div>
      </div>
    </section>
  )
}