import React, { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectCoverflow } from 'swiper/modules'
import { TESTIMONIALS_DATA } from '@/data/public-data'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import TestimonialCard from './TestimonialCard'

// Import testimonial image
import testimonialLogo from '@/assets/images/testimonlis/logo-1.svg'

/**
 * TestimonialSlider component - Swiper-based testimonial carousel.
 * Prefers server-provided dbTestimonials (published reviews) and falls
 * back to the bundled TESTIMONIALS_DATA for offline previews.
 */
const TestimonialSlider = ({ dbTestimonials } = {}) => {
  const swiperRef = useRef(null)

  const transformedTestimonials = (dbTestimonials && dbTestimonials.length > 0)
    ? dbTestimonials.map((r) => ({
        id: r.id,
        name: r.guest_name,
        position: '★'.repeat(Math.max(1, Math.min(5, r.rating))),
        text: r.comment ?? '',
        image: testimonialLogo,
      }))
    : TESTIMONIALS_DATA.map(t => ({ ...t, image: testimonialLogo }))

  return (
    <Swiper
      ref={swiperRef}
      modules={[Autoplay, EffectCoverflow]}
      effect="coverflow"
      grabCursor
      centeredSlides
      loop={transformedTestimonials.length > 6}
      slidesPerView={2.2}
      observer
      observeParents
      watchSlidesProgress
      // Coverflow effect configuration
      coverflowEffect={{
        rotate: 0,
        stretch: 0,
        depth: 150,
        modifier: 1.5,
        slideShadows: false,
      }}
      // Autoplay configuration
      autoplay={{
        delay: 4000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      }}
      // Swiper event handlers
      onSwiper={(swiper) => {
        swiperRef.current = { swiper }
      }}
      onSlideChange={() => {
        if (swiperRef.current && swiperRef.current.swiper) {
          swiperRef.current.swiper.updateProgress()
        }
      }}
      // Responsive breakpoints
      breakpoints={{
        320: {
          slidesPerView: 1,
          spaceBetween: 20,
          centeredSlides: true,
          coverflowEffect: { rotate: 0, stretch: 0, depth: 100, modifier: 1 }
        },
        768: {
          slidesPerView: 1,
          spaceBetween: 20,
          centeredSlides: true,
          coverflowEffect: { rotate: 0, stretch: 0, depth: 100, modifier: 1 }
        },
        1024: {
          slidesPerView: 2.2,
          spaceBetween: 40,
          centeredSlides: true,
          coverflowEffect: { rotate: 0, stretch: 0, depth: 150, modifier: 1.5 }
        },
      }}
      className="testimonials-swiper pb-12"
    >
      {/* Render testimonial slides */}
      {transformedTestimonials.map((testimonial) => (
        <SwiperSlide key={testimonial.id} className="pb-8">
          {({ isActive }) => (
            <TestimonialCard testimonial={testimonial} isActive={isActive} />
          )}
        </SwiperSlide>
      ))}
    </Swiper>
  )
}

export default TestimonialSlider
