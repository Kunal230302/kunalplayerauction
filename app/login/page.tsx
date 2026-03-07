'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiPhone } from 'react-icons/fi'
import { useAuth } from '@/lib/auth'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [tab, setTab] = useState<'email' | 'phone'>('email')
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgot,  setForgot]  = useState(false)

  // Phone login state
  const [phone, setPhone]     = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp]         = useState('')
  const [confirmResult, setConfirmResult] = useState<any>(null)
  const [timer, setTimer]     = useState(0)

  const { login, logout, resetPwd, appUser, loading: authLoading } = useAuth()
  const router = useRouter()

  const dashboardUrl = appUser?.role === 'admin' ? '/admin/dashboard' : '/team/dashboard'

  // If already logged in
  if (!authLoading && appUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 40%, #fff 100%)' }}>
        <div className="relative w-full max-w-md text-center">
          <div className="w-16 h-16 bg-saffron-500 rounded-3xl flex items-center justify-center text-white text-3xl shadow-xl shadow-saffron-200 mx-auto mb-4">🏏</div>
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

  // Email login
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

  // Phone OTP send
  const sendPhoneOTP = async () => {
    if (!phone || phone.length < 10) { toast.error('Enter valid 10-digit phone number'); return }
    setLoading(true)
    try {
      // Clear old recaptcha
      const container = document.getElementById('recaptcha-login')
      if (container) container.innerHTML = ''
      const recaptcha = new RecaptchaVerifier(auth, 'recaptcha-login', { size: 'invisible' })
      const fullNumber = `+91${phone.replace(/\D/g, '').slice(-10)}`
      const result = await signInWithPhoneNumber(auth, fullNumber, recaptcha)
      setConfirmResult(result)
      setOtpSent(true)
      setTimer(60)
      const iv = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(iv); return 0 } return t - 1 }), 1000)
      toast.success('OTP sent! 📲')
    } catch (e: any) {
      if (e.code === 'auth/too-many-requests') toast.error('Too many attempts. Wait and try again.')
      else toast.error(e.message || 'Failed to send OTP')
    }
    setLoading(false)
  }

  // Verify phone OTP
  const verifyPhoneOTP = async () => {
    if (otp.length !== 6) { toast.error('Enter 6-digit OTP'); return }
    if (!confirmResult) { toast.error('OTP expired. Send again.'); return }
    setLoading(true)
    try {
      const credential = await confirmResult.confirm(otp)
      const uid = credential.user.uid

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        toast.success(`Welcome, ${userData.displayName || 'User'}! 🏏`)
        router.push(userData.role === 'admin' ? '/admin/dashboard' : '/team/dashboard')
      } else {
        toast.success('Phone verified! 📱')
        router.push('/team/dashboard')
      }
    } catch {
      toast.error('Wrong OTP. Try again.')
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

      <div id="recaptcha-login" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-saffron-500 rounded-3xl flex items-center justify-center text-white text-3xl shadow-xl shadow-saffron-200">🏏</div>
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
              {/* Tab Switcher */}
              <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
                <button onClick={() => setTab('email')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition ${tab === 'email' ? 'bg-white shadow text-saffron-600' : 'text-stone-400 hover:text-stone-600'}`}>
                  <FiMail size={14}/> Email
                </button>
                <button onClick={() => setTab('phone')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition ${tab === 'phone' ? 'bg-white shadow text-saffron-600' : 'text-stone-400 hover:text-stone-600'}`}>
                  <FiPhone size={14}/> Phone OTP
                </button>
              </div>

              {tab === 'email' ? (
                <>
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
                </>
              ) : (
                /* ── Phone OTP Login ── */
                <>
                  {!otpSent ? (
                    <>
                      <div>
                        <label className="label">📱 Phone Number</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-sm">+91</span>
                          <input className="input pl-14" type="tel" maxLength={10} placeholder="9876543210"
                            value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            onKeyDown={e => e.key === 'Enter' && sendPhoneOTP()} autoFocus/>
                        </div>
                      </div>
                      <button onClick={sendPhoneOTP} disabled={loading || phone.length < 10} className="btn-primary w-full py-3.5 text-base">
                        {loading ? '⏳ Sending OTP…' : '📲 Send OTP'}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center">
                        <p className="text-sm text-green-700 font-semibold">✅ OTP Sent to +91 {phone}</p>
                      </div>
                      <div>
                        <label className="label">Enter 6-digit OTP</label>
                        <input className="input text-center text-2xl tracking-[0.5em] font-bold"
                          type="text" maxLength={6} placeholder="● ● ● ● ● ●"
                          value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                          onKeyDown={e => e.key === 'Enter' && verifyPhoneOTP()} autoFocus/>
                      </div>
                      <button onClick={verifyPhoneOTP} disabled={loading || otp.length !== 6} className="btn-primary w-full py-3.5 text-base">
                        {loading ? '⏳ Verifying…' : '✅ Verify & Login'}
                      </button>
                      <div className="flex justify-between text-xs">
                        <button onClick={sendPhoneOTP} disabled={timer > 0 || loading}
                          className="text-saffron-600 font-bold hover:underline disabled:text-stone-300">
                          {timer > 0 ? `Resend in ${timer}s` : '🔄 Resend OTP'}
                        </button>
                        <button onClick={() => { setOtpSent(false); setOtp('') }}
                          className="text-stone-400 hover:text-stone-600">Change Number</button>
                      </div>
                    </>
                  )}
                </>
              )}

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
            Made with 🏏 by <span className="text-saffron-500 font-bold">Kunal Kotak</span> &amp; <span className="text-blue-500 font-bold">Yash Jani</span>
          </p>
          <Link href="/" className="flex items-center justify-center gap-1 text-stone-400 hover:text-stone-600 text-xs font-medium">
            <FiArrowLeft size={12}/> Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
