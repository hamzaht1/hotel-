// Pricing section: main component that renders pricing plans and handles subscribe actions
// File: src/components/public/Pricing/index.tsx
import React, { useMemo } from "react";
import { router } from "@inertiajs/react";
import PlanCard from "./PlanCard";
import { plans as fallbackPlans } from "./plans";
import { useLang } from '@/hooks/useLang'
import type { Plan } from "./types";
import starterIcon from '@/assets/images/icons/starter-package.svg'
import developmentIcon from '@/assets/images/icons/development-package.svg'
import premiumIcon from '@/assets/images/icons/premium-package.svg'

import AnimatedHeading from '@/components/motion/AnimatedHeading'

interface DbPlan {
  id: number; slug: string; name_ar: string; name_en: string;
  price: string; billing_cycle: string; features_ar: string[] | null;
  features_en: string[] | null; variant: string | null; icon: string | null;
}

interface Props {
  dbPlans?: DbPlan[];
}

const iconMap: Record<string, string> = {
  starter: starterIcon,
  growth: developmentIcon,
  premium: premiumIcon,
};

/**
 * Pricing component - Main pricing section
 * Uses DB plans when available, falls back to hardcoded plans
 */
const Pricing: React.FC<Props> = ({ dbPlans }) => {
  const { __ } = useLang()
  const { template_id, template_title } = useMemo(() => {
    if (typeof window === "undefined") return { template_id: "", template_title: "" };
    const qs = new URLSearchParams(window.location.search);
    return {
      template_id: qs.get("template_id") ?? "",
      template_title: qs.get("template_title") ?? "",
    };
  }, []);

  // Convert DB plans to PlanCard format, or use fallback
  const plans: Plan[] = useMemo(() => {
    if (dbPlans && dbPlans.length > 0) {
      return dbPlans.map((p) => ({
        key: p.slug,
        name: p.name_ar,
        iconSrc: iconMap[p.icon || p.slug] || starterIcon,
        iconAlt: p.name_en,
        price: Number(p.price).toLocaleString(),
        period: p.billing_cycle === 'yearly' ? 'سنوياً' : 'شهرياً',
        vatNote: 'شامل ضريبة القيمة المضافة',
        features: p.features_ar || [],
        variant: (p.variant as Plan['variant']) || 'light',
      }));
    }
    return fallbackPlans;
  }, [dbPlans]);

  const handleSubscribe = (plan: Plan) => {
    // If we have DB plans, find the ID for the setup flow
    const dbPlan = dbPlans?.find((p) => p.slug === plan.key);

    if (dbPlan) {
      // New flow: go to setup with plan_id
      router.visit("/setup/plan", {
        method: "post",
        data: { plan_id: dbPlan.id },
        preserveScroll: true,
      });
    } else {
      // Legacy flow
      router.visit("/setup/template", {
        method: "get",
        data: {
          plan_key: plan.key,
          plan_name: plan.name,
          template_id,
          template_title,
        },
        preserveScroll: true,
      });
    }
  };

  return (
    <section id="pricing" className="bg-white">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <header className="mx-auto mb-10 max-w-2xl text-center">
        <AnimatedHeading dir="up" delay={0.30}>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mx-2 mb-4 md:mb-14">
              {__("messages.section_titles.pricing.title")}
              <span className="text-public-active mx-2">
                {__("messages.section_titles.pricing.subtitle")}
              </span>
            </h2>
        </AnimatedHeading>
        </header>

        {/* Plans grid */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <PlanCard key={p.key} plan={p} onSubscribe={handleSubscribe} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
