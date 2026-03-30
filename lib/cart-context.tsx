'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'

/* ─── Types ─────────────────────────────────────────────────── */
export interface CartItem {
  id:        string
  name:      string
  priceEGP:  number   // always in EGP (base currency)
  qty:       number
  imageUrl?: string
  category?: string
}

interface CartState {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD_ITEM';    payload: Omit<CartItem, 'qty'> }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'SET_QTY';     payload: { id: string; qty: number } }
  | { type: 'CLEAR' }

interface CartContextValue {
  items:      CartItem[]
  itemCount:  number
  subtotalEGP: number
  dispatch:   (action: CartAction) => void
}

/* ─── Reducer ───────────────────────────────────────────────── */
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.findIndex((i) => i.id === action.payload.id)
      if (existing >= 0) {
        const updated = [...state.items]
        updated[existing] = { ...updated[existing], qty: updated[existing].qty + 1 }
        return { items: updated }
      }
      return { items: [...state.items, { ...action.payload, qty: 1 }] }
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter((i) => i.id !== action.payload.id) }
    case 'SET_QTY': {
      if (action.payload.qty <= 0) {
        return { items: state.items.filter((i) => i.id !== action.payload.id) }
      }
      return {
        items: state.items.map((i) =>
          i.id === action.payload.id ? { ...i, qty: action.payload.qty } : i
        ),
      }
    }
    case 'CLEAR':
      return { items: [] }
    default:
      return state
  }
}

/* ─── Context ───────────────────────────────────────────────── */
const CartContext = createContext<CartContextValue | null>(null)
const LS_KEY = 'nexa_cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((item) => dispatch({ type: 'ADD_ITEM', payload: item }))
        }
      }
    } catch { /* ignore parse errors */ }
  }, [])

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state.items))
    } catch { /* quota exceeded etc */ }
  }, [state.items])

  const itemCount   = state.items.reduce((s, i) => s + i.qty, 0)
  const subtotalEGP = state.items.reduce((s, i) => s + i.priceEGP * i.qty, 0)

  return (
    <CartContext.Provider value={{ items: state.items, itemCount, subtotalEGP, dispatch }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
