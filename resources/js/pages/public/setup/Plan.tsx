import React from 'react'
import { router, Head } from '@inertiajs/react'
import PublicLayout from '@/layouts/public-layout'
import SetupBanner from '@/components/public/setup/SetupBanner'
import PlanCard from '@/components/public/Pricing/PlanCard'
import type { Plan as PlanType } from '@/components/public/Pricing/types'
import AnimatedHeading from '@/components/motion/AnimatedHeading'
import AnimatedParagraph from '@/components/motion/AnimatedParagraph'
import { useLang } from '@/hooks/useLang'
import starterIcon from '@/assets/images/icons/starter-package.svg'
import developmentIcon from '@/assets/images/icons/development-package.svg'
import premiumIcon from '@/assets/images/icons/premium-package.svg'

interface DbPlan {
  id: number
  slug: string
  name_ar: string
  name_en: string
  price: string
  billing_cycle: string
  features_ar: string[] | null
  features_en: string[] | null
  variant: string | null
  icon: string | null
}

interface Props {
  setup: Record<string, string>
  plans: DbPlan[]
}

const iconMap: Record<string, string> = {
  starter: starterIcon,
  growth: developmentIcon,
  premium: premiumIcon,
}

export default function Plan({ setup, plans }: Props) {
  const { __ } = useLang()

  const handleSubscribe = (plan: { key: string; name: string }) => {
    // Find the DB plan by slug to get its ID
    const dbPlan = plans.find((p) => p.slug === plan.key)
    if (!dbPlan) return

    router.post('/setup/plan', {
      plan_id: dbPlan.id,
    })
  }

  // Transform DB plans into PlanCard-compatible format
  const planCards: PlanType[] = plans.map((p) => ({
    key: p.slug,
    name: p.name_ar,
    iconSrc: iconMap[p.icon || p.slug] || starterIcon,
    iconAlt: p.name_en,
    price: Number(p.price).toLocaleString(),
    period: p.billing_cycle === 'yearly' ? 'سنوياً' : 'شهرياً',
    vatNote: 'شامل ضريبة القيمة المضافة',
    features: p.features_ar || [],
    variant: (p.variant as PlanType['variant']) || 'light',
  }))

  return (
    <PublicLayout>
      <Head title="اختيار خطة الاشتراك | ضيافة">
        <meta name="description" content="اختر خطة الاشتراك المناسبة لمنشأتك السياحية." />
      </Head>

      <section className="bg-white p-6 mx-auto max-w-screen-xl">
        <SetupBanner />
        <div className='sm:border sm:rounded-2xl sm:shadow'>
          <div className="px-4 sm:p-6 lg:p-8 text-center">
            <AnimatedHeading dir="up" delay={0.30}>
              <h2 className="text-xl sm:text-3xl font-bold text-public-primary">
                {setup?.template_title ? (
                  <>
                    {__("messages.setup.plan.selected_template_label")}
                    <span className="text-public-active mx-2">{setup.template_title}</span>
                  </>
                ) : (
                  __("messages.setup.plan.choose_plan_prompt")
                )}
              </h2>
            </AnimatedHeading>
            <AnimatedParagraph dir="none" delay={0.70}>
              <p className="mt-2 text-lg sm:text-xl text-public-sub-title">
                {__("messages.setup.plan.choose_plan_prompt")}
              </p>
            </AnimatedParagraph>
          </div>

          <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="mx-auto grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {planCards.map((p) => (
                <PlanCard key={p.key} plan={p} onSubscribe={handleSubscribe} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
