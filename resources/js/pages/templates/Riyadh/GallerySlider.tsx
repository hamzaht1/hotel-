// Gallery Display Section - Riyadh Template
import { useRef, useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode, Pagination, Navigation } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import BackgroundTitle from '@/components/templates/BackgroundTitle'
import { useTemplateT, useTemplateLanguage } from '@/hooks/useTemplateTranslations'
import { useStorageUrl } from '@/lib/storage'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/free-mode'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

import image1 from '@/assets/images/riyadh-template/galary/imag1.png'
import image2 from '@/assets/images/riyadh-template/galary/imag2.png'
import image3 from '@/assets/images/riyadh-template/galary/imag3.png'
import image4 from '@/assets/images/riyadh-template/galary/imag4.png'
import rightArrow from '@/assets/images/riyadh-template/right-arrow.png'
import leftArrow from '@/assets/images/riyadh-template/left-arrow.png'

// Bilingual gallery image interface
import leftLine from '@/assets/images/riyadh-template/rooms/left-line.svg'
import rightLine from '@/assets/images/riyadh-template/rooms/right-line.svg'

// Madina template icons (for madina style)
import madinaLeftLine from '../Madina/images/rooms/left-line.svg'
import madinaRightLine from '../Madina/images/rooms/right-line.svg'

interface BilingualGalleryImage {
  id: number
  src: string
  altAr: string
  altEn: string
}

interface GallerySliderProps {
  gallery?: any[];
}

