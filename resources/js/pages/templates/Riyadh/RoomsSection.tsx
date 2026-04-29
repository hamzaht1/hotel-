/**
 * قسم الغرف والأجنحة - قالب الرياض
 */
import roomImage from '@/assets/images/riyadh-template/rooms/room-1.png'
import React, { useMemo, useState } from 'react'
import BookingModal, { BookingType, BookingData } from '@/components/templates/BookingModal'
import BackgroundTitle from '@/components/templates/BackgroundTitle'
import { useTemplateT, useTemplateLanguage } from '@/hooks/useTemplateTranslations'
import { useStorageUrl } from '@/lib/storage'
import { riyadhRoomsData } from '@/data/templates/riyadh/rooms-data'
import { TemplateRoom } from '@/types/template-types'

// Extend TemplateRoom with bilingual fields
interface BilingualRoom extends TemplateRoom {
  nameEn?: string;
  descriptionEn?: string;
  currencyEn?: string;
  featuresEn?: string[];
  bedTypeEn?: string;
  amenitiesEn?: string[];
  popularTagEn?: string;
}

// Function to get English translations for room data
function getBilingualRoomData(roomId: number): Partial<BilingualRoom> {
  // This would ideally come from a database or API
  const roomTranslations: Record<number, Partial<BilingualRoom>> = {
    1: {
      nameEn: "Royal Suite",
      descriptionEn: "Luxurious suite with panoramic views of Riyadh featuring modern design and premium services",
      featuresEn: ["120 sq meters", "Separate bedroom", "Marble bathroom", "Private balcony"],
      bedTypeEn: "King-size bed",
    },
    2: {
      nameEn: "Deluxe Room",
      descriptionEn: "Spacious and comfortable room with all modern amenities and great city views",
      featuresEn: ["45 sq meters", "King-size bed", "Sitting area", "City view"],
      bedTypeEn: "King-size bed",
    },
    3: {
      nameEn: "Family Room",
      descriptionEn: "Perfect room for families with spacious areas, extra beds and child-friendly facilities",
      featuresEn: ["60 sq meters", "Two beds", "Living room", "Child-friendly"],
      bedTypeEn: "King-size bed + Two single beds",
    },
    4: {
      nameEn: "Executive Room",
      descriptionEn: "Room specifically designed for business travelers with equipped desk and work facilities",
      featuresEn: ["50 sq meters", "Work desk", "High-speed internet", "Printer"],
      bedTypeEn: "King-size bed",
    }
  };
  
  return roomTranslations[roomId] || {};
}

// Import icons
import wifiIcon from '@/assets/images/riyadh-template/rooms/icons/wifi.svg'
import wheelchairIcon from '@/assets/images/riyadh-template/rooms/icons/wheelchair.svg'
import peopleIcon from '@/assets/images/riyadh-template/rooms/icons/people.svg'
import parkIcon from '@/assets/images/riyadh-template/rooms/icons/park.svg'
import mealIcon from '@/assets/images/riyadh-template/rooms/icons/meal.svg'
import frameIcon from '@/assets/images/riyadh-template/rooms/icons/frame.svg'
import amenitiesIcon from '@/assets/images/riyadh-template/rooms/icons/amenities.svg'
import priceIcon from '@/assets/images/riyadh-template/rooms/icons/price.svg'

import leftLine from '@/assets/images/riyadh-template/rooms/left-line.svg'
import rightLine from '@/assets/images/riyadh-template/rooms/right-line.svg'

interface RoomsSectionProps {
  rooms?: any[];
}

