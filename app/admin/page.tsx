'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiShield } from 'react-icons/fi'
import { useAuth } from '@/lib/auth'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
    const [email, setEmail] = useState('')
    const [pass, setPass] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const { login, logout, appUser, loading: authLoading } = useAuth()
    const router = useRouter()

    // If already logged in as admin → dashboard
    useEffect(() => {
        if (!authLoading && appUser?.role === 'admin') {
            router.push('/admin/dashboard')
        }
    }, [appUser, authLoading, router])

    // Already logged in but NOT admin
    if (!authLoading && appUser && appUser.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0f0f2a 50%, #0a0a1a 100%)' }}>
                <div className="text-center max-w-sm">
                    <div className="text-7xl mb-4">🚫</div>
                    <h1 className="text-2xl font-extrabold text-white mb-2">Admin Access Only</h1>
                    <p className="text-slate-400 text-sm mb-6">
                        You are logged in as <strong className="text-white">{appUser.displayName}</strong> (Team Owner).
                        This page is restricted to administrators only.
                    </p>
                    <button
                        onClick={async () => { await logout(); toast.success('Logged out') }}
                        className="bg-saffron-500 hover:bg-saffron-600 text-white font-bold px-6 py-3 rounded-xl transition-all mb-3 block w-full">
                        🔄 Logout &amp; Switch Account
                    </button>
                    <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        )
    }

    const handleLogin = async () => {
        if (!email.trim() || !pass.trim()) { toast.error('Enter email and password'); return }
        setLoading(true)
        try {
            const u = await login(email.trim(), pass)
            if (u.role !== 'admin') {
                await logout()
                toast.error('Access denied. This page is for admins only.')
                setLoading(false)
                return
            }
            toast.success(`Welcome, ${u.displayName}! 👑`)
            router.push('/admin/dashboard')
        } catch (e: any) {
            const code = e.code || ''
            if (code.includes('invalid-credential') || code.includes('wrong-password')) toast.error('Wrong email or password')
            else if (code.includes('user-not-found')) toast.error('No admin account found')
            else toast.error(e.message || 'Login failed')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0f0f2a 50%, #0a0a1a 100%)' }}>

            {/* Animated background grid */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(249,115,22,1) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

            {/* Glowing orbs */}
            <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(249,115,22,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(220,38,38,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />

            <div className="relative w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex flex-col items-center gap-3 group">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl border-2 border-saffron-500/30 group-hover:border-saffron-400/60 transition-all"
                                style={{ boxShadow: '0 0 40px rgba(249,115,22,0.2)' }}>
                                <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            {/* Crown badge */}
                            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-base"
                                style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', boxShadow: '0 0 12px rgba(255,215,0,0.5)' }}>
                                👑
                            </div>
                        </div>
                        <div>
                            <div className="font-black text-white text-xl leading-none tracking-tight">PlayerAuctionHub</div>
                            <div className="text-saffron-400 text-xs font-bold mt-1 tracking-widest uppercase">Admin Portal</div>
                        </div>
                    </Link>

                    <div className="mt-5 flex items-center justify-center gap-2 text-slate-400">
                        <FiShield size={14} className="text-saffron-400" />
                        <span className="text-sm font-medium">Restricted Access — Admins Only</span>
                    </div>
                </div>

                {/* Card */}
                <div className="rounded-3xl p-8 border border-white/10"
                    style={{
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}>
                    <h1 className="text-white font-extrabold text-2xl mb-1">Admin Login</h1>
                    <p className="text-slate-500 text-sm mb-6">Enter your admin credentials to access the auction control panel.</p>

                    <div className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Email Address</label>
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-saffron-400/60 focus:bg-white/8 transition-all"
                                    type="email" placeholder="admin@example.com"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Password</label>
                            <div className="relative">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl pl-11 pr-12 py-3.5 text-sm focus:outline-none focus:border-saffron-400/60 focus:bg-white/8 transition-all"
                                    type={showPw ? 'text' : 'password'} placeholder="Enter admin password"
                                    value={pass} onChange={e => setPass(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 rounded-lg transition-colors">
                                    {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Login button */}
                        <button
                            onClick={handleLogin} disabled={loading}
                            className="w-full py-4 rounded-xl font-extrabold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                            style={{
                                background: loading ? 'rgba(249,115,22,0.4)' : 'linear-gradient(135deg, #f97316, #ea580c)',
                                boxShadow: loading ? 'none' : '0 8px 25px rgba(249,115,22,0.35)',
                                color: 'white',
                            }}>
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Verifying…
                                </>
                            ) : (
                                <><FiShield size={16} /> Sign in as Admin</>
                            )}
                        </button>

                        {/* Warning */}
                        <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                            <span className="text-amber-400 text-base mt-0.5">⚠️</span>
                            <p className="text-amber-300/80 text-xs leading-relaxed">
                                This portal is for <strong className="text-amber-300">auction administrators only</strong>. Team owners should use the regular <Link href="/login" className="underline hover:text-amber-200">Login page</Link>.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-5">
                    <Link href="/" className="flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-400 text-sm transition-colors">
                        <FiArrowLeft size={13} /> Back to Home
                    </Link>
                </div>
            </div>
        </div>
    )
}
