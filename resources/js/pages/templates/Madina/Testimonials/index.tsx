/**
 * Testimonials Section - Customer Reviews Slider
 * Clean square cards design with consistent formatting
 * Displays 3 cards at a time, navigates through 6 testimonials
 * Uses CSS variables for colors and  styles for dark mode
 * Uses CSS variables for colors and  styles for dark sd
*/
import { useRef, useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import BackgroundTitle from '@/components/templates/BackgroundTitle'
import { useTemplateT, useTemplateLanguage } from '@/hooks/useTemplateTranslations'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'

// Import images from template folder
import leftArrow from '../images/left-arrow.png'
import rightArrow from '../images/right-arrow.png'
import leftLine from '../images/rooms/left-line.svg'
import rightLine from '../images/rooms/right-line.svg'
import avatarImage from '../images/partners/avatar.svg'

// Bilingual testimonial interface
interface BilingualTestimonial {
  id: number
  nameAr: string
  nameEn: string
  roleAr: string
  roleEn: string
  commentAr: string
  commentEn: string
  avatar?: string
  rating?: number
}

// A published guest review coming from the backend.
interface PublicReview {
  id: number
  guest_name: string
  rating: number
  comment: string | null
}

export default function TestimonialsSection({ reviews }: { reviews?: PublicReview[] }) {
  const t = useTemplateT()
  const { isArabic } = useTemplateLanguage()
  const swiperRef = useRef<SwiperType | null>(null)
  const [cardStyle, setCardStyle] = useState<'default' | 'simple'>('default')
  
  // Load testimonial card style from localStorage
  useEffect(() => {
    const savedStyle = localStorage.getItem('madina-testimonial-card-style')
    if (savedStyle) {
      if (savedStyle === 'simple') {
        setCardStyle('simple')
      } else {
        setCardStyle('default')
      }
    }
    
    // Listen for custom event from ThemeSwitcher
    const handleStyleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: 'default' | 'simple'; id: string }>
      if (customEvent.detail && customEvent.detail.type) {
        setCardStyle(customEvent.detail.type)
      }
    }
    
    window.addEventListener('madina-testimonial-card-style-changed', handleStyleChange)
    
    return () => {
      window.removeEventListener('madina-testimonial-card-style-changed', handleStyleChange)
    }
  }, [])

  // Force Swiper to update when card style changes
  useEffect(() => {
    if (swiperRef.current) {
      setTimeout(() => {
        if (swiperRef.current) {
          swiperRef.current.update()
          swiperRef.current.updateSlides()
          swiperRef.current.slideTo(0, 0)
        }
      }, 100)
    }
  }, [cardStyle])
  
  // Bilingual testimonials data
  const bilingualTestimonialsData: BilingualTestimonial[] = [
    {
      id: 1,
      nameAr: 'أحمد محمد',
      nameEn: 'Ahmed Mohammed',
      roleAr: 'عميل',
      roleEn: 'Guest',
      commentAr: 'تجربة رائعة وخدمة ممتازة. أنصح الجميع بزيارة هذا الفندق. الإقامة كانت مريحة والموظفون محترفون جداً.',
      commentEn: 'Excellent experience and outstanding service. I highly recommend everyone to visit this hotel. The stay was comfortable and the staff were very professional.',
      avatar: avatarImage,
    },
    {
      id: 2,
      nameAr: 'فاطمة علي',
      nameEn: 'Fatima Ali',
      roleAr: 'عميلة',
      roleEn: 'Guest',
      commentAr: 'الغرف نظيفة والموظفون متعاونون جداً. سأعود بالتأكيد. الموقع ممتاز والخدمات على أعلى مستوى.',
      commentEn: 'Clean rooms and very cooperative staff. I will definitely return. Excellent location and top-tier services.',
      avatar: avatarImage,
    },
    {
      id: 3,
      nameAr: 'خالد عبدالله',
      nameEn: 'Khalid Abdullah',
      roleAr: 'عميل',
      roleEn: 'Guest',
      commentAr: 'فندق جميل وموقع متميز. الإفطار كان لذيذاً والمرافق متطورة. تجربة تستحق التكرار.',
      commentEn: 'Beautiful hotel and excellent location. The breakfast was delicious and the facilities are modern. An experience worth repeating.',
      avatar: avatarImage,
    },
    {
      id: 4,
      nameAr: 'سارة أحمد',
      nameEn: 'Sara Ahmed',
      roleAr: 'عميلة',
      roleEn: 'Guest',
      commentAr: 'إقامة ممتازة بكل المقاييس. الفندق نظيف والخدمة سريعة. أنصح به بشدة للعائلات.',
      commentEn: 'Excellent stay by all standards. The hotel is clean and service is fast. I highly recommend it for families.',
      avatar: avatarImage,
    },
    {
      id: 5,
      nameAr: 'محمد حسن',
      nameEn: 'Mohammed Hassan',
      roleAr: 'عميل',
      roleEn: 'Guest',
      commentAr: 'تجربة فريدة من نوعها. الغرف واسعة ومريحة والطاقم ودود. سأعود قريباً إن شاء الله.',
      commentEn: 'A unique experience. The rooms are spacious and comfortable, and the staff are friendly. I will return soon, God willing.',
      avatar: avatarImage,
    },
    {
      id: 6,
      nameAr: 'نورا السالم',
      nameEn: 'Nora Al-Salem',
      roleAr: 'عميلة',
      roleEn: 'Guest',
      commentAr: 'فندق راقي بمعنى الكلمة. كل التفاصيل منظمة والخدمة ممتازة. المكان هادئ ومريح للغاية.',
      commentEn: 'A truly luxurious hotel. Every detail is organized and the service is excellent. The place is very quiet and comfortable.',
      avatar: avatarImage,
    },
  ]
  
  // Map real published reviews into the card shape. A guest comment is written
  // in a single language, so the same text is shown for both locales; the role
  // is a generic localized "Guest" label. Fall back to the demo data when the
  // tenant has no published reviews yet (keeps the template preview populated).
  const realTestimonials: BilingualTestimonial[] = (reviews ?? [])
    .filter((r) => (r.comment ?? '').trim() !== '')
    .map((r) => ({
      id: r.id,
      nameAr: r.guest_name,
      nameEn: r.guest_name,
      roleAr: 'عميل',
      roleEn: 'Guest',
      commentAr: r.comment ?? '',
      commentEn: r.comment ?? '',
      avatar: avatarImage,
      rating: r.rating,
    }))

  const testimonialsData = realTestimonials.length > 0 ? realTestimonials : bilingualTestimonialsData
  
  // Function to get card background color based on index
  const getCardColor = (index: number): string => {
    // Alternating colors: odd cards one color, even another
    if (index % 2 === 0) {
      return '#E5DED7' // Odd cards (1, 3, 5, ...)
    }
    return 'var(--madina-primary)' // Even cards (2, 4, 6, ...)
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {/* Section Title */}
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
              {t('sections.testimonials.title', 'آراء عملائنا الكرام')}
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
            text={t('sections.testimonials.background_title', 'التقييمات')} 
            colorClass="dark:text-[rgba(237,237,237,0.2)]"
            colorStyle={{ color: 'var(--madina-primary)', opacity: 0.1 }}
          />
          <p className="madina-font madina-text-body relative z-10 text-xl">
            {t('sections.testimonials.subtitle', 'اكتشف ما يقوله ضيوفنا عن تجربتهم معنا واطلع على تقييماتهم الصادقة')}
          </p>
        </div>

        {/* Testimonials Slider */}
        <div className="relative flex items-stretch gap-4 md:gap-6">
          {/* Previous button */}
          <button
            className="testimonial-prev flex-shrink-0 self-center transition-all duration-300 cursor-pointer hover:scale-110 z-10"
            aria-label="Previous testimonials"
          >
            <div 
              className="w-10 h-10 ltr:hidden madina-testimonial-nav-arrow"
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
                backgroundColor: 'var(--madina-testimonial-nav-bg, var(--madina-primary))',
                opacity: 0.7
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            />
            <div 
              className="w-10 h-10 rtl:hidden madina-testimonial-nav-arrow"
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
                backgroundColor: 'var(--madina-testimonial-nav-bg, var(--madina-primary))',
                opacity: 0.7
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            />
          </button>

          {/* Swiper Container */}
          <div className="flex-1 min-w-0">
            <Swiper
              key={`testimonials-swiper-${cardStyle}`}
              onSwiper={(swiper) => {
                swiperRef.current = swiper
              }}
              modules={[Navigation, Autoplay]}
              spaceBetween={24}
              slidesPerView={1}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
              }}
              navigation={{
                prevEl: '.testimonial-prev',
                nextEl: '.testimonial-next',
              }}
              breakpoints={{
                640: {
                  slidesPerView: 1,
                  spaceBetween: 20,
                },
                768: {
                  slidesPerView: 2,
                  spaceBetween: 24,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 24,
                },
              }}
              className="testimonials-swiper"
              style={{
                '--swiper-slide-height': 'auto'
              } as React.CSSProperties}
            >
              {testimonialsData.map((testimonial, index) => {
              const name = isArabic ? testimonial.nameAr : testimonial.nameEn
              const role = isArabic ? testimonial.roleAr : testimonial.roleEn
              const comment = isArabic ? testimonial.commentAr : testimonial.commentEn
              const cardColor = getCardColor(index)
              
              // Check if in dark mode for proper text color
              const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
              
              return (
                <SwiperSlide key={`${testimonial.id}-${cardStyle}`} className="h-auto">
                  {/* Use SVG as background - default style only */}
                  <div
                    className={`relative transition-all duration-300 h-full ${
                      cardStyle === 'simple' 
                        ? 'rounded-xl shadow-lg overflow-hidden' 
                        : ''
                    }`}
                    style={{
                      width: '100%',
                      height: '100%',
                      color: cardColor,
                      ...(cardStyle === 'simple' ? { backgroundColor: cardColor } : {})
                    }}
                  >
                    {/* SVG background - default style only */}
                    {cardStyle === 'default' && (
                      <svg 
                        viewBox="0 0 379 390" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        className="madina-testimonial-card-bg absolute inset-0 w-full h-full"
                        aria-hidden="true"
                        preserveAspectRatio="none"
                      >
                        <path 
                          d="M346.412 389.888C332.093 389.501 307.547 388.921 277.005 388.728C221.493 388.341 193.137 389.501 125.352 389.888C107.295 389.985 79.0099 390.082 43.8124 389.888C36.6177 386.164 13.0587 381.569 11.2248 367.543C1.56132 294.363 15.9507 204.642 1.84345 127.254C-4.43426 92.7201 6.9926 58.863 11.2248 26.5537C11.4364 23.5066 12.4943 17.509 18.631 12.3337C23.2864 8.416 29.8463 5.61072 37.5347 4.64338C70.7572 0.338695 98.0546 -0.290091 117.805 0.0968465C157.234 0.822355 162.243 5.36889 203.859 5.17542C249.707 4.98195 261.628 -0.628662 301.692 0.0968465C321.372 0.435417 338.794 2.12826 353.325 4.20805C368.349 6.33621 379 15.526 379 26.0701V367.591C379 379.925 364.399 389.937 346.412 389.937V389.888Z" 
                          fill="currentColor"
                        />
                      </svg>
                    )}
                    
                    {/* Card content */}
                    <div className="relative z-10 madina-font h-full w-full flex flex-col items-center text-center p-6">
                      {/* Image */}
                      <div className="mb-4 flex items-center justify-center flex-shrink-0">
                        <img 
                          src={avatarImage} 
                          alt={name}
                          className="w-20 h-20 rounded-full object-contain mx-auto"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                            padding: '8px'
                          }}
                        />
                      </div>

                      {/* Name */}
                      <h3 
                        className="madina-font-heading text-lg font-bold mb-1 flex-shrink-0"
                        style={{
                          color: isDarkMode ? 'var(--madina-testimonial-name-color, #FFFFFF)' : 'var(--madina-testimonial-name-color, #000000)'
                        }}
                      >
                        {name}
                      </h3>

                      {/* Role */}
                      <p
                        className="text-xs mb-2 flex-shrink-0"
                        style={{
                          color: isDarkMode ? 'var(--madina-testimonial-text-color, rgba(255,255,255,0.8))' : 'var(--madina-testimonial-text-color, rgba(0,0,0,0.6))'
                        }}
                      >
                        {role}
                      </p>

                      {/* Star rating (real reviews only) */}
                      {typeof testimonial.rating === 'number' && (
                        <div className="mb-4 flex-shrink-0 text-base leading-none tracking-wide" aria-label={`${testimonial.rating}/5`}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span key={n} style={{ color: n <= testimonial.rating! ? '#F5B301' : 'rgba(0,0,0,0.18)' }}>★</span>
                          ))}
                        </div>
                      )}

                      {/* Testimonial text */}
                      <div className="relative w-full flex-grow flex flex-col justify-start">
                        {/* Testimonial content */}
                        <p 
                          className="leading-relaxed text-sm flex-grow"
                          style={{
                            color: isDarkMode ? 'var(--madina-testimonial-text-color, rgba(255,255,255,0.9))' : 'var(--madina-testimonial-text-color, rgba(0,0,0,0.8))',
                            lineHeight: '1.8',
                            display: '-webkit-box',
                            WebkitLineClamp: 6,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {comment}
                        </p>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              )
            })}
            </Swiper>
          </div>

          {/* Next button */}
          <button
            className="testimonial-next flex-shrink-0 self-center hover:scale-110 transition-all duration-300 cursor-pointer z-10"
            aria-label="Next testimonials"
          >
            <div 
              className="w-10 h-10 ltr:hidden madina-testimonial-nav-arrow"
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
                backgroundColor: 'var(--madina-testimonial-nav-bg, var(--madina-primary))',
                opacity: 0.7
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            />
            <div 
              className="w-10 h-10 rtl:hidden madina-testimonial-nav-arrow"
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
                backgroundColor: 'var(--madina-testimonial-nav-bg, var(--madina-primary))',
                opacity: 0.7
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            />
          </button>
        </div>
      </div>

      {/* CSS for equal card height */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .testimonials-swiper .swiper-slide {
            height: auto;
            display: flex;
          }
          .testimonials-swiper .swiper-wrapper {
            display: flex;
            align-items: stretch;
          }
          
          /* Dark Mode: Odd cards use primary or custom, Even cards use primary3 or custom */
          .dark .testimonials-swiper .swiper-slide:nth-child(odd) .madina-testimonial-card-bg path {
            fill: var(--madina-testimonial-odd-bg, var(--madina-primary)) !important;
          }
          .dark .testimonials-swiper .swiper-slide:nth-child(even) .madina-testimonial-card-bg path {
            fill: var(--madina-testimonial-even-bg, var(--madina-primary3)) !important;
          }
          
          /* Simple card style - apply background colors */
          .dark .testimonials-swiper .swiper-slide:nth-child(odd) > div[style*="backgroundColor"] {
            background-color: var(--madina-testimonial-odd-bg, var(--madina-primary)) !important;
          }
          .dark .testimonials-swiper .swiper-slide:nth-child(even) > div[style*="backgroundColor"] {
            background-color: var(--madina-testimonial-even-bg, var(--madina-primary3)) !important;
          }
          
          /* Dark Mode: Testimonial text colors (name, role, comment) */
          .dark .testimonials-swiper h3 {
            color: var(--madina-testimonial-name-color, #FFFFFF) !important;
          }
          .dark .testimonials-swiper p {
            color: var(--madina-testimonial-text-color, rgba(255,255,255,0.9)) !important;
          }
          
          /* Dark Mode: Navigation arrows */
          .dark .madina-testimonial-nav-arrow {
            background-color: var(--madina-testimonial-nav-bg, var(--madina-primary)) !important;
          }
        `
      }} />
    </section>
  )
}
