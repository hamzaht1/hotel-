import React, { useState, useEffect } from 'react'
import defaultLogo from '@/assets/images/riyadh-template/footer/logo.png'
import mapImage from '@/assets/images/riyadh-template/footer/map.png'
// import footerFrame from '@/assets/images/riyadh-template/footer/footer-frame-1.svg'
import footerBackground from '@/assets/images/riyadh-template/footer/footer-frame-2.svg'
import paymentLogos from '@/assets/images/riyadh-template/footer/payment-logos.svg'
import { useTemplateT, useTemplateLanguage } from '@/hooks/useTemplateTranslations'
import { useStorageUrl } from '@/lib/storage'
import {
  useMergedSiteTexts,
  useTenantSiteSettings,
} from '@/hooks/use-tenant-preview-overrides'
import { pickSiteText } from '@/lib/site-texts'

/**
 * Template footer component with hotel information and links
 */
export default function TemplateFooter() {
  const t = useTemplateT()
  const { isArabic } = useTemplateLanguage()
  const [windowWidth, setWindowWidth] = useState(0)
  const storageUrl = useStorageUrl()
  // Live-preview hook: logo + footer texts update instantly while editing.
  const siteSettings = useTenantSiteSettings()
  const rawLogo = siteSettings?.identity?.site_logo as string | null | undefined
  const logo = (rawLogo && typeof rawLogo === 'string' && rawLogo.startsWith('data:'))
    ? rawLogo
    : (storageUrl(rawLogo) || defaultLogo)
  const siteTexts = useMergedSiteTexts()
  const footerDescription = pickSiteText(
    siteTexts,
    'footer',
    'description',
    t('footer.description', 'نحن لسنا مجرد فنادق، بل وجهة للراحة والفخامة. نحن نؤمن بأن كل رحلة تستحق نهاية مثالية، ولهذا نسعى جاهدين لتقديم أفضل الخدمات'),
    isArabic,
  )
  const footerTitle = pickSiteText(siteTexts, 'footer', 'title', '', isArabic)
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    handleResize()
    
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const calculateVisibleTriangles = () => {
    if (windowWidth === 0) return 7 
    const triangleWidth = 60 
    const gapWidth = windowWidth >= 1024 ? 16 : windowWidth >= 640 ? 12 : 8
    const totalTriangleWidth = triangleWidth + gapWidth
    
    
    const maxTriangles = Math.floor(windowWidth / totalTriangleWidth)
    
    return Math.min(Math.max(maxTriangles, 3), 180) 
  }
  
  const visibleTrianglesCount = calculateVisibleTriangles()
  
  // Build array of 30 triangles
  const triangleElements = Array.from({ length: 180 }, (_, index) => index)
  
  return (
    <>
<div className="relative w-full py-4">
  {/* Top line */}
  <div className="absolute inset-x-0 top-0 h-4 bg-public-primary"></div>

  {/* Bottom line */}
  <div className="absolute inset-x-0 bottom-0 h-4 bg-public-primary"></div>

  {/* Empty triangles in center */}
  <div className="flex justify-center items-center gap-4  lg:gap-4">
    {triangleElements.slice(0, visibleTrianglesCount).map((_, index) => (
      <svg
        key={index}
        width="60"
        height="44"
        viewBox="0 0 44 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-public-primary z-10"
      >
        <path
          d="M22 2 L42 38 H2 Z"
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
        />
      </svg>
    ))}
  </div>

</div>


      <footer 
        className="text-white relative mt-1 bg-[#020151f5]"
        style={{
          backgroundImage: `url(${footerBackground})`,
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Section 1: Logo and Description */}
            <div className="space-y-4">
              <img 
                src={logo} 
                alt={t('footer.hotel_name', 'فندق الرياض')} 
                className="h-16 w-auto max-w-[220px] object-contain mb-4"
              />
              {footerTitle && (
                <h3 className="text-white text-xl font-semibold mb-2">{footerTitle}</h3>
              )}
              <p className="text-gray-300 text-sm leading-relaxed">
                {footerDescription}
              </p>
            </div>
            
            {/* Section 2: Quick Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">{t('footer.quick_links', 'الروابط السريعة')}</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.home', 'الصفحة الرئيسية')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.about', 'من نحن')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.privacy', 'سياسة الخصوصية')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.terms', 'الشروط والأحكام')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.contact', 'تواصل معنا')}</a></li>
              </ul>
            </div>

            {/* Section 3: Sections */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">{t('footer.sections', 'الأقسام')}</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.rooms', 'الغرف')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.restaurants', 'المطاعم')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.events', 'الفعاليات')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.offers', 'العروض')}</a></li>
              </ul>
            </div>
            
            {/* Section 4: Contact Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">{t('footer.contact', 'الـــــتــــواصــــل')}</h4>
              <ul className="space-y-3 text-gray-300">

                {/* Phone */}
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                    </svg>
                  </div>
                  <span dir="ltr" className="text-left mt-1">+966 666 666 66</span>
                </li>
                {/* Email */}
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </div>
                  <span className="mt-1">info@diyafa.com</span>
                </li>
                {/* Location */}
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C7.802 0 4.403 3.399 4.403 7.597c0 5.398 7.597 16.403 7.597 16.403s7.597-11.005 7.597-16.403C19.597 3.399 16.198 0 12 0zm0 11.5c-2.137 0-3.869-1.732-3.869-3.869S9.863 3.762 12 3.762s3.869 1.732 3.869 3.869S14.137 11.5 12 11.5z"/>
                    </svg>
                  </div>
                  <span className="mt-1">{t('footer.contact_location', 'الرياض، السعودية')}</span>
                </li>
              </ul>
              {/* Social Media Icons */}
              <div className="flex gap-3 mt-4">
                {/* Facebook */}
                <a 
                  href="#" 
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-white transition-all"
                  style={{ color: 'var(--riyadh-primary)' }} 
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                {/* Instagram */}
                <a 
                  href="#" 
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-white transition-all" 
                  style={{ color: 'var(--riyadh-primary)' }} 
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                  </svg>
                </a>
                {/* X (Twitter) */}
                <a 
                  href="#" 
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-white transition-all" 
                  style={{ color: 'var(--riyadh-primary)' }} 
                  aria-label="X"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                {/* YouTube */}
                <a 
                  href="#" 
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-white transition-all" 
                  style={{ color: 'var(--riyadh-primary)' }} 
                  aria-label="YouTube"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Section 5: Map */}
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={mapImage} 
                  alt="Location Map" 
                  className="w-full h-auto"
                />
              </div>
              <a 
                href="https://maps.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block text-start text-gray-300 hover:text-white transition-colors underline underline-offset-4"
              >
                {t('footer.google_maps', 'العرض على خرائط غوغل')}
              </a>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-t border-gray-700 mt-8 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Payment Logos */}
              <div className="order-2 md:order-1">
                <img 
                  src={paymentLogos} 
                  alt="Payment Methods" 
                  className="h-8 w-auto"
                />
              </div>
              {/* Copyright Text */}
              <div className="text-center text-gray-300 order-1 md:order-2">
                <p>
                  {t('footer.copyright', 'جميع الحقوق محفوظة لسلسة ضيافة للفنادق 2025')} &copy;
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}