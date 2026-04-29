import { useMemo } from 'react'
import { usePage } from '@inertiajs/react'

/**
 * Hook that returns a function building public-storage URLs that work whether
 * the backend uses a local disk or an S3/R2 disk. The base comes from the
 * Inertia-shared `storageBaseUrl` prop, set in HandleInertiaRequests.
 */
export function useStorageUrl(): (path: string | null | undefined) => string | null {
    const props = usePage<{ storageBaseUrl?: string }>().props
    const base = (props.storageBaseUrl ?? '/storage').replace(/\/+$/, '')

    return useMemo(() => (path: string | null | undefined) => buildUrl(base, path), [base])
}

export function storageUrlWithBase(baseUrl: string | null | undefined, path: string | null | undefined): string | null {
    const base = (baseUrl ?? '/storage').replace(/\/+$/, '')
    return buildUrl(base, path)
}

function buildUrl(base: string, path: string | null | undefined): string | null {
    if (!path) return null
    if (/^https?:\/\//i.test(path)) return path
    return `${base}/${path.replace(/^\/+/, '')}`
}
