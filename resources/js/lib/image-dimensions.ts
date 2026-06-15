// Dimensions used for room / service images on the public site. Uploaded
// images must follow the same 16:9 ratio (the popup uses aspect-video and the
// cards crop with object-cover) and be at least this resolution to stay sharp.
export const IDEAL_IMAGE = { width: 1280, height: 720 };

const TARGET_RATIO = IDEAL_IMAGE.width / IDEAL_IMAGE.height; // 16:9
const RATIO_TOLERANCE = 0.08; // ±8% on the ratio

/**
 * Validate an uploaded image against the public-site dimensions. Resolves with
 * a localised error message when the image must be rejected (wrong ratio or too
 * small), or null when it is acceptable. Larger 16:9 images are accepted (they
 * downscale cleanly).
 */
export function validateImageDimensions(file: File): Promise<string | null> {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
            resolve(null);
            return;
        }
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            URL.revokeObjectURL(url);

            const isArabic = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
            const ideal = isArabic
                ? `الأبعاد المثالية: ${IDEAL_IMAGE.width} × ${IDEAL_IMAGE.height} بكسل (نسبة 16:9).`
                : `Ideal dimensions: ${IDEAL_IMAGE.width} × ${IDEAL_IMAGE.height} px (16:9).`;

            if (!w || !h) {
                resolve(null);
                return;
            }

            const ratio = w / h;
            if (Math.abs(ratio - TARGET_RATIO) / TARGET_RATIO > RATIO_TOLERANCE) {
                resolve(
                    (isArabic
                        ? `نسبة أبعاد الصورة غير مناسبة (${w}×${h}). يجب أن تكون 16:9. `
                        : `Image aspect ratio must be 16:9 (got ${w}×${h}). `) + ideal,
                );
                return;
            }

            if (w < IDEAL_IMAGE.width || h < IDEAL_IMAGE.height) {
                resolve(
                    (isArabic
                        ? `الصورة صغيرة جداً (${w}×${h}). `
                        : `Image is too small (${w}×${h}). `) + ideal,
                );
                return;
            }

            resolve(null);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };
        img.src = url;
    });
}
