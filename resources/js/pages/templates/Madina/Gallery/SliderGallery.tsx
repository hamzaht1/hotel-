/**
 * Slider Gallery Section - معرض الصور السلايدر
 * 
 * Features:
 * - Swiper slider with arch frames
 * - Bilingual support (Arabic/English)
 * - Navigation arrows
 * - Responsive design
 * - Uses template's CSS variables for colors
 */
import { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode, Pagination, Navigation } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import BackgroundTitle from '@/components/templates/BackgroundTitle'
import { useTemplateT, useTemplateLanguage } from '@/hooks/useTemplateTranslations'
import { useMergedSiteTexts } from '@/hooks/use-tenant-preview-overrides'
import { pickSiteText } from '@/lib/site-texts'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/free-mode'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

import leftLine from '../images/rooms/left-line.svg'
import rightLine from '../images/rooms/right-line.svg'
import leftArrow from '../images/left-arrow.png'
import rightArrow from '../images/right-arrow.png'

// Import images from template folder
import image1 from '../images/galary/imag1.png'
import image2 from '../images/galary/imag2.png'
import image3 from '../images/galary/imag3.png'
import image4 from '../images/galary/imag4.png'

// Gallery item interface (from CircularGallery)
interface GalleryItem {
  image: string
  text: string
}

interface SliderGalleryProps {
  galleryItems?: GalleryItem[]
}

export default function SliderGallery({ galleryItems }: SliderGalleryProps) {
  const t = useTemplateT()
  const { isArabic } = useTemplateLanguage()
  // Tenant-editable section title/subtitle (section=gallery) from the Site
  // Branding editor; falls back to the bundled translation.
  const siteTexts = useMergedSiteTexts()
  const swiperRef = useRef<SwiperType | null>(null)

  // Use provided galleryItems or fallback to default images
  const galleryImages = galleryItems ? galleryItems.map((item, index) => ({
    id: index + 1,
    src: item.image,
    altAr: item.text,
    altEn: item.text
  })) : [
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
    <section data-preview-section="gallery" className="py-20">
      <div className="container mx-auto px-4">
        {/* Title */}
        <div className="relative text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div 
              className="h-6 w-6 hidden md:block"
              aria-label="left line"
              style={{
                maskImage: `url(${leftLine})`,
                WebkitMaskImage: `url(${leftLine})`,
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
              {pickSiteText(siteTexts, 'gallery', 'title', t('sections.gallery_slider.title', 'جولة افتراضية'), isArabic)}
            </h2>
            <div 
              className="h-6 w-6 hidden md:block"
              aria-label="right line"
              style={{
                maskImage: `url(${rightLine})`,
                WebkitMaskImage: `url(${rightLine})`,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                backgroundColor: 'var(--madina-primary)'
              }}
            />
          </div>
          <BackgroundTitle 
            text={t('sections.gallery_slider.background_title', 'الجولة')} 
            colorClass="dark:text-[rgba(237,237,237,0.2)]"
            colorStyle={{ color: 'var(--madina-primary)', opacity: 0.1 }}
          />
          <p className="relative z-10 text-xl madina-text-body">
            {pickSiteText(siteTexts, 'gallery', 'subtitle', t('sections.gallery_slider.subtitle', 'استكشف الفندق بالصور'), isArabic)}
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
              style={{ 
                fill: 'var(--madina-background-color, var(--madina-bg-primary, #f5f5f5))',
                mixBlendMode: 'multiply'
              }}
              className="dark:fill-[var(--madina-background-color)]"
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
          {galleryImages.map((image, index) => {
            // Use text from galleryItems if available, otherwise use altAr/altEn
            const altText = galleryItems && galleryItems[index] 
              ? (isArabic ? galleryItems[index].text : galleryItems[index].text)
              : (isArabic ? image.altAr : image.altEn)
            
            return (
              <SwiperSlide key={image.id}>
                <div className="w-full h-[600px] overflow-hidden rounded-lg border" style={{ borderColor: 'var(--madina-primary)' }}>
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
        <div className="absolute bottom-0 left-0 w-full overflow-hidden z-10 pointer-events-none h-22 md:h-[180px]">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 1920 100" 
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M0,100 Q960,0 1920,100 L1920,100 L0,100 Z" 
              style={{ 
                fill: 'var(--madina-background-color, var(--madina-bg-primary, #f5f5f5))',
                mixBlendMode: 'multiply'
              }}
              className="dark:fill-[var(--madina-background-color)]"
            />
          </svg>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="container mx-auto px-4">
        <div className="flex justify-center gap-6 mt-8">
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="flex-shrink-0 self-center transition-all duration-300 cursor-pointer hover:scale-110 z-10"
            aria-label={isArabic ? 'الشريحة السابقة' : 'Previous slide'}
          >
            <div 
              className="w-10 h-10 ltr:hidden"
              aria-label="Previous"
              style={{
                maskImage: `url(${leftArrow})`,
                WebkitMaskImage: `url(${leftArrow})`,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                backgroundColor: 'var(--madina-primary)',
                opacity: 0.7
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            />
            <div 
              className="w-10 h-10 rtl:hidden"
              aria-label="Previous"
              style={{
                maskImage: `url(${rightArrow})`,
                WebkitMaskImage: `url(${rightArrow})`,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                backgroundColor: 'var(--madina-primary)',
                opacity: 0.7
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            />
          </button>
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="flex-shrink-0 self-center transition-all duration-300 cursor-pointer hover:scale-110 z-10"
            aria-label={isArabic ? 'الشريحة التالية' : 'Next slide'}
          >
            <div 
              className="w-10 h-10 ltr:hidden"
              aria-label="Next"
              style={{
                maskImage: `url(${rightArrow})`,
                WebkitMaskImage: `url(${rightArrow})`,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                backgroundColor: 'var(--madina-primary)',
                opacity: 0.7
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            />
            <div 
              className="w-10 h-10 rtl:hidden"
              aria-label="Next"
              style={{
                maskImage: `url(${leftArrow})`,
                WebkitMaskImage: `url(${leftArrow})`,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                backgroundColor: 'var(--madina-primary)',
                opacity: 0.7
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            />
          </button>
        </div>
      </div>
    </section>
  )
}
