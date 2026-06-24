/**
 * قسم آراء العملاء - قالب الرياض
 */
import { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import userAvatar from '@/assets/images/riyadh-template/user.png'
import leftArrow from '@/assets/images/riyadh-template/left-arrow.png'
import rightArrow from '@/assets/images/riyadh-template/right-arrow.png'
import BackgroundTitle from '@/components/templates/BackgroundTitle'
import { useTemplateT, useTemplateLanguage } from '@/hooks/useTemplateTranslations'

import leftLine from '@/assets/images/riyadh-template/rooms/left-line.svg'
import rightLine from '@/assets/images/riyadh-template/rooms/right-line.svg'
// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'

// Bilingual testimonial interface
interface BilingualTestimonial {
  id: number
  nameAr: string
  nameEn: string
  roleAr: string
  roleEn: string
  commentAr: string
  commentEn: string
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

  // Demo data shown when the tenant has no published reviews yet.
  const mockTestimonials: BilingualTestimonial[] = [
    {
      id: 1,
      nameAr: "أحمد العبدالله",
      nameEn: "Ahmed Al-Abdullah",
      roleAr: "رجل أعمال",
      roleEn: "Businessman",
      commentAr: "تجربة رائعة جداً! الخدمة ممتازة والغرف نظيفة ومريحة. أنصح بشدة بالإقامة في هذا الفندق.",
      commentEn: "Amazing experience! Excellent service and clean, comfortable rooms. I highly recommend staying at this hotel.",
    },
    {
      id: 2,
      nameAr: "فاطمة الأحمد",
      nameEn: "Fatima Al-Ahmad",
      roleAr: "مديرة تسويق",
      roleEn: "Marketing Manager",
      commentAr: "فندق رائع مع فريق عمل محترف جداً. الموقع ممتاز والمرافق من أعلى مستوى. سأعود بالتأكيد!",
      commentEn: "Wonderful hotel with a very professional team. Excellent location and top-tier facilities. I will definitely return!",
    },
    {
      id: 3,
      nameAr: "محمد الصالح",
      nameEn: "Mohammed Al-Saleh",
      roleAr: "طبيب",
      roleEn: "Doctor",
      commentAr: "إقامة مريحة وهادئة. المطعم يقدم أطباق لذيذة والمسبح رائع. الفندق يستحق التقييم العالي.",
      commentEn: "Comfortable and peaceful stay. The restaurant serves delicious dishes and the pool is wonderful. The hotel deserves high ratings.",
    },
    {
      id: 4,
      nameAr: "نورا المطيري",
      nameEn: "Nora Al-Mutairi",
      roleAr: "مهندسة",
      roleEn: "Engineer",
      commentAr: "أفضل فندق أقمت فيه في الرياض. الخدمة سريعة والطاقم ودود جداً. المكان نظيف ومنظم بشكل مثالي.",
      commentEn: "Best hotel I've stayed at in Riyadh. Fast service and very friendly staff. The place is perfectly clean and organized.",
    }
  ]

  // Map real published reviews into the card shape; fall back to demo data.
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
      rating: r.rating,
    }))

  const testimonialsData = realTestimonials.length > 0 ? realTestimonials : mockTestimonials

  return (
    <section className="py-20   ">
      <div className="container mx-auto px-4">
        {/* Title */}
        <div className="relative text-center mb-16">

          <div className="flex items-center justify-center gap-4 mb-4">
            <img src={leftLine} alt="left line" className="h-6 w-auto hidden md:block line-icon" />
              <h2 className="relative z-10 text-4xl md:text-5xl font-bold riyadh-heading mb-4">
                {t('sections.testimonials.title', 'آراء عملائنا الكرام')}
              </h2>
            <img src={rightLine} alt="right line" className="h-6 w-auto hidden md:block line-icon" />
          </div>
          <BackgroundTitle text={t('sections.testimonials.background_title', 'التقييمات')} />
          <p className="relative z-10 text-xl riyadh-text-muted max-w-2xl mx-auto">
            {t('sections.testimonials.subtitle', 'اكتشف ما يقوله ضيوفنا عن تجربتهم معنا واطلع على تقييماتهم الصادقة')}
          </p>
        </div>

        {/* Testimonials slider */}
        <div className="relative mb-16">
          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper
            }}
            modules={[Navigation, Autoplay]}
            spaceBetween={8}
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
                spaceBetween: 5,
              },
              768: {
                slidesPerView: 1,
        
                spaceBetween: 8,
              },
              1540: {
                slidesPerView: 3,
                spaceBetween: 8,
              },
            }}
            className="testimonials-swiper"
          >
            {/* Previous button */}
            <button
              className="testimonial-prev absolute top-1/2 -translate-y-1/2 start-0 z-10 ransition-all duration-300 cursor-pointer"
            >
              <img src={leftArrow} alt="Previous" className="w-12 h-12 ltr:hidden" />
              <img src={rightArrow} alt="Previous" className="w-12 h-12 rtl:hidden" />
            </button>

            {testimonialsData.map((testimonial) => {
              const name = isArabic ? testimonial.nameAr : testimonial.nameEn
              const role = isArabic ? testimonial.roleAr : testimonial.roleEn
              const comment = isArabic ? testimonial.commentAr : testimonial.commentEn
              
              return (
                <SwiperSlide key={testimonial.id}>
                  <div className="triangle-card relative ">
                    <div className="triangle-shape  shadow-lg hover:shadow-xl transition-shadow duration-300" style={{ backgroundColor: 'var(--riyadh-primary)' }}>
                      <div className="triangle-content  p-6 text-center">
                        {/* Customer image */}
                        <div className="flex justify-center mb-3">
                          <img 
                            src={userAvatar} 
                            alt={name}
                            className="w-10 h-10 md:w-16 md:h-16 rounded-full object-cover border-2 border-white"
                          />
                        </div>

                        {/* Customer info */}
                        <div className="flex flex-col items-center mb-3">
                          <div>
                            <p className="text-sm sm:text-xl font-bold text-white mb-1">{name}</p>
                            <p className="text-gray-300 dark:text-gray-200 text-sm sm:text-base">{role}</p>
                            {typeof testimonial.rating === 'number' && (
                              <div className="mt-1 text-sm leading-none tracking-wide" aria-label={`${testimonial.rating}/5`}>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <span key={n} style={{ color: n <= testimonial.rating! ? '#F5B301' : 'rgba(255,255,255,0.3)' }}>★</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quote mark */}
                        <div className="text-start my-3 px-8">
                          <span className="text-5xl sm:text-6xl leading-none text-gray-300 dark:text-gray-200">❝</span>
                        </div>

                        {/* Comment */}
                        <p className="text-gray-100 dark:text-white leading-relaxed text-xs sm:text-sm px-6 sm:px-8">
                          {comment}
                        </p>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              )
            })}

            {/* Next button */}
            <button
              className="testimonial-next absolute top-1/2 -translate-y-1/2 end-0 z-10 hover:scale-110 transition-all duration-300 cursor-pointer"
            >
              <img src={rightArrow} alt="Next" className="w-12 h-12 ltr:hidden" />
              <img src={leftArrow} alt="Next" className="w-12 h-12 rtl:hidden" />
            </button>
          </Swiper>
        </div>
      </div>

      {/* CSS for triangle style */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .triangle-card {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
            padding: 5px;
          }

          .triangle-shape {
            width: 100%;
            max-width: 450px;
            height: 400px;
            clip-path: path('M 225 5 Q 240 -5, 255 5 L 448 370 Q 455 390, 428 402 L 22 402 Q -5 390, 2 370 Z');
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: box-shadow 0.3s ease;
            background: var(--riyadh-primary);
          }


          .triangle-content {

            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
            text-align: center;
            padding-bottom: 40px;
          }

          .triangle-content h4 {
            font-size: 16px;
            margin-bottom: 4px;
          }

          .triangle-content p {
            font-size: 14px;
            line-height: 1.4;
          }

          @media (max-width: 768px) {
            .triangle-shape {
             
              max-width: 350px;
              height: 340px;
              clip-path: path('M 175 4 Q 187 -4, 199 4 L 348 318 Q 354 336, 334 344 L 16 344 Q -4 336, 2 318 Z');
            }
          @media (max-width: 400px) {
            .triangle-shape {

              max-width: 300px;
              height: 300px;
              border-radius: 12px;
              clip-path: none;
            }
            
            .triangle-content {
              padding-bottom: 30px;
            }

            .triangle-content h4 {
              font-size: 18px;
              margin-bottom: 6px;
            }

            .triangle-content p {
              font-size: 13px;
              line-height: 1.3;
            }
          }

          /* Dark mode triangle customizations */
          .dark .triangle-shape {
            background: var(--riyadh-primary) !important;
            border: 2px solid rgba(255, 255, 255, 0.12);

          }
        `
      }} />
    </section>
  )
}