export default function RoomsSection({ rooms: backendRooms }: RoomsSectionProps) {
  const t = useTemplateT()
  const { isArabic } = useTemplateLanguage()
  const storageUrl = useStorageUrl()
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultType, setDefaultType] = useState<BookingType>('غرفة')

  // Use backend rooms if available, otherwise fallback to static data
  const rooms = useMemo(() => {
    if (backendRooms && backendRooms.length > 0) {
      return backendRooms.slice(0, 3).map((room, i) => ({
        id: room.id,
        name: room.name_ar || room.name,
        nameEn: room.name_en || room.name,
        description: room.description_ar || room.description || '',
        descriptionEn: room.description_en || room.description || '',
        price: room.price,
        maxGuests: room.capacity || 2,
        image: storageUrl(room.featured_image) ?? roomImage,
        amenities: room.amenities || [],
      }));
    }

    // Fallback to static data
    return riyadhRoomsData.slice(0, 3).map(room => ({
      ...room,
      nameEn: getBilingualRoomData(room.id).nameEn,
      descriptionEn: getBilingualRoomData(room.id).descriptionEn,
      currencyEn: 'SAR',
      featuresEn: getBilingualRoomData(room.id).featuresEn,
      bedTypeEn: getBilingualRoomData(room.id).bedTypeEn,
      image: roomImage,
    })) as BilingualRoom[];
  }, [backendRooms, storageUrl])

  const onBookClick = () => {
    // In a real app, we'd pass the room ID here
    // Since BookingType only accepts Arabic values currently, we'll use those
    setDefaultType('جناح');
    setModalOpen(true);
  }

  const handleConfirm = (data: BookingData) => {
    console.log('تأكيد الحجز:', data)
    setModalOpen(false)
  }

  return (
  <section id="rooms" className="py-20  ">
      <div className="container mx-auto px-4">
        {/* Title */}
        <div className="relative text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src={leftLine} alt="left line" className="h-6 w-auto hidden md:block line-icon" />
            <h2 className="relative z-10 text-4xl md:text-5xl font-bold riyadh-heading">
              {t('sections.rooms.title', 'ارتقِ بإقامتك إلى مستوى آخر من الفخامة')}
            </h2>
            <img src={rightLine} alt="right line" className="h-6 w-auto hidden md:block line-icon" />
          </div>
          <BackgroundTitle text={t('sections.rooms.background_title', 'الأجنحة')} />
          <p className="relative z-10 text-xl riyadh-text-muted max-w-4xl mx-auto leading-relaxed">
            {t(
              'sections.rooms.subtitle',
              'نقدم لك أكثر من مجرد إقامة. نحن نقدم تجربة فريدة، حيث تلتقي الفخامة بالضيافة. من غرفنا الأنيقة إلى مرافقنا المتطورة، كل شيء مصمم ليوفر لك الهدوء والرفاهية التي تستحقها.'
            )}
          </p>
        </div>

        {/* Rooms grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border riyadh-border p-6 h-full flex flex-col">
              
              {/* Room image */}
              <div className=" overflow-hidden rounded-xl mb-4 flex-shrink-0">
                <img
                  src={room.image || roomImage}
                  alt={isArabic ? room.name : (room.nameEn || room.name)}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Features with icons - horizontal row */}
              <div className="grid grid-cols-3 gap-3 mb-4 flex-shrink-0">
                {[
                  { 
                    icon: parkIcon, 
                    labelAr: 'مواقف السيارات', 
                    labelEn: 'Parking' 
                  },
                  { 
                    icon: mealIcon, 
                    labelAr: '3 وجبات', 
                    labelEn: '3 Meals' 
                  },
                  { 
                    icon: peopleIcon, 
                    labelAr: `${room.maxGuests} أشخاص`, 
                    labelEn: `${room.maxGuests} Guests` 
                  },
                  { 
                    icon: amenitiesIcon, 
                    labelAr: `${(room.amenities?.length ?? 4)} مرافق`, 
                    labelEn: `${(room.amenities?.length ?? 4)} Amenities` 
                  },
                  { 
                    icon: wifiIcon, 
                    labelAr: 'واي فاي', 
                    labelEn: 'Wi-Fi' 
                  },
                  { 
                    icon: wheelchairIcon, 
                    labelAr: 'الاحتياجات الخاصة', 
                    labelEn: 'Accessibility' 
                  },
                ].map((feature, index) => {
                  const label = isArabic ? feature.labelAr : feature.labelEn;
                  return (
                    <div key={index} className="flex flex-col items-center text-center">
                      <img src={feature.icon} alt={label} className="w-6 h-6 mb-1 on-dark-white" />
                      <span className="text-xs riyadh-text-muted">{label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="border-t riyadh-border mb-4 flex-shrink-0"></div>

              {/* Title and price area with frame background */}
              <div 
                className="relative p-4 mb-4 rounded-lg flex-grow bg-transparent bg-blend-multiply dark:bg-[#050711]/40"
                style={{
                  backgroundImage: `url(${frameIcon})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 ">
                      {isArabic ? room.name : (room.nameEn || room.name)}
                    </h3>
                    <p className="riyadh-text-muted text-sm md:text-[16px] leading-relaxed">
                      {isArabic ? room.description : (room.descriptionEn || room.description)}
                    </p>
                  </div>
                  <div className="text-left mr-4">
                    <div className="flex items-center justify-end gap-2">
                      {isArabic ? (
                        <>
                          <span className="text-2xl font-bold ">{room.price}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl font-bold riyadh-heading">{room.price}</span>
                        </>
                      )}
                      <img src={priceIcon} alt="price" className="w-5 h-5 on-dark-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Book button */}
              <button 
                className="w-full text-white py-3 rounded-lg text-xl font-semibold transition-colors hover:opacity-90 flex-shrink-0 cursor-pointer riyadh-primary-bg"
                onClick={onBookClick}
              >
                {isArabic 
                  ? (room.id === 1 ? 'حجز الجناح' : 'حجز الغرفة') 
                  : (room.id === 1 ? 'Book Suite' : 'Book Room')}
              </button>

            </div>
          ))}
        </div>
        {modalOpen && (
          <BookingModal
            open={modalOpen}
            defaultType={defaultType}
            onClose={() => setModalOpen(false)}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </section>
  )
}