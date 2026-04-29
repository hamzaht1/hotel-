type SiteTextRow = { value_ar?: string | null; value_en?: string | null }

type SiteTextsMap = Record<string, Record<string, SiteTextRow>> | undefined | null

export function pickSiteText(
  texts: SiteTextsMap,
  section: string,
  key: string,
  fallback: string,
  isArabic: boolean,
): string {
  const row = texts?.[section]?.[key]
  if (!row) return fallback
  const primary = isArabic ? row.value_ar : row.value_en
  if (primary && primary.trim() !== '') return primary
  const secondary = isArabic ? row.value_en : row.value_ar
  if (secondary && secondary.trim() !== '') return secondary
  return fallback
}
