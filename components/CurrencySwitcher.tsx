'use client'

import { useCurrency, type CurrencyCode } from '@/lib/currency-context'

const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: 'EGP', label: 'ج.م' },
  { code: 'SAR', label: 'ر.س' },
  { code: 'AED', label: 'د.إ' },
]

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency()

  return (
    <div
      style={{
        display:       'flex',
        alignItems:    'center',
        background:    'rgba(29,29,31,0.06)',
        borderRadius:  50,
        padding:       '2px',
        gap:           0,
        direction:     'ltr',
      }}
    >
      {CURRENCIES.map(({ code, label }) => {
        const active = currency === code
        return (
          <button
            key={code}
            id={`currency-${code.toLowerCase()}`}
            onClick={() => setCurrency(code)}
            style={{
              padding:      '0.3rem 0.65rem',
              borderRadius: 50,
              border:       'none',
              background:   active ? '#D4AF37' : 'transparent',
              color:        active ? '#fff'    : 'rgba(29,29,31,0.55)',
              fontWeight:   active ? 800      : 500,
              fontSize:     '0.72rem',
              cursor:       'pointer',
              transition:   'all 0.2s',
              fontFamily:   'inherit',
              letterSpacing: '0.03em',
              lineHeight:   1,
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
