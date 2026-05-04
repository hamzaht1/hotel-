import { Link, usePage } from '@inertiajs/react'
import { Menu, X, LogIn } from 'lucide-react'
import { useState } from 'react'
import LanguageSwitcher from './navbar/LanguageSwitcher'
import { useLang } from '@/hooks/useLang'

export interface HeaderLink {
  label_ar: string
  label_en: string
  url: string
}

export interface HeaderConfig {
  logo_url?: string | null
  background_color?: string | null
  text_color?: string | null
  links?: HeaderLink[]
}

interface Props {
  config: HeaderConfig
}

export default function CustomPageHeader({ config }: Props) {
  const [open, setOpen] = useState(false)
  const { __ } = useLang()
  const { locale } = usePage<{ locale: 'ar' | 'en' }>().props
  const isArabic = locale === 'ar'

  const logo = config.logo_url || '/logo.png'
  const links = (config.links ?? []).filter((l) => l.url && (l.label_ar || l.label_en))

  const headerStyle: React.CSSProperties = {}
  if (config.background_color) headerStyle.backgroundColor = config.background_color
  if (config.text_color) headerStyle.color = config.text_color

  return (
    <header
      className="border-b sticky top-0 z-50 bg-background/50 dark:bg-black/50 backdrop-blur-xl border-border dark:border-sidebar-border/80"
      style={headerStyle}
    >
      <div className="container mx-auto flex items-center justify-between px-8 xl:px-18 py-2">
        <Link href="/" aria-label={__('messages.home')} className="flex items-center">
          <img src={logo} alt="Logo" className="h-16 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-md font-bold">
          {links.map((link, i) => {
            const label = (isArabic ? link.label_ar : link.label_en) || link.label_en || link.label_ar
            return (
              <Link
                key={i}
                href={link.url}
                className="hover:text-public-secondary transition-colors"
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-public-primary px-4 py-2 text-sm font-semibold text-public-primary transition-colors hover:bg-public-primary hover:text-white"
          >
            <LogIn className="h-4 w-4" />
            {__('messages.nav.login')}
          </Link>
          <LanguageSwitcher />
        </div>

        <button
          type="button"
          className="lg:hidden rounded-lg p-2 hover:bg-gray-100"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t bg-background" style={headerStyle}>
          <nav className="flex flex-col gap-1 p-4">
            {links.map((link, i) => {
              const label = (isArabic ? link.label_ar : link.label_en) || link.label_en || link.label_ar
              return (
                <Link
                  key={i}
                  href={link.url}
                  className="rounded px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              )
            })}
            <Link
              href="/login"
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-public-primary px-4 py-2 text-sm font-semibold text-public-primary"
              onClick={() => setOpen(false)}
            >
              <LogIn className="h-4 w-4" />
              {__('messages.nav.login')}
            </Link>
            <div className="mt-2"><LanguageSwitcher /></div>
          </nav>
        </div>
      )}
    </header>
  )
}
