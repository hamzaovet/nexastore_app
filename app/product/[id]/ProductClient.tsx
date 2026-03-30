'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Box, Tag, Layers } from 'lucide-react'
import { useCurrency } from '@/lib/currency-context'
import AddToCartButton from '@/components/AddToCartButton'

export default function ProductClient({ product }: { product: any }) {
  const { format } = useCurrency()

  const safeImage = product.imageUrl || 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=2670&auto=format&fit=crop'
  const isOutOfStock = product.stock <= 0

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8FA', direction: 'rtl', paddingBottom: '4rem' }}>
      
      {/* ── Breadcrumb ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(29,29,31,0.06)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '1.25rem 1.5rem' }}>
          <Link href="/#products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(29,29,31,0.5)', textDecoration: 'none', transition: 'color 0.2s' }}>
            <ChevronLeft size={16} /> العودة للرئيسية
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '2rem auto', padding: '0 1.5rem', display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', alignItems: 'start' }} className="product-layout">
        
        {/* ── Left: Image Gallery (Visual Right in RTL) ── */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(29,29,31,0.04)', minHeight: 400 }}>
          {/* Badge */}
          {product.badge && (
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', padding: '0.45rem 1.1rem', borderRadius: 50, fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.05em', zIndex: 10 }}>
              {product.badge}
            </div>
          )}
          <div style={{ position: 'relative', width: '100%', height: 400 }}>
            <Image src={safeImage} alt={product.name} fill style={{ objectFit: 'contain' }} priority />
          </div>
        </div>

        {/* ── Right: Product Details (Visual Left in RTL) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(29,29,31,0.05)', padding: '0.35rem 0.85rem', borderRadius: 50, fontSize: '0.76rem', fontWeight: 700, color: 'rgba(29,29,31,0.6)', marginBottom: '1rem' }}>
              <Layers size={14} /> {product.category}
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1D1D1F', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              {product.name}
            </h1>
          </div>

          {/* Pricing */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#D4AF37', lineHeight: 1 }}>
              {format(product.price)}
            </span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(29,29,31,0.08)', margin: '0.5rem 0' }} />

          {/* Specs & Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {product.specs && (
              <div style={{ display: 'flex', gap: '0.75rem', background: '#fff', padding: '1.25rem', borderRadius: 16, border: '1px solid rgba(29,29,31,0.06)' }}>
                <Tag size={18} color="rgba(29,29,31,0.4)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(29,29,31,0.5)', marginBottom: '0.2rem' }}>المواصفات التقنية</p>
                  <p style={{ fontSize: '0.9rem', color: '#1D1D1F', lineHeight: 1.6, fontWeight: 600 }}>{product.specs}</p>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '0.75rem', background: '#fff', padding: '1.25rem', borderRadius: 16, border: '1px solid rgba(29,29,31,0.06)' }}>
              <Box size={18} color="rgba(29,29,31,0.4)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(29,29,31,0.5)', marginBottom: '0.2rem' }}>حالة المخزون</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOutOfStock ? '#ef4444' : '#10b981' }} />
                  <p style={{ fontSize: '0.9rem', color: '#1D1D1F', fontWeight: 700 }}>
                    {isOutOfStock ? 'نفدت الكمية' : `متوفر (${product.stock} قطعة)`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action */}
          <div style={{ marginTop: '1rem' }}>
            <AddToCartButton
              product={{
                id: product._id,
                name: product.name,
                priceEGP: product.price,
                imageUrl: safeImage,
                category: product.category,
              }}
              large
            />
          </div>

        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .product-layout { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}
