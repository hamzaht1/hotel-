import { useT } from '@/hooks/use-translations';
import { useStorageUrl } from '@/lib/storage';
import { useForm } from '@inertiajs/react';
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
import { ROOM_AMENITY_ICONS, ROOM_AMENITY_ICON_OPTIONS } from '@/lib/room-amenity-icons';
import { useMemo, useState } from 'react';

export interface ExistingImage {
    id: number;
    path: string;
}

export interface AmenityItem {
    key: string;
    label_ar: string;
    label_en: string;
    icon: string | null;
}

export interface RoomInitial {
    id?: number;
    name_ar?: string;
    name_en?: string;
    capacity?: number | string | null;
    price?: string | number;
    description_ar?: string | null;
    description_en?: string | null;
    short_description_ar?: string | null;
    short_description_en?: string | null;
    internal_notes?: string | null;
    amenities?: AmenityItem[] | null;
    is_featured?: boolean;
    is_active?: boolean;
    booking_channel?: 'whatsapp' | 'email' | null;
    whatsapp_number?: string | null;
    booking_email?: string | null;
    whatsapp_message_ar?: string | null;
    whatsapp_message_en?: string | null;
    featured_image?: string | null;
    text_color?: string | null;
    images?: ExistingImage[];
}

interface Props {
    mode: 'create' | 'edit';
    initial?: RoomInitial;
    submitUrl: string;
    cancelUrl: string;
}

// The preset toggles shown under "Available Features". Icons are rendered from
// the shared ROOM_AMENITY_ICONS catalogue (same source the public site uses).
const PRESET_AMENITIES: { key: string; label_ar: string; label_en: string }[] = [
    { key: 'wifi',             label_ar: 'واي فاي',         label_en: 'WiFi' },
    { key: 'tv',               label_ar: 'تلفاز',           label_en: 'TV' },
    { key: 'air_conditioning', label_ar: 'تكييف',           label_en: 'Air Conditioning' },
    { key: 'minibar',          label_ar: 'ميني بار',         label_en: 'Mini Bar' },
    { key: 'safe',             label_ar: 'خزنة',            label_en: 'Safe' },
    { key: 'balcony',          label_ar: 'شرفة',            label_en: 'Balcony' },
    { key: 'sea_view',         label_ar: 'إطلالة بحرية',     label_en: 'Sea View' },
    { key: 'room_service',     label_ar: 'خدمة الغرف',      label_en: 'Room Service' },
    { key: 'jacuzzi',          label_ar: 'جاكوزي',          label_en: 'Jacuzzi' },
    { key: 'kitchen',          label_ar: 'مطبخ',            label_en: 'Kitchen' },
];

// Lookup of icon by amenity key — used to render selected items (which only
// carry the key). Shared with the public Madina Rooms template.
const AMENITY_FA_ICONS = ROOM_AMENITY_ICONS;

type FormData = {
    _method?: string;
    name_ar: string;
    name_en: string;
    capacity: string;
    price: string;
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
    amenities: AmenityItem[];
    featured_image: File | null;
    images: File[];
    delete_images: number[];
};

