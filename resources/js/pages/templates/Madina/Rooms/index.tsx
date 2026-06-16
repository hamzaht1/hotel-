/**
 * Rooms Section - Hotel Rooms Display
 * 
 * Features:
 * - Grid layout of room cards
 * - Bilingual support (Arabic/English)
 * - Booking modal integration
 * - Room features with icons
 * - Uses template's primary color from CSS variables
 * 
 * All images and icons imported from template's local images folder
 */
import React, { useMemo, useState, useEffect, useRef } from 'react'
import BookingModal, { BookingType, BookingData, BookingService } from '@/components/templates/BookingModal'
import BackgroundTitle from '@/components/templates/BackgroundTitle'
import { useTemplateT, useTemplateLanguage } from '@/hooks/useTemplateTranslations'
import { useStorageUrl } from '@/lib/storage'
import { ROOM_AMENITY_ICONS } from '@/lib/room-amenity-icons'

// Shared icon catalogue (same source the admin wizard picks from). A saved
// amenity key resolves to the exact icon the tenant chose; unknown keys fall
// back to the stored icon key, then to the emoji.
const AMENITY_FA_ICONS = ROOM_AMENITY_ICONS

interface RoomCardAmenity {
    key: string
    labelAr: string
    labelEn: string
    icon: string | null
}

// Bilingual room interface
interface BilingualRoom {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  currency: string;
  currencyEn: string;
  featuresAr: string[];
  featuresEn: string[];
  bedTypeAr: string;
  bedTypeEn: string;
  amenitiesAr: string[];
  amenitiesEn: string[];
  maxGuests: number;
  size: number;
  image?: string;
  originalPrice?: number;
  popularTagAr?: string;
  popularTagEn?: string;
}

// Import icons from template folder
import room1Image from '../images/rooms/rooms/roome1.png'
import room2Image from '../images/rooms/rooms/room2.png'
import room3Image from '../images/rooms/rooms/room3.png'
import wifiIcon from '../images/rooms/icons/wifi.svg'
import wheelchairIcon from '../images/rooms/icons/wheelchair.svg'
import peopleIcon from '../images/rooms/icons/people.svg'
import parkIcon from '../images/rooms/icons/park.svg'
import mealIcon from '../images/rooms/icons/meal.svg'
import amenitiesIcon from '../images/rooms/icons/amenities.svg'
import priceIcon from '../images/rooms/icons/price.svg'
import leftIcon from '../images/rooms/left-icon.svg'
import rightIcon from '../images/rooms/right-icon.svg'

interface Props {
  rooms?: any[];
}

