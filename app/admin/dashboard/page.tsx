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
  const [loading,   setLoading]  = useState(true)

  const load = async () => {
    setLoading(true)
    const p = await getPlayers()
    setPlayers(p); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const avail  = players.filter(p => p.status === 'available').length

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">Live Player Registration</h1>
            <p className="text-stone-400 text-sm font-medium mt-0.5">Real-time player registration status</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/admin/players" className="btn-primary btn-sm gap-1.5">
              <FiZap size={13}/> Register Players
            </Link>
          </div>
        </div>

        {/* Live Registration Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { e:'👤', v:players.length, l:'Total Players',  sub:`${avail} available`, c:'bg-blue-50 border-blue-200' },
            { e:'📝', v:avail,           l:'Available',       sub:'Ready for auction',    c:'bg-emerald-50 border-emerald-200' },
            { e:'🔄', v:0,               l:'In Progress',      sub:'Registration active',   c:'bg-saffron-50 border-saffron-200' },
          ].map((s,i) => (
            <div key={i} className={`card border-2 p-4 ${s.c}`}>
              <div className="text-3xl mb-1">{s.e}</div>
              <div className="text-3xl font-extrabold text-stone-800">{loading ? '—' : s.v}</div>
              <div className="text-sm font-bold text-stone-600 mt-0.5">{s.l}</div>
              <div className="text-xs text-stone-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Registration Progress */}
        {players.length > 0 && (
          <div className="card p-5">
            <h2 className="sec-title mb-3">Registration Progress</h2>
            <div className="h-4 bg-stone-100 rounded-full overflow-hidden flex">
              <div className="bg-emerald-400 h-full transition-all" style={{width:`${avail/players.length*100}%`}}/>
              <div className="bg-stone-200 h-full transition-all" style={{width:`${(players.length-avail)/players.length*100}%`}}/>
            </div>
            <div className="flex gap-4 text-xs mt-2 text-stone-500 font-semibold">
              <span><span className="inline-block w-3 h-3 rounded bg-emerald-400 mr-1"/>Available {avail}</span>
              <span><span className="inline-block w-3 h-3 rounded bg-stone-200 mr-1"/>Processing {players.length-avail}</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {href:'/admin/players', e:'➕', l:'Register New Player', c:'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'},
            {href:'/admin/auction', e:'🔴', l:'Start Live Auction', c:'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'},
          ].map(a => (
            <Link key={a.href} href={a.href} className={`card border-2 p-4 text-center font-bold text-sm transition-all hover:-translate-y-0.5 ${a.c}`}>
              <div className="text-2xl mb-1">{a.e}</div>{a.l}
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
