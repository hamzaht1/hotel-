import { useT } from '@/hooks/use-translations';
import { useStorageUrl } from '@/lib/storage';
import { router, useForm } from '@inertiajs/react';
import RichTextarea from '@/components/forms/rich-textarea';
import RichTextEditor from '@/components/forms/rich-text-editor';
import ColorTextEditor from '@/components/forms/color-text-editor';
import { validateImageDimensions } from '@/lib/image-dimensions';
import AlertModal from '@/components/ui/alert-modal';
import {
    Upload,
    X,
    Star,
    Plus,
    GripVertical,
    Trash2,
    Image as ImageIcon,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';
import {
    FaCalendarDays,
    FaCheck,
    FaMoon,
    FaClock,
    FaStopwatch,
    FaBed,
    FaSpa,
    FaBuilding,
    FaUtensils,
    FaWandMagicSparkles,
} from 'react-icons/fa6';
import type { IconType } from 'react-icons';
import { SERVICE_FEATURE_ICONS, SERVICE_FEATURE_ICON_OPTIONS } from '@/lib/service-feature-icons';
import { useMemo, useState } from 'react';

export interface CategoryOption {
    id: number;
    name_ar: string;
    name_en: string;
    type?: string | null;
}

export interface FeatureItem {
    key: string;
    label_ar: string;
    label_en: string;
    icon: string | null;
}

export interface ExistingImage {
    id: number;
    image_path: string;
    sort_order: number;
}

export interface ServiceInitial {
    id?: number;
    name_ar?: string;
    name_en?: string;
    category_id?: number | string | null;
    service_type?: string;
    room_type?: string | null;
    custom_subtype_ar?: string | null;
    custom_subtype_en?: string | null;
    food_serving_method?: string | null;
    buffet_start_time?: string | null;
    buffet_end_time?: string | null;
    capacity?: number | string | null;
    party_size?: number | string | null;
    price?: string | number;
    billing_method?: string | null;
    duration_hours?: number | string | null;
    duration_minutes?: number | string | null;
    time_window_from?: string | null;
    time_window_to?: string | null;
    duration?: string | null;
    booking_channel?: 'whatsapp' | 'email' | null;
    whatsapp_number?: string | null;
    booking_email?: string | null;
    whatsapp_message_ar?: string | null;
    whatsapp_message_en?: string | null;
    is_featured?: boolean;
    is_active?: boolean;
    short_description_ar?: string | null;
    short_description_en?: string | null;
    description_ar?: string | null;
    description_en?: string | null;
    internal_notes?: string | null;
    featured_image?: string | null;
    text_color?: string | null;
    features?: FeatureItem[];
    images?: ExistingImage[];
}

interface Props {
    mode: 'create' | 'edit';
    initial?: ServiceInitial;
    categories: CategoryOption[];
    submitUrl: string;
    cancelUrl: string;
}

// The five top-level service types. Picking one drives the conditional
// sub-fields below (subtype select, capacity / party_size, and the billing
// picker for "custom").
const SERVICE_TYPES: { key: string; icon: IconType; labelKey: string }[] = [
    { key: 'rooms', icon: FaBed, labelKey: 'type_rooms' },
    { key: 'spa', icon: FaSpa, labelKey: 'type_spa' },
    { key: 'hall', icon: FaBuilding, labelKey: 'type_hall' },
    { key: 'restaurant', icon: FaUtensils, labelKey: 'type_restaurant' },
    { key: 'custom', icon: FaWandMagicSparkles, labelKey: 'type_custom' },
];

// Billing methods for custom services. Each method maps the chosen pricing
// model to the conditional sub-fields the form should reveal underneath.
const BILLING_METHODS: { key: string; labelKey: string; icon: IconType }[] = [
    { key: 'time_window', labelKey: 'bill_time_window', icon: FaCalendarDays },
    { key: 'once', labelKey: 'bill_once', icon: FaCheck },
    { key: 'per_night', labelKey: 'bill_per_night', icon: FaMoon },
    { key: 'per_hour', labelKey: 'bill_per_hour', icon: FaClock },
    { key: 'per_minute', labelKey: 'bill_per_minute', icon: FaStopwatch },
];

// Shared icon catalogue — identical to what the Madina Services template
// renders, so the wizard preview matches the public site exactly.
const FEATURE_FA_ICONS = SERVICE_FEATURE_ICONS;

// Preset sub-type option keys per service type. Each list ends with the
// special "custom" key that, when picked, lets the admin type a free
// bilingual label into custom_subtype_ar / custom_subtype_en.
const ROOM_SUBTYPES = ['standard', 'deluxe', 'suite', 'family', 'custom'] as const;
const MASSAGE_SUBTYPES = [
    { key: 'traditional', labelKey: 'massage_traditional' },
    { key: 'swedish', labelKey: 'massage_swedish' },
    { key: 'hot_stone', labelKey: 'massage_hot_stone' },
    { key: 'aromatherapy', labelKey: 'massage_aromatherapy' },
    { key: 'thai', labelKey: 'massage_thai' },
    { key: 'custom', labelKey: 'custom' },
] as const;
const HALL_SUBTYPES = [
    { key: 'meeting', labelKey: 'hall_meeting' },
    { key: 'conference', labelKey: 'hall_conference' },
    { key: 'wedding', labelKey: 'hall_wedding' },
    { key: 'private', labelKey: 'hall_private' },
    { key: 'custom', labelKey: 'custom' },
] as const;
const RESTAURANT_SUBTYPES = [
    { key: 'breakfast', labelKey: 'restaurant_breakfast' },
    { key: 'lunch', labelKey: 'restaurant_lunch' },
    { key: 'dinner', labelKey: 'restaurant_dinner' },
    { key: 'buffet', labelKey: 'restaurant_buffet' },
    { key: 'custom', labelKey: 'custom' },
] as const;

const PRESET_FEATURES: FeatureItem[] = [
    { key: 'wifi', label_ar: 'واي فاي', label_en: 'WiFi', icon: '📶' },
    { key: 'tv', label_ar: 'تلفاز', label_en: 'TV', icon: '📺' },
    { key: 'ac', label_ar: 'تكييف', label_en: 'Air Conditioning', icon: '❄️' },
    { key: 'minibar', label_ar: 'ميني بار', label_en: 'Mini Bar', icon: '🍷' },
    { key: 'safe', label_ar: 'خزنة', label_en: 'Safe', icon: '🔐' },
    { key: 'balcony', label_ar: 'شرفة', label_en: 'Balcony', icon: '🪟' },
];

type FormData = {
    _method?: string;
    name_ar: string;
    name_en: string;
    category_id: string;
    service_type: string;
    room_type: string;
    custom_subtype_ar: string;
    custom_subtype_en: string;
    food_serving_method: string;
    buffet_start_time: string;
    buffet_end_time: string;
    capacity: string;
    party_size: string;
    price: string;
    billing_method: string;
    duration_hours: string;
    duration_minutes: string;
    time_window_from: string;
    time_window_to: string;
    duration: string;
    booking_channel: 'whatsapp' | 'email';
    whatsapp_number: string;
    booking_email: string;
    whatsapp_message_ar: string;
    whatsapp_message_en: string;
    text_color: string;
    is_featured: boolean;
    is_active: boolean;
    short_description_ar: string;
    short_description_en: string;
    description_ar: string;
    description_en: string;
    internal_notes: string;
    features: FeatureItem[];
    featured_image: File | null;
    images: File[];
};

export default function ServiceForm({ mode, initial = {}, categories, submitUrl, cancelUrl }: Props) {
    const { t, isArabic } = useT();
    const storageUrl = useStorageUrl();
    const dir = isArabic ? 'rtl' : 'ltr';

    const { data, setData, post, processing, errors } = useForm<FormData>({
        ...(mode === 'edit' ? { _method: 'PUT' } : {}),
        name_ar: initial.name_ar ?? '',
        name_en: initial.name_en ?? '',
        category_id: initial.category_id != null ? String(initial.category_id) : '',
        // Pre-select the type from the service's saved category on edit (the
        // category field itself is no longer shown), falling back to rooms.
        service_type: initial.service_type
            ?? categories.find((c) => String(c.id) === String(initial.category_id))?.type
            ?? 'rooms',
        room_type: initial.room_type ?? '',
        custom_subtype_ar: initial.custom_subtype_ar ?? '',
        custom_subtype_en: initial.custom_subtype_en ?? '',
        food_serving_method: initial.food_serving_method ?? '',
        buffet_start_time: initial.buffet_start_time ?? '',
        buffet_end_time: initial.buffet_end_time ?? '',
        capacity: initial.capacity != null ? String(initial.capacity) : '2',
        party_size: initial.party_size != null ? String(initial.party_size) : '',
        price: initial.price != null ? String(initial.price) : '',
        billing_method: initial.billing_method ?? 'once',
        duration_hours: initial.duration_hours != null ? String(initial.duration_hours) : '',
        duration_minutes: initial.duration_minutes != null ? String(initial.duration_minutes) : '',
        time_window_from: initial.time_window_from ?? '',
        time_window_to: initial.time_window_to ?? '',
        duration: initial.duration ?? '',
        booking_channel: (initial.booking_channel ?? 'whatsapp') as 'whatsapp' | 'email',
        whatsapp_number: initial.whatsapp_number ?? '',
        booking_email: initial.booking_email ?? '',
        whatsapp_message_ar: initial.whatsapp_message_ar ?? '',
        whatsapp_message_en: initial.whatsapp_message_en ?? '',
        text_color: initial.text_color ?? '',
        is_featured: initial.is_featured ?? false,
        is_active: initial.is_active ?? true,
        short_description_ar: initial.short_description_ar ?? '',
        short_description_en: initial.short_description_en ?? '',
        description_ar: initial.description_ar ?? '',
        description_en: initial.description_en ?? '',
        internal_notes: initial.internal_notes ?? '',
        features: initial.features ?? [],
        featured_image: null,
        images: [],
    });

    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [featuredPreview, setFeaturedPreview] = useState<string | null>(storageUrl(initial.featured_image ?? null));
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [imageAlert, setImageAlert] = useState<string | null>(null);
    const [customFeature, setCustomFeature] = useState({ label_ar: '', label_en: '', icon: 'wifi' });

    const steps = useMemo(
        () => [
            { num: 1, label: t('step_basic_info') },
            { num: 2, label: t('step_description') },
            { num: 3, label: t('step_features') },
            { num: 4, label: t('step_images') },
        ],
        [t],
    );

    const isFeatureSelected = (key: string) => data.features.some((f) => f.key === key);

    function togglePresetFeature(feat: FeatureItem) {
        setData(
            'features',
            isFeatureSelected(feat.key) ? data.features.filter((f) => f.key !== feat.key) : [...data.features, feat],
        );
    }

    function addCustomFeature() {
        if (!customFeature.label_ar.trim() || !customFeature.label_en.trim()) return;
        setData('features', [...data.features, { key: `custom_${Date.now()}`, ...customFeature }]);
        setCustomFeature({ label_ar: '', label_en: '', icon: '✨' });
    }

    function removeFeature(key: string) {
        setData('features', data.features.filter((f) => f.key !== key));
    }

    function moveFeature(from: number, to: number) {
        if (to < 0 || to >= data.features.length) return;
        const next = [...data.features];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        setData('features', next);
    }

    async function handleFeaturedImage(e: React.ChangeEvent<HTMLInputElement>) {
        const input = e.target;
        const file = input.files?.[0];
        if (!file) return;
        const error = await validateImageDimensions(file);
        if (error) {
            input.value = '';
            setImageAlert(error);
            return;
        }
        setData('featured_image', file);
        setFeaturedPreview(URL.createObjectURL(file));
    }

    async function handleExtraImages(e: React.ChangeEvent<HTMLInputElement>) {
        const input = e.target;
        const files = Array.from(input.files || []);
        const valid: File[] = [];
        const rejected: string[] = [];
        for (const f of files) {
            const error = await validateImageDimensions(f);
            if (error) {
                rejected.push(error);
                continue;
            }
            valid.push(f);
        }
        input.value = '';
        if (rejected.length) setImageAlert(rejected.join('\n\n'));
        const capped = valid.slice(0, 6 - data.images.length);
        if (!capped.length) return;
        setData('images', [...data.images, ...capped]);
        setImagePreviews([...imagePreviews, ...capped.map((f) => URL.createObjectURL(f))]);
    }

    function removeExtraImage(i: number) {
        setData('images', data.images.filter((_, idx) => idx !== i));
        setImagePreviews(imagePreviews.filter((_, idx) => idx !== i));
    }

    function deleteExistingImage(image: ExistingImage) {
        if (!confirm(t('delete_image_confirm'))) return;
        router.delete(`/client-admin/service-images/${image.id}`, { preserveScroll: true });
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(submitUrl, { forceFormData: true });
    }

    const existingImages = initial.images ?? [];

    return (
        <div className="mx-auto max-w-5xl p-4 sm:p-6" dir={dir}>
            <AlertModal open={!!imageAlert} message={imageAlert} onClose={() => setImageAlert(null)} />
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {mode === 'create' ? t('add_new_service') : t('edit_service')}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">{t('service_wizard_intro')}</p>
                </div>
                <a
                    href={cancelUrl}
                    className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label={t('cancel')}
                >
                    <X className="h-5 w-5" />
                </a>
            </div>

            {/* Errors */}
            {Object.keys(errors).length > 0 && (
                <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                    <ul className="list-inside list-disc">
                        {Object.entries(errors).map(([field, msg]) => (
                            <li key={field}>{msg as string}</li>
                        ))}
                    </ul>
                </div>
            )}

            <Stepper steps={steps} current={step} onSelect={(n) => setStep(n as 1 | 2 | 3 | 4)} />

            <form onSubmit={submit} className="mt-6 space-y-6">
                {step === 1 && (
                    <StepBasic
                        data={data}
                        setData={setData}
                        errors={errors}
                        categories={categories}
                    />
                )}
                {step === 2 && <StepDescription data={data} setData={setData} errors={errors} />}
                {step === 3 && (
                    <StepFeatures
                        data={data}
                        isSelected={isFeatureSelected}
                        onToggle={togglePresetFeature}
                        customFeature={customFeature}
                        setCustomFeature={setCustomFeature}
                        onAddCustom={addCustomFeature}
                        onRemove={removeFeature}
                        onMove={moveFeature}
                    />
                )}
                {step === 4 && (
                    <StepImages
                        existingImages={existingImages}
                        storageUrl={storageUrl}
                        onDeleteExisting={deleteExistingImage}
                        featuredPreview={featuredPreview}
                        imagePreviews={imagePreviews}
                        onFeaturedChange={handleFeaturedImage}
                        onExtraChange={handleExtraImages}
                        onRemoveExtra={removeExtraImage}
                        disabled={data.images.length + existingImages.length >= 6}
                    />
                )}

                {/* Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <a href={cancelUrl} className="text-sm text-muted-foreground hover:underline">
                        {t('cancel')}
                    </a>
                    <div className="flex items-center gap-2">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                                className="inline-flex items-center gap-1 rounded-md border px-4 py-2 text-sm transition hover:bg-muted"
                            >
                                {isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                                {t('previous')}
                            </button>
                        )}
                        {step < 4 && (
                            <button
                                type="button"
                                onClick={() => setStep((s) => (s + 1) as 2 | 3 | 4)}
                                className="inline-flex items-center gap-1 rounded-md border px-4 py-2 text-sm transition hover:bg-muted"
                            >
                                {t('next')}
                                {isArabic ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                        >
                            {processing ? t('saving') : t('save_service')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

// ============== Stepper =================
function Stepper({
    steps,
    current,
    onSelect,
}: {
    steps: { num: number; label: string }[];
    current: number;
    onSelect: (n: number) => void;
}) {
    return (
        <div className="vuexy-card flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4">
            {steps.map((s) => {
                const active = s.num === current;
                const done = s.num < current;
                return (
                    <button
                        key={s.num}
                        type="button"
                        onClick={() => onSelect(s.num)}
                        className={`flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                            active
                                ? 'bg-primary/10 font-medium text-primary'
                                : done
                                    ? 'text-foreground hover:bg-muted'
                                    : 'text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                active || done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            {s.num}
                        </span>
                        <span className="truncate">{s.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

// ============== Step 1: Basic =================
function StepBasic({
    data,
    setData,
    errors,
    categories,
}: {
    data: FormData;
    setData: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
    errors: Partial<Record<keyof FormData, string>>;
    categories: CategoryOption[];
}) {
    const { t, isArabic } = useT();

    // The Service Type picker drives the conditional fields below.
    const isFood = data.service_type === 'restaurant';

    return (
        <div className="space-y-6">
            <div className="vuexy-card p-6">
                <h2 className="mb-4 text-sm font-semibold text-muted-foreground">{t('service_type')}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {SERVICE_TYPES.map(({ key, icon: Icon, labelKey }) => {
                        const active = data.service_type === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    setData('service_type', key);
                                    // Food serving method only applies to restaurant
                                    // (food) services — clear it when switching away.
                                    if (key !== 'restaurant') {
                                        setData('food_serving_method', '');
                                        setData('buffet_start_time', '');
                                        setData('buffet_end_time', '');
                                    }
                                }}
                                className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-sm transition ${
                                    active
                                        ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                                        : 'hover:bg-muted'
                                }`}
                            >
                                <Icon className="h-6 w-6" />
                                <span>{t(labelKey)}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="vuexy-card p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('name_ar')} error={errors.name_ar}>
                        <input
                            type="text"
                            value={data.name_ar}
                            onChange={(e) => setData('name_ar', e.target.value)}
                            placeholder="مثال: غرفة ديلوكس"
                            className="vuexy-input"
                            required
                            dir="rtl"
                        />
                    </Field>
                    <Field label={t('name_en')} error={errors.name_en}>
                        <input
                            type="text"
                            value={data.name_en}
                            onChange={(e) => setData('name_en', e.target.value)}
                            placeholder="e.g. Deluxe Room"
                            className="vuexy-input"
                            required
                        />
                    </Field>

                    {/* "التصنيف" (category) and "Room Type" (sub-type) fields were
                        removed from the UI per request. The Service Type picker
                        above drives the remaining conditional fields. */}

                    {/* Food serving method (meal / buffet) — only for food
                        (restaurant) services. Buffet reveals a serving window. */}
                    {isFood && (
                        <div className="sm:col-span-2">
                            <Field label={isArabic ? 'طريقة تقديم الطعام' : 'Food serving method'} error={errors.food_serving_method}>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { key: 'meal', label_ar: 'وجبة', label_en: 'Meal' },
                                        { key: 'buffet', label_ar: 'بوفيه', label_en: 'Buffet' },
                                    ].map((o) => {
                                        const active = data.food_serving_method === o.key;
                                        return (
                                            <button
                                                key={o.key}
                                                type="button"
                                                onClick={() => {
                                                    setData('food_serving_method', o.key);
                                                    // A single meal has no serving window — clear it.
                                                    if (o.key !== 'buffet') {
                                                        setData('buffet_start_time', '');
                                                        setData('buffet_end_time', '');
                                                    }
                                                }}
                                                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                                                    active ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
                                                }`}
                                            >
                                                {isArabic ? o.label_ar : o.label_en}
                                            </button>
                                        );
                                    })}
                                </div>
                            </Field>

                            {data.food_serving_method === 'buffet' && (
                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                    <Field label={isArabic ? 'وقت البداية' : 'Start time'} error={errors.buffet_start_time}>
                                        <input
                                            type="time"
                                            value={data.buffet_start_time}
                                            onChange={(e) => setData('buffet_start_time', e.target.value)}
                                            className="vuexy-input"
                                            required
                                        />
                                    </Field>
                                    <Field label={isArabic ? 'وقت النهاية' : 'End time'} error={errors.buffet_end_time}>
                                        <input
                                            type="time"
                                            value={data.buffet_end_time}
                                            onChange={(e) => setData('buffet_end_time', e.target.value)}
                                            className="vuexy-input"
                                            required
                                        />
                                    </Field>
                                    {data.buffet_start_time && data.buffet_end_time && data.buffet_end_time <= data.buffet_start_time && (
                                        <p className="text-xs text-red-500 sm:col-span-2">
                                            {isArabic ? 'يجب أن يكون وقت النهاية أكبر من وقت البداية' : 'End time must be later than start time'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {(data.service_type === 'rooms' || data.service_type === 'hall') && (
                        <Field label={t('capacity')} error={errors.capacity}>
                            <input
                                type="number"
                                value={data.capacity}
                                onChange={(e) => setData('capacity', e.target.value)}
                                className="vuexy-input"
                                min="1"
                            />
                        </Field>
                    )}

                    {data.service_type === 'restaurant' && (
                        <Field label={t('party_size')} error={errors.party_size}>
                            <input
                                type="number"
                                value={data.party_size}
                                onChange={(e) => setData('party_size', e.target.value)}
                                className="vuexy-input"
                                min="1"
                                placeholder="4"
                            />
                        </Field>
                    )}

                    <Field label={data.service_type === 'rooms' ? t('price_per_night') : t('price_sar')} error={errors.price}>
                        <div className="relative">
                            <input
                                type="number"
                                value={data.price}
                                onChange={(e) => setData('price', e.target.value)}
                                className="vuexy-input pe-12"
                                placeholder="350"
                                min="0"
                                step="0.01"
                                required
                            />
                            <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-sm text-muted-foreground">
                                {isArabic ? 'ر.س' : 'SAR'}
                            </span>
                        </div>
                    </Field>

                    {data.service_type === 'spa' && (
                        <>
                            <Field label={t('duration_hours_label')} error={errors.duration_hours}>
                                <input
                                    type="number"
                                    value={data.duration_hours}
                                    onChange={(e) => setData('duration_hours', e.target.value)}
                                    className="vuexy-input"
                                    min="0"
                                    placeholder="1"
                                />
                            </Field>
                            <Field label={t('duration_minutes_label')} error={errors.duration_minutes}>
                                <input
                                    type="number"
                                    value={data.duration_minutes}
                                    onChange={(e) => setData('duration_minutes', e.target.value)}
                                    className="vuexy-input"
                                    min="0"
                                    max="59"
                                    placeholder="30"
                                />
                            </Field>
                        </>
                    )}

                    {data.service_type === 'hall' && (
                        <Field label={t('hours_count')} error={errors.duration_hours}>
                            <input
                                type="number"
                                value={data.duration_hours}
                                onChange={(e) => setData('duration_hours', e.target.value)}
                                className="vuexy-input"
                                min="0"
                                placeholder="2"
                            />
                        </Field>
                    )}

                </div>
            </div>

            {data.service_type === 'custom' && (
                <BillingMethodCard
                    method={data.billing_method}
                    hours={data.duration_hours}
                    minutes={data.duration_minutes}
                    from={data.time_window_from}
                    to={data.time_window_to}
                    onMethodChange={(v) => setData('billing_method', v)}
                    onHoursChange={(v) => setData('duration_hours', v)}
                    onMinutesChange={(v) => setData('duration_minutes', v)}
                    onFromChange={(v) => setData('time_window_from', v)}
                    onToChange={(v) => setData('time_window_to', v)}
                />
            )}

            <div className="vuexy-card p-6">
                <h2 className="mb-4 text-base font-semibold">{t('booking_data')}</h2>
                <div className="mb-4 inline-flex rounded-lg border p-1">
                    {(['whatsapp', 'email'] as const).map((ch) => (
                        <button
                            key={ch}
                            type="button"
                            onClick={() => setData('booking_channel', ch)}
                            className={`rounded-md px-4 py-1.5 text-sm transition ${
                                data.booking_channel === ch
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            {ch === 'whatsapp' ? t('whatsapp') : t('email_channel')}
                        </button>
                    ))}
                </div>

                {data.booking_channel === 'whatsapp' ? (
                    <Field label={t('whatsapp_number')} error={errors.whatsapp_number}>
                        <input
                            type="tel"
                            value={data.whatsapp_number}
                            onChange={(e) => setData('whatsapp_number', e.target.value)}
                            placeholder="+966 50 000 0000"
                            className="vuexy-input"
                            dir="ltr"
                        />
                    </Field>
                ) : (
                    <Field label={t('booking_email')} error={errors.booking_email}>
                        <input
                            type="email"
                            value={data.booking_email}
                            onChange={(e) => setData('booking_email', e.target.value)}
                            placeholder="bookings@hotel.com"
                            className="vuexy-input"
                            dir="ltr"
                        />
                    </Field>
                )}

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label={t('preset_message_ar')} error={errors.whatsapp_message_ar}>
                        <textarea
                            value={data.whatsapp_message_ar}
                            onChange={(e) => setData('whatsapp_message_ar', e.target.value)}
                            placeholder={t('whatsapp_placeholder_ar')}
                            className="vuexy-input"
                            rows={3}
                            dir="rtl"
                        />
                    </Field>
                    <Field label={t('preset_message_en')} error={errors.whatsapp_message_en}>
                        <textarea
                            value={data.whatsapp_message_en}
                            onChange={(e) => setData('whatsapp_message_en', e.target.value)}
                            placeholder={t('whatsapp_placeholder_en')}
                            className="vuexy-input"
                            rows={3}
                        />
                    </Field>
                </div>
            </div>

            <ColorPickerCard value={data.text_color} onChange={(v) => setData('text_color', v)} />

            <div className="vuexy-card flex items-start justify-between gap-4 p-6">
                <div className="flex items-start gap-3">
                    <Star className={`mt-0.5 h-5 w-5 ${data.is_featured ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                    <div>
                        <p className="text-sm font-medium">{t('mark_as_featured')}</p>
                        <p className="text-xs text-muted-foreground">{t('featured_hint')}</p>
                    </div>
                </div>
                <Toggle checked={data.is_featured} onChange={(v) => setData('is_featured', v)} />
            </div>

            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={data.is_active}
                    onChange={(e) => setData('is_active', e.target.checked)}
                    className="rounded border-gray-300"
                />
                {t('active_visible')}
            </label>
        </div>
    );
}

// Reusable color picker card — bound to an optional hex text_color value.
// Renders the native color input + a hex text field + a clear button so the
// admin can reset back to the template default.
function ColorPickerCard({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const { t } = useT();
    const safeValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#7367f0';

    return (
        <div className="vuexy-card flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
                <p className="text-sm font-medium">{t('text_color')}</p>
                <p className="text-xs text-muted-foreground">{t('text_color_hint')}</p>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={safeValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-md border bg-transparent p-1"
                    aria-label={t('text_color')}
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#7367f0"
                    className="vuexy-input w-28"
                    dir="ltr"
                    maxLength={7}
                />
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                    >
                        {t('clear')}
                    </button>
                )}
            </div>
        </div>
    );
}

// ============== Step 2: Description =================
function StepDescription({
    data,
    setData,
    errors,
}: {
    data: FormData;
    setData: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
    errors: Partial<Record<keyof FormData, string>>;
}) {
    const { t } = useT();
    return (
        <div className="vuexy-card space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('short_desc_ar')} error={errors.short_description_ar}>
                    <ColorTextEditor
                        value={data.short_description_ar}
                        onChange={(v) => setData('short_description_ar', v)}
                        dir="rtl"
                        maxLength={120}
                    />
                </Field>
                <Field label={t('short_desc_en')} error={errors.short_description_en}>
                    <ColorTextEditor
                        value={data.short_description_en}
                        onChange={(v) => setData('short_description_en', v)}
                        maxLength={120}
                    />
                </Field>
            </div>

            <Field label={t('long_desc_ar')} error={errors.description_ar}>
                <RichTextEditor
                    value={data.description_ar}
                    onChange={(v) => setData('description_ar', v)}
                    placeholder={t('long_desc_hint_ar')}
                    dir="rtl"
                />
            </Field>

            <Field label={t('long_desc_en')} error={errors.description_en}>
                <RichTextEditor
                    value={data.description_en}
                    onChange={(v) => setData('description_en', v)}
                    placeholder={t('long_desc_hint_en')}
                />
            </Field>

            <Field label={t('internal_notes')} error={errors.internal_notes}>
                <RichTextarea
                    value={data.internal_notes}
                    onChange={(v) => setData('internal_notes', v)}
                    placeholder={t('internal_notes_hint')}
                    rows={2}
                />
            </Field>
        </div>
    );
}

// ============== Step 3: Features =================
function StepFeatures({
    data,
    isSelected,
    onToggle,
    customFeature,
    setCustomFeature,
    onAddCustom,
    onRemove,
    onMove,
}: {
    data: FormData;
    isSelected: (key: string) => boolean;
    onToggle: (feat: FeatureItem) => void;
    customFeature: { label_ar: string; label_en: string; icon: string };
    setCustomFeature: (v: { label_ar: string; label_en: string; icon: string }) => void;
    onAddCustom: () => void;
    onRemove: (key: string) => void;
    onMove: (from: number, to: number) => void;
}) {
    const { t, isArabic } = useT();

    return (
        <div className="space-y-6">
            <div className="vuexy-card p-6">
                <h2 className="mb-4 text-sm font-semibold text-muted-foreground">{t('available_features')}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {PRESET_FEATURES.map((feat) => {
                        const active = isSelected(feat.key);
                        const Fa = FEATURE_FA_ICONS[feat.key];
                        return (
                            <button
                                key={feat.key}
                                type="button"
                                onClick={() => onToggle(feat)}
                                className={`flex items-center justify-between gap-2 rounded-lg border p-3 text-sm transition ${
                                    active
                                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20'
                                        : 'hover:bg-muted'
                                }`}
                            >
                                <span>{isArabic ? feat.label_ar : feat.label_en}</span>
                                {Fa ? <Fa className="h-4 w-4" /> : <span className="text-lg">{feat.icon}</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="vuexy-card p-6">
                <h2 className="mb-4 text-sm font-semibold text-muted-foreground">{t('add_custom_feature')}</h2>
                <div className="space-y-3">
                    <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">{t('choose_icon')}</p>
                        <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
                            {SERVICE_FEATURE_ICON_OPTIONS.map((opt) => {
                                const Icon = opt.Icon;
                                const active = customFeature.icon === opt.key;
                                return (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        title={isArabic ? opt.label_ar : opt.label_en}
                                        onClick={() => setCustomFeature({ ...customFeature, icon: opt.key })}
                                        className={`flex h-10 w-full items-center justify-center rounded-md border transition ${
                                            active ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20' : 'hover:bg-muted'
                                        }`}
                                        aria-label={isArabic ? opt.label_ar : opt.label_en}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                        <input
                            type="text"
                            value={customFeature.label_ar}
                            onChange={(e) => setCustomFeature({ ...customFeature, label_ar: e.target.value })}
                            placeholder={t('name_in_arabic')}
                            className="vuexy-input flex-1"
                            dir="rtl"
                        />
                        <input
                            type="text"
                            value={customFeature.label_en}
                            onChange={(e) => setCustomFeature({ ...customFeature, label_en: e.target.value })}
                            placeholder={t('name_in_english')}
                            className="vuexy-input flex-1"
                        />
                        <button
                            type="button"
                            onClick={onAddCustom}
                            className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            <Plus className="h-4 w-4" />
                            {t('add')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="vuexy-card p-6">
                <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
                    {t('selected_features')} ({data.features.length}) — {t('drag_to_reorder')}
                </h2>
                {data.features.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">{t('no_features_yet')}</p>
                ) : (
                    <div className="space-y-2">
                        {data.features.map((feat, idx) => {
                            const Fa = FEATURE_FA_ICONS[feat.key] ?? FEATURE_FA_ICONS[feat.icon ?? ''];
                            return (
                            <div key={feat.key} className="flex items-center gap-2 rounded-md border p-2">
                                <div className="flex flex-col gap-0.5">
                                    <button
                                        type="button"
                                        onClick={() => onMove(idx, idx - 1)}
                                        disabled={idx === 0}
                                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                        aria-label="Move up"
                                    >
                                        <GripVertical className="h-3 w-3 rotate-90" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onMove(idx, idx + 1)}
                                        disabled={idx === data.features.length - 1}
                                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                        aria-label="Move down"
                                    >
                                        <GripVertical className="h-3 w-3 -rotate-90" />
                                    </button>
                                </div>
                                {Fa ? <Fa className="h-4 w-4" /> : <span className="text-lg">{feat.icon}</span>}
                                <span className="flex-1 text-sm">{isArabic ? feat.label_ar : feat.label_en}</span>
                                <button
                                    type="button"
                                    onClick={() => onRemove(feat.key)}
                                    className="text-red-500 hover:text-red-700"
                                    aria-label="Remove"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============== Step 4: Images =================
function StepImages({
    existingImages,
    storageUrl,
    onDeleteExisting,
    featuredPreview,
    imagePreviews,
    onFeaturedChange,
    onExtraChange,
    onRemoveExtra,
    disabled,
}: {
    existingImages: ExistingImage[];
    storageUrl: (path: string | null | undefined) => string | null;
    onDeleteExisting: (image: ExistingImage) => void;
    featuredPreview: string | null;
    imagePreviews: string[];
    onFeaturedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onExtraChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveExtra: (i: number) => void;
    disabled: boolean;
}) {
    const { t } = useT();
    const totalExtra = existingImages.length + imagePreviews.length;

    return (
        <div className="space-y-6">
            <div className="vuexy-card p-6">
                <div className="mb-3 flex items-baseline justify-between">
                    <h2 className="text-base font-semibold">{t('main_image')}</h2>
                    <span className="text-xs text-muted-foreground">{t('recommended_resolution')}: 1200×800 px</span>
                </div>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition hover:bg-muted">
                    {featuredPreview ? (
                        <img src={featuredPreview} alt="" className="max-h-48 rounded-md object-cover" />
                    ) : (
                        <>
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm text-foreground">{t('click_to_upload_main')}</span>
                            <span className="text-xs text-muted-foreground">{t('recommended_formats')}</span>
                        </>
                    )}
                    <input type="file" accept="image/*" onChange={onFeaturedChange} className="hidden" />
                </label>
            </div>

            <div className="vuexy-card p-6">
                <div className="mb-3 flex items-baseline justify-between">
                    <h2 className="text-base font-semibold">{t('extra_images')}</h2>
                    <span className="text-xs text-muted-foreground">{totalExtra} / 6</span>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {existingImages.map((img) => (
                        <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border">
                            <img src={storageUrl(img.image_path) ?? ''} alt="" className="h-full w-full object-cover" />
                            <button
                                type="button"
                                onClick={() => onDeleteExisting(img)}
                                className="absolute end-1 top-1 rounded-full bg-red-500/90 p-1 text-white opacity-0 transition group-hover:opacity-100"
                                aria-label="Delete"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    {imagePreviews.map((src, i) => (
                        <div key={`new-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border">
                            <img src={src} alt="" className="h-full w-full object-cover" />
                            <button
                                type="button"
                                onClick={() => onRemoveExtra(i)}
                                className="absolute end-1 top-1 rounded-full bg-red-500/90 p-1 text-white opacity-0 transition group-hover:opacity-100"
                                aria-label="Remove"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    {!disabled && (
                        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground transition hover:bg-muted">
                            <ImageIcon className="h-5 w-5" />
                            <span className="text-xs">{t('add')}</span>
                            <input type="file" accept="image/*" multiple onChange={onExtraChange} className="hidden" />
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============== Bits =================
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

// Picker for the "custom" service type. Renders the five billing options
// and reveals the matching conditional fields underneath.
function BillingMethodCard({
    method,
    hours,
    minutes,
    from,
    to,
    onMethodChange,
    onHoursChange,
    onMinutesChange,
    onFromChange,
    onToChange,
}: {
    method: string;
    hours: string;
    minutes: string;
    from: string;
    to: string;
    onMethodChange: (v: string) => void;
    onHoursChange: (v: string) => void;
    onMinutesChange: (v: string) => void;
    onFromChange: (v: string) => void;
    onToChange: (v: string) => void;
}) {
    const { t } = useT();
    return (
        <div className="vuexy-card space-y-4 p-6">
            <div>
                <h2 className="text-base font-semibold">{t('billing_method_label')}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{t('billing_method_hint')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {BILLING_METHODS.map(({ key, labelKey, icon: Icon }) => {
                    const active = method === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onMethodChange(key)}
                            className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border p-3 text-xs transition ${
                                active ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20' : 'hover:bg-muted'
                            }`}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-center">{t(labelKey)}</span>
                        </button>
                    );
                })}
            </div>

            {method === 'per_hour' && (
                <Field label={t('hours_count')}>
                    <input
                        type="number"
                        value={hours}
                        onChange={(e) => onHoursChange(e.target.value)}
                        className="vuexy-input"
                        min="0"
                        placeholder="1"
                    />
                </Field>
            )}

            {method === 'per_minute' && (
                <Field label={t('duration_minutes_label')}>
                    <input
                        type="number"
                        value={minutes}
                        onChange={(e) => onMinutesChange(e.target.value)}
                        className="vuexy-input"
                        min="0"
                        placeholder="30"
                    />
                </Field>
            )}

            {method === 'time_window' && (
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('from_time')}>
                        <input
                            type="time"
                            value={from}
                            onChange={(e) => onFromChange(e.target.value)}
                            className="vuexy-input"
                            dir="ltr"
                        />
                    </Field>
                    <Field label={t('to_time')}>
                        <input
                            type="time"
                            value={to}
                            onChange={(e) => onToChange(e.target.value)}
                            className="vuexy-input"
                            dir="ltr"
                        />
                    </Field>
                </div>
            )}
        </div>
    );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                checked ? 'bg-primary' : 'bg-muted'
            }`}
            role="switch"
            aria-checked={checked}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0.5 rtl:-translate-x-0.5'
                }`}
            />
        </button>
    );
}