export default function GallerySlider({ gallery: backendGallery }: GallerySliderProps) {
  const t = useTemplateT()
  const { isArabic } = useTemplateLanguage()
  const storageUrl = useStorageUrl()
  const swiperRef = useRef<SwiperType | null>(null)
  const [sliderStyle, setSliderStyle] = useState<'riyadh' | 'madina'>('riyadh')

  // Load gallery slider style from localStorage
  useEffect(() => {
    const savedStyle = localStorage.getItem('madina-gallery-slider-style')
    if (savedStyle) {
      if (savedStyle === 'madina') {
        setSliderStyle('madina')
      } else {
        setSliderStyle('riyadh')
      }
    }
    
    // Listen for custom event from ThemeSwitcher
    const handleStyleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: 'riyadh' | 'madina'; id: string }>
      if (customEvent.detail && customEvent.detail.type) {
        setSliderStyle(customEvent.detail.type)
      }
    }
    
    window.addEventListener('madina-gallery-slider-style-changed', handleStyleChange)
    
    return () => {
      window.removeEventListener('madina-gallery-slider-style-changed', handleStyleChange)
    }
  }, [])

  // Use backend gallery if available, otherwise fallback to static data
  const galleryImages: BilingualGalleryImage[] = (backendGallery && backendGallery.length > 0)
    ? backendGallery.map((img, i) => ({
        id: img.id || i + 1,
        src: storageUrl(img.path) ?? image1,
        altAr: img.title_ar || '',
        altEn: img.title_en || '',
      }))
    : [
    { id: 1, src: image1, altAr: 'غرفة ديلوكس مع إطلالة رائعة', altEn: 'Deluxe room with amazing view' },
    { id: 2, src: image2, altAr: 'مطعم فاخر بتصميم عصري', altEn: 'Luxury restaurant with modern design' },
    { id: 3, src: image3, altAr: 'مسبح داخلي مُدفأ', altEn: 'Indoor heated swimming pool' },
    { id: 4, src: image4, altAr: 'منتجع صحي للاسترخاء', altEn: 'Spa resort for relaxation' },
    { id: 5, src: image1, altAr: 'ردهة الاستقبال الفاخرة', altEn: 'Luxury reception lobby' },
    { id: 6, src: image2, altAr: 'غرفة اجتماعات حديثة', altEn: 'Modern meeting room' },
    { id: 7, src: image3, altAr: 'إطلالة خارجية ساحرة', altEn: 'Charming exterior view' },
    { id: 8, src: image4, altAr: 'مرافق ترفيهية متطورة', altEn: 'Advanced recreational facilities' },
  ]

  return (
    <section className="py-20 ">
      <div className="container mx-auto px-4">
        {/* Title */}
        <div className="relative text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            {sliderStyle === 'madina' ? (
              <>
                <div 
                  className="h-6 w-6 hidden md:block"
                  aria-label="left line"
                  style={{
                    maskImage: `url(${isArabic ? madinaLeftLine : madinaRightLine})`,
                    WebkitMaskImage: `url(${isArabic ? madinaLeftLine : madinaRightLine})`,
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center',
                    backgroundColor: 'var(--madina-primary)'
                  }}
                />
                <h2 className="madina-font-heading madina-text-primary relative z-10 text-4xl md:text-5xl font-bold mb-4">
                  {t('sections.gallery_slider.title', 'جولة افتراضية')}
                </h2>
                <div 
                  className="h-6 w-6 hidden md:block"
                  aria-label="right line"
                  style={{
                    maskImage: `url(${isArabic ? madinaRightLine : madinaLeftLine})`,
                    WebkitMaskImage: `url(${isArabic ? madinaRightLine : madinaLeftLine})`,
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center',
                    backgroundColor: 'var(--madina-primary)'
                  }}
                />
              </>
            ) : (
              <>
                <img src={leftLine} alt="left line" className="h-6 w-auto hidden md:block line-icon" />
                <h2 className="relative z-10 text-4xl md:text-5xl font-bold riyadh-heading mb-4">
                  {t('sections.gallery_slider.title', 'جولة افتراضية')}
                </h2>
                <img src={rightLine} alt="right line" className="h-6 w-auto hidden md:block line-icon" />
              </>
            )}
          </div>
          <BackgroundTitle 
            text={t('sections.gallery_slider.background_title', 'الجولة')}
            {...(sliderStyle === 'madina' ? {
              colorClass: "dark:text-[rgba(237,237,237,0.2)]",
              colorStyle: { color: 'var(--madina-primary)', opacity: 0.1 }
            } : {})}
          />
          <p className={`relative z-10 text-xl ${sliderStyle === 'madina' ? 'madina-text-body' : 'riyadh-text-muted'}`}>
            {t('sections.gallery_slider.subtitle', 'استكشف الفندق بالصور')}
          </p>
        </div>
      </div>

      {/* Full Width Gallery with Arch Frame */}
      <div className="w-full relative">
        {/* Top Arch - Overlay on images */}
        <div className="absolute top-0 left-0 w-full overflow-hidden z-10 pointer-events-none h-22 md:h-[180px]">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 1920 100" 
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M0,0 Q960,100 1920,0 L1920,0 L0,0 Z" 
              className="fill-background dark:fill-black mix-blend-multiply"
            />
          </svg>
        </div>

        {/* Swiper Slider */}
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper
          }}
          slidesPerView={1}
          spaceBetween={30}
          freeMode={true}
          pagination={{
            clickable: true,
          }}
          breakpoints={{
            640: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 4,
              spaceBetween: 20,
            },
          }}
          modules={[FreeMode, Pagination, Navigation]}
          className="mySwiper"
        >
          {galleryImages.map((image) => {
            const altText = isArabic ? image.altAr : image.altEn
            
            return (
              <SwiperSlide key={image.id}>
                <div 
                  className={`w-full h-[600px] overflow-hidden rounded-lg border ${sliderStyle === 'madina' ? '' : 'riyadh-border dark:border-white/20'}`}
                  style={sliderStyle === 'madina' ? { borderColor: 'var(--madina-primary)' } : {}}
                >
                  <img
                    src={image.src}
                    alt={altText}
                    className="w-full h-full object-cover border-none hover:scale-110 transition-transform duration-500 dark:brightness-95"
                  />
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>

        {/* Bottom Arch - Overlay on images */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden z-10  pointer-events-none h-22 md:h-[180px]">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 1920 100" 
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M0,100 Q960,0 1920,100 L1920,100 L0,100 Z" 
              className="fill-background dark:fill-black mix-blend-multiply"
            />
          </svg>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="container mx-auto px-4">
        <div className="flex justify-center gap-6 mt-8">
          {sliderStyle === 'madina' ? (
            <>
              <button
                onClick={() => swiperRef.current?.slidePrev()}
                className="w-14 h-14 md:w-16 md:h-16 rounded-full transition-all duration-300 flex items-center justify-center group cursor-pointer"
                style={{
                  backgroundColor: 'var(--madina-primary)',
                  color: '#FFFFFF'
                }}
                aria-label={isArabic ? 'الشريحة السابقة' : 'Previous slide'}
              >
                <svg 
                  className="w-7 h-7 md:w-8 md:h-8 transition-transform group-hover:scale-110" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ transform: isArabic ? 'rotate(180deg)' : 'none' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => swiperRef.current?.slideNext()}
                className="w-14 h-14 md:w-16 md:h-16 rounded-full transition-all duration-300 flex items-center justify-center group cursor-pointer"
                style={{
                  backgroundColor: 'var(--madina-primary)',
                  color: '#FFFFFF'
                }}
                aria-label={isArabic ? 'الشريحة التالية' : 'Next slide'}
              >
                <svg 
                  className="w-7 h-7 md:w-8 md:h-8 transition-transform group-hover:scale-110" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ transform: isArabic ? 'rotate(180deg)' : 'none' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => swiperRef.current?.slidePrev()}
                className="w-14 h-14 md:w-16 md:h-16 rounded-full transition-all duration-300 flex items-center justify-center group cursor-pointer "
                aria-label="Previous slide"
              >
                <img 
                  src={rightArrow} 
                  alt="Previous" 
                  className="w-7 h-7 md:w-8 md:h-8 transition-transform group-hover:scale-110 rtl:rotate-180 dark:brightness-125" 
                />
              </button>
              <button
                onClick={() => swiperRef.current?.slideNext()}
                className="w-14 h-14 md:w-16 md:h-16 rounded-full  transition-all duration-300 flex items-center justify-center group cursor-pointer "
                aria-label="Next slide"
              >
                <img 
                  src={leftArrow} 
                  alt="Next" 
                  className="w-7 h-7 md:w-8 md:h-8 transition-transform group-hover:scale-110 rtl:rotate-180 dark:brightness-125" 
                />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