export default function RoomsSection({ rooms: backendRooms }: Props) {
  const t = useTemplateT()
  const { isArabic } = useTemplateLanguage()
  const storageUrl = useStorageUrl()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<BookingService | null>(null)
  const [defaultType, setDefaultType] = useState<BookingType>('غرفة')
  const [cardStyle, setCardStyle] = useState<'default' | 'simple'>('default')
  
  // Load room card style from localStorage
  useEffect(() => {
    const savedStyle = localStorage.getItem('madina-room-card-style')
    if (savedStyle) {
      if (savedStyle === 'simple') {
        setCardStyle('simple')
      } else {
        setCardStyle('default')
      }
    }
    
    // Listen for custom event from ThemeSwitcher
    const handleStyleChange = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail.type === 'simple') {
        setCardStyle('simple')
      } else {
        setCardStyle('default')
      }
    }
    
    window.addEventListener('madina-room-card-style-changed', handleStyleChange)
    
    return () => {
      window.removeEventListener('madina-room-card-style-changed', handleStyleChange)
    }
  }, [])
  
  // Bilingual rooms data
  const bilingualRoomsData: BilingualRoom[] = [
    {
      id: 1,
      nameAr: 'غرفة قياسية',
      nameEn: 'Standard Room',
      descriptionAr: 'غرفة مريحة ومجهزة بكل وسائل الراحة مع تصميم عصري وأنيق',
      descriptionEn: 'Comfortable room equipped with all amenities featuring modern and elegant design',
      price: 300,
      currency: 'ريال',
      currencyEn: 'SAR',
      featuresAr: ['واي فاي مجاني', 'تلفزيون', 'مكيف هواء'],
      featuresEn: ['Free WiFi', 'TV', 'Air Conditioning'],
      bedTypeAr: 'سرير مزدوج',
      bedTypeEn: 'Double Bed',
      amenitiesAr: ['واي فاي', 'تلفزيون', 'مكيف'],
      amenitiesEn: ['WiFi', 'TV', 'Air Conditioning'],
      maxGuests: 2,
      size: 25,
      image: room1Image,
    },
    {
      id: 2,
      nameAr: 'جناح عائلي',
      nameEn: 'Family Suite',
      descriptionAr: 'جناح واسع مناسب للعائلات مع مساحات مريحة ومرافق متكاملة',
      descriptionEn: 'Spacious suite suitable for families with comfortable spaces and integrated facilities',
      price: 500,
      currency: 'ريال',
      currencyEn: 'SAR',
      featuresAr: ['غرفتي نوم', 'صالة معيشة', 'مطبخ صغير'],
      featuresEn: ['Two Bedrooms', 'Living Room', 'Small Kitchen'],
      bedTypeAr: 'سريرين مزدوجين',
      bedTypeEn: 'Two Double Beds',
      amenitiesAr: ['واي فاي', 'تلفزيون', 'مكيف', 'مطبخ'],
      amenitiesEn: ['WiFi', 'TV', 'Air Conditioning', 'Kitchen'],
      maxGuests: 4,
      size: 45,
      image: room2Image,
      popularTagAr: 'الأكثر طلباً',
      popularTagEn: 'Most Popular',
    },
    {
      id: 3,
      nameAr: 'جناح ملكي',
      nameEn: 'Royal Suite',
      descriptionAr: 'جناح فاخر مع إطلالة رائعة وتصميم راقي يوفر تجربة إقامة استثنائية',
      descriptionEn: 'Luxurious suite with stunning views and elegant design providing an exceptional stay experience',
      price: 800,
      originalPrice: 1000,
      currency: 'ريال',
      currencyEn: 'SAR',
      featuresAr: ['إطلالة بانورامية', 'جاكوزي', 'خدمة غرف 24 ساعة'],
      featuresEn: ['Panoramic View', 'Jacuzzi', '24/7 Room Service'],
      bedTypeAr: 'سرير كينج',
      bedTypeEn: 'King Bed',
      amenitiesAr: ['واي فاي', 'تلفزيون', 'مكيف', 'جاكوزي', 'بلكونة'],
      amenitiesEn: ['WiFi', 'TV', 'Air Conditioning', 'Jacuzzi', 'Balcony'],
      maxGuests: 2,
      size: 60,
      image: room3Image,
    },
  ]
  
  // Use backend rooms if available, otherwise use static data
  const roomsSource = useMemo(() => {
    if (backendRooms && backendRooms.length > 0) {
      return backendRooms.map((room, index) => {
        // Amenities now come from the normalized room_amenities relation
        // as an ordered list of objects, not the legacy string[] JSON.
        const amenityList: RoomCardAmenity[] = (room.amenities || []).map((a: any) => ({
          key: a.key,
          labelAr: a.label_ar,
          labelEn: a.label_en,
          icon: a.icon,
        }));
        return {
          id: room.id,
          name: isArabic ? room.name_ar : room.name_en,
          description: isArabic ? (room.description_ar || '') : (room.description_en || ''),
          shortDescription: isArabic ? (room.short_description_ar || '') : (room.short_description_en || ''),
          price: Number(room.price) || 0,
          originalPrice: undefined,
          currency: isArabic ? 'ريال' : 'SAR',
          features: amenityList.slice(0, 6).map((a) => (isArabic ? a.labelAr : a.labelEn)),
          bedType: isArabic ? 'سرير مزدوج' : 'Double Bed',
          amenities: amenityList,
          maxGuests: room.capacity || 2,
          size: 30,
          image: storageUrl(room.featured_image) ?? storageUrl(room.images?.[0]?.path) ?? bilingualRoomsData[index % bilingualRoomsData.length]?.image,
          gallery: [storageUrl(room.featured_image), ...((room.images || []).map((i: any) => storageUrl(i.path)))].filter(Boolean) as string[],
          popularTag: undefined,
          isAvailable: true,
        };
      });
    }
    // Fallback to static data
    return bilingualRoomsData.map(room => ({
      id: room.id,
      name: isArabic ? room.nameAr : room.nameEn,
      description: isArabic ? room.descriptionAr : room.descriptionEn,
      shortDescription: '',
      price: room.price,
      originalPrice: room.originalPrice,
      currency: isArabic ? room.currency : room.currencyEn,
      features: isArabic ? room.featuresAr : room.featuresEn,
      bedType: isArabic ? room.bedTypeAr : room.bedTypeEn,
      amenities: [] as RoomCardAmenity[],
      maxGuests: room.maxGuests,
      size: room.size,
      image: room.image,
      gallery: [room.image].filter(Boolean) as string[],
      popularTag: room.popularTagAr || room.popularTagEn
        ? (isArabic ? room.popularTagAr : room.popularTagEn)
        : undefined,
      isAvailable: true,
    }));
  }, [isArabic, backendRooms, storageUrl])

  // Update SVG gradient colors when CSS variable changes
  useEffect(() => {
    const updateGradientColors = () => {
      const root = getComputedStyle(document.documentElement)
      // Prefer explicit room button variables if set, otherwise fall back to primary colors
      const roomButtonPrimary = root.getPropertyValue('--madina-room-button-primary').trim()
      const roomButtonLight = root.getPropertyValue('--madina-room-button-light').trim()
      const primaryColor = roomButtonPrimary || root.getPropertyValue('--madina-primary').trim()
      const primaryLightColor = roomButtonLight || root.getPropertyValue('--madina-primary-light').trim()
      
      // Update all gradient stops
      roomsSource.forEach((room) => {
        const stop0 = document.querySelector(`#paint0_linear_${room.id} stop:nth-child(1)`) as SVGStopElement
        const stop1 = document.querySelector(`#paint0_linear_${room.id} stop:nth-child(2)`) as SVGStopElement
        const stop2 = document.querySelector(`#paint1_linear_${room.id} stop:nth-child(1)`) as SVGStopElement
        const stop3 = document.querySelector(`#paint1_linear_${room.id} stop:nth-child(2)`) as SVGStopElement
        
        if (stop0 && primaryColor) stop0.setAttribute('stop-color', primaryColor)
        if (stop1 && primaryLightColor) stop1.setAttribute('stop-color', primaryLightColor)
        if (stop2 && primaryColor) stop2.setAttribute('stop-color', primaryColor)
        if (stop3 && primaryLightColor) stop3.setAttribute('stop-color', primaryLightColor)
      })
    }

    // Initial update
    updateGradientColors()

    // Watch for CSS variable changes using interval (simpler than MutationObserver)
    const interval = setInterval(updateGradientColors, 100)

    return () => {
      clearInterval(interval)
    }
  }, [roomsSource])

  const onBookClick = (room?: any) => {
    // Surface the clicked room's real data into the popup so it matches what
    // was entered (gallery, name, price, amenities, full description).
    if (room) {
      setSelectedRoom({
        name: room.name,
        description: room.description, // full detailed description
        images: room.gallery,
        features: (room.amenities || []).map((a: any) => ({
          lucideKey: a.key,
          emoji: a.icon,
          labelAr: a.labelAr,
          labelEn: a.labelEn,
        })),
        price: String(room.price),
        currency: room.currency,
      });
    }
    setDefaultType('جناح');
    setModalOpen(true);
  }

  const handleConfirm = (data: BookingData) => {
    // Handle booking confirmation
    setModalOpen(false)
  }

  return (
    <section id="rooms" className="pt-20">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Title */}
        <div className="relative text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div 
              className="h-6 w-6 hidden md:block"
              aria-label="left icon"
              style={{
                maskImage: `url(${leftIcon})`,
                WebkitMaskImage: `url(${leftIcon})`,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                backgroundColor: 'var(--madina-primary)'
              }}
            />
            <h2 className="madina-font-heading madina-text-primary relative z-10 text-4xl md:text-5xl font-bold">
              {t('sections.rooms.title', 'ارتقِ بإقامتك إلى مستوى آخر من الفخامة')}
          </h2>
            <div 
              className="h-6 w-6 hidden md:block"
              aria-label="right icon"
              style={{
                maskImage: `url(${rightIcon})`,
                WebkitMaskImage: `url(${rightIcon})`,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                backgroundColor: 'var(--madina-primary)'
              }}
            />
          </div>
          <BackgroundTitle 
            text={t('sections.rooms.background_title', 'الأجنحة')} 
            colorClass="dark:text-[rgba(237,237,237,0.2)]"
            colorStyle={{ color: 'var(--madina-primary)', opacity: 0.1 }}
          />
          <p className="relative z-10 text-xl madina-text-body max-w-4xl mx-auto leading-relaxed">
            {t(
              'sections.rooms.subtitle',
              'نقدم لك أكثر من مجرد إقامة. نحن نقدم تجربة فريدة، حيث تلتقي الفخامة بالضيافة. من غرفنا الأنيقة إلى مرافقنا المتطورة، كل شيء مصمم ليوفر لك الهدوء والرفاهية التي تستحقها.'
            )}
          </p>
        </div>

        {/* Rooms grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {roomsSource.map((room) => (
            <div
              key={room.id}
              className={`relative transition-all duration-300 ${
                cardStyle === 'simple' 
                  ? 'bg-white dark:bg-[#1E293B] rounded-xl shadow-lg overflow-hidden' 
                  : 'text-white dark:text-gray-800'
              }`}
              style={{
                width: '100%',
                minHeight: '100%'
              }}
            >
              {/* SVG background - default style only */}
              {cardStyle === 'default' && (
                <svg 
                  viewBox="0 0 504 694" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="madina-room-card-bg absolute inset-0 w-full h-full"
                  aria-hidden="true"
                  preserveAspectRatio="none"
                >
                  <path 
                    d="M460.664 693.801C441.623 693.113 408.981 692.08 368.365 691.736C294.545 691.047 256.837 693.113 166.695 693.801C142.682 693.973 105.069 694.145 58.2624 693.801C48.6948 687.174 17.3657 678.997 14.9269 654.037C2.07627 523.815 21.2114 364.158 2.45145 226.447C-5.89675 164.994 9.29887 104.746 14.9269 47.252C15.2083 41.8297 16.6152 31.1571 24.7758 21.9477C30.9666 14.9762 39.69 9.98421 49.9142 8.26283C94.094 0.602703 130.395 -0.516214 156.659 0.172337C209.093 1.46337 215.753 9.55387 271.095 9.20959C332.065 8.86532 347.917 -1.1187 401.195 0.172337C427.365 0.774819 450.534 3.78722 469.857 7.48818C489.836 11.2752 504 27.6283 504 46.3913V654.123C504 676.071 484.583 693.887 460.664 693.887V693.801Z" 
                    className="fill-current text-white dark:text-[var(--madina-room-card-bg,var(--madina-primary))]"
                  />
                </svg>
              )}
              
              {/* Content */}
              <div className="relative z-10 flex flex-col h-full p-6">

                {/* Room image */}
                <div className="overflow-hidden rounded-lg mb-4 flex-shrink-0">
                  <img
                    src={room.image}
                    alt={room.name}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Features with icons - horizontal row.
                    When the admin configured amenities for this room, we
                    render those (FontAwesome for known keys, emoji for
                    custom ones); otherwise fall back to the generic set. */}
                <div className="grid grid-cols-3 gap-3 mb-4 flex-shrink-0">
                {(room.amenities && room.amenities.length > 0
                  ? room.amenities.slice(0, 6).map((a) => ({
                      // Resolve a themed icon from the amenity key first, then
                      // from the stored icon value (custom amenities save an
                      // icon key); fall back to the emoji for legacy rows.
                      faKey: AMENITY_FA_ICONS[a.key] ? a.key : (a.icon && AMENITY_FA_ICONS[a.icon] ? a.icon : null),
                      labelAr: a.labelAr,
                      labelEn: a.labelEn,
                      emoji: a.icon,
                      svg: null as string | null,
                    }))
                  : [
                      { faKey: null, labelAr: 'مواقف السيارات', labelEn: 'Parking', emoji: null, svg: parkIcon },
                      { faKey: null, labelAr: '3 وجبات', labelEn: '3 Meals', emoji: null, svg: mealIcon },
                      { faKey: null, labelAr: `${room.maxGuests} أشخاص`, labelEn: `${room.maxGuests} Guests`, emoji: null, svg: peopleIcon },
                      { faKey: null, labelAr: '4 مرافق', labelEn: '4 Amenities', emoji: null, svg: amenitiesIcon },
                      { faKey: 'wifi', labelAr: 'واي فاي', labelEn: 'Wi-Fi', emoji: null, svg: wifiIcon },
                      { faKey: null, labelAr: 'الاحتياجات الخاصة', labelEn: 'Accessibility', emoji: null, svg: wheelchairIcon },
                    ]
                ).map((feature, index) => {
                  const label = isArabic ? feature.labelAr : feature.labelEn;
                  const Fa = feature.faKey ? AMENITY_FA_ICONS[feature.faKey] : undefined;
                  return (
                    <div key={index} className="flex flex-col items-center text-center">
                      {Fa ? (
                        <Fa
                          className="w-6 h-6 mb-1"
                          style={{ color: 'var(--madina-identity-icon-color, var(--madina-primary))' }}
                          aria-label={label}
                        />
                      ) : feature.emoji ? (
                        <span className="mb-1 inline-flex h-6 w-6 items-center justify-center text-lg" aria-label={label}>
                          {feature.emoji}
                        </span>
                      ) : feature.svg ? (
                        <div
                          className="w-6 h-6 mb-1"
                          aria-label={label}
                          style={{
                            maskImage: `url(${feature.svg})`,
                            WebkitMaskImage: `url(${feature.svg})`,
                            maskSize: 'contain',
                            WebkitMaskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            WebkitMaskRepeat: 'no-repeat',
                            maskPosition: 'center',
                            WebkitMaskPosition: 'center',
                            backgroundColor: 'var(--madina-identity-icon-color, var(--madina-primary))',
                            opacity: 1,
                          }}
                        />
                      ) : null}
                      <span className="text-xs madina-text-body">{label}</span>
                    </div>
                  );
                })}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-600 mb-4 flex-shrink-0"></div>

                {/* Title and price area */}
                <div className="mb-4 flex-grow">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="madina-font-heading text-xl font-bold madina-text-primary min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                      {room.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="madina-text-primary text-2xl font-bold break-all">{room.price}</span>
                      <div 
                        className="w-5 h-5"
                        aria-label="price"
                        style={{
                          maskImage: `url(${priceIcon})`,
                          WebkitMaskImage: `url(${priceIcon})`,
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat',
                          maskPosition: 'center',
                          WebkitMaskPosition: 'center',
                          backgroundColor: 'var(--madina-identity-icon-color, var(--madina-primary))',
                          opacity: 1
                        }}
                      />
                    </div>
                  </div>
                  {/* The card shows the SHORT description (concise, colour-only).
                      The full detailed description lives in the booking popup. */}
                  <div
                    className="rte-content madina-text-body text-sm md:text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: room.shortDescription || room.description || '' }}
                  />
                </div>

                {/* Book button */}
                <button 
                  className="w-full flex-shrink-0 cursor-pointer transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    '--focus-ring': 'var(--madina-primary)'
                  } as React.CSSProperties & { '--focus-ring': string }}
                  onFocus={(e) => {
                    e.currentTarget.style.setProperty('--tw-ring-color', 'var(--madina-primary)')
                  }}
                  onClick={() => onBookClick(room)}
                >
                  <svg width="432" height="62" viewBox="0 0 432 62" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                    <defs>
                      <linearGradient id={`paint0_linear_${room.id}`} x1="0" y1="31" x2="432" y2="31" gradientUnits="userSpaceOnUse">
                        <stop stopColor="var(--madina-room-button-primary, var(--madina-primary))"/>
                        <stop offset="0.8" stopColor="var(--madina-room-button-light, var(--madina-primary-light))"/>
                      </linearGradient>
                      <linearGradient id={`paint1_linear_${room.id}`} x1="0" y1="31" x2="432" y2="31" gradientUnits="userSpaceOnUse">
                        <stop stopColor="var(--madina-room-button-primary, var(--madina-primary))"/>
                        <stop offset="0.8" stopColor="var(--madina-room-button-light, var(--madina-primary-light))"/>
                      </linearGradient>
                    </defs>
                    <rect x="0.5" y="0.5" width="431" height="61" rx="30.5" fill={`url(#paint0_linear_${room.id})`}/>
                    <rect x="0.5" y="0.5" width="431" height="61" rx="30.5" fill="black" fillOpacity="0.2"/>
                    <rect x="0.5" y="0.5" width="431" height="61" rx="30.5" stroke={`url(#paint1_linear_${room.id})`}/>
                    <rect x="0.5" y="0.5" width="431" height="61" rx="30.5" stroke="black" strokeOpacity="0.2"/>
                    <text 
                      x="50%" 
                      y="50%" 
                      dominantBaseline="middle" 
                      textAnchor="middle" 
                      className="madina-font-heading text-white font-semibold"
                      fill="white"
                      style={{ fontSize: '20px', fontWeight: '600' }}
                    >
                      {isArabic 
                        ? (room.id === 1 ? 'حجز الجناح' : 'حجز الغرفة') 
                        : (room.id === 1 ? 'Book Suite' : 'Book Room')}
                    </text>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        {modalOpen && (
          <BookingModal
            open={modalOpen}
            defaultType={defaultType}
            service={selectedRoom}
            variant="room"
            onClose={() => setModalOpen(false)}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </section>
  )
}
