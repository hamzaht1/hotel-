// Pricing plan definitions — data-driven plan configuration consumed by PlanCard
// File: src/components/public/Pricing/plans.ts
import type { Plan } from "./types";
import starter from '@/assets/images/icons/starter-package.svg'
import development from '@/assets/images/icons/development-package.svg'
import premium from '@/assets/images/icons/premium-package.svg'

/**
 * Pricing plans configuration
 * Defines all available subscription plans with their features and pricing
 */
export const plans: Plan[] = [
  {
    key: "starter",
    name: "ضيافة انطلاقة",
    nameKey: "messages.pricing.plans.starter.name",
    iconSrc: starter,
    iconAlt: "Starter plan icon",
    price: "820",
    period: "سنوياً",
    periodKey: "messages.pricing.plans.starter.period",
    features: [
        "ميزة تجريبية أولى",
        "ميزة تجريبية ثانية",
        "ميزة تجريبية ثالثة",
        "ميزة تجريبية ثالثة",
        "ميزة تجريبية ثالثة",
    ],
    featuresKeys: [
      "messages.pricing.plans.starter.features.0",
      "messages.pricing.plans.starter.features.1",
      "messages.pricing.plans.starter.features.2",
      "messages.pricing.plans.starter.features.3",
      "messages.pricing.plans.starter.features.4",
    ],
    variant: "light",
    },
  {
    key: "premium",
    name: "ضيافة بريميوم",
    nameKey: "messages.pricing.plans.premium.name",
    iconSrc: premium,
    iconAlt: "Premium plan icon",
    price: "3,150",
    period: "سنوياً",
    periodKey: "messages.pricing.plans.premium.period",
    features: [
        "ميزة ميزة ميزة ميزة ميزة ميزة ميزة ميزة ميزة  ",
        "ميزة تجريبية ثانية",
        "ميزة تجريبية ثالثة",
        "ميزة تجريبية ثالثة",
    ],
    featuresKeys: [
      "messages.pricing.plans.premium.features.0",
      "messages.pricing.plans.premium.features.1",
      "messages.pricing.plans.premium.features.2",
      "messages.pricing.plans.premium.features.3",
    ],
    variant: "solid",
  },
  {
    key: "growth",
    name: "ضيافة تطوير",
    nameKey: "messages.pricing.plans.growth.name",
    iconSrc: development,
    iconAlt: "Development plan icon",
    price: "1,950",
    period: "سنوياً",
    periodKey: "messages.pricing.plans.growth.period",
    features: [
        "ميزة تجريبية أولى",
        "ميزة تجريبية ثانية",
        "ميزة تجريبية ثالثة",
        "ميزة تجريبية ثالثة",
        "ميزة تجريبية ثالثة",
    ],
    featuresKeys: [
      "messages.pricing.plans.growth.features.0",
      "messages.pricing.plans.growth.features.1",
      "messages.pricing.plans.growth.features.2",
      "messages.pricing.plans.growth.features.3",
      "messages.pricing.plans.growth.features.4",
    ],
    variant: "soft",
  },

];

