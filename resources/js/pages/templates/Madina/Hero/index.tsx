/**
 * Hero Section - Full Screen Slider
 * 
 * Features:
 * - Full screen height (100vh) slider with images and YouTube videos
 * - Supports both image slides and embedded YouTube videos
 * - Auto-play functionality with navigation arrows
 * - Decorative bottom border with responsive element count
 * - Overlay for better text readability
 * 
 * Images and assets are imported from template's local images folder
 */
import React, { useRef, useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules'
import { useTemplateT, useTemplateLanguage } from '@/hooks/useTemplateTranslations'
import { pickSiteText } from '@/lib/site-texts'
import { useTenantSiteSettings } from '@/hooks/use-tenant-preview-overrides'
import { useStorageUrl } from '@/lib/storage'

// Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'

// Import images from template folder
import slider1 from '../images/slider/slider.png'
import slider1Mobile from '../images/slider/slider-mobile.png'
import slider2 from '../images/slider/slider-vedio.mp4'
import slider2Mobile from '../images/slider/slider-vedio-mobile.mp4'
import leftArrow from '../images/right-arrow.png'
import rightArrow from '../images/left-arrow.png'

type BilingualSlide = {
  src?: string
  videoId?: string
  type: 'image' | 'video'
  titleAr: string
  titleEn: string
  descriptionAr: string
  descriptionEn: string
  ctaLabelAr: string
  ctaLabelEn: string
  ctaHref?: string
}

interface HeroSectionProps {
  siteTexts?: Record<string, Record<string, { value_ar?: string | null; value_en?: string | null }>>
}

export default function HeroSection({ siteTexts }: HeroSectionProps = {}) {
  const t = useTemplateT()
  const { isArabic } = useTemplateLanguage()
  const storageUrl = useStorageUrl()
  // Both slides accept a tenant-uploaded image override. data: URLs come
  // through unchanged (live editor uploads); persisted paths go via storageUrl.
  const liveSettings = useTenantSiteSettings()
  const resolveOverride = (raw: string | null | undefined): string | null =>
    raw && typeof raw === 'string' && raw.startsWith('data:') ? raw : storageUrl(raw) ?? null
  const heroImageOverride = resolveOverride(liveSettings?.media?.hero_image as string | null | undefined)
  const heroImage2Override = resolveOverride((liveSettings?.media as { hero_image_2?: string | null })?.hero_image_2)
  const [windowWidth, setWindowWidth] = useState(0)
  const [sliderStyle, setSliderStyle] = useState<'arrows' | 'dots'>('arrows')
  const [sliderEffect, setSliderEffect] = useState<'slide' | 'fade'>('slide')
  const prevRef = useRef<HTMLButtonElement | null>(null)
  const nextRef = useRef<HTMLButtonElement | null>(null)
  
  // Load hero slider style from localStorage
  useEffect(() => {
    const savedStyle = localStorage.getItem('madina-hero-slider-style')
    if (savedStyle) {
      if (savedStyle === 'dots') {
        setSliderStyle('dots')
        setSliderEffect('fade')
      } else {
        setSliderStyle('arrows')
        setSliderEffect('slide')
      }
    }
    
    // Listen for custom event from ThemeSwitcher
    const handleStyleChange = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail.type === 'dots') {
        setSliderStyle('dots')
        setSliderEffect('fade')
      } else {
        setSliderStyle('arrows')
        setSliderEffect('slide')
      }
    }
    
    window.addEventListener('madina-hero-slider-style-changed', handleStyleChange)
    
    return () => {
      window.removeEventListener('madina-hero-slider-style-changed', handleStyleChange)
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const calculateVisibleElements = () => {
    if (windowWidth === 0) return 20 
    // Calculate number of semicircles to fill the width
    const elementWidth = windowWidth >= 768 ? 48 : 32 
    const maxElements = Math.ceil(windowWidth / elementWidth)
    return Math.min(Math.max(maxElements, 10), 200) 
  }
  
  const visibleElementsCount = calculateVisibleElements()
  const decorativeElements = Array.from({ length: 180 }, (_, index) => index)
  
  // Bilingual slides data
  const slidesData: BilingualSlide[] = [
    {
      src: slider1,
      type: 'image',
      titleAr: 'إقامتك المثالية تبدأ هنا',
      titleEn: 'Your Perfect Stay Begins Here',
      descriptionAr: 'نحن لسنا مجرد فنادق، بل وجهة للراحة والفخامة. نحن نؤمن بأن كل رحلة تستحق نهاية مثالية، ولهذا نسعى جاهدين لتقديم أفضل الخدمات.',
      descriptionEn: 'We are not just hotels, but a destination for comfort and luxury. We believe that every journey deserves a perfect ending, and that is why we strive to provide the best services.',
      ctaLabelAr: 'اكتشف الغرف',
      ctaLabelEn: 'Explore Rooms',
      ctaHref: '#rooms',
    },
    {
      videoId: 'jfKfPfyJRdk', // Luxury hotel ambiance video - suitable for hotel website
      type: 'video',
      titleAr: 'تجربة فندقية لا تُنسى',
      titleEn: 'An Unforgettable Hotel Experience',
      descriptionAr: 'استمتع بخدمات مخصصة وتصميم فاخر يراعي أدق التفاصيل لراحة ضيوفنا طوال فترة الإقامة.',
      descriptionEn: 'Enjoy personalized services and luxurious design that pays attention to the finest details for our guests\' comfort throughout their stay.',
      ctaLabelAr: 'احجز الآن',
      ctaLabelEn: 'Book Now',
      ctaHref: '#rooms',
    },
  ]
  
  // Both slides are overridable via SiteText (section=hero) and tenant uploads.
  // Slide 1 → keys: title / subtitle / cta and media.hero_image.
  // Slide 2 → keys: title_2 / subtitle_2 and media.hero_image_2 (forces image type).
  const slides = slidesData.map((slide, index) => {
    const baseTitle = isArabic ? slide.titleAr : slide.titleEn
    const baseDescription = isArabic ? slide.descriptionAr : slide.descriptionEn
    const baseCta = isArabic ? slide.ctaLabelAr : slide.ctaLabelEn

    if (index === 0) {
      return {
        src: heroImageOverride || slide.src,
        videoId: slide.videoId,
        type: heroImageOverride ? 'image' as const : slide.type,
        title: pickSiteText(siteTexts, 'hero', 'title', baseTitle, isArabic),
        description: pickSiteText(siteTexts, 'hero', 'subtitle', baseDescription, isArabic),
        ctaLabel: pickSiteText(siteTexts, 'hero', 'cta', baseCta, isArabic),
        ctaHref: slide.ctaHref,
      }
    }

    return {
      src: heroImage2Override || slide.src,
      videoId: slide.videoId,
      type: heroImage2Override ? 'image' as const : slide.type,
      title: pickSiteText(siteTexts, 'hero', 'title_2', baseTitle, isArabic),
      description: pickSiteText(siteTexts, 'hero', 'subtitle_2', baseDescription, isArabic),
      ctaLabel: baseCta,
      ctaHref: slide.ctaHref,
    }
  })

  // Determine modules based on slider style
  const swiperModules = sliderStyle === 'dots' 
    ? [Autoplay, Pagination, EffectFade]
    : [Autoplay, Navigation]

  const isMobile = windowWidth > 0 && windowWidth < 768
  return (
    <section data-preview-section="hero" id="home" className="relative w-full max-w-full overflow-hidden min-h-[60vh] h-[60vh] md:min-h-screen md:h-screen p-0 m-0">
      <Swiper
        key={`hero-slider-${sliderStyle}-${sliderEffect}`}
        modules={swiperModules}
        loop
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        effect={sliderEffect}
        navigation={sliderStyle === 'arrows' ? {
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        } : false}
        pagination={sliderStyle === 'dots' ? {
          clickable: true,
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active',
        } : false}
        onBeforeInit={(swiper) => {
          if (sliderStyle === 'arrows' && swiper && swiper.params && swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
            try {
              swiper.params.navigation.prevEl = prevRef.current
              swiper.params.navigation.nextEl = nextRef.current
            } catch (e) {
              // Navigation not available
            }
          }
        }}
        onSwiper={(swiper) => {
          if (sliderStyle === 'arrows' && swiper && swiper.navigation && swiper.params) {
            setTimeout(() => {
              if (swiper.params && swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
                try {
                  swiper.params.navigation.prevEl = prevRef.current
                  swiper.params.navigation.nextEl = nextRef.current
                } catch (e) {
                  // Navigation not available
                }
              }
              if (swiper.navigation) {
                try {
                  swiper.navigation.destroy()
                  swiper.navigation.init()
                  swiper.navigation.update()
                } catch (e) {
                  // Navigation methods not available
                }
              }
            })
          }
        }}
        className="!w-full !h-full !min-h-[60vh] md:!min-h-screen"
        style={{ height: '100%', minHeight: 'inherit' }}
      >
        {slides.map((item, idx) => (
          <SwiperSlide key={idx} className="!h-full !min-h-[60vh] md:!min-h-screen">
            <div className="relative w-full h-full min-w-full min-h-[60vh] md:min-h-screen">
              {item.type === 'video' && item.videoId ? (
                <div className="absolute inset-0 w-full h-full min-w-full min-h-[60vh] md:min-h-screen">
                  <video
                    src={isMobile ? slider2Mobile : slider2}
                    className="absolute inset-0 w-full h-full min-w-full object-cover"
                    style={{
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                      minWidth: '100%',
                      minHeight: '100%',
                    }}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls={false}
                  />
                </div>
              ) : (
                <img
                  // Tenant override (first slide) wins on both mobile and desktop; bundled
                  // assets are only used as a fallback when no upload is set.
                  src={item.src || (isMobile ? slider1Mobile : slider1)}
                  alt={`Hero slide ${idx + 1}`}
                  className="absolute inset-0 w-full h-full min-w-full object-cover"
                  style={{ objectFit: 'cover' }}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              )}

              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-black/40 z-[1]"></div>

              {/* Centered Content */}
              <div className="absolute inset-0 z-[2] flex items-center justify-center text-center px-4">
                <div className="max-w-3xl">
                  <h2 className="madina-font-heading text-white text-3xl sm:text-4xl lg:text-5xl font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                    {item.title}
                  </h2>
                  <p className="madina-font mt-4 text-white/90 dark:text-white text-base sm:text-lg lg:text-xl leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
                    {item.description}
                  </p>
          </div>
        </div>
      </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Decorative semicircles at the bottom of the slider - Full width */}
      {/* <div 
        className="flex items-end absolute left-0 right-0 bottom-0 z-10 w-full"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0',
          paddingTop: windowWidth >= 768 ? '6px' : '4px',
          backgroundColor: 'rgba(166, 125, 95, 0.86)'
        }}
      >
        {decorativeElements.slice(0, visibleElementsCount).map((_, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-white flex-1"
            style={{
              height: windowWidth >= 768 ? '24px' : '16px',
              borderRadius: windowWidth >= 768 ? '24px 24px 0 0' : '16px 16px 0 0',
            }}
          />
        ))}
      </div> */}

      {/* Navigation Arrows - Only show when style is arrows */}
      {sliderStyle === 'arrows' && (
        <>
          <button
            ref={prevRef}
            className="hero-prev absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full border border-white/60 bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm transition"
            aria-label="Previous slide"
          >
            <img src={leftArrow} alt="Previous" className="w-5 h-5" />
          </button>
          <button
            ref={nextRef}
            className="hero-next absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full border border-white/60 bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm transition"
            aria-label="Next slide"
          >
            <img src={rightArrow} alt="Next" className="w-5 h-5" />
          </button>
        </>
      )}
    </section>
  )
}
