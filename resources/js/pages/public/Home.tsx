import { Head } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout'
import Hero from '@/components/public/Hero'
import Templates from '@/components/public/templates'
import WhyUs from '@/components/public/WhyUs'
import HowWeWork from '@/components/public/HowWeWork'
import Hotels from '@/components/public/Hotels'
import Testimonlis from '@/components/public/Testimonials'
import Pricing from '@/components/public/Pricing'
import Contact from '@/components/public/Contact'
import { motion } from 'motion/react';
import SchemaScript from '@/components/seo/SchemaScript';
import SEOFAQs from '@/components/seo/SEOFAQs';

interface DbPlan {
  id: number; slug: string; name_ar: string; name_en: string;
  price: string; billing_cycle: string; features_ar: string[] | null;
  features_en: string[] | null; variant: string | null; icon: string | null;
}

interface DbTemplate {
  id: number; key: string;
  name_ar: string; name_en: string;
  city_ar: string | null; city_en: string | null;
  description_ar: string | null; description_en: string | null;
  preview_image: string | null; demo_url: string | null;
  is_active: boolean; is_coming_soon: boolean;
}

interface DbTestimonial {
  id: number; guest_name: string; rating: number;
  comment: string | null; created_at: string;
}

interface DbPartner {
  id: number; name: string;
  org_name_ar: string | null; org_name_en: string | null;
  logo: string | null;
}

interface Props {
  plans?: DbPlan[];
  templates?: DbTemplate[];
  testimonials?: DbTestimonial[];
  partners?: DbPartner[];
  siteSettings?: Record<string, Record<string, string | null>>;
}

// Public page: Home landing page — renders hero, why-us, pricing and other public sections.
export default function Home({ plans, templates, testimonials, partners, siteSettings }: Props) {
  return (
    <PublicLayout>
        <Head title="ضيافة - الصفحة الرئيسية | نظام إدارة الفنادق المتكامل">
          <meta name="description" content="ضيافة - نظام متكامل لإدارة الفنادق والشقق المفروشة. يوفر أدوات متطورة لإدارة الحجوزات وخدمة العملاء وتحسين تجربة الضيوف." />
          <meta name="keywords" content="إدارة فنادق, نظام حجوزات, إدارة شقق مفروشة, ضيافة, برنامج فندقة" />
        </Head>
        <SchemaScript 
          schema={{
            type: 'SoftwareApplication',
            name: 'ضيافة - نظام إدارة الفنادق',
            applicationCategory: 'نظام إدارة فنادق وشقق مفروشة',
            operatingSystem: 'Web, iOS, Android',
            offers: {
              price: '820',
              priceCurrency: 'SAR',
              priceValidUntil: '2025-12-31'
            }
          }}
        />
                {/* Background */}
          <div className="overflow-hidden bg-background dark:bg-neutral-950 text-foreground dark:text-white">
            {/* Animated gradient orbs with subtle parallax + mouse drift */}
            <motion.div
              className="pointer-events-none fixed -right-1/4 -bottom-1/4 h-[70vh] w-[50vh] animate-[spin_14s_linear_infinite_reverse] rounded-full 
                        bg-[conic-gradient(at_bottom_right,_#01004C,_#5A5ECD,_#8689E3,_#01004C)] opacity-20 blur-3xl"
              aria-hidden
            />
            {/* Extra orbs for richness */}
            <motion.div
              className="pointer-events-none fixed -top-80 right-0 h-[45vh] w-[25vh] animate-[spin_30s_linear_infinite] rounded-full 
                        bg-[conic-gradient(at_top_right,_#027F84,_#8689E3,_#5A5ECD,_#027F84)] opacity-15 blur-3xl"
              aria-hidden
            />
            <motion.div
              className="pointer-events-none fixed -left-2 top-1/2 h-[36vh] w-[56vh] animate-[spin_30s_linear_infinite_reverse] rounded-full 
                        bg-[conic-gradient(at_left,_#454891,_#8689E3,_#5A5ECD,_#454891)] opacity-10 blur-3xl"
              aria-hidden
            />
            <motion.div
              className="pointer-events-none fixed top-1/4 left-1/2 h-[28vh] w-[48vh] animate-[spin_30s_linear_infinite] -translate-x-1/2 -translate-y-1/2 rounded-full 
                        bg-[conic-gradient(at_center,_#027F84,_#5A5ECD,_#8689E3,_#01004C)] opacity-10 blur-3xl"
              aria-hidden
            />
        <Hero />
        <Templates dbTemplates={templates} />
        <WhyUs />
        <HowWeWork />
        <Hotels dbPartners={partners} />
        <Testimonlis dbTestimonials={testimonials} />
        <Pricing dbPlans={plans} />
        <Contact />
        <SEOFAQs />
      </div>

    </PublicLayout>
  )
}
