'use client'
import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FiGrid, FiUsers, FiShield, FiZap, FiUserPlus, FiSettings, FiMenu, FiLogOut, FiInstagram, FiHome, FiX, FiAward } from 'react-icons/fi'
import { useAuth } from '@/lib/auth'

const NAV = [
  { href:'/admin/dashboard', icon:FiGrid,     label:'Dashboard' },
  { href:'/admin/players',   icon:FiUsers,    label:'Players' },
  { href:'/admin/teams/dashboard', icon:FiShield, label:'Teams' },
  { href:'/admin/tournaments', icon:FiAward,  label:'Tournaments' },
  { href:'/admin/auction',   icon:FiZap,      label:'Live Auction', live:true },
  { href:'/admin/users',     icon:FiUserPlus, label:'User Accounts' },
  { href:'/admin/settings',  icon:FiSettings, label:'Settings' },
]

function Sidebar({ close }: { close?: () => void }) {
  const path = usePathname()
  const { appUser, logout } = useAuth()
  const router = useRouter()

  return (
    <div className="flex flex-col h-full bg-white border-r-2 border-saffron-100">
      {/* Logo */}
      <div className="px-5 py-4 border-b-2 border-saffron-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-saffron-500 rounded-xl flex items-center justify-center text-white font-extrabold text-base">🏏</div>
          <div>
            <div className="font-extrabold text-saffron-600 text-xs leading-none">PlayerAuctionHub</div>
            <div className="text-[10px] text-stone-400 font-medium mt-0.5">Admin Panel</div>
          </div>
        </Link>
        {close && <button onClick={close} className="p-1 text-stone-400 hover:text-stone-600 lg:hidden"><FiX size={18}/></button>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const Icon = item.icon
          const active = path === item.href || (item.href !== '/admin/dashboard' && path.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} onClick={close}
              className={`nav-link ${active ? 'active' : ''}`}>
              <Icon size={16}/>
              <span className="flex-1 text-sm">{item.label}</span>
              {item.live && (
                <span className="flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
                  <span className="text-[10px] font-extrabold text-red-500">LIVE</span>
                </span>
              )}
            </Link>
          )
        })}
        <div className="pt-2 border-t border-stone-100 mt-2">
          <Link href="/" onClick={close} className="nav-link"><FiHome size={16}/><span className="text-sm">View Website</span></Link>
        </div>
        <div className="pt-1 border-t border-stone-100 mt-1">
          <p className="px-3 pt-1 pb-0.5 text-[9px] text-stone-400 font-bold uppercase tracking-widest">Overlays</p>
          <a href="/overlay" target="_blank" onClick={close} className="nav-link"><span className="text-sm">📺 OBS Overlay</span></a>
          <a href="/overlay/youtube" target="_blank" onClick={close} className="nav-link"><span className="text-sm">🔴 YouTube Live</span></a>
        </div>
      </nav>

      {/* Creator credits */}
      <div className="px-4 py-3 bg-saffron-50 border-t border-saffron-100">
        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mb-1.5 text-center">Built by</p>
        <div className="space-y-1">
          <a href="https://instagram.com/kunallll2303" target="_blank" className="flex items-center gap-1.5 text-xs font-semibold text-saffron-500 hover:text-saffron-700 transition-colors">
            <FiInstagram size={11}/> Kunal Kotak · @kunallll2303
          </a>
          <a href="https://instagram.com/yash_jani_" target="_blank" className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors">
            <FiInstagram size={11}/> Yash Jani · @yash_jani_
          </a>
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-3 border-t-2 border-stone-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-saffron-100 flex items-center justify-center text-saffron-600 font-extrabold text-sm shrink-0">
          {appUser?.displayName?.[0]?.toUpperCase() || 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">{appUser?.displayName || 'Admin'}</div>
          <div className="text-[10px] text-stone-400">Administrator</div>
        </div>
        <button onClick={async () => { await logout(); router.push('/login') }}
          className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
          <FiLogOut size={15}/>
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mob, setMob] = useState(false)
  const path = usePathname()
  const router = useRouter()
  const { appUser, loading } = useAuth()
  const title = NAV.find(n => path.startsWith(n.href))?.label || path.split('/').pop()?.replace(/-/g,' ') || 'Admin'

  // Auth guard: redirect non-admin users
  useEffect(() => {
    if (!loading && (!appUser || appUser.role !== 'admin')) {
      router.push('/login')
    }
  }, [loading, appUser, router])

  // Show loading while auth resolves
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-saffron-500 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-3 animate-pulse">🏏</div>
          <div className="text-stone-400 text-sm font-semibold">Loading…</div>
        </div>
      </div>
    )
  }

  // Don't render admin panel if not admin
  if (!appUser || appUser.role !== 'admin') return null

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 h-full overflow-y-auto"><Sidebar/></aside>

      {/* Mobile sidebar */}
      {mob && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMob(false)}/>
          <div className="fixed inset-y-0 left-0 w-60 z-50 shadow-2xl"><Sidebar close={() => setMob(false)}/></div>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b-2 border-stone-100 px-4 flex items-center gap-3 shrink-0">
          <button className="lg:hidden p-1.5 text-stone-500 hover:bg-stone-100 rounded-lg" onClick={() => setMob(true)}>
            <FiMenu size={20}/>
          </button>
          <h1 className="flex-1 text-base font-extrabold text-stone-700 capitalize">{title}</h1>
          <span className="b-orange hidden sm:flex text-xs">Admin</span>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
