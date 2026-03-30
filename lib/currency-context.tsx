'use client'

import {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react'

/* ─── Types ─────────────────────────────────────────────────── */
export type CurrencyCode = 'EGP' | 'SAR' | 'AED'

/** 1 SAR = fxRates.SAR EGP, 1 AED = fxRates.AED EGP, EGP is always 1 */
type FxRates = Record<CurrencyCode, number>

interface CurrencyContextValue {
  currency:    CurrencyCode
  setCurrency: (c: CurrencyCode) => void
  rates:       FxRates
  /** Convert a price in EGP to the active display currency */
  convert:     (egpPrice: number) => number
  /** Format a converted price with symbol */
  format:      (egpPrice: number) => string
}

const SYMBOLS: Record<CurrencyCode, string> = { EGP: 'ج.م', SAR: 'ر.س', AED: 'د.إ' }
const DEFAULT_RATES: FxRates = { EGP: 1, SAR: 13, AED: 14 }
const LS_KEY = 'nexa_currency'

/* ─── Context ───────────────────────────────────────────────── */
const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('EGP')
  const [rates,    setRates]         = useState<FxRates>(DEFAULT_RATES)

  // Restore last chosen currency from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY) as CurrencyCode | null
      if (saved && ['EGP', 'SAR', 'AED'].includes(saved)) setCurrencyState(saved)
    } catch { /* SSR */ }
  }, [])

  // Fetch FX rates from store settings (so admin-configured rates take effect)
  useEffect(() => {
    fetch('/api/store-settings/public')
      .then((r) => r.json())
      .then((d: { fxRates?: FxRates }) => {
        if (d.fxRates) setRates(d.fxRates)
      })
      .catch(() => { /* use defaults */ })
  }, [])

  function setCurrency(c: CurrencyCode) {
    setCurrencyState(c)
    try { localStorage.setItem(LS_KEY, c) } catch { /* quota */ }
  }

  /** EGP → display currency:  price / rate  (1 SAR = 13 EGP → price/13) */
  const convert = useCallback(
    (egpPrice: number) => {
      const rate = rates[currency] ?? 1
      return currency === 'EGP' ? egpPrice : egpPrice / rate
    },
    [currency, rates]
  )

  const format = useCallback(
    (egpPrice: number) => {
      const val = convert(egpPrice)
      return `${val.toLocaleString('ar-EG', { maximumFractionDigits: 0 })} ${SYMBOLS[currency]}`
    },
    [convert, currency]
  )

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider')
  return ctx
}

export { SYMBOLS }
