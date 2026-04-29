// resources/js/pages/public/templates/Index.tsx
import React, { useMemo, useState } from "react";
import { router, Head } from "@inertiajs/react";
import PublicLayout from "@/layouts/public-layout";
import { ChevronDown, Eye, Clock } from "lucide-react";
import AnimatedHeading from '@/components/motion/AnimatedHeading'
import AnimatedParagraph from '@/components/motion/AnimatedParagraph'
import SetupBanner from "@/components/public/setup/SetupBanner";
import { useLang } from '@/hooks/useLang'
// Local fallback assets — used when a backend template has no preview_image uploaded yet.
import t1 from '@/assets/images/templates/template-1.webp'
import t2 from '@/assets/images/templates/template-2.webp'
import t3 from '@/assets/images/templates/template-3.webp'
import t4 from '@/assets/images/templates/template-4.webp'

interface BackendTemplate {
  id: number;
  key: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  preview_url: string | null;
  demo_url: string | null;
  regions: string[];
  is_coming_soon: boolean;
}

interface Props {
  templates: BackendTemplate[];
}

const FALLBACK_IMAGES = [t1, t2, t3, t4];

// Public page: Templates gallery — driven entirely from the backend Template model.
export default function Templates({ templates }: Props) {
  const { __ } = useLang();
  const isArabic = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

  const [active, setActive] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(9);
  const [preview, setPreview] = useState<BackendTemplate | null>(null);

  // Filter chips: "all" plus the union of regions across all backend templates.
  const filters = useMemo(() => {
    const regions = new Set<string>();
    templates.forEach((t) => t.regions.forEach((r) => regions.add(r)));
    return ['all', ...Array.from(regions).sort()];
  }, [templates]);

  const filtered = useMemo(() => {
    if (active === 'all') return templates;
    return templates.filter((t) => t.regions.includes(active));
  }, [active, templates]);

  const items = filtered.slice(0, visibleCount);
  const canShowMore = filtered.length > visibleCount;

  const previewImage = (t: BackendTemplate, idx: number) =>
    t.preview_url ?? FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];

  const titleOf = (t: BackendTemplate) => (isArabic ? t.name_ar : t.name_en) ?? t.key;

  return (
    <PublicLayout>
      <Head title="قوالب ضيافة | نماذج تصميم لمواقع الفنادق والشقق المفروشة">
        <meta name="description" content="استكشف مجموعتنا المتنوعة من قوالب تصميم مواقع الفنادق والشقق المفروشة. قوالب احترافية مصممة لتعزيز حضورك على الإنترنت وزيادة الحجوزات." />
        <meta name="keywords" content="قوالب فنادق, تصميم موقع فندق, قوالب شقق مفروشة, قوالب ويب للفنادق, تصميم مواقع سياحية" />
      </Head>

      <section className="p-6 mx-auto max-w-7xl">
        <SetupBanner />
        <div className="px-4 sm:px-6 lg:px-8 py-4 border rounded-2xl shadow">
          <AnimatedHeading dir="up" delay={0.30}>
            <h2 className="text-center text-public-primary text-2xl sm:text-4xl font-bold">
              {__("messages.section_titles.templates.page_title") || "القوالب"}
            </h2>
          </AnimatedHeading>

          <AnimatedParagraph dir="none" delay={0.70}>
            <p className="mt-3 text-center text-sm sm:text-base">
              {__("messages.templates_page.count_label") || "عدد القوالب المتاحة لدينا:"}
              <span className="ms-2 inline-flex items-center justify-center rounded-lg bg-public-sub-title px-3 py-0.5 text-sm font-bold text-white">
                {filtered.length}
              </span>
            </p>
          </AnimatedParagraph>

          {/* Region filters — derived from backend.regions[] */}
          {filters.length > 1 && (
            <div className="mt-6 overflow-x-auto">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {filters.map((label) => {
                  const isActive = active === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setActive(label);
                        setVisibleCount(9);
                      }}
                      aria-pressed={isActive}
                      className={[
                        "whitespace-nowrap rounded-full border font-semibold transition px-4 py-1.5 text-sm sm:text-base",
                        isActive
                          ? "bg-public-primary text-white border-public-primary "
                          : "text-public-primary border-public-primary hover:bg-public-primary/10 cursor-pointer",
                      ].join(" ")}
                    >
                      {__(`messages.templates_section.filters.${label}`) || label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Templates grid */}
          {items.length === 0 ? (
            <div className="mt-10 text-center text-muted-foreground py-12">
              {__("messages.templates_page.empty") || (isArabic ? 'لا توجد قوالب متاحة حالياً' : 'No templates available')}
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {items.map((item, idx) => {
                const title = titleOf(item);
                const src = previewImage(item, idx);
                return (
                  <article key={item.id} className="group relative flex flex-col items-center text-center">
                    <div className="relative w-full overflow-hidden rounded-xl shadow-md transition-colors duration-300">
                      <img
                        src={src}
                        alt={title}
                        className={`w-full h-auto object-cover transition-transform duration-300 ${item.is_coming_soon ? 'grayscale opacity-60' : 'group-hover:scale-[1.03]'}`}
                        loading="lazy"
                        decoding="async"
                      />

                      {item.is_coming_soon ? (
                        <div className="absolute inset-0 z-10 grid place-items-center bg-black/50">
                          <div className="flex flex-col items-center gap-3 text-white">
                            <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                              <Clock className="h-8 w-8" />
                            </div>
                            <span className="text-xl sm:text-2xl font-bold">قريبـــاً</span>
                            <span className="text-sm text-white/70">Coming Soon</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center opacity-0 transition-all duration-300 group-hover:opacity-100 bg-black/55">
                            <button
                              type="button"
                              onClick={() => setPreview(item)}
                              className="pointer-events-auto inline-flex flex-col items-center gap-2 text-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-md px-3 py-2"
                              aria-label={__("messages.templates_page.preview_aria") || "معاينة القالب"}
                            >
                              <Eye className="h-10 w-10" aria-hidden="true" />
                              <span className="text-base sm:text-lg tracking-wide">
                                {__("messages.common.preview") || "معاينة"}
                              </span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              router.visit(route('setup.plan', {
                                template_id: item.id,
                                template_key: item.key,
                                template_title: title,
                              }))
                            }
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-fit rounded-lg border-2 px-4 py-3 font-bold
                                      bg-[#C5C7FC] text-public-sub-title border-public-sub-title hover:opacity-90 duration-300
                                      focus:outline-none focus-visible:ring-2 focus-visible:ring-public-sub-title cursor-pointer"
                          >
                            {__("messages.templates_page.choose_this_template") || "اختيــــار هذا القـــالب"}
                          </button>
                        </>
                      )}
                    </div>

                    <h3 className={`mt-3 text-md sm:text-xl font-semibold ${item.is_coming_soon ? 'text-gray-400' : 'text-black'}`}>
                      {title}
                      {item.is_coming_soon && <span className="ms-2 text-xs text-gray-400">(قريباً)</span>}
                    </h3>
                  </article>
                );
              })}
            </div>
          )}

          {canShowMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount(filtered.length)}
                className="inline-flex items-center gap-2 rounded-full bg-public-primary px-5 py-2.5
                           font-semibold text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              >
                <span>{__("messages.common.show_more") || "رؤية المزيد"}</span>
                <ChevronDown className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </section>

      {preview && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={preview.preview_url ?? FALLBACK_IMAGES[0]}
              alt={titleOf(preview)}
              className="w-full h-auto rounded-xl"
            />
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute top-2 end-2 rounded-md bg-white/90 px-3 py-1 text-sm font-semibold text-black"
            >
              {__("messages.common.close") || "إغلاق"}
            </button>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
