import { useMemo } from 'react'
import { usePage } from '@inertiajs/react'

/**
 * Hook that returns a function building public-storage URLs that work whether
 * the backend uses a local disk (`/storage/...`) or an S3/R2 disk
 * (`https://pub-xxx.r2.dev/...`). The base comes from the Inertia-shared
 * `storageBaseUrl` prop, which the backend resolves from
 * `config('filesystems.disks.public.url')`.
 *
 * The returned function is memoised, so it's safe to use as a `useMemo`
 * dependency without triggering extra re-renders.
 */
export function useStorageUrl(): (path: string | null | undefined) => string | null {
    const props = usePage<{ storageBaseUrl?: string }>().props
    const base = (props.storageBaseUrl ?? '/storage').replace(/\/+$/, '')

    return useMemo(() => (path: string | null | undefined) => buildUrl(base, path), [base])
}

/**
 * Pure helper for callers outside the React render tree. Pass the base URL
 * explicitly (e.g. `props.storageBaseUrl`).
 */
export function storageUrlWithBase(baseUrl: string | null | undefined, path: string | null | undefined): string | null {
    const base = (baseUrl ?? '/storage').replace(/\/+$/, '')
    return buildUrl(base, path)
}

function buildUrl(base: string, path: string | null | undefined): string | null {
    if (!path) return null
    if (/^https?:\/\//i.test(path)) return path
    return `${base}/${path.replace(/^\/+/, '')}`
}
