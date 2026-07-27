/**
 * قسم الشركاء - قالب الرياض
 */
import React from 'react'
import partnerLogo from '@/assets/images/riyadh-template/partners/logo-2.png'
import backgroundImage from '@/assets/images/riyadh-template/partners/background.png'
import starIcon from '@/assets/images/riyadh-template/partners/star.svg'
import BackgroundTitle from '@/components/templates/BackgroundTitle'
import { useTemplateT } from '@/hooks/useTemplateTranslations'

import leftLine from '@/assets/images/riyadh-template/rooms/left-line.svg'
import rightLine from '@/assets/images/riyadh-template/rooms/right-line.svg'
interface PartnerLogo {
  id: number
  title_ar?: string | null
  title_en?: string | null
  url?: string | null
}

export default function PartnersSection({ partnerLogos }: { partnerLogos?: PartnerLogo[] }) {
  const t = useTemplateT()
  // Build repeated logos array for infinite marquee. Prefer the tenant's own
  // uploaded "hotels" gallery images; fall back to the bundled demo logo
  // when the client hasn't added any yet.
  const isArabic = typeof document !== 'undefined' && document.documentElement.dir === 'rtl'
  const uploaded = (partnerLogos ?? []).filter((p) => p.url)
  const REPEAT_COUNT = 20
  const logos = uploaded.length > 0
    ? Array.from({ length: REPEAT_COUNT }, (_, i) => {
        const p = uploaded[i % uploaded.length]
        return { src: p.url as string, alt: (isArabic ? p.title_ar : p.title_en) || `Partner logo ${i + 1}` }
      })
    : Array.from({ length: REPEAT_COUNT }, (_, i) => ({ src: partnerLogo, alt: `Partner logo ${i + 1}` }))

  return (
    <section className="py-20 ">
      <div className="container mx-auto px-4">
        {/* Title */}
        <div className="relative text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src={leftLine} alt="left line" className="h-6 w-auto hidden md:block line-icon" />
              <h2 className="relative z-10 text-4xl md:text-5xl font-bold riyadh-heading mb-4">
                {t('sections.partners.title', 'شركاؤنا في النجاح')}
              </h2>
            <img src={rightLine} alt="right line" className="h-6 w-auto hidden md:block line-icon" />
          </div>
          <BackgroundTitle text={t('sections.partners.background_title', 'الشركاء')} />
          <p className="relative z-10 text-xl riyadh-text-muted max-w-2xl mx-auto">
            {t('sections.partners.subtitle', 'نتعاون مع أفضل الشركات والمؤسسات في المملكة لتقديم خدمات متميزة لضيوفنا الكرام')}
          </p>
        </div>
      </div>

      {/* Infinite scrolling logo marquee - full width */}
      <div 
        className="w-full overflow-hidden relative py-8 bg-black/5 dark:bg-white/50"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* overlay to improve contrast */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-black/10 via-transparent to-black/10 dark:from-white/20 dark:via-white/10 dark:to-white/20 mix-blend-multiply"
        />
        <div 
          className="flex animate-infinite-scroll relative z-10"
        >
            {/* Repeated groups for continuous loop */}
            {Array.from({ length: 3 }, (_, groupIndex) => (
              <div key={groupIndex} className="flex flex-shrink-0">
                {logos.map((logo, index) => (
                  <React.Fragment key={`group-${groupIndex}-${index}`}>
                    {/* Logo */}
                    <div className="flex items-center justify-center px-8 py-4 flex-shrink-0">
                      <img
                        src={logo.src}
                        alt={logo.alt}
                        className="h-32 w-auto object-contain opacity-80 hover:opacity-100 dark:opacity-90 dark:hover:opacity-100 dark:brightness-110 transition duration-300"
                      />
                    </div>
                    {/* Separator star between logos */}
                    <div className="flex items-center justify-center px-4 py-4 flex-shrink-0">
                      <img 
                        src={starIcon} 
                        alt="Star separator"
                        className="h-4 w-4 object-contain opacity-50 dark:opacity-70 dark:brightness-125"
                      />
                    </div>
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* CSS for infinite continuous animation with RTL support */}
        <style dangerouslySetInnerHTML={{
          __html: `
            .animate-infinite-scroll {
              display: flex;
              animation: infiniteScroll 45s linear infinite;
              width: max-content;
            }
            
            /* LTR direction - right to left */
            @keyframes infiniteScroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(calc(-100% / 3)); }
            }
            
            /* RTL direction - left to right */
            [dir="rtl"] .animate-infinite-scroll {
              animation: infiniteScrollRTL 45s linear infinite;
            }
            
            @keyframes infiniteScrollRTL {
              0% { transform: translateX(0); }
              100% { transform: translateX(calc(100% / 3)); }
            }
            
            .animate-infinite-scroll:hover {
              animation-play-state: paused;
            }
          `
        }} />
    </section>
  )
}



  