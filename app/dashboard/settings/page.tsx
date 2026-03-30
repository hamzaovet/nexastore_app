'use client'

import { useState, useEffect } from 'react'
import { Shield, Users, Eye, EyeOff, Plus, Trash2, Check, KeyRound, RefreshCw, Copy, CreditCard, Save } from 'lucide-react'

type AdminUser = { id: number; name: string; role: '  مدير' | 'كاشير'; email: string }

const initialUsers: AdminUser[] = [
  { id: 1, name: 'Dr. Hamza',   role: '  مدير', email: 'hamza@almaz.eg' },
  { id: 2, name: 'Ahmed Nabil', role: 'كاشير',  email: 'ahmed@almaz.eg' },
  { id: 3, name: 'Sara Tarek',  role: 'كاشير',  email: 'sara@almaz.eg' },
]

export default function SettingsPage() {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)

  // Password form
  const [pwForm, setPwForm]   = useState({ old: '', new1: '', new2: '' })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

  // Add user form
  const [addForm, setAddForm]   = useState({ name: '', email: '', role: 'كاشير' as AdminUser['role'] })
  const [showAddForm, setShowAddForm] = useState(false)
  const [userSaved, setUserSaved]     = useState(false)

  // ── License Manager state ────────────────────────────────────
  type LicInfo = { status: string; plan: string | null; expiresAt: string | null }
  const [licInfo,     setLicInfo]     = useState<LicInfo | null>(null)
  const [genPlan,     setGenPlan]     = useState<'monthly' | 'yearly' | 'lifetime'>('monthly')
  const [genLoading,  setGenLoading]  = useState(false)
  const [genKey,      setGenKey]      = useState('')
  const [genError,    setGenError]    = useState('')
  const [copied,      setCopied]      = useState(false)

  // Fetch current license info on mount
  useEffect(() => {
    fetch('/api/license/check')
      .then((r) => r.json())
      .then((d: LicInfo) => setLicInfo(d))
      .catch(console.error)

    fetch('/api/store-settings', { headers: { Authorization: `Basic ${btoa('admin:123456')}` } })
      .then(r => r.json())
      .then(data => {
        if (!data.error) setGateways({
          activeGateway: data.activeGateway || 'whatsapp',
          whatsappNumber: data.whatsappNumber || '201551190990',
          paymobApiKey: data.paymobApiKey || '',
          paymobIntegrationId: data.paymobIntegrationId || '',
          paymobIframeId: data.paymobIframeId || '',
          tapSecretKey: data.tapSecretKey || ''
        })
      })
      .catch(console.error)
  }, [])

  async function handleGenerate() {
    setGenLoading(true)
    setGenKey('')
    setGenError('')
    // Build Basic Auth header with the same admin/123456 credentials
    const creds = Buffer.from('admin:123456').toString('base64')
    try {
      const res  = await fetch('/api/license/generate', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Basic ${btoa('admin:123456')}`,
        },
        body: JSON.stringify({ plan: genPlan }),
      })
      const data = await res.json() as { ok?: boolean; key?: string; error?: string }
      if (data.ok && data.key) {
        setGenKey(data.key)
        // Refresh license info
        fetch('/api/license/check').then((r) => r.json()).then(setLicInfo).catch(() => null)
      } else {
        setGenError(data.error ?? 'فشل توليد المفتاح')
      }
    } catch {
      setGenError('تعذّر الاتصال بالخادم')
    } finally {
      setGenLoading(false)
    }
  }

  function copyKey() {
    if (!genKey) return
    navigator.clipboard.writeText(genKey).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function licStatusColor(s: string) {
    if (s === 'active')  return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)',  text: '#16a34a', label: '✦ مفعّل' }
    if (s === 'trial')   return { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', text: '#d97706', label: '⏳ تجريبي' }
    if (s === 'expired') return { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)',   text: '#dc2626', label: '✗ منتهي' }
    return { bg: 'rgba(100,100,100,0.08)', border: 'rgba(100,100,100,0.15)', text: '#666', label: 'غير محدد' }
  }


  function handlePwSave(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (pwForm.new1 !== pwForm.new2) { setPwError('كلمتا المرور الجديدتان غير متطابقتين'); return }
    if (pwForm.new1.length < 6) { setPwError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return }
    setPwSaved(true)
    setPwForm({ old: '', new1: '', new2: '' })
    setTimeout(() => setPwSaved(false), 3000)
  }

  function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.name || !addForm.email) return
    setUsers([...users, { id: Date.now(), name: addForm.name, email: addForm.email, role: addForm.role }])
    setAddForm({ name: '', email: '', role: 'كاشير' })
    setShowAddForm(false)
    setUserSaved(true)
    setTimeout(() => setUserSaved(false), 3000)
  }

  // ── Payment Gateways state ──────────────────────────────────
  const [gateways, setGateways] = useState({
    activeGateway: 'whatsapp',
    whatsappNumber: '201551190990',
    paymobApiKey: '', paymobIntegrationId: '', paymobIframeId: '',
    tapSecretKey: '',
  })
  const [gwSaving, setGwSaving] = useState(false)
  const [gwSaved, setGwSaved]   = useState(false)
  const [gwError, setGwError]   = useState('')

  async function handleSaveGateways(e: React.FormEvent) {
    e.preventDefault()
    setGwSaving(true)
    setGwError('')
    try {
      const res = await fetch('/api/store-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa('admin:123456')}`,
        },
        body: JSON.stringify(gateways),
      })
      if (!res.ok) throw new Error()
      setGwSaved(true)
      setTimeout(() => setGwSaved(false), 3000)
    } catch {
      setGwError('تعذّر حفظ التحديثات')
    } finally {
      setGwSaving(false)
    }
  }

  const card: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(29,29,31,0.06)' }
  const inp: React.CSSProperties  = { width: '100%', padding: '0.65rem 0.9rem', border: '1px solid rgba(29,29,31,0.14)', borderRadius: 10, fontSize: '0.92rem', fontFamily: 'inherit', color: '#1D1D1F', outline: 'none', background: '#fafafa', boxSizing: 'border-box' }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '0.3rem' }}>الإعدادات</p>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1D1D1F' }}>إعدادات النظام</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ── Card 1: Change Password ─────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} color="#D4AF37" strokeWidth={1.8} />
            </div>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1D1D1F' }}>تغيير كلمة المرور</h2>
              <p style={{ fontSize: '0.78rem', color: 'rgba(29,29,31,0.45)', marginTop: '0.1rem' }}>تأكد من استخدام كلمة مرور قوية لأمان النظام</p>
            </div>
          </div>

          {pwSaved && (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '0.65rem 1rem', marginBottom: '1rem', color: '#16a34a', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={16} /> تم تحديث كلمة المرور بنجاح
            </div>
          )}
          {pwError && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, padding: '0.65rem 1rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.88rem', fontWeight: 600 }}>
              {pwError}
            </div>
          )}

          <form onSubmit={handlePwSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(29,29,31,0.55)', display: 'block', marginBottom: '0.3rem' }}>كلمة المرور الحالية</label>
              <div style={{ position: 'relative' }}>
                <input required type={showOld ? 'text' : 'password'} value={pwForm.old} onChange={(e) => setPwForm({ ...pwForm, old: e.target.value })} style={{ ...inp, paddingLeft: '2.5rem' }} placeholder="••••••••" />
                <button type="button" onClick={() => setShowOld(!showOld)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(29,29,31,0.4)', display: 'flex' }}>
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {[
              { label: 'كلمة المرور الجديدة', key: 'new1' },
              { label: 'تأكيد كلمة المرور',   key: 'new2' },
            ].map((f) => (
              <div key={f.key}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(29,29,31,0.55)', display: 'block', marginBottom: '0.3rem' }}>{f.label}</label>
                <div style={{ position: 'relative' }}>
                  <input required type={showNew ? 'text' : 'password'} value={pwForm[f.key as 'new1' | 'new2']} onChange={(e) => setPwForm({ ...pwForm, [f.key]: e.target.value })} style={{ ...inp, paddingLeft: '2.5rem' }} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(29,29,31,0.4)', display: 'flex' }}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" style={{ background: '#D4AF37', color: '#fff', border: 'none', borderRadius: 12, padding: '0.75rem 2rem', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                حفظ كلمة المرور
              </button>
            </div>
          </form>
        </div>

        {/* ── Card 2: User Management ─────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} color="#6366f1" strokeWidth={1.8} />
              </div>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1D1D1F' }}>إدارة المستخدمين</h2>
                <p style={{ fontSize: '0.78rem', color: 'rgba(29,29,31,0.45)', marginTop: '0.1rem' }}>{users.length} مستخدمين مسجلين</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '0.62rem 1.1rem', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Plus size={16} /> إضافة مستخدم
            </button>
          </div>

          {userSaved && (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '0.65rem 1rem', marginBottom: '1rem', color: '#16a34a', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={16} /> تم إضافة المستخدم بنجاح
            </div>
          )}

          {/* Add user form */}
          {showAddForm && (
            <form onSubmit={handleAddUser} style={{ background: '#f8f8fa', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', border: '1px solid rgba(99,102,241,0.15)' }}>
              {[
                { label: 'الاسم الكامل', key: 'name',  type: 'text',  placeholder: 'Ahmed Nabil' },
                { label: 'البريد الإلكتروني', key: 'email', type: 'email', placeholder: 'user@almaz.eg' },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(29,29,31,0.55)', display: 'block', marginBottom: '0.3rem' }}>{f.label}</label>
                  <input required type={f.type} placeholder={f.placeholder} value={addForm[f.key as 'name' | 'email']} onChange={(e) => setAddForm({ ...addForm, [f.key]: e.target.value })} style={inp} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(29,29,31,0.55)', display: 'block', marginBottom: '0.3rem' }}>الصلاحية</label>
                <select value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value as AdminUser['role'] })} style={inp}>
                  <option value="  مدير">مدير</option>
                  <option value="كاشير">كاشير</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <button type="submit" style={{ flex: 1, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '0.65rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem' }}>إضافة</button>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ flex: 1, background: 'rgba(29,29,31,0.06)', color: '#1D1D1F', border: 'none', borderRadius: 10, padding: '0.65rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem' }}>إلغاء</button>
              </div>
            </form>
          )}

          {/* Users list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {users.map((u) => (
              <div
                key={u.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1rem', borderRadius: 12, background: '#fafafa', border: '1px solid rgba(29,29,31,0.06)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: u.role === '  مدير' ? 'rgba(212,175,55,0.15)' : 'rgba(99,102,241,0.12)', border: `1px solid ${u.role === '  مدير' ? 'rgba(212,175,55,0.25)' : 'rgba(99,102,241,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: u.role === '  مدير' ? '#D4AF37' : '#6366f1' }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#1D1D1F', fontSize: '0.92rem' }}>{u.name}</p>
                    <p style={{ fontSize: '0.76rem', color: 'rgba(29,29,31,0.45)', direction: 'ltr', textAlign: 'right' }}>{u.email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ padding: '0.22rem 0.7rem', borderRadius: 50, fontSize: '0.72rem', fontWeight: 700, background: u.role === '  مدير' ? 'rgba(212,175,55,0.12)' : 'rgba(99,102,241,0.1)', color: u.role === '  مدير' ? '#D4AF37' : '#6366f1' }}>
                    {u.role.trim()}
                  </span>
                  {u.id !== 1 && (
                    <button
                      onClick={() => setUsers(users.filter((x) => x.id !== u.id))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(29,29,31,0.3)', display: 'flex', padding: 4, transition: 'color 0.2s' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#dc2626')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(29,29,31,0.3)')}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* ── Card 3: License Manager ───────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <KeyRound size={20} color="#D4AF37" strokeWidth={1.8} />
            </div>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1D1D1F' }}>إدارة الرخصة</h2>
              <p style={{ fontSize: '0.78rem', color: 'rgba(29,29,31,0.45)', marginTop: '0.1rem' }}>توليد مفاتيح تفعيل جديدة وعرض حالة الرخصة الحالية</p>
            </div>
          </div>

          {/* Current license status */}
          <div style={{ background: '#f8f8fa', borderRadius: 12, padding: '1.1rem 1.25rem', marginBottom: '1.5rem', border: '1px solid rgba(29,29,31,0.06)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(29,29,31,0.4)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>الحالة الحالية</p>
            {!licInfo ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(29,29,31,0.35)' }}>
                <RefreshCw size={14} style={{ animation: 'nexaSpin 1s linear infinite' }} />
                <span style={{ fontSize: '0.85rem' }}>جاري التحقق…</span>
              </div>
            ) : (() => {
              const col = licStatusColor(licInfo.status)
              const planLabels: Record<string, string> = { trial: 'تجريبي 24 ساعة', monthly: 'شهري', yearly: 'سنوي', lifetime: 'مدى الحياة' }
              return (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ background: col.bg, border: `1px solid ${col.border}`, color: col.text, padding: '0.3rem 0.85rem', borderRadius: 50, fontSize: '0.8rem', fontWeight: 800 }}>
                    {col.label}
                  </span>
                  {licInfo.plan && (
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1D1D1F' }}>
                      {planLabels[licInfo.plan] ?? licInfo.plan}
                    </span>
                  )}
                  {licInfo.expiresAt && licInfo.plan !== 'lifetime' && (
                    <span style={{ fontSize: '0.78rem', color: 'rgba(29,29,31,0.45)', direction: 'ltr' }}>
                      {licInfo.status === 'trial' ? 'تنتهي في: ' : 'انتهت في: '}
                      {new Date(licInfo.expiresAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  )}
                  {licInfo.plan === 'lifetime' && (
                    <span style={{ fontSize: '0.78rem', color: 'rgba(29,29,31,0.45)' }}>لا تنتهي أبداً ✦</span>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Key Generator */}
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(29,29,31,0.55)', marginBottom: '0.6rem' }}>
            توليد مفتاح تفعيل جديد
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.85rem' }}>
            {(['monthly', 'yearly', 'lifetime'] as const).map((p) => {
              const labels = { monthly: 'شهري', yearly: 'سنوي', lifetime: 'مدى الحياة' }
              const isSelected = genPlan === p
              return (
                <button
                  key={p}
                  onClick={() => setGenPlan(p)}
                  style={{
                    padding:      '0.45rem 1.1rem',
                    borderRadius: 50,
                    border:       isSelected ? '1.5px solid #D4AF37' : '1.5px solid rgba(29,29,31,0.12)',
                    background:   isSelected ? 'rgba(212,175,55,0.1)' : 'transparent',
                    color:        isSelected ? '#D4AF37' : 'rgba(29,29,31,0.5)',
                    fontWeight:   isSelected ? 800 : 600,
                    fontSize:     '0.82rem',
                    cursor:       'pointer',
                    fontFamily:   'inherit',
                    transition:   'all 0.18s',
                  }}
                >
                  {labels[p]}
                </button>
              )
            })}

            <button
              id="generate-license-btn"
              onClick={handleGenerate}
              disabled={genLoading}
              style={{
                display:    'flex', alignItems: 'center', gap: '0.4rem',
                background: genLoading ? 'rgba(212,175,55,0.4)' : '#D4AF37',
                color:      '#0a0a0a',
                border:     'none',
                borderRadius: 10,
                padding:    '0.55rem 1.2rem',
                fontWeight: 800,
                fontSize:   '0.85rem',
                cursor:     genLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.2s',
                marginRight: 'auto',
              }}
            >
              {genLoading
                ? <><RefreshCw size={14} style={{ animation: 'nexaSpin 0.7s linear infinite' }} /> توليد…</>
                : <><KeyRound size={14} /> توليد مفتاح</>
              }
            </button>
          </div>

          {/* Error */}
          {genError && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, padding: '0.65rem 1rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>
              ⚠ {genError}
            </div>
          )}

          {/* Generated key display */}
          {genKey && (
            <div style={{ background: '#f0f9f0', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(29,29,31,0.4)', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>المفتاح الجديد (غير مُفعَّل)</p>
                <p id="generated-key-value" style={{ fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 800, color: '#1D1D1F', letterSpacing: '0.1em', direction: 'ltr' }}>{genKey}</p>
              </div>
              <button
                onClick={copyKey}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(29,29,31,0.06)', color: copied ? '#16a34a' : '#1D1D1F', border: 'none', borderRadius: 8, padding: '0.5rem 0.9rem', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
              >
                {copied ? <><Check size={14} /> تم النسخ</> : <><Copy size={14} /> نسخ</>}
              </button>
            </div>
          )}
        </div>

        {/* ── Card 4: Payment Gateways ───────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={20} color="#3b82f6" strokeWidth={1.8} />
            </div>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1D1D1F' }}>بوابات الدفع</h2>
              <p style={{ fontSize: '0.78rem', color: 'rgba(29,29,31,0.45)', marginTop: '0.1rem' }}>إعداد خيارات الدفع الإلكتروني و Paymob/Tap</p>
            </div>
          </div>

          {gwSaved && (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '0.65rem 1rem', marginBottom: '1rem', color: '#16a34a', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={16} /> تم حفظ إعدادات بوابات الدفع بنجاح
            </div>
          )}
          {gwError && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, padding: '0.65rem 1rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.88rem', fontWeight: 600 }}>
              {gwError}
            </div>
          )}

          <form onSubmit={handleSaveGateways} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Active Gateway Selection */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(29,29,31,0.55)', display: 'block', marginBottom: '0.5rem' }}>البوابة الافتراضية النشطة</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'whatsapp', label: 'الواتساب (يدوي)' },
                  { id: 'paymob',   label: 'Paymob (مصر)' },
                  { id: 'tap',      label: 'Tap Payments (الخليج)' }
                ].map((g) => {
                  const active = gateways.activeGateway === g.id
                  return (
                    <button
                      key={g.id} type="button"
                      onClick={() => setGateways({ ...gateways, activeGateway: g.id })}
                      style={{
                        padding: '0.55rem 1rem', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                        border: active ? '1.5px solid #3b82f6' : '1.5px solid rgba(29,29,31,0.12)',
                        background: active ? 'rgba(59,130,246,0.08)' : 'transparent',
                        color: active ? '#2563eb' : 'rgba(29,29,31,0.55)', fontWeight: active ? 800 : 700, fontSize: '0.82rem',
                        transition: 'all 0.15s'
                      }}
                    >
                      {g.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* View configuration forms */}
            <div style={{ background: '#f8f8fa', border: '1px solid rgba(29,29,31,0.06)', borderRadius: 12, padding: '1.25rem' }}>
              {gateways.activeGateway === 'whatsapp' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(29,29,31,0.6)', fontWeight: 600, lineHeight: 1.6 }}>
                    سيتم تحويل العملاء تلقائياً لفتح محادثة واتساب تحتوي على تفاصيل الطلب بالكامل.
                  </p>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(29,29,31,0.5)', display: 'block', marginBottom: '0.35rem' }}>رقم الواتساب (متضمناً كود الدولة)</label>
                    <input
                      type="text" dir="ltr"
                      placeholder="201551190990"
                      value={gateways.whatsappNumber}
                      onChange={(e) => setGateways({ ...gateways, whatsappNumber: e.target.value })}
                      style={{ ...inp, padding: '0.55rem 0.85rem' }}
                    />
                  </div>
                </div>
              )}

              {gateways.activeGateway === 'paymob' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb', marginBottom: '0.2rem' }}>إعدادات حساب Paymob</p>
                  {[
                    { key: 'paymobApiKey', label: 'API Key', placeholder: 'zxC...' },
                    { key: 'paymobIntegrationId', label: 'Integration ID', placeholder: '1234567' },
                    { key: 'paymobIframeId', label: 'Iframe ID', placeholder: '112233' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(29,29,31,0.5)', display: 'block', marginBottom: '0.35rem' }}>{f.label}</label>
                      <input
                        type="text" dir="ltr"
                        placeholder={f.placeholder}
                        value={gateways[f.key as keyof typeof gateways]}
                        onChange={(e) => setGateways({ ...gateways, [f.key]: e.target.value })}
                        style={{ ...inp, padding: '0.55rem 0.85rem' }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {gateways.activeGateway === 'tap' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb', marginBottom: '0.2rem' }}>إعدادات حساب Tap</p>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(29,29,31,0.5)', display: 'block', marginBottom: '0.35rem' }}>Secret API Key</label>
                    <input
                      type="text" dir="ltr"
                      placeholder="sk_test_..."
                      value={gateways.tapSecretKey}
                      onChange={(e) => setGateways({ ...gateways, tapSecretKey: e.target.value })}
                      style={{ ...inp, padding: '0.55rem 0.85rem' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={gwSaving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', alignSelf: 'flex-start', background: gwSaving ? 'rgba(59,130,246,0.6)' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, padding: '0.65rem 1.6rem', fontWeight: 700, fontSize: '0.88rem', cursor: gwSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}>
              {gwSaving ? <RefreshCw size={16} style={{ animation: 'nexaSpin 0.7s linear infinite' }} /> : <Save size={16} />} 
              حفظ الإعدادات
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}

