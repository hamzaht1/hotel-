import {
    Wifi,
    Tv,
    Snowflake,
    Wine,
    Lock,
    Blinds,
    Car,
    Waves,
    Dumbbell,
    Utensils,
    Coffee,
    Bath,
    ShowerHead,
    BedDouble,
    Wind,
    Flower2,
    Sparkles,
    PawPrint,
    Baby,
    Accessibility,
    Shirt,
    BellRing,
    Mountain,
    TreePalm,
    Refrigerator,
    Microwave,
    Phone,
    Sun,
    Cigarette,
    // Spa / massage
    HandHeart,
    Droplets,
    Flame,
    Leaf,
    // Restaurant / food
    UtensilsCrossed,
    ChefHat,
    CookingPot,
    CakeSlice,
    // Halls
    Theater,
    Presentation,
    Projector,
    PartyPopper,
    Armchair,
    // Transportation
    Bus,
    PlaneTakeoff,
    CarTaxiFront,
    CarFront,
    type LucideIcon,
} from 'lucide-react';

export interface FeatureIconOption {
    key: string;
    Icon: LucideIcon;
    label_ar: string;
    label_en: string;
}

/**
 * The catalogue of icons a tenant can attach to a service feature. This is the
 * single source of truth shared by the admin wizard (the icon picker) and the
 * Madina Services template (the public render), so a picked icon always matches
 * exactly what shows on the site. The first six keys mirror the preset
 * "Available Features"; the rest are extra hospitality icons.
 */
export const SERVICE_FEATURE_ICON_OPTIONS: FeatureIconOption[] = [
    { key: 'wifi', Icon: Wifi, label_ar: 'واي فاي', label_en: 'WiFi' },
    { key: 'tv', Icon: Tv, label_ar: 'تلفاز', label_en: 'TV' },
    { key: 'ac', Icon: Snowflake, label_ar: 'تكييف', label_en: 'Air Conditioning' },
    { key: 'minibar', Icon: Wine, label_ar: 'ميني بار', label_en: 'Mini Bar' },
    { key: 'safe', Icon: Lock, label_ar: 'خزنة', label_en: 'Safe' },
    { key: 'balcony', Icon: Blinds, label_ar: 'شرفة', label_en: 'Balcony' },
    { key: 'parking', Icon: Car, label_ar: 'موقف سيارات', label_en: 'Parking' },
    { key: 'pool', Icon: Waves, label_ar: 'مسبح', label_en: 'Pool' },
    { key: 'gym', Icon: Dumbbell, label_ar: 'صالة رياضية', label_en: 'Gym' },
    { key: 'restaurant', Icon: Utensils, label_ar: 'مطعم', label_en: 'Restaurant' },
    { key: 'coffee', Icon: Coffee, label_ar: 'قهوة', label_en: 'Coffee' },
    { key: 'bathtub', Icon: Bath, label_ar: 'حوض استحمام', label_en: 'Bathtub' },
    { key: 'shower', Icon: ShowerHead, label_ar: 'دش', label_en: 'Shower' },
    { key: 'bed', Icon: BedDouble, label_ar: 'سرير', label_en: 'Bed' },
    { key: 'ventilation', Icon: Wind, label_ar: 'تهوية', label_en: 'Ventilation' },
    { key: 'spa', Icon: Flower2, label_ar: 'سبا', label_en: 'Spa' },
    { key: 'cleaning', Icon: Sparkles, label_ar: 'تنظيف', label_en: 'Cleaning' },
    { key: 'pets', Icon: PawPrint, label_ar: 'حيوانات أليفة', label_en: 'Pets Allowed' },
    { key: 'kids', Icon: Baby, label_ar: 'أطفال', label_en: 'Kids' },
    { key: 'accessibility', Icon: Accessibility, label_ar: 'ذوي الاحتياجات', label_en: 'Accessibility' },
    { key: 'laundry', Icon: Shirt, label_ar: 'غسيل', label_en: 'Laundry' },
    { key: 'concierge', Icon: BellRing, label_ar: 'خدمة الاستقبال', label_en: 'Concierge' },
    { key: 'view', Icon: Mountain, label_ar: 'إطلالة', label_en: 'View' },
    { key: 'garden', Icon: TreePalm, label_ar: 'حديقة', label_en: 'Garden' },
    { key: 'fridge', Icon: Refrigerator, label_ar: 'ثلاجة', label_en: 'Fridge' },
    { key: 'microwave', Icon: Microwave, label_ar: 'ميكروويف', label_en: 'Microwave' },
    { key: 'phone', Icon: Phone, label_ar: 'هاتف', label_en: 'Phone' },
    { key: 'terrace', Icon: Sun, label_ar: 'تراس', label_en: 'Terrace' },
    { key: 'smoking', Icon: Cigarette, label_ar: 'مسموح التدخين', label_en: 'Smoking' },

    // ── Massage / Spa ──────────────────────────────────────────
    { key: 'massage', Icon: HandHeart, label_ar: 'مساج', label_en: 'Massage' },
    { key: 'aromatherapy', Icon: Droplets, label_ar: 'علاج عطري', label_en: 'Aromatherapy' },
    { key: 'sauna', Icon: Flame, label_ar: 'ساونا', label_en: 'Sauna' },
    { key: 'relaxation', Icon: Leaf, label_ar: 'استرخاء', label_en: 'Relaxation' },

    // ── Restaurant / food ──────────────────────────────────────
    { key: 'dining', Icon: UtensilsCrossed, label_ar: 'مأكولات', label_en: 'Dining' },
    { key: 'chef', Icon: ChefHat, label_ar: 'شيف', label_en: 'Chef' },
    { key: 'buffet', Icon: CookingPot, label_ar: 'بوفيه', label_en: 'Buffet' },
    { key: 'dessert', Icon: CakeSlice, label_ar: 'حلويات', label_en: 'Desserts' },

    // ── Halls / قاعات ──────────────────────────────────────────
    { key: 'hall', Icon: Theater, label_ar: 'قاعة', label_en: 'Hall' },
    { key: 'conference', Icon: Presentation, label_ar: 'مؤتمرات', label_en: 'Conference' },
    { key: 'meeting', Icon: Projector, label_ar: 'اجتماعات', label_en: 'Meeting' },
    { key: 'wedding', Icon: PartyPopper, label_ar: 'أفراح', label_en: 'Weddings' },
    { key: 'seating', Icon: Armchair, label_ar: 'جلوس', label_en: 'Seating' },

    // ── Transportation / مواصلات ───────────────────────────────
    { key: 'shuttle', Icon: Bus, label_ar: 'نقل', label_en: 'Shuttle' },
    { key: 'airport_transfer', Icon: PlaneTakeoff, label_ar: 'توصيل المطار', label_en: 'Airport Transfer' },
    { key: 'taxi', Icon: CarTaxiFront, label_ar: 'سيارة أجرة', label_en: 'Taxi' },
    { key: 'car_rental', Icon: CarFront, label_ar: 'تأجير سيارات', label_en: 'Car Rental' },
];

/** Map of feature key → icon component, derived from the catalogue. */
export const SERVICE_FEATURE_ICONS: Record<string, LucideIcon> = Object.fromEntries(
    SERVICE_FEATURE_ICON_OPTIONS.map((o) => [o.key, o.Icon]),
);
