// resources/js/components/public/Navbar.tsx
import { Link, router, usePage } from '@inertiajs/react'
import { Menu, X, LogIn } from 'lucide-react'
import { useState } from 'react'
import LanguageSwitcher from './navbar/LanguageSwitcher'
import SubscribeButton from './navbar/SubscribeButton'
import MobileDrawer from './navbar/MobileDrawer'
import { useNavItems } from './navbar/NavItems'
import { useLang } from '@/hooks/useLang'

/**
 * Navbar component - Main navigation header
 * Responsive navigation with desktop menu, mobile drawer, language switcher, and subscribe button
 */
function goToSection(rawHref: string) {
  const id = (rawHref.startsWith('#') ? rawHref.slice(1) : rawHref) || ''
  const onHome = window.location.pathname === '/'

  const doScroll = () => {
    requestAnimationFrame(() => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.location.hash = `#${id}` 
    })
  }

  if (onHome) {
    doScroll()
  } else {
    router.visit('/', { method: 'get', preserveScroll: true, onSuccess: doScroll })
  }
}
export default function Navbar() {
  // Mobile menu state
  const [open, setOpen] = useState(false)
  // Navigation items from hook
  const items = useNavItems()
  // Language translation function
  const { __ } = useLang()
  // Site settings from Inertia shared props
  const { siteSettings } = usePage<{ siteSettings?: { identity?: { site_logo?: string | null } } }>().props
  const siteLogo = siteSettings?.identity?.site_logo ? `/storage/${siteSettings.identity.site_logo}` : '/logo.png'

  // Toggle mobile menu
  const toggle = () => setOpen((v) => !v)

  return (
    <header className="border-b sticky top-0 z-50 bg-background/50 dark:bg-black/50 backdrop-blur-xl border-border dark:border-sidebar-border/80">
      <div className="container mx-auto flex items-center justify-between px-8 xl:px-18 py-2">
        {/* Company logo */}
        <Link href="/" aria-label={__('messages.home')} className="flex items-center">
          <img src={siteLogo} alt="Logo" className="h-16 w-auto" />
        </Link>

        {/* Desktop navigation menu */}
       <nav className="hidden lg:flex items-center gap-8 text-md font-bold text-gray-700">
          {items.map(({ href, label }) => (
            <button
              key={href}
              type="button"
              onClick={() => goToSection(href)}   
              className="hover:text-public-secondary transition-colors cursor-pointer"
            >
              {label}
            </button>
          ))}
        </nav>
        
        {/* Desktop action buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-public-primary px-4 py-2 text-sm font-semibold text-public-primary transition-colors hover:bg-public-primary hover:text-white"
          >
            <LogIn className="h-4 w-4" />
            {__('messages.nav.login')}
          </Link>
          <SubscribeButton />
          <LanguageSwitcher />
        </div>

        {/* Mobile menu toggle button */}
        <button
          type="button"
          className="lg:hidden rounded-lg p-2 text-gray-700 hover:bg-gray-100"
          onClick={toggle}                                
          aria-label={open ? 'Close menu' : 'Open menu'}  
          aria-expanded={open}                           
          aria-controls="mobile-drawer"                 
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}  
        </button>
      </div>

      {/* Mobile navigation drawer */}
      <MobileDrawer
        open={open}
        onClose={() => setOpen(false)}
        items={items}
      />
    </header>
  )
}
