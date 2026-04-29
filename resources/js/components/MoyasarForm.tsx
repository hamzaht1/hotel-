import { useEffect, useRef, useState } from 'react'

declare global {
    interface Window {
        Moyasar?: {
            init: (config: Record<string, unknown>) => void
        }
    }
}

const MOYASAR_JS_URL = 'https://cdn.moyasar.com/mpf/1.15.0/moyasar.js'
const MOYASAR_CSS_URL = 'https://cdn.moyasar.com/mpf/1.15.0/moyasar.css'

interface Props {
    /** Amount in major currency units (e.g. SAR). The component converts to halalas. */
    amount: number
    description: string
    publishableKey: string | null
    callbackUrl: string
    /** Optional list of Moyasar payment methods. Defaults to creditcard. */
    methods?: ('creditcard' | 'applepay' | 'stcpay')[]
    metadata?: Record<string, string | number | null | undefined>
    currency?: string
}

/**
 * Embeds Moyasar's hosted card form directly on the page. The customer enters
 * card details here; Moyasar tokenises client-side and processes the payment,
 * then redirects to `callbackUrl` with `id` and `status` query parameters.
 */
export default function MoyasarForm({
    amount,
    description,
    publishableKey,
    callbackUrl,
    methods = ['creditcard'],
    metadata = {},
    currency = 'SAR',
}: Props) {
    const formRef = useRef<HTMLFormElement | null>(null)
    const [scriptLoaded, setScriptLoaded] = useState(false)
    const [scriptError, setScriptError] = useState<string | null>(null)

    // Load CSS + JS once per session.
    useEffect(() => {
        if (!publishableKey) return

        if (!document.querySelector(`link[href="${MOYASAR_CSS_URL}"]`)) {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = MOYASAR_CSS_URL
            document.head.appendChild(link)
        }

        if (window.Moyasar) {
            setScriptLoaded(true)
            return
        }

        const existing = document.querySelector<HTMLScriptElement>(`script[src="${MOYASAR_JS_URL}"]`)
        if (existing) {
            existing.addEventListener('load', () => setScriptLoaded(true), { once: true })
            existing.addEventListener('error', () => setScriptError('Failed to load Moyasar SDK'), { once: true })
            return
        }

        const script = document.createElement('script')
        script.src = MOYASAR_JS_URL
        script.async = true
        script.onload = () => setScriptLoaded(true)
        script.onerror = () => setScriptError('Failed to load Moyasar SDK')
        document.body.appendChild(script)
    }, [publishableKey])

    // Re-init the form whenever the amount/description/key changes.
    useEffect(() => {
        if (!scriptLoaded || !window.Moyasar || !publishableKey || !formRef.current) return

        // Halalas — Moyasar's smallest unit for SAR.
        const amountMinor = Math.round(amount * 100)

        // Reset the form node so re-init mounts cleanly.
        formRef.current.innerHTML = ''

        window.Moyasar.init({
            element: formRef.current,
            amount: amountMinor,
            currency,
            description,
            publishable_api_key: publishableKey,
            callback_url: callbackUrl,
            methods,
            metadata,
        })
    }, [scriptLoaded, publishableKey, amount, description, callbackUrl, currency, JSON.stringify(metadata), methods.join(',')])

    if (!publishableKey) {
        return (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                Moyasar publishable key is not configured. Set <code className="font-mono">MOYASAR_PUBLISHABLE_KEY</code> in <code className="font-mono">.env</code>.
            </div>
        )
    }

    if (scriptError) {
        return (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {scriptError}
            </div>
        )
    }

    return (
        <div className="moyasar-form-wrapper">
            {!scriptLoaded && (
                <div className="rounded-xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                    Loading payment form…
                </div>
            )}
            <form ref={formRef} className="mysr-form" />
        </div>
    )
}
