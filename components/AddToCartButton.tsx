'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/lib/cart-context'

interface Props {
  product: {
    id:        string
    name:      string
    priceEGP:  number
    imageUrl?: string
    category?: string
  }
  large?: boolean
}

export default function AddToCartButton({ product, large }: Props) {
  const { dispatch } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    dispatch({
      type:    'ADD_ITEM',
      payload: {
        id:       product.id,
        name:     product.name,
        priceEGP: product.priceEGP,
        imageUrl: product.imageUrl,
        category: product.category,
      },
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
    window.dispatchEvent(new Event('openCart'))
  }

  return (
    <button
      id={`add-to-cart-${product.id}`}
      onClick={handleAdd}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '0.4rem',
        width:          '100%',
        padding:        large ? '1.2rem 2rem' : '0.6rem',
        background:     added ? 'rgba(34,197,94,0.1)' : 'rgba(212,175,55,0.1)',
        border:         added
          ? '1px solid rgba(34,197,94,0.3)'
          : '1px solid rgba(212,175,55,0.28)',
        borderRadius:   large ? 16 : 10,
        color:          added ? '#16a34a' : '#D4AF37',
        fontWeight:     800,
        fontSize:       large ? '1.1rem' : '0.82rem',
        cursor:         'pointer',
        fontFamily:     'inherit',
        transition:     'all 0.25s',
      }}
      onMouseEnter={(e) => {
        if (added) return
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = 'rgba(212,175,55,0.22)'
        el.style.boxShadow  = '0 4px 14px rgba(212,175,55,0.22)'
      }}
      onMouseLeave={(e) => {
        if (added) return
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = 'rgba(212,175,55,0.1)'
        el.style.boxShadow  = 'none'
      }}
    >
      {added
        ? <><Check size={14} strokeWidth={2.5} /> أُضيف للسلة</>
        : <><ShoppingCart size={14} strokeWidth={2} /> أضف للسلة</>
      }
    </button>
  )
}
