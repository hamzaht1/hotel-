// resources/js/layouts/PublicLayout.tsx
import { PropsWithChildren, useLayoutEffect } from 'react'
import { usePage } from '@inertiajs/react'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'

// NEW: Motion for React
import { MotionConfig, AnimatePresence, motion } from 'motion/react'

type Locale = 'ar' | 'en'
const RTL_LOCALES: Locale[] = ['ar']

type PublicLayoutProps = PropsWithChildren<{
  showHeader?: boolean
  showFooter?: boolean
}>

// Layout: PublicLayout wraps public pages with header and footer used by marketing pages.
export default function PublicLayout({ children, showHeader = true, showFooter = true }: PublicLayoutProps) {
  // We read both: props (for locale/dir) + page.url (for route-keyed transitions)
  const page = usePage()
  // page.props comes from the server and has many possible fields. Cast via
  // `unknown` first to avoid unsafe direct conversions and keep TS happy.
  const { locale, dir, siteSettings } = (page.props as unknown) as {
    locale: Locale; dir?: 'rtl' | 'ltr';
    siteSettings?: { colors?: { primary_color?: string; secondary_color?: string }; typography?: { font_family?: string } }
  }
  const { url } = page // URL changes on each Inertia navigation

  const effectiveDir = dir ?? (RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr')

  useLayoutEffect(() => {
    const html = document.documentElement
    html.lang = locale
    html.dir = effectiveDir
    document.body.classList.toggle('rtl', effectiveDir === 'rtl')

    // Apply super-admin branding colors as CSS variables
    if (siteSettings?.colors?.primary_color) {
      html.style.setProperty('--public-primary', siteSettings.colors.primary_color)
      html.style.setProperty('--public-active', siteSettings.colors.primary_color)
    }
    if (siteSettings?.colors?.secondary_color) {
      html.style.setProperty('--public-secondary', siteSettings.colors.secondary_color)
    }
  }, [locale, effectiveDir, siteSettings])

  return (
    // MotionConfig: one place to control defaults & reduced-motion
    <MotionConfig
      reducedMotion="user"                 // honor user's OS setting
      transition={{ duration: 0.25, ease: 'easeOut' }} // default tween
    >
      <div key={locale} dir={effectiveDir} className="flex min-h-screen flex-col">
        {showHeader && <Navbar key={`nav-${locale}`} />}

        <main className="flex-1">
          {/* AnimatePresence: enables exit animations on route change */}
          <AnimatePresence mode="wait">
            {/* Route-keyed wrapper: exiting page animates out before next enters */}
            <motion.div
              key={url}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              // NOTE: transition comes from MotionConfig by default
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {showFooter && <Footer />}
      </div>
    </MotionConfig>
  )
}
