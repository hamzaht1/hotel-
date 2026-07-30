/**
 * Partners Section - Partners Logo Display
 * 
 * Features:
 * - Infinite scrolling logo carousel
 * - Simplified design without background image
 * - RTL/LTR support for animation direction
 * - Uses template's primary color from CSS variables
 * 
 * All images imported from template's local images folder
 */
import React, { useState, useEffect } from 'react'
import { useTemplateT } from '@/hooks/useTemplateTranslations'

// Import images from template folder
import partnerLogo from '../images/partners/logo-2.png'
import starIcon from '../images/partners/star.svg'

interface PartnerLogo {
  id: number
  title_ar?: string | null
  title_en?: string | null
  url?: string | null
}

export default function PartnersSection({ partnerLogos }: { partnerLogos?: PartnerLogo[] }) {
  const t = useTemplateT()
  const [partnersStyle, setPartnersStyle] = useState<'carousel' | 'grid'>('carousel')
  
  // Load partners style from localStorage
  useEffect(() => {
    const savedStyle = localStorage.getItem('madina-partners-style')
    if (savedStyle) {
      if (savedStyle === 'grid') {
        setPartnersStyle('grid')
      } else {
        setPartnersStyle('carousel')
      }
    }
    
    // Listen for custom event from ThemeSwitcher
    const handleStyleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: 'carousel' | 'grid'; id: string }>
      if (customEvent.detail && customEvent.detail.type) {
        setPartnersStyle(customEvent.detail.type)
      }
    }
    
    window.addEventListener('madina-partners-style-changed', handleStyleChange)
    
    return () => {
      window.removeEventListener('madina-partners-style-changed', handleStyleChange)
    }
  }, [])
  
  // Build repeated logos array for infinite marquee. Prefer the tenant's own
  // gallery images tagged "partners"; fall back to the bundled demo logo
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
    <section id="partners" className="py-0 relative">
      {partnersStyle === 'carousel' ? (
        /* Infinite scrolling logo marquee */
        <div 
          className="w-full overflow-hidden relative pb-8"
        >
          {/* Separate background */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundColor: 'var(--madina-partners-bg, var(--madina-primary-light))',
              opacity: 'var(--madina-partners-opacity, 0.4)' as any
            }}
          />
          <div className="flex animate-infinite-scroll relative z-10">
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
                        className="h-32 w-auto object-contain opacity-80 hover:opacity-100 dark:opacity-90 dark:hover:opacity-100 transition duration-300"
                      />
                    </div>
                    {/* Separator star between logos */}
                    <div className="flex items-center justify-center px-4 py-4 flex-shrink-0">
                      <div 
                        className="h-4 w-4"
                        aria-label="Star separator"
                        style={{
                          maskImage: `url(${starIcon})`,
                          WebkitMaskImage: `url(${starIcon})`,
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat',
                          maskPosition: 'center',
                          WebkitMaskPosition: 'center',
                          backgroundColor: 'var(--madina-primary)',
                          opacity: 0.5
                        }}
                      />
                    </div>
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Logo marquee - simple style */
        <div 
          className="w-full overflow-hidden relative pb-8"
          style={{
            backgroundColor: 'var(--madina-partners-bg, var(--madina-primary))'
          }}
        >
          <div className="flex animate-infinite-scroll relative z-10 py-8">
            {/* Repeated groups for continuous loop */}
            {Array.from({ length: 3 }, (_, groupIndex) => (
              <div key={groupIndex} className="flex flex-shrink-0">
                {logos.map((logo, index) => (
                  <div 
                    key={`group-${groupIndex}-${index}`}
                    className="flex items-center justify-center px-8 py-4 flex-shrink-0"
                  >
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      className="h-24 w-auto object-contain opacity-90 hover:opacity-100 transition duration-300 filter brightness-0 invert"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SVG at bottom of section - partly visible above */}
      <div 
        className="absolute bottom-0 left-0 right-0 w-full" 
        style={{ 
          height: '100px', 
          transform: 'translateY(50%)',
          zIndex: 1
        }}
      >
        <svg 
          viewBox="0 0 1743 139" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="madina-partners-bottom-wave w-full h-full"
          aria-hidden="true"
          preserveAspectRatio="none"
          style={{
            width: '100%',
          }}
        >
          <path 
            d="M0 138.775H1742.2V7.14275L1623.86 9.79579L1552.84 3.26518L1465.47 7.14275L1349.88 0.816208L1238.84 7.14275L1160.56 10.204L1105.92 7.14275L1037.68 3.67336L895.675 6.32642L851.971 12.0407L693.619 4.89784L599.861 13.2244L513.394 3.18355L415.663 9.71417L387.77 3.71417L340.42 7.14275L263.988 15.0611L152.945 -0.00012207L90.1123 7.14275H0V138.775Z" 
            style={{ fill: 'var(--madina-background-color, #f5f5f5)' }}
            className="dark:fill-[#0F172A]"
          />
        </svg>
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
          
          /* Dark mode: Make partner logos white (filter for carousel style) */
          .dark #partners img {
            filter: var(--madina-partners-logo-filter, none);
          }
        `
      }} />
    </section>
  )
}
