'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addTournament } from '@/lib/db'
import { useAuth } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { FiArrowLeft, FiUpload, FiCheck, FiCopy, FiLogIn } from 'react-icons/fi'
import toast from 'react-hot-toast'

const BALL_TYPES = ['Tennis Ball', 'Leather Ball', 'Heavy Tennis Ball', 'Mini Ball (Smiley)', 'Plastic Ball']
const ballEmoji: Record<string, string> = {
  'Tennis Ball': '🎾', 'Leather Ball': '🏏', 'Heavy Tennis Ball': '🥎',
  'Mini Ball (Smiley)': '😊', 'Plastic Ball': '⚪',
}

export default function RegisterTournament() {
  const router = useRouter()
  const { appUser, loading: authLoading, login, register } = useAuth()

  // Auth form state (shown when not logged in)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPass, setAuthPass] = useState('')
  const [authName, setAuthName] = useState('')
  const [authLoading2, setAuthLoading2] = useState(false)

  // Tournament form state (must be before any returns — React hooks rules)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ id: string; code: string } | null>(null)
  const [logo, setLogo] = useState<File | null>(null)
  const [preview2, setPreview2] = useState('')
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [qrPreview, setQrPreview] = useState('')
  const [form, setForm] = useState({
    name: '', description: '', entryFee: 0, ballType: 'Tennis Ball',
    totalPlayersRequired: 0, groundName: '', groundLocation: '', auctionLocation: '',
  })

  const F = (k: string, v: any) => setForm({ ...form, [k]: v })

  const handleAuth = async () => {
    if (!authEmail.trim() || !authPass.trim()) { toast.error('Enter email and password'); return }
    if (authTab === 'register' && !authName.trim()) { toast.error('Enter your name'); return }
    if (authTab === 'register' && authPass.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setAuthLoading2(true)
    try {
      if (authTab === 'login') {
        await login(authEmail.trim(), authPass)
        toast.success('Logged in!')
      } else {
        await register(authEmail.trim(), authPass, authName.trim())
        toast.success('Account created!')
      }
    } catch (e: any) {
      const code = e.code || ''
      if (code.includes('email-already-in-use')) toast.error('Email already registered. Try login.')
      else if (code.includes('invalid-credential') || code.includes('wrong-password')) toast.error('Wrong email or password')
      else if (code.includes('user-not-found')) toast.error('No account found. Try register.')
      else toast.error(e.message || 'Auth failed')
    }
    setAuthLoading2(false)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Tournament name is required'); return }
    if (!appUser) return
    setSaving(true)
    try {
      let logoURL = ''
      if (logo) {
        logoURL = await uploadToCloudinary(logo, 'tournament-logos')
      }
      let upiQrURL = ''
      if (qrFile) {
        upiQrURL = await uploadToCloudinary(qrFile, 'tournament-qr')
      }
      const res = await addTournament({
        ...form, logoURL, upiQrURL, createdBy: appUser.uid, isAdmin: appUser.role === 'admin', maxFreeTeams: appUser.role === 'admin' ? 9999 : 4,
      })
      setResult(res)
      setStep('success')
      toast.success('Tournament registered!')
    } catch (e: any) { toast.error(e.message || 'Failed to create tournament') }
    setSaving(false)
  }

  const copyCode = () => {
    if (result) {
      navigator.clipboard.writeText(result.code)
      toast.success('Tournament code copied!')
    }
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  // Loading
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-5xl animate-bounce">🏏</div>
    </div>
  )

  // Not logged in — inline Login/Register form
  if (!appUser) return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 40%, #fff 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-2xl font-extrabold text-stone-800">Register Tournament</h1>
          <p className="text-stone-400 text-sm mt-1">Login or create an account to get started</p>
        </div>

        <div className="card p-6 shadow-2xl border-2 border-saffron-100 space-y-4">
          {/* Tabs */}
          <div className="flex bg-stone-100 rounded-xl p-1">
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => setAuthTab(t)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authTab === t ? 'bg-saffron-500 text-white shadow-md' : 'text-stone-400 hover:text-stone-600'}`}>
                {t === 'login' ? '🔑 Login' : '✨ Register'}
              </button>
            ))}
          </div>

          {/* Register: Name field */}
          {authTab === 'register' && (
            <div>
              <label className="label">Your Name</label>
              <input className="input" placeholder="e.g. Kunal Kotak" value={authName} onChange={e => setAuthName(e.target.value)}/>
            </div>
          )}

          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@email.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)}/>
          </div>

          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder={authTab === 'register' ? 'Min 6 characters' : '••••••••'}
              value={authPass} onChange={e => setAuthPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}/>
          </div>

          <button onClick={handleAuth} disabled={authLoading2} className="btn-primary w-full py-3 text-base gap-2">
            {authLoading2 ? 'Please wait…' : authTab === 'login' ? <><FiLogIn size={16}/> Login</> : '✨ Create Account'}
          </button>
        </div>

        <p className="text-xs text-stone-300 mt-4 text-center">
          <Link href="/" className="hover:text-saffron-500">← Back to Home</Link>
        </p>
      </div>
    </div>
  )
  // All hooks are declared above. Render tournament form.

  if (step === 'success' && result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 40%, #fff 100%)' }}>
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-extrabold text-stone-800 mb-2">Tournament Created!</h1>
          <p className="text-stone-400 mb-6">Share the code and links below with your players and teams</p>

          <div className="card p-6 shadow-2xl border-2 border-saffron-100 space-y-4 text-left">
            {/* Tournament Code */}
            <div className="bg-saffron-50 border-2 border-saffron-200 rounded-xl p-4 text-center">
              <p className="text-xs text-saffron-500 font-bold uppercase tracking-widest mb-1">Tournament Code</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-black text-saffron-600 tracking-widest">{result.code}</span>
                <button onClick={copyCode} className="p-2 rounded-lg bg-saffron-100 hover:bg-saffron-200 text-saffron-600 transition-all">
                  <FiCopy size={18}/>
                </button>
              </div>
            </div>

            {/* Links */}
            <div className="space-y-2">
              <div className="bg-stone-50 rounded-xl p-3">
                <p className="text-xs text-stone-400 font-bold mb-1">🏆 Tournament Page</p>
                <code className="text-xs text-saffron-600 break-all font-mono">{baseUrl}/t/{result.code}</code>
              </div>
              <div className="bg-stone-50 rounded-xl p-3">
                <p className="text-xs text-stone-400 font-bold mb-1">👤 Player Registration Link</p>
                <code className="text-xs text-blue-600 break-all font-mono">{baseUrl}/t/{result.code}/players</code>
              </div>
              <div className="bg-stone-50 rounded-xl p-3">
                <p className="text-xs text-stone-400 font-bold mb-1">🛡️ Team Registration Link</p>
                <code className="text-xs text-green-600 break-all font-mono">{baseUrl}/t/{result.code}/teams</code>
              </div>
            </div>

            {/* Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-semibold">
              📌 Free plan: Up to 4 teams. Need more teams? Contact admin for ₹199/team upgrade.
            </div>

            <div className="flex gap-3">
              <Link href={`/t/${result.code}`} className="btn-primary flex-1 text-center py-3">
                View Tournament →
              </Link>
              <Link href="/" className="btn-ghost flex-1 text-center py-3 border-2 border-stone-200">
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4"
      style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 40%, #fff 100%)' }}>

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pt-4">
          <Link href="/" className="p-2 rounded-lg hover:bg-saffron-100 text-stone-400 transition"><FiArrowLeft size={20}/></Link>
          <div>
            <h1 className="text-2xl font-extrabold text-stone-800">Register Tournament</h1>
            <p className="text-stone-400 text-sm">Create your local cricket auction tournament</p>
          </div>
        </div>

        {/* Free tier banner */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-5 text-center">
          <p className="text-green-700 font-bold text-sm">🆓 Free — Up to 4 teams per tournament</p>
          <p className="text-green-500 text-xs mt-0.5">Need more teams? ₹199 per extra team · Contact admin</p>
        </div>

        <div className="card p-6 shadow-xl border-2 border-saffron-100 space-y-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div onClick={() => document.getElementById('tlogo')?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-saffron-300 bg-saffron-50 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-saffron-100 transition shrink-0">
              {preview2 ? <img src={preview2} className="w-full h-full object-cover"/> : <FiUpload className="text-saffron-400 text-xl"/>}
            </div>
            <div>
              <input id="tlogo" type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0]; if (f) { setLogo(f); setPreview2(URL.createObjectURL(f)) }
              }}/>
              <button onClick={() => document.getElementById('tlogo')?.click()} className="btn-outline btn-sm">Upload Logo</button>
              <p className="text-xs text-stone-400 mt-1">Tournament logo (optional)</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="label">Tournament Name *</label>
            <input className="input" placeholder="e.g. Unjha Premier League 2025" value={form.name} onChange={e => F('name', e.target.value)}/>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[60px] resize-none" placeholder="Brief description…" value={form.description} onChange={e => F('description', e.target.value)}/>
          </div>

          {/* Entry Fee & Ball Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Entry Fee (₹)</label>
              <input className="input" type="number" min={0} placeholder="0" value={form.entryFee || ''} onChange={e => F('entryFee', parseInt(e.target.value) || 0)}/>
            </div>
            <div>
              <label className="label">Ball Type</label>
              <select className="input" value={form.ballType} onChange={e => F('ballType', e.target.value)}>
                {BALL_TYPES.map(b => <option key={b} value={b}>{ballEmoji[b]} {b}</option>)}
              </select>
            </div>
          </div>

          {/* Player count */}
          <div>
            <label className="label">Total Players Required</label>
            <input className="input" type="number" min={0} placeholder="e.g. 60" value={form.totalPlayersRequired || ''} onChange={e => F('totalPlayersRequired', parseInt(e.target.value) || 0)}/>
          </div>

          {/* UPI QR Code Upload */}
          <div className="border-t pt-4">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">💳 UPI / GPay QR Code <span className="text-stone-300">(for player registration fee)</span></p>
            <div className="flex items-center gap-4">
              <div onClick={() => document.getElementById('upiQr')?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-green-300 bg-green-50 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-green-100 transition shrink-0">
                {qrPreview ? <img src={qrPreview} className="w-full h-full object-contain"/> : <span className="text-3xl">📱</span>}
              </div>
              <div>
                <input id="upiQr" type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0]; if (f) { setQrFile(f); setQrPreview(URL.createObjectURL(f)) }
                }}/>
                <button onClick={() => document.getElementById('upiQr')?.click()} className="btn-outline btn-sm">Upload QR Code</button>
                <p className="text-xs text-stone-400 mt-1">Upload your GPay/UPI QR for player fee collection</p>
              </div>
            </div>
          </div>

          {/* Ground */}
          <div className="border-t pt-4">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">📍 Ground Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Ground Name</label>
                <input className="input" placeholder="e.g. Municipal Stadium" value={form.groundName} onChange={e => F('groundName', e.target.value)}/>
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" placeholder="e.g. Unjha, Gujarat" value={form.groundLocation} onChange={e => F('groundLocation', e.target.value)}/>
              </div>
            </div>
          </div>

          {/* Auction location */}
          <div className="border-t pt-4">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">🏏 Auction Location <span className="text-stone-300">(Optional)</span></p>
            <input className="input" placeholder="e.g. Hotel Patil, Unjha" value={form.auctionLocation} onChange={e => F('auctionLocation', e.target.value)}/>
          </div>

          <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full py-3.5 text-base gap-2">
            {saving ? 'Creating…' : <><FiCheck size={18}/> Register Tournament (Free)</>}
          </button>
        </div>
      </div>
    </div>
  )
}
