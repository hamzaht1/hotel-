// resources/js/components/public/templates/TemplateCard.tsx
import { Eye, Clock } from 'lucide-react'
import type { TemplateItem } from './constants'
import { useLang } from '@/hooks/useLang'

export default function TemplateCard({
  item,
  onPreview,
}: {
  item: TemplateItem & { href?: string }
  onPreview?: (item: TemplateItem) => void
}) {
  const { __ } = useLang()
  const title = item.titleKey ? __(item.titleKey) : item.title
  const handlePreview = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!item.comingSoon) {
      onPreview?.(item)
    }
  }

  return (
    <div className="group relative flex flex-col items-center text-center">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl transition-colors duration-300 shadow-md">
        {/* Image */}
        <img
          src={item.src}
          alt={item.title ?? ''}
          className={`h-full w-full object-cover transition-transform duration-300 ${item.comingSoon ? 'grayscale opacity-60' : 'group-hover:scale-[1.03]'}`}
          loading="lazy"
          decoding="async"
        />

        {item.comingSoon ? (
          /* Coming Soon overlay */
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/50">
            <div className="flex flex-col items-center gap-3 text-white">
              <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                <Clock className="h-10 w-10" />
              </div>
              <span className="text-xl sm:text-3xl font-bold tracking-wide">قريبـــاً</span>
              <span className="text-sm sm:text-base text-white/70">Coming Soon</span>
            </div>
          </div>
        ) : (
          /* Preview overlay for available templates */
          <button
            type="button"
            onClick={handlePreview}
            aria-label={__("messages.templates_page.preview_aria")}
            className="
              absolute inset-0 z-10 grid place-items-center
              opacity-0 group-hover:opacity-100
              bg-black/0 group-hover:bg-black/55
              transition-all duration-300
              cursor-pointer select-none
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70
            "
          >
            <div className="flex flex-col items-center gap-2 text-white/80">
              <Eye className="h-12 w-12" aria-hidden="true" />
              <span className="text-xl sm:text-5xl tracking-wide">{__("messages.common.preview")}</span>
            </div>
          </button>
        )}
      </div>

      {/* Title below */}
      <div className={`mt-3 text-lg sm:text-2xl font-medium ${item.comingSoon ? 'text-white/50' : 'text-white'}`}>
        {title}
        {item.comingSoon && <span className="ms-2 text-sm text-white/40">(قريباً)</span>}
      </div>
    </div>
  )
}
