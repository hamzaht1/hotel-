// src/components/public/Footer.tsx
import React from "react";
import { usePage } from "@inertiajs/react";
import { Instagram, Youtube, Facebook, Twitter } from "lucide-react";
import { SOCIAL_LINKS, PAYMENT_METHODS } from "@/data/public-data";
import { useLang } from '@/hooks/useLang'
import { useStorageUrl } from '@/lib/storage'
import { useSiteSettings } from '@/hooks/use-preview-overrides'
import { useAppearance } from '@/hooks/use-appearance'
import footerline from "@/assets/images/icons/footer-line.svg";
import vision2030 from "@/assets/images/icons/footer-logo-1.svg";
import khidmah from "@/assets/images/icons/footer-logo-2.svg";
import sta from "@/assets/images/icons/footer-logo-3.svg";
import brandMark from "@/assets/images/icons/logo.png";

// Import payment method images
import applepay from "@/assets/images/icons/pay-1.svg";
import visa from "@/assets/images/icons/pay-2.svg";
import mastercard from "@/assets/images/icons/pay-3.svg";
import gpay from "@/assets/images/icons/pay-4.svg";
import paypal from "@/assets/images/icons/pay-5.svg";
import mada from "@/assets/images/icons/pay-6.svg";

/**
 * Footer component - Main site footer with company info, social links, and payment methods
 * Displays company logo, login link, privacy policy, business registration number,
 * partner logos, social media links, address, and accepted payment methods
 */
export default function Footer() {
  // Get current year for copyright
  const year = new Date().getFullYear();
  const { __ } = useLang()
  const storageUrl = useStorageUrl()
  const siteSettings = useSiteSettings()
  const { locale } = usePage<{ locale?: string }>().props

  // Override social links with DB settings if available
  const socialOverrides: Record<string, string> = {
    instagram: (siteSettings?.social?.social_instagram as string) || '',
    facebook: (siteSettings?.social?.social_facebook as string) || '',
    x: (siteSettings?.social?.social_twitter as string) || '',
  };
  const footerText = locale === 'ar' ? siteSettings?.footer?.footer_text_ar : siteSettings?.footer?.footer_text_en;
  const isAr = locale === 'ar'
  const businessNumber = (isAr ? siteSettings?.footer?.footer_business_number_ar : siteSettings?.footer?.footer_business_number_en) || __('messages.footer.business_number')
  const { appearance } = useAppearance()
  // In dark mode prefer the dedicated dark logo, falling back to the light one.
  const rawFooterLogo = (appearance === 'dark'
    ? (siteSettings?.identity?.site_logo_dark ?? siteSettings?.identity?.site_logo)
    : siteSettings?.identity?.site_logo) ?? null;
  const footerLogo = rawFooterLogo && (rawFooterLogo.startsWith('blob:') || rawFooterLogo.startsWith('data:')) ? rawFooterLogo : storageUrl(rawFooterLogo);

  // Super-admin managed footer partner logos (fall back to the bundled trio).
  type GalleryImg = { id: number; image_path: string; title: string | null; width: number };
  const footerGallery = (usePage<{ siteGallery?: { footer?: GalleryImg[] } }>().props.siteGallery?.footer) ?? [];

  // Social media icons mapping
  const socialIcons = {
  instagram: Instagram,
  x: Twitter,
  youtube: Youtube,
  facebook: Facebook,
  };

  // Payment method images mapping
  const paymentImages = {
    'Apple Pay': applepay,
    'VISA': visa,
    'Mastercard': mastercard,
    'Google Pay': gpay,
    'PayPal': paypal,
    'mada': mada,
  };

  return (
    <footer className="">
      <div className="mx-auto max-w-7xl  sm:px-6 lg:px-8 pb-6">
        {/* Decorative footer line */}
        <img src={footerline} alt="فاصل تزييني" className="px-4 sm:w-full sm:h-24 sm:px-22" />
        
        {/* Main footer content grid */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-7 md:items-center">
          {/* Company information section */}
          <div className="flex flex-col items-center md:items-start gap-3 text-black/70 md:col-span-2">
            {/* Company logo */}
            <img src={footerLogo || brandMark} alt="ضيافة" className="h-32 sm:h-24" />

            {/* Login and privacy policy links */}
            <div className="flex items-center gap-2 text-md">
              <a href="/login" className="hover:text-slate-900 focus:outline-none focus:ring">
                {__("messages.footer.login")}
              </a>
              <span aria-hidden>•</span>
              <a href="/Privacy" className="hover:text-slate-900 focus:outline-none focus:ring">
                {__("messages.footer.privacy")}
              </a>
            </div>

            {/* Business registration number and copyright */}
            <p className="text-sm md:text-lg">
              {businessNumber}
            </p>
          </div>

          {/* Partner logos section */}
          <div className="flex flex-col gap-y-4 sm:gap-2 m-4 sm:m-0 sm:items-center  justify-center md:col-span-3">
            <div className="flex flex-col md:flex-row   shadow-md  p-4 rounded-2xl border  md:divide-x md:divide-slate-200 items-center justify-center">
              {footerGallery.length > 0 ? (
                footerGallery.map((img) => (
                  <img
                    key={img.id}
                    src={storageUrl(img.image_path) ?? ''}
                    alt={img.title ?? ''}
                    className="p-4 object-contain"
                    style={{ width: `${img.width}px`, maxWidth: '100%' }}
                  />
                ))
              ) : (
                <>
                  <img src={vision2030} alt="رؤية 2030" className="w-32 p-4" />
                  <img src={khidmah} alt="خدمة" className="w-32 p-4" />
                  <img src={sta} alt="الهيئة السعودية للسياحة" className="w-32 p-4" />
                </>
              )}
            </div>
            {/* <div className="flex flex-col md:flex-row   shadow-md  p-4 rounded-2xl border  md:divide-x md:divide-slate-200 items-center justify-center">
              <img src={vision2030} alt="" className="w-32 p-4" />
              <img src={khidmah} alt="" className="w-32 p-4" />
              <img src={sta} alt="" className="w-32 p-4" />
            </div> */}
          </div>

          {/* Social media and contact section */}
          <div className="space-y-5 text-black/70 px-6 sm:px-0 md:col-span-2">
            {/* Social media links */}
            <div className="flex items-center gap-4 ">
              {SOCIAL_LINKS.map((social) => {
                const Icon = socialIcons[social.key as keyof typeof socialIcons];
                if (!Icon) return null;
                const href = socialOverrides[social.key] || social.href;
                return (
                  <a
                    key={social.key}
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    aria-label={__(social.ariaLabelKey)}
                    className="hover:text-slate-900 focus:outline-none focus:ring"
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>

            {/* Company address */}
            <p className="text-sm leading-relaxed">
              {__("messages.contact_info.address")}
            </p>

            {/* Payment methods grid */}
            <div className="grid grid-cols-3 gap-1 pt-1">
              {PAYMENT_METHODS.map((payment) => {
                const paymentImage = paymentImages[payment.name as keyof typeof paymentImages];
                return (
                  <div key={payment.name} className="h-12 flex items-center justify-center">
                    <img src={paymentImage} alt={payment.alt} className="h-18" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div>
          <p className="flex justify-center items-center text-black/70 p-4 text-sm md:text-md">
            {footerText || __("messages.footer.copyright", { year })}
          </p>
      </div>
    </footer>
  );
}
