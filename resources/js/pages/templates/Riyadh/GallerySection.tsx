// Gallery Section - Riyadh Template
import { useState } from 'react'
import BackgroundTitle from '@/components/templates/BackgroundTitle'
import { useTemplateT, useTemplateLanguage } from '@/hooks/useTemplateTranslations'
import { useMergedSiteTexts } from '@/hooks/use-tenant-preview-overrides'
import { pickSiteText } from '@/lib/site-texts'
import { useStorageUrl } from '@/lib/storage'
import image1 from '@/assets/images/riyadh-template/galary/imag1.png'
import image2 from '@/assets/images/riyadh-template/galary/imag2.png'
import image3 from '@/assets/images/riyadh-template/galary/imag3.png'
import image4 from '@/assets/images/riyadh-template/galary/imag4.png'


import leftLine from '@/assets/images/riyadh-template/rooms/left-line.svg'
import rightLine from '@/assets/images/riyadh-template/rooms/right-line.svg'
// Bilingual gallery image interface
interface BilingualGalleryImage {
  id: number
  src: string
  categoryAr: string
  categoryEn: string
  descriptionAr: string
  descriptionEn: string
}

interface GallerySectionProps {
  gallery?: any[];
}

export default function GallerySection({ gallery: backendGallery }: GallerySectionProps) {
  const t = useTemplateT()
  const { isArabic } = useTemplateLanguage()
  // Tenant-editable section title/subtitle (section=gallery) from the Site
  // Branding editor; falls back to the bundled translation.
  const siteTexts = useMergedSiteTexts()
  const storageUrl = useStorageUrl()
  // Default category with translation
  const defaultCategory = t('sections.gallery.filter_all', 'الكل')
  const [activeCategory, setActiveCategory] = useState(defaultCategory)

  // Use backend gallery if available, otherwise fallback to static data
  const galleryImages: BilingualGalleryImage[] = (backendGallery && backendGallery.length > 0)
    ? backendGallery.map((img, i) => ({
        id: img.id || i + 1,
        src: img.url ?? storageUrl(img.path) ?? image1,
        categoryAr: img.category || 'عام',
        categoryEn: img.category || 'General',
        descriptionAr: img.title_ar || '',
        descriptionEn: img.title_en || '',
      }))
    : [
    {
      id: 1,
      src: image1,
      categoryAr: "الغرف",
      categoryEn: "Rooms",
      descriptionAr: "غرفة ديلوكس مع إطلالة مدينة",
      descriptionEn: "Deluxe room with city view"
    },
    {
      id: 2,
      src: image2,
      categoryAr: "المطاعم",
      categoryEn: "Dining",
      descriptionAr: "مطعم فاخر مع أجواء راقية",
      descriptionEn: "Luxury restaurant with elegant atmosphere"
    },
    {
      id: 3,
      src: image3,
      categoryAr: "المرافق",
      categoryEn: "Facilities",
      descriptionAr: "مسبح داخلي مُدفأ",
      descriptionEn: "Indoor heated swimming pool"
    },
    {
      id: 4,
      src: image4,
      categoryAr: "السبا",
      categoryEn: "Spa",
      descriptionAr: "منتجع صحي فاخر للاسترخاء",
      descriptionEn: "Luxury spa for relaxation"
    },
    {
      id: 5,
      src: image1,
      categoryAr: "المرافق",
      categoryEn: "Facilities",
      descriptionAr: "مرافق حديثة ومتطورة",
      descriptionEn: "Modern and advanced facilities"
    },
    {
      id: 6,
      src: image2,
      categoryAr: "الغرف",
      categoryEn: "Rooms",
      descriptionAr: "غرف فاخرة بتصميم راقي",
      descriptionEn: "Luxury rooms with elegant design"
    },
    {
      id: 7,
      src: image3,
      categoryAr: "المطاعم",
      categoryEn: "Dining",
      descriptionAr: "تجربة طعام استثنائية",
      descriptionEn: "Exceptional dining experience"
    },
    {
      id: 8,
      src: image4,
      categoryAr: "السبا",
      categoryEn: "Spa",
      descriptionAr: "علاجات مميزة للعناية بالجسم",
      descriptionEn: "Premium body care treatments"
    }
  ]

  // Translated categories
  const categories = [
    { key: 'filter_all', labelAr: 'الكل', labelEn: 'All' },
    { key: 'filter_rooms', labelAr: 'الغرف', labelEn: 'Rooms' },
    { key: 'filter_dining', labelAr: 'المطاعم', labelEn: 'Dining' },
    { key: 'filter_facilities', labelAr: 'المرافق', labelEn: 'Facilities' },
    { key: 'filter_spa', labelAr: 'السبا', labelEn: 'Spa' }
  ]

  // Filter images by category
  const filteredImages = activeCategory === defaultCategory
    ? galleryImages 
    : galleryImages.filter(image => {
        const imageCategory = isArabic ? image.categoryAr : image.categoryEn
        return imageCategory === activeCategory
      })

  return (
    <section data-preview-section="gallery" id="gallery" className="py-20 ">
      <div className="container mx-auto px-4">
        {/* Title */}
        <div className="relative text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src={leftLine} alt="left line" className="h-6 w-auto hidden md:block line-icon" />
              <h2 className="relative z-10 text-4xl md:text-5xl font-bold riyadh-heading mb-4">
                {pickSiteText(siteTexts, 'gallery', 'title', t('sections.gallery.title', 'معرض الصور'), isArabic)}
              </h2>
            <img src={rightLine} alt="right line" className="h-6 w-auto hidden md:block line-icon" />
          </div>
          <BackgroundTitle text={t('sections.gallery.background_title', 'المعرض')} />
          <p className="relative z-10 text-xl riyadh-text-muted max-w-2xl mx-auto">
            {pickSiteText(siteTexts, 'gallery', 'subtitle', t('sections.gallery.subtitle', 'اكتشف جمال فندقنا من خلال معرض الصور المتنوع الذي يعرض مرافقنا وخدماتنا المميزة'), isArabic)}
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => {
            const categoryLabel = t(`sections.gallery.${category.key}`, isArabic ? category.labelAr : category.labelEn)
            const isActive = activeCategory === categoryLabel
            
            return (
              <button
                key={category.key}
                onClick={() => setActiveCategory(categoryLabel)}
                className={`px-6 py-2 rounded-full border-2 transition-colors duration-300 font-medium ${
                  isActive
                    ? 'text-white riyadh-primary-bg border-2 border-white '
                    : 'riyadh-border  hover:text-white'
                }`}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.classList.add('riyadh-primary-bg')
                    e.currentTarget.classList.add('text-white')
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.classList.remove('riyadh-primary-bg')
                    e.currentTarget.classList.remove('text-white')
                  }
                }}
              >
                {categoryLabel}
              </button>
            )
          })}
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {filteredImages.map((image) => {
            const category = isArabic ? image.categoryAr : image.categoryEn
            const description = isArabic ? image.descriptionAr : image.descriptionEn
            
            return (
              <div
                key={image.id}
                className="group relative rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border riyadh-border bg-white/60 dark:bg-white/10 dark:border-white/20"
              >
                {/* Image */}
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={image.src} 
                    alt={description}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                
                {/* Info Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 dark:group-hover:bg-black/80 transition-all duration-300 flex items-end">
                  <div className="p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h4 className="font-bold text-lg mb-1">{category}</h4>
                    <p className="text-sm opacity-90">{description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}