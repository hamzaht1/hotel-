/**
 * Custom header for Madina template.
 * Layout: logo at start | links in center | icons at end.
 */
import React, { useState, useEffect, useRef } from 'react'
import { Globe, Menu as MenuIcon, X as XIcon, Moon, Sun } from 'lucide-react'
import { usePage } from '@inertiajs/react'
import { useTemplateLanguage } from '@/hooks/useTemplateTranslations'
import { useAppearance } from '@/hooks/use-appearance'
import { useTemplateT } from '@/hooks/useTemplateTranslations'
import { useStorageUrl } from '@/lib/storage'
import { useTenantSiteSettings } from '@/hooks/use-tenant-preview-overrides'
import defaultLogoImage from './images/logo.svg'

// Logo component
export interface LogoProps {
  scrolled?: boolean
}

// Logo sizing: cap height to fit the header bar, let width auto-scale so
// any aspect ratio (square / horizontal / vertical) renders without
// distorting or overflowing. max-width prevents very-wide logos from
// pushing the navigation off-screen.
const LOGO_BOX: React.CSSProperties = {
  height: '64px',
  width: 'auto',
  maxWidth: '200px',
  objectFit: 'contain',
  transition: 'opacity 0.3s ease',
}

export const Logo = ({ scrolled = false }: LogoProps) => {
  const storageUrl = useStorageUrl()
  // useTenantSiteSettings merges server props with live preview overrides so
  // the logo updates in real-time when the editor streams a new upload.
  const siteSettings = useTenantSiteSettings()
  const rawLogo = siteSettings?.identity?.site_logo as string | null | undefined
  // The editor sends data: URLs for staged uploads — render them as-is.
  // Persisted paths go through storageUrl for the CDN-aware absolute URL.
  const tenantLogo = rawLogo && typeof rawLogo === 'string' && rawLogo.startsWith('data:')
    ? rawLogo
    : storageUrl(rawLogo)
  const logoImage = tenantLogo || defaultLogoImage
  const isCustomLogo = !!tenantLogo

  // Initial / unscrolled: render the image plainly.
  if (!scrolled) {
    return <img src={logoImage} alt="Logo" style={LOGO_BOX} />
  }

  // After scroll: keep custom (uploaded) logos as-is — the CSS mask trick
  // only works for the bundled SVG silhouette of the default Madina logo.
  if (isCustomLogo) {
    return <img src={logoImage} alt="Logo" style={LOGO_BOX} />
  }

  return (
    <div
      style={{
        ...LOGO_BOX,
        width: '150px',
        WebkitMaskImage: `url(${logoImage})`,
        maskImage: `url(${logoImage})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        backgroundColor: 'var(--madina-logo-color, var(--madina-primary))',
        display: 'inline-block',
      }}
      role="img"
      aria-label="Logo"
    />
  )
}

function getActiveSection() {
  if (typeof window === 'undefined') return 'home'
  const hash = window.location.hash || '#home'
  return hash.replace('#', '') || 'home'
}

export default function MadinaHeader() {
  const t = useTemplateT()
  const { toggleLanguage, isArabic } = useTemplateLanguage()
  const { appearance, updateAppearance } = useAppearance()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState(getActiveSection())
  const [scrolled, setScrolled] = useState(false)
  const [headerStyle, setHeaderStyle] = useState<'container' | 'full'>('container')
  const menuRef = useRef<HTMLElement>(null)

  const toggleTheme = () => {
    const newMode = appearance === 'dark' ? 'light' : 'dark'
    updateAppearance(newMode)
  }

  useEffect(() => {
    const onHashChange = () => setActiveSection(getActiveSection())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Load header style from localStorage
  useEffect(() => {
    const savedStyle = localStorage.getItem('madina-header-style')
    if (savedStyle) {
      const style = savedStyle === 'wide' ? 'full' : 'container'
      setHeaderStyle(style)
    }
    
    // Listen for custom event from ThemeSwitcher
    const handleStyleChange = (e: Event) => {
      const customEvent = e as CustomEvent
      const style = customEvent.detail.width === 'full' ? 'full' : 'container'
      setHeaderStyle(style)
    }
    
    window.addEventListener('madina-header-style-changed', handleStyleChange)
    
    return () => {
      window.removeEventListener('madina-header-style-changed', handleStyleChange)
    }
  }, [])

  // Handle scroll to change header appearance
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setScrolled(scrollPosition > 100) // Change after 100px scroll
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileMenuOpen])

  const navItems = [
    { id: 'home', label: t('header.nav.home', 'الرئيسية'), href: '#home' },
    { id: 'rooms', label: t('header.nav.rooms', 'الغرف'), href: '#rooms' },
    { id: 'services', label: t('header.nav.services', 'الخدمات'), href: '#services' },
    { id: 'testimonials', label: t('header.nav.reviews', 'التقييمات'), href: '#testimonials' },
    { id: 'contact', label: t('header.nav.contact', 'تواصل معنا'), href: '#contact' },
  ]

  return (
    <header ref={menuRef} className={`fixed top-0 left-0 right-0 z-50 ${headerStyle === 'full' ? '' : 'py-4'}`}>
      <div className={headerStyle === 'full' ? 'w-full' : 'max-w-6xl mx-auto px-6 lg:px-8'}>
        <div 
          className={`flex items-center justify-between h-16 backdrop-blur-md shadow-sm border px-6 transition-all duration-300 ${
            scrolled 
              ? 'border-gray-200 dark:border-[#334155]/50' 
              : 'border-white/20 dark:border-[#334155]/30'
          }`}
          style={{
            ...(scrolled 
              ? { backgroundColor: 'var(--madina-primary3)' } 
              : { backgroundColor: 'rgba(217, 217, 217, 0.46)' }
            ),
            ...(headerStyle === 'full' ? {} : { borderRadius: 'var(--madina-header-radius, 16px)' })
          }}
        >
          
          {/* Logo - start */}
          <div className="flex items-center flex-shrink-0">
            <a href="#home" className="flex items-center">
              <div className="h-20 w-auto" style={{ display: 'flex', alignItems: 'center' }}>
                <Logo scrolled={scrolled} />
              </div>
            </a>
          </div>

          {/* Navigation links - center */}
          <nav className="hidden lg:flex items-center justify-center flex-1 gap-6" dir={isArabic ? 'rtl' : 'ltr'}>
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className={`madina-font-heading text-sm font-medium transition-all duration-300 pb-1 border-b-2 ${
                  activeSection === item.id
                    ? scrolled
                      ? 'madina-text-primary border-[var(--madina-primary)]'
                      : 'text-white border-white'
                    : scrolled
                      ? 'madina-text-body border-transparent hover:madina-text-primary'
                      : 'text-white/90 border-transparent hover:text-white hover:border-white/50'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Icons - end */}
          <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors hover:opacity-80 ${
                scrolled
                  ? 'bg-[var(--madina-primary)]/10 dark:bg-[var(--madina-primary)]/20 madina-text-primary hover:bg-[var(--madina-primary)]/20 dark:hover:bg-[var(--madina-primary)]/30'
                  : 'text-white'
              }`}
              style={scrolled ? {} : { backgroundColor: 'rgba(217, 217, 217, 0.43)' }}
              aria-label={appearance === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {appearance === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:opacity-80 ${
                scrolled
                  ? 'bg-[var(--madina-primary)]/10 dark:bg-[var(--madina-primary)]/20 madina-text-primary hover:bg-[var(--madina-primary)]/20 dark:hover:bg-[var(--madina-primary)]/30'
                  : 'text-white'
              }`}
              style={scrolled ? {} : { backgroundColor: 'rgba(217, 217, 217, 0.43)' }}
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">{isArabic ? 'EN' : 'عربي'}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`lg:hidden p-2 transition-colors ${
              scrolled 
                ? 'madina-text-body' 
                : 'text-white'
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            className="lg:hidden mt-4 overflow-hidden backdrop-blur-md shadow-lg border border-white/20 dark:border-[#334155]/50 bg-[rgba(217,217,217,0.95)] dark:bg-[#1E293B]/95"
            style={{ borderRadius: 'var(--madina-header-radius, 16px)' }}
          >
            <nav className="flex flex-col p-4 space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`madina-font-heading px-4 py-3 rounded-lg transition-all duration-300 text-center ${
                    activeSection === item.id
                      ? 'text-white bg-white/30 dark:bg-[var(--madina-primary)]/30 font-semibold'
                      : 'madina-text-body hover:bg-white/20 dark:hover:bg-gray-700/50 hover:madina-text-primary dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </a>
              ))}
              
              {/* Mobile Actions */}
              <div className="flex items-center justify-center gap-4 pt-4 mt-4 border-t border-gray-300 dark:border-gray-600">
                <button
                  onClick={toggleTheme}
                  className="p-3 rounded-lg hover:opacity-80 transition-colors madina-text-primary bg-[var(--madina-primary)]/10 dark:bg-[var(--madina-primary)]/20 hover:bg-[var(--madina-primary)]/20 dark:hover:bg-[var(--madina-primary)]/30"
                  aria-label={appearance === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {appearance === 'dark' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </button>
                
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-800 dark:text-[#E5E7EB] hover:opacity-80 transition-colors font-medium bg-[rgba(217,217,217,0.6)] dark:bg-[#334155]/60"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">{isArabic ? 'English' : 'عربي'}</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
