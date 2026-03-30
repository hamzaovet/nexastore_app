'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, X, Package, Search, Upload, Loader2 } from 'lucide-react'

const IMGBB_KEY = '1705736b8f2b46dcbaeec8a6025aca83'

/* ─── Types ─────────────────────────────────────────────────── */
type Product = {
  _id?: string
  name: string
  category: string
  price: number
  stock: number
  specs?: string
  imageUrl?: string
  badge?: string
}

/* ─── Form state — includes _id so edit path always has it ─── */
type FormState = {
  _id:      string   // empty string = new product
  name:     string
  category: string
  price:    string
  stock:    string
  specs:    string
  badge:    string
  imageUrl: string
}

const blankForm: FormState = {
  _id:      '',
  name:     '',
  category: 'موبايلات',
  price:    '',
  stock:    '',
  specs:    '',
  badge:    '',
  imageUrl: '',
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function ProductsPage() {
  const [items, setItems]           = useState<Product[]>([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(false)
  const [isEditing, setIsEditing]   = useState(false)

  // Single unified form state with _id
  const [form, setForm]             = useState<FormState>(blankForm)

  const [imageFile, setImageFile]   = useState<File | null>(null)
  const [imagePreview, setPreview]  = useState<string>('')
  const [uploading, setUploading]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [search, setSearch]         = useState('')
  const [deleteId, setDeleteId]     = useState<string | null>(null)
  const [toast, setToast]           = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const fileRef                     = useRef<HTMLInputElement>(null)

  /* ── Fetch ────────────────────────────────────────────────── */
  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    setLoading(true)
    try {
      const res  = await fetch('/api/products')
      const data = await res.json()
      setItems(data.products ?? [])
    } catch {
      showToast('فشل تحميل المنتجات', 'err')
    } finally {
      setLoading(false)
    }
  }

  /* ── Toast ────────────────────────────────────────────────── */
  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  /* ── Open modal for NEW product ───────────────────────────── */
  function openNew() {
    setIsEditing(false)
    setForm(blankForm)
    setImageFile(null)
    setPreview('')
    setModal(true)
  }

  /* ── Open modal for EDIT — populates EVERY field explicitly ── */
  function openEdit(p: Product) {
    setIsEditing(true)
    setForm({
      _id:      p._id      ?? '',
      name:     p.name     ?? '',
      category: p.category ?? 'موبايلات',
      price:    String(p.price  ?? ''),
      stock:    String(p.stock  ?? ''),
      specs:    p.specs    ?? '',
      badge:    p.badge    ?? '',
      imageUrl: p.imageUrl ?? '',
    })
    setImageFile(null)
    setPreview(p.imageUrl ?? '')
    setModal(true)
  }

  /* ── Image selection ──────────────────────────────────────── */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    if (file) setPreview(URL.createObjectURL(file))
  }

  /* ── ImgBB upload ─────────────────────────────────────────── */
  async function uploadToImgBB(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('image', file)
    const res  = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: fd })
    const data = await res.json()
    if (!data.success) throw new Error('ImgBB upload failed')
    return data.data.display_url as string
  }

  /* ── Save ─────────────────────────────────────────────────── */
  async function handleSave() {
    if (!form.name.trim() || !form.price || !form.stock) return
    setSaving(true)
    try {
      // Resolve image URL: upload new file if chosen, else keep existing
      let imageUrl = form.imageUrl
      if (imageFile) {
        setUploading(true)
        imageUrl = await uploadToImgBB(imageFile)
        setUploading(false)
      }

      if (isEditing) {
        /* ── PUT: send _id + all fields ─────────────────────── */
        const body = {
          _id:      form._id,
          name:     form.name.trim(),
          category: form.category,
          price:    Number(form.price),
          stock:    Number(form.stock),
          specs:    form.specs.trim(),
          badge:    form.badge.trim(),
          imageUrl: imageUrl.trim(),
        }

        const res  = await fetch('/api/products', {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message ?? 'فشل التعديل')

        // data.data is the updated document returned by the API
        setItems((prev) => prev.map((p) => (p._id === form._id ? data.data : p)))
        showToast('تم تحديث المنتج بنجاح ✓', 'ok')
      } else {
        /* ── POST: new product ───────────────────────────────── */
        const body = {
          name:     form.name.trim(),
          category: form.category,
          price:    Number(form.price),
          stock:    Number(form.stock),
          specs:    form.specs.trim()    || undefined,
          badge:    form.badge.trim()    || undefined,
          imageUrl: imageUrl.trim()      || undefined,
        }

        const res  = await fetch('/api/products', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message ?? 'فشل الإضافة')

        setItems((prev) => [data.product, ...prev])
        showToast('تم إضافة المنتج بنجاح ✓', 'ok')
      }

      setModal(false)
    } catch (err: unknown) {
      setUploading(false)
      showToast(err instanceof Error ? err.message : 'حدث خطأ', 'err')
    } finally {
      setSaving(false)
    }
  }

  /* ── Delete ───────────────────────────────────────────────── */
  async function handleDelete(id: string) {
    try {
      await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((p) => p._id !== id))
      showToast('تم حذف المنتج', 'ok')
    } catch {
      showToast('فشل حذف المنتج', 'err')
    } finally {
      setDeleteId(null)
    }
  }

  /* ── Derived ──────────────────────────────────────────────── */
  const filtered = items.filter(
    (p) => p.name.includes(search) || p.category.includes(search)
  )

  /* ── Shared styles ────────────────────────────────────────── */
  const card: React.CSSProperties = {
    background: '#fff', borderRadius: 16, padding: '1.75rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(29,29,31,0.06)',
  }
  const inp: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.9rem',
    border: '1px solid rgba(29,29,31,0.14)', borderRadius: 10,
    fontSize: '0.92rem', fontFamily: 'inherit', color: '#1D1D1F',
    outline: 'none', background: '#fafafa', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: '0.78rem', fontWeight: 700,
    color: 'rgba(29,29,31,0.55)', display: 'block', marginBottom: '0.3rem',
  }
  const field = (children: React.ReactNode) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
  )

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: toast.type === 'ok' ? '#16a34a' : '#dc2626', color: '#fff', padding: '0.65rem 1.5rem', borderRadius: 50, fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '0.3rem' }}>المستودع</p>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1D1D1F' }}>إدارة المنتجات والأقسام</h1>
          <p style={{ color: 'rgba(29,29,31,0.5)', fontSize: '0.88rem', marginTop: '0.2rem' }}>{items.length} منتج في المخزون</p>
        </div>
        <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#D4AF37', color: '#fff', border: 'none', borderRadius: 12, padding: '0.72rem 1.4rem', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 18px rgba(212,175,55,0.35)' }}>
          <Plus size={18} strokeWidth={2.5} />
          إضافة منتج جديد
        </button>
      </div>

      {/* Search */}
      <div style={{ ...card, marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(29,29,31,0.35)' }} />
          <input
            type="text"
            placeholder="بحث بالاسم أو القسم…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inp, paddingRight: '2.25rem' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(29,29,31,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ التحميل…
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(212,175,55,0.15)' }}>
                {['#', 'المنتج', 'القسم', 'السعر', 'المخزون', 'الحالة', 'إجراءات'].map((h) => (
                  <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: 'rgba(29,29,31,0.5)', fontSize: '0.78rem', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p._id ?? i}
                  style={{ borderBottom: '1px solid rgba(29,29,31,0.05)', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = '#fafafa')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}>
                  <td style={{ padding: '0.9rem 1rem', color: 'rgba(29,29,31,0.35)', fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(212,175,55,0.2)' }} />
                        : <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={16} color="#D4AF37" strokeWidth={1.8} /></div>
                      }
                      <div style={{ fontWeight: 700, color: '#1D1D1F', whiteSpace: 'nowrap' }}>{p.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: 'rgba(29,29,31,0.6)' }}>{p.category}</td>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#D4AF37', direction: 'ltr' }}>{Number(p.price).toLocaleString('ar-EG')} ج.م</td>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: '#1D1D1F' }}>{p.stock}</td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span style={{ padding: '0.25rem 0.7rem', borderRadius: 50, fontSize: '0.72rem', fontWeight: 700, background: p.stock > 10 ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: p.stock > 10 ? '#16a34a' : '#d97706' }}>
                      {p.stock > 10 ? 'متوفر' : 'كمية محدودة'}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEdit(p)} style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.22)', borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer', color: '#D4AF37', display: 'flex', alignItems: 'center' }}><Pencil size={14} /></button>
                      <button onClick={() => setDeleteId(p._id!)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(29,29,31,0.35)' }}>لا توجد منتجات</div>
        )}
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────────── */}
      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(false) }}
        >
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 540, padding: '2rem', boxShadow: '0 32px 80px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#1D1D1F' }}>
                {isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1D1D1F' }}><X size={22} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Image upload */}
              {field(<>
                <label style={lbl}>صورة المنتج</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{ border: '2px dashed rgba(212,175,55,0.35)', borderRadius: 12, padding: '1.25rem', textAlign: 'center', cursor: 'pointer', background: '#fafafa', position: 'relative', minHeight: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {imagePreview
                    ? <img src={imagePreview} alt="preview" style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} />
                    : (<>
                        <Upload size={24} color="#D4AF37" />
                        <span style={{ fontSize: '0.82rem', color: 'rgba(29,29,31,0.5)' }}>اضغط لاختيار صورة</span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(29,29,31,0.35)' }}>سيتم رفعها على ImgBB</span>
                      </>)
                  }
                  {uploading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700, color: '#D4AF37' }}>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ الرفع…
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </>)}

              {/* اسم المنتج */}
              {field(<>
                <label style={lbl}>اسم المنتج *</label>
                <input
                  type="text"
                  placeholder="iPhone 17 Pro Max"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inp}
                />
              </>)}

              {/* السعر */}
              {field(<>
                <label style={lbl}>السعر (ج.م) *</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  style={inp}
                />
              </>)}

              {/* الكمية */}
              {field(<>
                <label style={lbl}>الكمية المتاحة *</label>
                <input
                  type="number"
                  placeholder="0"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  style={inp}
                />
              </>)}

              {/* المواصفات — explicit binding, no shared key */}
              {field(<>
                <label style={lbl}>المواصفات</label>
                <input
                  type="text"
                  placeholder="256GB • تيتانيوم"
                  value={form.specs}
                  onChange={(e) => setForm({ ...form, specs: e.target.value })}
                  style={inp}
                />
              </>)}

              {/* شارة — explicit binding, completely isolated */}
              {field(<>
                <label style={lbl}>شارة (اختياري)</label>
                <input
                  type="text"
                  placeholder="جديد"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  style={inp}
                />
              </>)}

              {/* القسم */}
              {field(<>
                <label style={lbl}>القسم</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={inp}
                >
                  {['موبايلات', 'تابلت', 'اكسسوارات', 'لابتوب'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </>)}

            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ flex: 1, background: '#D4AF37', color: '#fff', border: 'none', borderRadius: 12, padding: '0.8rem', fontWeight: 700, fontSize: '0.95rem', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: saving ? 0.75 : 1 }}
              >
                {saving
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ الحفظ…</>
                  : (isEditing ? 'حفظ التعديلات' : 'إضافة المنتج')}
              </button>
              <button
                onClick={() => setModal(false)}
                style={{ flex: 1, background: 'rgba(29,29,31,0.06)', color: '#1D1D1F', border: 'none', borderRadius: 12, padding: '0.8rem', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Trash2 size={24} color="#dc2626" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1D1D1F', marginBottom: '0.5rem' }}>تأكيد الحذف</h3>
            <p style={{ color: 'rgba(29,29,31,0.5)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>هل أنت متأكد؟ لا يمكن التراجع.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>نعم، احذف</button>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, background: 'rgba(29,29,31,0.06)', color: '#1D1D1F', border: 'none', borderRadius: 10, padding: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
