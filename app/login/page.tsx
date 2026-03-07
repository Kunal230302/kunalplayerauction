'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi'
import { useAuth } from '@/lib/auth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgot,  setForgot]  = useState(false)
  const { login, logout, resetPwd, appUser, loading: authLoading } = useAuth()
  const router = useRouter()

  const dashboardUrl = appUser?.role === 'admin' ? '/admin/dashboard' : '/team/dashboard'

  // If already logged in, show welcome-back screen
  if (!authLoading && appUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 40%, #fff 100%)' }}>
        <div className="relative w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center overflow-hidden shadow-xl shadow-saffron-200 mx-auto mb-4">
            <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-extrabold text-2xl text-stone-800 mb-1">Welcome Back!</h1>
          <p className="text-stone-400 text-sm mb-6">Logged in as <strong className="text-stone-700">{appUser.displayName}</strong> ({appUser.role === 'admin' ? '👑 Admin' : '🏏 Team Owner'})</p>
          <div className="card p-6 shadow-2xl border-2 border-saffron-100 space-y-3">
            <button onClick={() => router.push(dashboardUrl)} className="btn-primary w-full py-3.5 text-base">
              Continue to Dashboard →
            </button>
            <button onClick={async () => { await logout(); toast.success('Logged out') }}
              className="btn-ghost w-full py-3 border-2 border-stone-200 text-sm">
              🔄 Switch Account / Logout
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleLogin = async () => {
    if (!email.trim() || !pass.trim()) { toast.error('Enter email and password'); return }
    setLoading(true)
    try {
      const u = await login(email.trim(), pass)
      toast.success(`Welcome, ${u.displayName}! 🏏`)
      router.push(u.role === 'admin' ? '/admin/dashboard' : '/team/dashboard')
    } catch (e: any) {
      const code = e.code || ''
      if (code.includes('invalid-credential') || code.includes('wrong-password')) toast.error('Wrong email or password')
      else if (code.includes('user-not-found')) toast.error('No account found')
      else toast.error(e.message || 'Login failed')
    }
    setLoading(false)
  }

  const handleReset = async () => {
    if (!email.trim()) { toast.error('Enter your email first'); return }
    try { await resetPwd(email.trim()); toast.success('Password reset link sent!'); setForgot(false) }
    catch { toast.error('Could not send reset email') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 40%, #fff 100%)' }}>

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f97316 0, #f97316 1px, transparent 0, transparent 50%)', backgroundSize: '30px 30px' }}/>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center overflow-hidden shadow-xl shadow-saffron-200">
              <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-extrabold text-saffron-600 text-xl leading-none">PlayerAuctionHub</div>
              <div className="text-xs text-stone-400 font-medium mt-0.5">playerauctionhub.in</div>
            </div>
          </Link>
          <h1 className="font-extrabold text-2xl text-stone-800 mt-5 mb-1">
            {forgot ? 'Reset Password' : 'Login to Auction'}
          </h1>
          <p className="text-stone-400 text-sm">
            {forgot ? 'Enter your email for a reset link' : 'Admin & Team Owners login here'}
          </p>
        </div>

        <div className="card p-7 shadow-2xl border-2 border-saffron-100">
          {!forgot ? (
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16}/>
                  <input className="input pl-11" type="email" placeholder="your@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && handleLogin()} autoFocus/>
                </div>
              </div>
              {/* Password */}
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16}/>
                  <input className="input pl-11 pr-12" type={showPw ? 'text' : 'password'} placeholder="Enter password"
                    value={pass} onChange={e => setPass(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && handleLogin()}/>
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 rounded-lg">
                    {showPw ? <FiEyeOff size={16}/> : <FiEye size={16}/>}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setForgot(true)} className="text-saffron-500 hover:text-saffron-700 text-xs font-bold hover:underline">
                  Forgot password?
                </button>
              </div>
              <button onClick={handleLogin} disabled={loading} className="btn-primary w-full py-3.5 text-base">
                {loading
                  ? <span className="flex items-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Logging in...</span>
                  : '🏏 Login to Auction'}
              </button>
              <div className="bg-amber-50 border-2 border-amber-100 rounded-xl p-3 text-center">
                <p className="text-amber-700 text-xs font-semibold">Contact your tournament admin for login credentials</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label">Your Email</label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16}/>
                  <input className="input pl-11" type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} autoFocus/>
                </div>
              </div>
              <button onClick={handleReset} className="btn-primary w-full py-3.5">Send Reset Link</button>
              <button onClick={() => setForgot(false)} className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 text-sm font-medium mx-auto">
                <FiArrowLeft size={14}/> Back to Login
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-5 space-y-1">
          <p className="text-stone-400 text-xs">
            Made with <img src="/icon.png" className="w-4 h-4 inline-block mx-0.5" alt="🏏" /> by <span className="text-saffron-500 font-bold">Kunal Kotak</span> &amp; <span className="text-blue-500 font-bold">Yash Jani</span>
          </p>
          <Link href="/" className="flex items-center justify-center gap-1 text-stone-400 hover:text-stone-600 text-xs font-medium">
            <FiArrowLeft size={12}/> Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
