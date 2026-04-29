import React, { useRef, useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation } from 'swiper/modules'
import { useTemplateT, useTemplateLanguage } from '@/hooks/useTemplateTranslations'

// Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'

// Assets
import slider1 from '@/assets/images/riyadh-template/slider/slider.jpg'
// import sliderLine from '@/assets/images/riyadh-template/slider/slider-line.png'

type Slide = {
  src: string
  title: string
  description: string
  ctaLabel: string
  ctaHref?: string
}

interface HeroSectionProps {
  hotelSettings?: any;
  siteTexts?: Record<string, any>;
}

export default function HeroSection({ hotelSettings, siteTexts }: HeroSectionProps) {
  const t = useTemplateT()
  const { isArabic } = useTemplateLanguage()

  // Helper to get site text with fallback, locale-aware (AR/EN with the other as fallback).
  const getText = (section: string, key: string, fallback: string) => {
    const text = siteTexts?.[section]?.[key];
    if (!text) return fallback;
    const primary = isArabic ? text.value_ar : text.value_en;
    if (primary && primary.trim() !== '') return primary;
    const secondary = isArabic ? text.value_en : text.value_ar;
    if (secondary && secondary.trim() !== '') return secondary;
    return fallback;
  }
  const [windowWidth, setWindowWidth] = useState(0)
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    handleResize()
    
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const calculateVisibleElements = () => {
    if (windowWidth === 0) return 3 
    
    const elementWidth = windowWidth >= 768 ? 56 : 40 
    const gap = 0
    const totalElementWidth = elementWidth + gap
    
    const maxElements = Math.floor(windowWidth / totalElementWidth)
    
    return Math.min(Math.max(maxElements, 5), 180) 
  }
  
  const visibleElementsCount = calculateVisibleElements()
  
  // Build array of 30 elements
  const decorativeElements = Array.from({ length: 180 }, (_, index) => index)
  const hotelName = hotelSettings?.hotel_name_ar || getText('hero', 'title', '');

  const slides: Slide[] = [
    {
      src: slider1,
      title: hotelName || t('sections.hero.title', 'إقامتك المثالية تبدأ هنا'),
      description: getText('hero', 'subtitle', '') || t(
        'sections.hero.subtitle',
        'نحن لسنا مجرد فنادق، بل وجهة للراحة والفخامة. نحن نؤمن بأن كل رحلة تستحق نهاية مثالية، ولهذا نسعى جاهدين لتقديم أفضل الخدمات.'
      ),
      ctaLabel: t('header.nav.rooms', 'الغرف'),
      ctaHref: '#rooms',
    },
    {
      src: slider1,
      title: getText('hero', 'title_2', '') || t('sections.hero.title', 'تجربة فندقية لا تُنسى'),
      description: getText('hero', 'subtitle_2', '') || t(
        'sections.hero.subtitle',
        'استمتع بخدمات مخصصة وتصميم فاخر يراعي أدق التفاصيل لراحة ضيوفنا طوال فترة الإقامة.'
      ),
      ctaLabel: t('header.nav.rooms', 'الغرف'),
      ctaHref: '#rooms',
    },
    {
      src: slider1,
      title: getText('hero', 'title_3', '') || t('sections.hero.title', 'رفاهية بمعايير عالمية'),
      description: getText('hero', 'subtitle_3', '') || t(
        'sections.hero.subtitle',
        'مزيج فريد من الضيافة الأصيلة والخدمات الحديثة لتجربة تضاهي توقعاتك.'
      ),
      ctaLabel: t('header.nav.rooms', 'الغرف'),
      ctaHref: '#rooms',
    },
  ]
  const prevRef = useRef<HTMLButtonElement | null>(null)
  const nextRef = useRef<HTMLButtonElement | null>(null)

  return (
    <section id="home" className="relative">
      <Swiper
        modules={[Autoplay, Navigation]}
        loop
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        navigation={false}
        onBeforeInit={(swiper) => {
          // Attach refs before init
          // @ts-expect-error - Swiper types don't include dynamic assignment
          swiper.params.navigation.prevEl = prevRef.current
          // @ts-expect-error - Swiper types don't include dynamic assignment
          swiper.params.navigation.nextEl = nextRef.current
        }}
        onSwiper={(swiper) => {
          // Ensure navigation is re-initialized after refs are set
          setTimeout(() => {
            // @ts-expect-error - dynamic runtime assignment
            swiper.params.navigation.prevEl = prevRef.current
            // @ts-expect-error - dynamic runtime assignment
            swiper.params.navigation.nextEl = nextRef.current
            swiper.navigation.destroy()
            swiper.navigation.init()
            swiper.navigation.update()
          })
        }}
        className="w-full h-[60vh] sm:h-[70vh] lg:h-[93vh]"
      >
        {slides.map((item, idx) => (
          <SwiperSlide key={idx}>
            <div className="relative w-full h-full">
              <img
                src={item.src}
                alt={`Hero slide ${idx + 1}`}
                className="w-full h-full object-cover"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />


              {/* Centered Content */}
              <div className="absolute inset-0 z-10 flex items-center justify-center text-center px-4">
                <div className="max-w-3xl">
                  <h2 className="text-white  text-3xl sm:text-4xl lg:text-5xl font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                    {item.title}
                  </h2>
                  <p className="mt-4 text-white/90 dark:text-white text-base sm:text-lg lg:text-xl leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
                    {item.description}
                  </p>
                  <div className="mt-6">
                    <a
                      href={item.ctaHref || '#'}
                      className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/10 text-white px-5 py-2.5 hover:bg-white/20 transition backdrop-blur-sm"
                    >
                      {item.ctaLabel}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 rtl:rotate-180 transition-transform">
                        <path fillRule="evenodd" d="M8.47 19.53a.75.75 0 010-1.06L14.94 12 8.47 5.53a.75.75 0 111.06-1.06l7 7a.75.75 0 010 1.06l-7 7a.75.75 0 01-1.06 0z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Decorative line at the bottom of the slider */}
      <div 
        className="flex justify-center items-center gap-2 absolute left-0 right-0 bottom-0 z-10"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {decorativeElements.slice(0, visibleElementsCount).map((_, index) => (
          <div key={index} className="relative w-8 h-6 md:w-12 md:h-8 bg-white dark:bg-black">
            <div className="absolute -top-4 md:-top-6 left-1/2 transform -translate-x-1/2 w-6 h-6 md:w-8 md:h-8 bg-white dark:bg-black"></div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        ref={prevRef}
        className="hero-prev absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full border border-white/60 bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm transition"
        aria-label="Previous slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M15.53 4.47a.75.75 0 010 1.06L9.06 12l6.47 6.47a.75.75 0 11-1.06 1.06l-7-7a.75.75 0 010-1.06l7-7a.75.75 0 011.06 0z" clipRule="evenodd" />
        </svg>
      </button>
      <button
        ref={nextRef}
        className="hero-next absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full border border-white/60 bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm transition"
        aria-label="Next slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M8.47 19.53a.75.75 0 010-1.06L14.94 12 8.47 5.53a.75.75 0 111.06-1.06l7 7a.75.75 0 010 1.06l-7 7a.75.75 0 01-1.06 0z" clipRule="evenodd" />
        </svg>
      </button>
      
    </section>
    
  )
}
