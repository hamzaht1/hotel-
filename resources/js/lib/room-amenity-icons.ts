import {
    FaWifi,
    FaTv,
    FaSnowflake,
    FaWineGlass,
    FaLock,
    FaWindowMaximize,
    FaWater,
    FaBellConcierge,
    FaBath,
    FaUtensils,
    FaCar,
    FaDumbbell,
    FaPersonSwimming,
    FaMugSaucer,
    FaSpa,
    FaBed,
    FaShower,
    FaKitchenSet,
    FaWheelchair,
    FaShirt,
    FaPaw,
    FaBaby,
    FaFan,
    FaMountainSun,
    FaUmbrellaBeach,
    FaElevator,
    FaPlateWheat,
    FaSmoking,
    FaPhone,
    FaTree,
} from 'react-icons/fa6';
import type { IconType } from 'react-icons';

export interface AmenityIconOption {
    key: string;
    Icon: IconType;
    label_ar: string;
    label_en: string;
}

/**
 * The catalogue of icons a tenant can attach to a room amenity. Shared by the
 * admin wizard (icon picker) and the Madina Rooms template (public render) so a
 * picked icon always matches exactly what shows on the site. The first ten keys
 * mirror the preset amenities; the rest are extra hospitality icons.
 */
export const ROOM_AMENITY_ICON_OPTIONS: AmenityIconOption[] = [
    { key: 'wifi', Icon: FaWifi, label_ar: 'واي فاي', label_en: 'WiFi' },
    { key: 'tv', Icon: FaTv, label_ar: 'تلفاز', label_en: 'TV' },
    { key: 'air_conditioning', Icon: FaSnowflake, label_ar: 'تكييف', label_en: 'Air Conditioning' },
    { key: 'minibar', Icon: FaWineGlass, label_ar: 'ميني بار', label_en: 'Mini Bar' },
    { key: 'safe', Icon: FaLock, label_ar: 'خزنة', label_en: 'Safe' },
    { key: 'balcony', Icon: FaWindowMaximize, label_ar: 'شرفة', label_en: 'Balcony' },
    { key: 'sea_view', Icon: FaWater, label_ar: 'إطلالة بحرية', label_en: 'Sea View' },
    { key: 'room_service', Icon: FaBellConcierge, label_ar: 'خدمة الغرف', label_en: 'Room Service' },
    { key: 'jacuzzi', Icon: FaBath, label_ar: 'جاكوزي', label_en: 'Jacuzzi' },
    { key: 'kitchen', Icon: FaUtensils, label_ar: 'مطبخ', label_en: 'Kitchen' },
    { key: 'parking', Icon: FaCar, label_ar: 'موقف سيارات', label_en: 'Parking' },
    { key: 'gym', Icon: FaDumbbell, label_ar: 'صالة رياضية', label_en: 'Gym' },
    { key: 'pool', Icon: FaPersonSwimming, label_ar: 'مسبح', label_en: 'Pool' },
    { key: 'coffee', Icon: FaMugSaucer, label_ar: 'قهوة', label_en: 'Coffee' },
    { key: 'spa', Icon: FaSpa, label_ar: 'سبا', label_en: 'Spa' },
    { key: 'bed', Icon: FaBed, label_ar: 'سرير', label_en: 'Bed' },
    { key: 'shower', Icon: FaShower, label_ar: 'دش', label_en: 'Shower' },
    { key: 'kitchenette', Icon: FaKitchenSet, label_ar: 'ركن طبخ', label_en: 'Kitchenette' },
    { key: 'accessibility', Icon: FaWheelchair, label_ar: 'ذوي الاحتياجات', label_en: 'Accessibility' },
    { key: 'laundry', Icon: FaShirt, label_ar: 'غسيل', label_en: 'Laundry' },
    { key: 'pets', Icon: FaPaw, label_ar: 'حيوانات أليفة', label_en: 'Pets Allowed' },
    { key: 'kids', Icon: FaBaby, label_ar: 'أطفال', label_en: 'Kids' },
    { key: 'ventilation', Icon: FaFan, label_ar: 'تهوية', label_en: 'Ventilation' },
    { key: 'view', Icon: FaMountainSun, label_ar: 'إطلالة', label_en: 'View' },
    { key: 'beach', Icon: FaUmbrellaBeach, label_ar: 'شاطئ', label_en: 'Beach' },
    { key: 'elevator', Icon: FaElevator, label_ar: 'مصعد', label_en: 'Elevator' },
    { key: 'meals', Icon: FaPlateWheat, label_ar: 'وجبات', label_en: 'Meals' },
    { key: 'smoking', Icon: FaSmoking, label_ar: 'مسموح التدخين', label_en: 'Smoking' },
    { key: 'phone', Icon: FaPhone, label_ar: 'هاتف', label_en: 'Phone' },
    { key: 'garden', Icon: FaTree, label_ar: 'حديقة', label_en: 'Garden' },
];

/** Map of amenity key → icon component, derived from the catalogue. */
export const ROOM_AMENITY_ICONS: Record<string, IconType> = Object.fromEntries(
    ROOM_AMENITY_ICON_OPTIONS.map((o) => [o.key, o.Icon]),
);
