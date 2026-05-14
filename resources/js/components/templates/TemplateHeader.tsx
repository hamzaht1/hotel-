import React, { useState } from 'react'
import { usePage } from '@inertiajs/react'
import { TiArrowSortedUp } from "react-icons/ti"
import { Globe, Menu as MenuIcon, X as XIcon } from 'lucide-react'
import { useTemplateT, useTemplateLanguage } from '@/hooks/useTemplateTranslations'
import { useAppearance } from '@/hooks/use-appearance'
import { useStorageUrl } from '@/lib/storage'
import { useTenantSiteSettings } from '@/hooks/use-tenant-preview-overrides'
import hotelLogo from '@/assets/images/riyadh-template/hero-logo.png'
import whitelogo from '@/assets/images/riyadh-template/white-logo.png'
import phoneIcon from '@/assets/images/riyadh-template/phone.svg'

/**
 * Template header component with navigation and language toggle
 * Layout: Logo (center) | Navigation Links | Language Toggle + Phone Number
 */
function getActiveSection() {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash || '#home';
  return hash.replace('#', '') || 'home';
}

export default function TemplateHeader() {
  const t = useTemplateT()
  const { toggleLanguage, isArabic } = useTemplateLanguage()
  const { appearance, updateAppearance } = useAppearance()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const storageUrl = useStorageUrl()
  // useTenantSiteSettings merges server props with live preview overrides so
  // the logo updates in real-time when the editor uploads a new file.
  const siteSettings = useTenantSiteSettings()
  const resolveLogo = (raw: string | null | undefined) =>
    raw && typeof raw === 'string' && raw.startsWith('data:') ? raw : storageUrl(raw)
  const tenantLogo = resolveLogo(siteSettings?.identity?.site_logo as string | null | undefined)
  const tenantLogoDark = resolveLogo(siteSettings?.identity?.site_logo_dark as string | null | undefined) || tenantLogo
  const lightLogoSrc = tenantLogo || hotelLogo
  const darkLogoSrc = tenantLogoDark || whitelogo

  const toggleTheme = () => {
    const newMode = appearance === 'dark' ? 'light' : 'dark'
    updateAppearance(newMode)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const [activeSection, setActiveSection] = useState(getActiveSection());

  React.useEffect(() => {
    const onHashChange = () => setActiveSection(getActiveSection());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <header className="bg-white/90 dark:bg-gray-900/85 backdrop-blur shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-200">
      <div className="container mx-auto px-4">
        <div className="relative flex items-center justify-between h-22">
          
          {/* Left Side - All Navigation Links (Desktop) */}
          <nav className={`hidden lg:flex items-end ${isArabic ? 'space-x-reverse space-x-6' : 'space-x-6'}`} style={{position:'relative'}}>
            {[
              { id: 'home', label: t('header.nav.home'), href: '#home' },
              { id: 'about', label: t('header.nav.about'), href: '#about' },
              { id: 'rooms', label: t('header.nav.rooms'), href: '#rooms' },
              { id: 'massage', label: t('header.nav.massage'), href: '#massage' },
              { id: 'reviews', label: t('header.nav.reviews'), href: '#reviews', extra: 'md:mx-6' },
              { id: 'contact', label: t('header.nav.contact'), href: '#contact' },
            ].map((item) => (
              <div key={item.id} className={`relative flex flex-col items-center justify-end ${item.extra || ''}`} style={{minHeight:'40px'}}>
                <a
                  href={item.href}
                  className={`text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium`}
                  style={{lineHeight:'1.5'}}
                >
                  {item.label}
                </a>
                <div style={{height:'0',display:'flex',alignItems:'flex-end'}}>
                    {activeSection === item.id && (
                      <span className="block relative h-0 w-full">
                        <TiArrowSortedUp className="text-riyadh-primary  text-2xl absolute left-1/2 -translate-x-1/2 top-2" />
                      </span>
                    )}
                </div>
              </div>
            ))}
          </nav>
          
          {/* Mobile Menu Button (Left side on mobile) */}
          <button
            className="lg:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <XIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
          
          {/* Center - Hotel Logo (Desktop only) */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center justify-center">
            <div className="flex items-center">
              {/* Hotel Logo Image */}
              <img 
                src={appearance === 'dark' ? darkLogoSrc : lightLogoSrc}
                alt="Hotel Logo"
                className="h-18 w-auto max-w-[200px] object-contain drop-shadow-sm"
              />
            </div>
          </div>
          
          {/* Right Side - Actions Only (Desktop) */}
          <div className="hidden lg:flex items-center">
            {/* Action Items */}
            <div className={`flex items-center ${isArabic ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
   
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                title={appearance === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {appearance === 'dark' ? (
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
               
              {/* Language Toggle Button */}
              <button
                onClick={toggleLanguage}
                className="group inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 mx-4 rounded-md transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
                title={t('header.current_language')}
              >
                <Globe className="h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-300 ease-in-out group-hover:rotate-180 group-hover:scale-110 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                {t('header.language_toggle')}
              </button>
              {/* Phone Number */}
              <a 
                href={`tel:${t('header.phone')}`} dir='ltr'
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium flex items-center"
                title="Call us"
              >
                <img src={phoneIcon} alt="Phone" className="w-4 h-4 mr-1 dark:invert" />
                 {t('header.phone')}
              </a>
            </div>
          </div>
          {/* Mobile - Logo on the right */}
          <div className="lg:hidden flex items-center">
            <img 
              src={appearance === 'dark' ? whitelogo : hotelLogo}
              alt="Hotel Logo"
              className="h-18 w-auto drop-shadow-sm"
            />
          </div>
          
          {/* Mobile Actions moved inside dropdown */}
        </div>
        
        {/* Mobile Menu */}
        <div className={`lg:hidden overflow-hidden transform transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-[70vh] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'
        }`}>
          <div className="border-t border-gray-200 dark:border-gray-800 py-4">
            <nav className="flex flex-col space-y-4">
              <a href="#home" onClick={closeMobileMenu} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium py-2">
                {t('header.nav.home')}
              </a>
              <a href="#about" onClick={closeMobileMenu} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium py-2">
                {t('header.nav.about')}
              </a>
              <a href="#rooms" onClick={closeMobileMenu} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium py-2">
                {t('header.nav.rooms')}
              </a>
              <a href="#massage" onClick={closeMobileMenu} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium py-2">
                {t('header.nav.massage')}
              </a>
              <a href="#reviews" onClick={closeMobileMenu} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium py-2">
                {t('header.nav.reviews')}
              </a>
              <a href="#contact" onClick={closeMobileMenu} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium py-2">
                {t('header.nav.contact')}
              </a>
              <a 
                href={`tel:${t('header.phone')}`}
                onClick={closeMobileMenu}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium py-2 border-t border-gray-200 dark:border-gray-800 pt-4 mt-2 flex items-center"
              >
                <span  dir='ltr'>
                  {t('header.phone')} 
                </span>
                <img src={phoneIcon} alt="Phone" className="w-4 h-4 mx-2 dark:invert" />

              </a>
            </nav>
            {/* Actions inside dropdown (mobile) - last two centered */}
            <div className="flex items-center justify-center gap-3 mt-6 px-1">
              <button
                onClick={toggleTheme}
                className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm transition-colors"
                title={appearance === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {appearance === 'dark' ? (
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              <button
                onClick={toggleLanguage}
                className="group inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm transition-colors text-gray-700 dark:text-gray-300"
              >
                <Globe className="h-4 w-4 text-[#7F7F7F] transition-transform duration-300 ease-in-out group-hover:rotate-180 group-hover:scale-110 group-hover:text-[#5a5a5a]" />
                {t('header.language_toggle')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}