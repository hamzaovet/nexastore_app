'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, AlertCircle, Plus, Loader2 } from 'lucide-react'

type ApiProduct = {
  _id: string
  name: string
  category: string
  price: number
  stock: number
}

type Sale = {
  _id: string
  customer: string
  phone: string
  date: string
  productId?: string
  productName: string
  price: number
  qty: number
  total: number
  status?: 'completed' | 'returned'
}

export default function SalesPage() {
  const [sales, setSales]         = useState<Sale[]>([])
  const [products, setProducts]   = useState<ApiProduct[]>([])
  const [loadingSales, setLoadingSales]       = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [submitting, setSubmitting]           = useState(false)
  const [toast, setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const [form, setForm] = useState({
    customer:  '',
    phone:     '',
    date:      new Date().toISOString().split('T')[0],
    productId: '',
    qty:       '1',
    actualSalePrice: '',
  })

  // Expense Modal State
  const [expenseModal, setExpenseModal] = useState(false)
  const [expenseForm, setExpenseForm]   = useState({ title: '', amount: '' })
  const [addingExpense, setAddingExpense] = useState(false)

  /* ── Data fetching ──────────────────────────────────────── */
  useEffect(() => { fetchSales();  fetchProducts() }, [])

  async function fetchSales() {
    setLoadingSales(true)
    try {
      const res  = await fetch('/api/sales')
      const data = await res.json()
      setSales(data.sales ?? [])
    } catch {
      showToast('فشل تحميل المبيعات', 'err')
    } finally {
      setLoadingSales(false)
    }
  }

  async function fetchProducts() {
    setLoadingProducts(true)
    try {
      const res  = await fetch('/api/products')
      const data = await res.json()
      const list: ApiProduct[] = data.products ?? []
      setProducts(list)
      // Pre-select first product and set its price as default actual sale price
      if (list.length > 0) {
        setForm((f) => ({ 
          ...f, 
          productId: list[0]._id,
          actualSalePrice: String(list[0].price)
        }))
      }
    } catch {
      showToast('فشل تحميل المنتجات', 'err')
    } finally {
      setLoadingProducts(false)
    }
  }

  /* ── Helpers ────────────────────────────────────────────── */
  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const selectedProduct = products.find((p) => p._id === form.productId)
  // حساب الإيرادات يتجاهل المردودات
  const totalRevenue    = sales.filter(s => s.status !== 'returned').reduce((s, e) => s + (e?.total ?? (e?.price * e?.qty) ?? 0), 0)

  /* ── Submit sale → POST /api/sales ──────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customer || !selectedProduct) return
    setSubmitting(true)
    try {
      const res  = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer:    form.customer,
          phone:       form.phone,
          date:        form.date,
          productId:   selectedProduct._id,
          productName: selectedProduct.name,
          price:       selectedProduct.price,
          actualSalePrice: Number(form.actualSalePrice),
          qty:         Number(form.qty),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Prepend new sale & reset form
      setSales((prev) => [data.data, ...prev])
      setForm({ 
        customer: '', 
        phone: '', 
        date: new Date().toISOString().split('T')[0], 
        productId: products[0]?._id ?? '', 
        qty: '1',
        actualSalePrice: String(products[0]?.price ?? '')
      })

      // Reflect stock decrement locally so the preview stays accurate
      setProducts((prev) =>
        prev.map((p) =>
          p._id === selectedProduct._id
            ? { ...p, stock: Math.max(0, p.stock - Number(form.qty)) }
            : p
        )
      )
      showToast('✓ تم تسجيل البيع وتحديث المخزون', 'ok')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'حدث خطأ', 'err')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Add Expense ───────────────────────────────────────── */
  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!expenseForm.title || !expenseForm.amount) return
    setAddingExpense(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: expenseForm.title,
          amount: Number(expenseForm.amount),
          date: new Date().toISOString().split('T')[0],
        }),
      })
      if (!res.ok) throw new Error('فشل إضافة المصروف')
      showToast('✓ تم إضافة المصروف بنجاح', 'ok')
      setExpenseModal(false)
      setExpenseForm({ title: '', amount: '' })
    } catch (err) {
      showToast('حدث خطأ أثناء إضافة المصروف', 'err')
    } finally {
      setAddingExpense(false)
    }
  }

  /* ── Return/Delete Sale ───────────────────────────────── */
  async function handleReturnSale(saleId: string, productId: string | undefined, qty: number) {
    if (!confirm('هل أنت متأكد من استرجاع هذه البيعة كـ (مردودات مبيعات)؟')) return;
    try {
      const res = await fetch(`/api/sales/${saleId}`, { method: 'PUT' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'فشل الاسترجاع');
      }

      // Update UI: Mark as returned and restore stock
      setSales((prev) => prev.map(s => s._id === saleId ? { ...s, status: 'returned' } : s));
      if (productId) {
        setProducts((prev) =>
          prev.map((p) =>
            p._id === productId ? { ...p, stock: p.stock + qty } : p
          )
        );
      }
      showToast('✓ تم تسجيل مردودات المبيعات بنجاح', 'ok');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'حدث خطأ', 'err');
    }
  }

  /* ── Styles ─────────────────────────────────────────────── */
  const card: React.CSSProperties = {
    background: '#fff', borderRadius: 16, padding: '1.75rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(29,29,31,0.06)',
  }
  const inp: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.9rem', border: '1px solid rgba(29,29,31,0.14)',
    borderRadius: 10, fontSize: '0.92rem', fontFamily: 'inherit', color: '#1D1D1F',
    outline: 'none', background: '#fafafa', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: '0.78rem', fontWeight: 700, color: 'rgba(29,29,31,0.55)',
    display: 'block', marginBottom: '0.3rem',
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: toast.type === 'ok' ? '#16a34a' : '#dc2626', color: '#fff', padding: '0.65rem 1.5rem', borderRadius: 50, fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '0.3rem' }}>إدارة المبيعات</p>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1D1D1F' }}>سجل المبيعات</h1>
          <p style={{ color: 'rgba(29,29,31,0.5)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            تسجيل البيع يخصم الكمية تلقائياً من المخزون
          </p>
        </div>
        <button 
          onClick={() => setExpenseModal(true)}
          style={{ background: '#1D1D1F', color: '#fff', border: 'none', borderRadius: 12, padding: '0.7rem 1.4rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          <Plus size={18} />
          إضافة مصروف
        </button>
      </div>

      {/* KPIs — derived from real sales state */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'إجمالي الإيرادات', value: `${totalRevenue.toLocaleString('ar-EG')} ج.م`, color: '#D4AF37' },
          { label: 'عدد العمليات',     value: `${sales.filter(s => s.status !== 'returned').length} عملية`,                                      color: '#6366f1' },
          { label: 'وحدات مباعة',      value: `${sales.filter(s => s.status !== 'returned').reduce((s, e) => s + e.qty, 0)} وحدة`,                 color: '#22c55e' },
        ].map((k) => (
          <div key={k.label} style={{ ...card, padding: '1.2rem 1.4rem' }}>
            <p style={{ fontSize: '0.74rem', fontWeight: 600, color: 'rgba(29,29,31,0.45)', marginBottom: '0.4rem' }}>{k.label}</p>
            <p style={{ fontSize: '1.35rem', fontWeight: 900, color: k.color, direction: 'ltr', textAlign: 'right' }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.7fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Record Sale Form ──────────────────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={18} color="#D4AF37" />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#1D1D1F' }}>تسجيل عملية بيع</h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'اسم العميل', key: 'customer', type: 'text',   placeholder: 'أحمد محمد' },
              { label: 'رقم الهاتف', key: 'phone',    type: 'tel',    placeholder: '010xxxxxxxx' },
              { label: 'التاريخ',    key: 'date',     type: 'date',   placeholder: '' },
              { label: 'سعر البيع الفعلي (ج.م)', key: 'actualSalePrice', type: 'number', placeholder: '0' },
              { label: 'الكمية',     key: 'qty',      type: 'number', placeholder: '1' },
            ].map((f) => (
              <div key={f.key}>
                <label style={lbl}>{f.label}</label>
                <input
                  required
                  type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form]}
                  min={f.key === 'qty' ? 1 : undefined}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  style={inp}
                />
              </div>
            ))}

            {/* Product selector — loaded from API */}
            <div>
              <label style={lbl}>المنتج</label>
              {loadingProducts ? (
                <div style={{ ...inp, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(29,29,31,0.4)' }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ التحميل…
                </div>
              ) : products.length === 0 ? (
                <div style={{ ...inp, color: 'rgba(29,29,31,0.4)', cursor: 'default' }}>
                  لا توجد منتجات — أضف منتجاً أولاً
                </div>
              ) : (
                <select 
                  value={form.productId} 
                  onChange={(e) => {
                    const p = products.find(prod => prod._id === e.target.value)
                    setForm({ ...form, productId: e.target.value, actualSalePrice: String(p?.price ?? '') })
                  }} 
                  style={inp}
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — {p.price.toLocaleString('ar-EG')} ج.م
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Stock impact preview */}
            {selectedProduct && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: selectedProduct.stock < +form.qty ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${selectedProduct.stock < +form.qty ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.22)'}`, borderRadius: 10, padding: '0.7rem 1rem' }}>
                <AlertCircle size={16} color={selectedProduct.stock < +form.qty ? '#dc2626' : '#d97706'} style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.77rem', fontWeight: 700, color: selectedProduct.stock < +form.qty ? '#dc2626' : '#d97706' }}>
                    {selectedProduct.stock < +form.qty ? 'تحذير: الكمية تتجاوز المخزون!' : 'تأثير على المخزون'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(29,29,31,0.6)', marginTop: '0.1rem' }}>
                    المتاح: {selectedProduct.stock} → سيصبح: {Math.max(0, selectedProduct.stock - +form.qty)}
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || products.length === 0 || (selectedProduct ? selectedProduct.stock < +form.qty : false)}
              style={{ background: '#D4AF37', color: '#fff', border: 'none', borderRadius: 12, padding: '0.8rem', fontWeight: 700, fontSize: '0.95rem', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: submitting ? 0.75 : 1 }}
            >
              {submitting
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ التسجيل…</>
                : <><TrendingUp size={17} /> تسجيل البيع</>}
            </button>
          </form>
        </div>

        {/* ── Sales history table ───────────────────────────── */}
        <div style={{ ...card, overflowX: 'auto' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#1D1D1F', marginBottom: '1.25rem' }}>آخر العمليات</h2>
          {loadingSales ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(29,29,31,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ التحميل…
            </div>
          ) : sales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(29,29,31,0.35)' }}>
              لا توجد مبيعات بعد — سجّل أول عملية بيع
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(212,175,55,0.12)' }}>
                  {['العميل', 'الهاتف', 'المنتج', 'القيمة', 'الكمية', 'التاريخ', 'إجراء'].map((h) => (
                    <th key={h} style={{ padding: '0.7rem 0.85rem', textAlign: h === 'إجراء' ? 'center' : 'right', fontWeight: 700, color: 'rgba(29,29,31,0.45)', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s._id} style={{ borderBottom: '1px solid rgba(29,29,31,0.05)', opacity: s.status === 'returned' ? 0.5 : 1 }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = '#fafafa')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}>
                    <td style={{ padding: '0.85rem', fontWeight: 700, color: '#1D1D1F' }}>{s.customer}</td>
                    <td style={{ padding: '0.85rem', color: 'rgba(29,29,31,0.55)', direction: 'ltr', textAlign: 'right' }}>{s.phone}</td>
                    <td style={{ padding: '0.85rem', color: 'rgba(29,29,31,0.7)' }}>{s.productName}</td>
                    <td style={{ padding: '0.85rem', fontWeight: 700, color: s.status === 'returned' ? '#dc2626' : '#D4AF37', direction: 'ltr', whiteSpace: 'nowrap' }}>
                      {s.status === 'returned' ? <strike>{(s.total ?? s.price * s.qty).toLocaleString('ar-EG')}</strike> : (s.total ?? s.price * s.qty).toLocaleString('ar-EG')} ج.م
                    </td>
                    <td style={{ padding: '0.85rem', color: 'rgba(29,29,31,0.6)', textAlign: 'center' }}>{s.qty}</td>
                    <td style={{ padding: '0.85rem', color: 'rgba(29,29,31,0.45)', direction: 'ltr', whiteSpace: 'nowrap' }}>{s.date}</td>
                    <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                      {s.status === 'returned' ? (
                        <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '0.75rem' }}>مردودات</span>
                      ) : (
                        <button 
                          onClick={() => handleReturnSale(s._id, s.productId, s.qty)}
                          style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                          onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          استرجاع
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Add Expense Modal ─────────────────────────────── */}
      {expenseModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 400, padding: '2rem', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}>
            <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#1D1D1F', marginBottom: '1.5rem' }}>إضافة مصروف جديد</h2>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={lbl}>بيان المصروف</label>
                <input required type="text" placeholder="مثلاً: إيجار، كهرباء، شحن..." value={expenseForm.title} onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={lbl}>المبلغ (ج.م)</label>
                <input required type="number" placeholder="0" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} style={inp} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" disabled={addingExpense} style={{ flex: 1, background: '#D4AF37', color: '#fff', border: 'none', borderRadius: 12, padding: '0.8rem', fontWeight: 700, cursor: addingExpense ? 'not-allowed' : 'pointer' }}>
                  {addingExpense ? 'جارٍ الحفظ...' : 'حفظ'}
                </button>
                <button type="button" onClick={() => setExpenseModal(false)} style={{ flex: 1, background: 'rgba(29,29,31,0.06)', color: '#1D1D1F', border: 'none', borderRadius: 12, padding: '0.8rem', fontWeight: 600 }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}