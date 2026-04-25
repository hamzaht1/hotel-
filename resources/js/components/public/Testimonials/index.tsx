import React from 'react'
import TestimonialSlider from './TestimonialSlider'
import AnimatedHeading from '@/components/motion/AnimatedHeading'
import { useLang } from '@/hooks/useLang'

interface DbTestimonial {
  id: number; guest_name: string; rating: number;
  comment: string | null; created_at: string;
}

interface Props {
  dbTestimonials?: DbTestimonial[]
}

/**
 * Testimonials component - Customer testimonials section
 * Shows hotel-owner/guest testimonials. Prefers DB-sourced published reviews
 * and falls back to the static TESTIMONIALS_DATA inside TestimonialSlider.
 */
const Testimonials = ({ dbTestimonials }: Props) => {
  const { __ } = useLang()
  return (
    <section className="text-center pb-16">
      <AnimatedHeading dir="up" delay={0.30}>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight pb-16">
          <span className="text-public-primary">{__("messages.section_titles.testimonials.title")}</span>
          <span className="text-public-active">{__("messages.section_titles.testimonials.subtitle")}</span>
        </h2>
      </AnimatedHeading>
      <div className="mx-auto px-4 sm:px-18">
        <div className="relative max-w-7xl mx-auto px-4 overflow-hidden">
          <TestimonialSlider dbTestimonials={dbTestimonials} />
        </div>
      </div>
    </section>
  )
}

export default Testimonials