export default function RoomForm({ mode, initial = {}, submitUrl, cancelUrl }: Props) {
    const { t, isArabic } = useT();
    const storageUrl = useStorageUrl();
    const dir = isArabic ? 'rtl' : 'ltr';

    const { data, setData, post, processing, errors } = useForm<FormData>({
        ...(mode === 'edit' ? { _method: 'PUT' } : {}),
        name_ar: initial.name_ar ?? '',
        name_en: initial.name_en ?? '',
        capacity: initial.capacity != null ? String(initial.capacity) : '2',
        price: initial.price != null ? String(initial.price) : '',
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
        amenities: initial.amenities ?? [],
        featured_image: null,
        images: [],
        delete_images: [],
    });
    const [customAmenity, setCustomAmenity] = useState({ label_ar: '', label_en: '', icon: 'wifi' });

    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [featuredPreview, setFeaturedPreview] = useState<string | null>(storageUrl(initial.featured_image ?? null));
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [imageAlert, setImageAlert] = useState<string | null>(null);

    const steps = useMemo(
        () => [
            { num: 1, label: t('step_basic_info') },
            { num: 2, label: t('step_description') },
            { num: 3, label: t('amenities') },
            { num: 4, label: t('step_images') },
        ],
        [t],
    );

    const isAmenitySelected = (key: string) => data.amenities.some((a) => a.key === key);

    function togglePresetAmenity(preset: { key: string; label_ar: string; label_en: string }) {
        setData(
            'amenities',
            isAmenitySelected(preset.key)
                ? data.amenities.filter((a) => a.key !== preset.key)
                : [...data.amenities, { key: preset.key, label_ar: preset.label_ar, label_en: preset.label_en, icon: preset.key }],
        );
    }

    function addCustomAmenity() {
        if (!customAmenity.label_ar.trim() || !customAmenity.label_en.trim()) return;
        setData('amenities', [...data.amenities, { key: `custom_${Date.now()}`, ...customAmenity }]);
        setCustomAmenity({ label_ar: '', label_en: '', icon: 'wifi' });
    }

    function removeAmenity(key: string) {
        setData('amenities', data.amenities.filter((a) => a.key !== key));
    }

    function moveAmenity(from: number, to: number) {
        if (to < 0 || to >= data.amenities.length) return;
        const next = [...data.amenities];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        setData('amenities', next);
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
        if (!valid.length) return;
        setData('images', [...data.images, ...valid]);
        setImagePreviews([...imagePreviews, ...valid.map((f) => URL.createObjectURL(f))]);
    }

    function removeExtraImage(i: number) {
        setData('images', data.images.filter((_, idx) => idx !== i));
        setImagePreviews(imagePreviews.filter((_, idx) => idx !== i));
    }

    function deleteExistingImage(id: number) {
        setData('delete_images', [...data.delete_images, id]);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(submitUrl, { forceFormData: true });
    }

    const existingImages = (initial.images ?? []).filter((img) => !data.delete_images.includes(img.id));

    return (
        <div className="mx-auto max-w-5xl p-4 sm:p-6" dir={dir}>
            <AlertModal open={!!imageAlert} message={imageAlert} onClose={() => setImageAlert(null)} />
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{mode === 'create' ? t('create_room') : t('edit_room')}</h1>
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
                {step === 1 && <StepBasic data={data} setData={setData} errors={errors} />}
                {step === 2 && <StepDescription data={data} setData={setData} errors={errors} />}
                {step === 3 && (
                    <StepAmenities
                        data={data}
                        isSelected={isAmenitySelected}
                        onToggle={togglePresetAmenity}
                        customAmenity={customAmenity}
                        setCustomAmenity={setCustomAmenity}
                        onAddCustom={addCustomAmenity}
                        onRemove={removeAmenity}
                        onMove={moveAmenity}
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
                            {processing ? t('saving') : mode === 'create' ? t('create_room') : t('save_changes')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

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

function StepBasic({
    data,
    setData,
    errors,
}: {
    data: FormData;
    setData: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
    errors: Partial<Record<keyof FormData, string>>;
}) {
    const { t, isArabic } = useT();

    return (
        <div className="space-y-6">
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
                    <Field label={t('capacity')} error={errors.capacity}>
                        <input
                            type="number"
                            value={data.capacity}
                            onChange={(e) => setData('capacity', e.target.value)}
                            className="vuexy-input"
                            min="1"
                            required
                        />
                    </Field>
                    <Field label={t('price_per_night')} error={errors.price}>
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
                </div>
            </div>

            <div className="vuexy-card p-6">
                <h2 className="mb-4 text-base font-semibold">{t('booking_data')}</h2>
                <div className="mb-4 inline-flex rounded-lg border p-1">
                    {(['whatsapp', 'email'] as const).map((ch) => (
                        <button
                            key={ch}
                            type="button"
                            onClick={() => setData('booking_channel', ch)}
                            className={`rounded-md px-4 py-1.5 text-sm transition ${
                                data.booking_channel === ch ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
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

function StepAmenities({
    data,
    isSelected,
    onToggle,
    customAmenity,
    setCustomAmenity,
    onAddCustom,
    onRemove,
    onMove,
}: {
    data: FormData;
    isSelected: (key: string) => boolean;
    onToggle: (preset: { key: string; label_ar: string; label_en: string }) => void;
    customAmenity: { label_ar: string; label_en: string; icon: string };
    setCustomAmenity: (v: { label_ar: string; label_en: string; icon: string }) => void;
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
                    {PRESET_AMENITIES.map((preset) => {
                        const active = isSelected(preset.key);
                        const Fa = AMENITY_FA_ICONS[preset.key];
                        return (
                            <button
                                key={preset.key}
                                type="button"
                                onClick={() => onToggle(preset)}
                                className={`flex items-center justify-between gap-2 rounded-lg border p-3 text-sm transition ${
                                    active ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20' : 'hover:bg-muted'
                                }`}
                            >
                                <span>{isArabic ? preset.label_ar : preset.label_en}</span>
                                <Fa className="h-4 w-4" />
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
                            {ROOM_AMENITY_ICON_OPTIONS.map((opt) => {
                                const Icon = opt.Icon;
                                const active = customAmenity.icon === opt.key;
                                return (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        title={isArabic ? opt.label_ar : opt.label_en}
                                        onClick={() => setCustomAmenity({ ...customAmenity, icon: opt.key })}
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
                            value={customAmenity.label_ar}
                            onChange={(e) => setCustomAmenity({ ...customAmenity, label_ar: e.target.value })}
                            placeholder={t('name_in_arabic')}
                            className="vuexy-input flex-1"
                            dir="rtl"
                        />
                        <input
                            type="text"
                            value={customAmenity.label_en}
                            onChange={(e) => setCustomAmenity({ ...customAmenity, label_en: e.target.value })}
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
                    {t('selected_features')} ({data.amenities.length}) — {t('drag_to_reorder')}
                </h2>
                {data.amenities.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">{t('no_features_yet')}</p>
                ) : (
                    <div className="space-y-2">
                        {data.amenities.map((item, idx) => {
                            const Fa = AMENITY_FA_ICONS[item.key] ?? AMENITY_FA_ICONS[item.icon ?? ''];
                            return (
                            <div key={item.key} className="flex items-center gap-2 rounded-md border p-2">
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
                                        disabled={idx === data.amenities.length - 1}
                                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                        aria-label="Move down"
                                    >
                                        <GripVertical className="h-3 w-3 -rotate-90" />
                                    </button>
                                </div>
                                {Fa ? <Fa className="h-4 w-4" /> : <span className="text-lg">{item.icon}</span>}
                                <span className="flex-1 text-sm">{isArabic ? item.label_ar : item.label_en}</span>
                                <button
                                    type="button"
                                    onClick={() => onRemove(item.key)}
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

function StepImages({
    existingImages,
    storageUrl,
    onDeleteExisting,
    featuredPreview,
    imagePreviews,
    onFeaturedChange,
    onExtraChange,
    onRemoveExtra,
}: {
    existingImages: ExistingImage[];
    storageUrl: (path: string | null | undefined) => string | null;
    onDeleteExisting: (id: number) => void;
    featuredPreview: string | null;
    imagePreviews: string[];
    onFeaturedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onExtraChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveExtra: (i: number) => void;
}) {
    const { t } = useT();
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
                <h2 className="mb-3 text-base font-semibold">{t('additional_images')}</h2>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {existingImages.map((img) => (
                        <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border">
                            <img src={storageUrl(img.path) ?? ''} alt="" className="h-full w-full object-cover" />
                            <button
                                type="button"
                                onClick={() => onDeleteExisting(img.id)}
                                className="absolute end-1 top-1 rounded-full bg-red-500/90 p-1 text-white opacity-0 transition group-hover:opacity-100"
                                aria-label="Delete"
                            >
                                <X className="h-3 w-3" />
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
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground transition hover:bg-muted">
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-xs">{t('add')}</span>
                        <input type="file" accept="image/*" multiple onChange={onExtraChange} className="hidden" />
                    </label>
                </div>
            </div>
        </div>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${checked ? 'bg-primary' : 'bg-muted'}`}
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
