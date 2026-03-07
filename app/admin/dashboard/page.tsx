'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import Link from 'next/link'
import { getPlayers, getTeams, resetTournament } from '@/lib/db'
import { FiArrowRight, FiRefreshCw, FiZap, FiAlertTriangle } from 'react-icons/fi'
import toast from 'react-hot-toast'

const TC = ['border-red-300 bg-red-50','border-blue-300 bg-blue-50','border-green-300 bg-green-50','border-purple-300 bg-purple-50']

export default function Dashboard() {
  const [players,   setPlayers]  = useState<any[]>([])
  const [teams,     setTeams]    = useState<any[]>([])
  const [loading,   setLoading]  = useState(true)
  const [confirm,   setConfirm]  = useState(false)
  const [resetting, setResetting]= useState(false)

  const load = async () => {
    setLoading(true)
    const [p, t] = await Promise.all([getPlayers(), getTeams()])
    setPlayers(p); setTeams(t); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const sold   = players.filter(p => p.status === 'sold').length
  const unsold = players.filter(p => p.status === 'unsold').length
  const avail  = players.filter(p => p.status === 'available').length

  const doReset = async () => {
    setResetting(true)
    try { await resetTournament(); toast.success('Tournament reset!'); setConfirm(false); load() }
    catch { toast.error('Reset failed') }
    setResetting(false)
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="text-stone-400 text-sm font-medium mt-0.5">Tournament overview</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setConfirm(true)} className="btn btn-sm border-2 border-red-200 text-red-500 hover:bg-red-50 gap-1.5">
              <FiRefreshCw size={13}/> Reset Tournament
            </button>
            <Link href="/admin/auction" className="btn-primary btn-sm gap-1.5">
              <FiZap size={13}/> 🔴 Go Live
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { e:'👤', v:players.length, l:'Total Players',  sub:`${avail} available`, c:'bg-blue-50 border-blue-200' },
            { e:'🏆', v:sold,           l:'Players Sold',   sub:'Auction results',    c:'bg-emerald-50 border-emerald-200' },
            { e:'❌', v:unsold,          l:'Unsold',         sub:'Can re-auction',     c:'bg-red-50 border-red-200' },
            { e:'🛡️', v:teams.length,   l:'Teams',          sub:'Max 4 allowed',      c:'bg-saffron-50 border-saffron-200' },
          ].map((s,i) => (
            <div key={i} className={`card border-2 p-4 ${s.c}`}>
              <div className="text-3xl mb-1">{s.e}</div>
              <div className="text-3xl font-extrabold text-stone-800">{loading ? '—' : s.v}</div>
              <div className="text-sm font-bold text-stone-600 mt-0.5">{s.l}</div>
              <div className="text-xs text-stone-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {players.length > 0 && (
          <div className="card p-5">
            <h2 className="sec-title mb-3">Auction Progress</h2>
            <div className="h-4 bg-stone-100 rounded-full overflow-hidden flex">
              <div className="bg-emerald-400 h-full transition-all" style={{width:`${sold/players.length*100}%`}}/>
              <div className="bg-red-300 h-full transition-all" style={{width:`${unsold/players.length*100}%`}}/>
            </div>
            <div className="flex gap-4 text-xs mt-2 text-stone-500 font-semibold">
              <span><span className="inline-block w-3 h-3 rounded bg-emerald-400 mr-1"/>Sold {sold}</span>
              <span><span className="inline-block w-3 h-3 rounded bg-red-300 mr-1"/>Unsold {unsold}</span>
              <span><span className="inline-block w-3 h-3 rounded bg-stone-200 mr-1"/>Remaining {avail}</span>
            </div>
          </div>
        )}

        {/* Teams */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="sec-title">Teams ({teams.length}/4)</h2>
            <Link href="/admin/teams" className="text-saffron-500 text-sm font-bold flex items-center gap-1">Manage <FiArrowRight size={13}/></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_,i) => {
              const t = teams[i]
              return t ? (
                <div key={t.id} className={`rounded-xl border-2 p-4 text-center ${TC[i]}`}>
                  <div className="w-12 h-12 rounded-full mx-auto mb-2 overflow-hidden bg-white border flex items-center justify-center font-extrabold text-lg">
                    {t.logoURL ? <img src={t.logoURL} className="w-full h-full object-cover"/> : t.teamName?.[0]}
                  </div>
                  <div className="text-sm font-bold truncate">{t.teamName}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{t.playersBought||0} players · {t.points||0} pts</div>
                </div>
              ) : (
                <div key={i} className="rounded-xl border-2 border-dashed border-stone-200 p-6 text-center text-stone-300">
                  <div className="text-2xl">+</div><div className="text-xs mt-1">Slot {i+1}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {href:'/admin/players', e:'➕', l:'Add Player',    c:'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'},
            {href:'/admin/teams',   e:'🛡️', l:'Manage Teams',  c:'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'},
            {href:'/admin/users',   e:'👤', l:'Add User',      c:'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'},
            {href:'/admin/auction', e:'🔴', l:'Start Auction', c:'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'},
          ].map(a => (
            <Link key={a.href} href={a.href} className={`card border-2 p-4 text-center font-bold text-sm transition-all hover:-translate-y-0.5 ${a.c}`}>
              <div className="text-2xl mb-1">{a.e}</div>{a.l}
            </Link>
          ))}
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-slide-up border-2 border-red-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center"><FiAlertTriangle className="text-red-500" size={24}/></div>
              <div><h2 className="font-extrabold text-lg">Reset Tournament?</h2><p className="text-stone-400 text-xs">Cannot be undone!</p></div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5 space-y-1 text-sm text-red-600 font-semibold">
              <div>• All players reset to "available"</div>
              <div>• All team points reset to 0</div>
              <div>• Live auction data cleared</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(false)} className="btn-ghost flex-1 border-2 border-stone-200">Cancel</button>
              <button onClick={doReset} disabled={resetting} className="btn-danger flex-1">{resetting ? 'Resetting...' : 'Yes, Reset'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
