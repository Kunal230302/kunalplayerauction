'use client'
import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getTournaments, getPlayers, deletePlayer, Tournament, Player } from '@/lib/db'
import { FiTrash2, FiSearch, FiX, FiImage, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'

const ROLES = ['Batsman','Bowler','All-Rounder','Wicket-Keeper']
const S_BADGE: Record<string,string> = { available:'b-gray', sold:'b-green', unsold:'b-red' }

export default function PlayersPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<string>('')
  const [players, setPlayers] = useState<Player[]>([])
  const [shown,   setShown]   = useState<Player[]>([])
  const [search,  setSearch]  = useState('')
  const [roleF,   setRoleF]   = useState('All')
  const [detail,  setDetail]  = useState<Player | null>(null)

  // Load tournaments first
  useEffect(() => {
    getTournaments().then(ts => {
      setTournaments(ts)
      if (ts.length > 0) setSelectedTournament(ts[0].id)
    })
  }, [])

  // Load players when tournament changes
  const load = async (tid?: string) => {
    const id = tid || selectedTournament
    if (!id) { setPlayers([]); return }
    const p = await getPlayers(id)
    setPlayers(p)
  }
  useEffect(() => { load(selectedTournament) }, [selectedTournament])

  // Filter
  useEffect(() => {
    let f = players
    if (roleF !== 'All') f = f.filter(p => p.role === roleF)
    if (search.trim()) f = f.filter(p => (p.name+' '+p.surname+' '+p.district+' '+p.mobile).toLowerCase().includes(search.toLowerCase()))
    setShown(f)
  }, [players, roleF, search])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    await deletePlayer(id, selectedTournament); toast.success('Deleted'); load()
  }

  const currentTournament = tournaments.find(t => t.id === selectedTournament)

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">Players</h1>
            <p className="text-stone-400 text-sm">{players.length} total · {players.filter(p=>p.status==='available').length} available</p>
          </div>
          <button onClick={() => load()} className="btn-outline gap-2 flex items-center">
            <FiRefreshCw size={15}/> Refresh
          </button>
        </div>

        {/* Tournament Selector */}
        <div className="card p-4 border-2 border-saffron-100 bg-saffron-50/30">
          <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">🏆 Select Tournament</label>
          {tournaments.length === 0 ? (
            <p className="text-sm text-stone-400">No tournaments. Create one first.</p>
          ) : (
            <select className="input bg-white" value={selectedTournament} onChange={e => setSelectedTournament(e.target.value)}>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name} (Code: {t.code})</option>
              ))}
            </select>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={15}/>
            <input className="input pl-11 text-sm" placeholder="Search name, surname, mobile, district…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['All',...ROLES].map(r => (
              <button key={r} onClick={()=>setRoleF(r)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all ${roleF===r ? 'bg-saffron-500 text-white border-saffron-500' : 'border-stone-200 text-stone-500 hover:border-saffron-300 bg-white'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Players Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-saffron-50 border-b-2 border-saffron-100">
                <tr>
                  {['Player','📱 Mobile','🎂 DOB','📍 District','🏘️ Taluka','🏏 Role','Status','💰 Payment','Actions'].map(h=>(
                    <th key={h} className="text-left px-3 py-3 text-xs font-extrabold text-stone-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {shown.map(p => (
                  <tr key={p.id} className="hover:bg-saffron-50/30 transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-saffron-50 border-2 border-saffron-100 overflow-hidden flex items-center justify-center font-extrabold text-saffron-500 shrink-0 text-xs">
                          {p.photoURL ? <img src={p.photoURL} className="w-full h-full object-cover"/> : (p.name?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-sm">{p.name} {p.surname}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-stone-600 font-mono">{p.mobile || '—'}</td>
                    <td className="px-3 py-3 text-xs text-stone-400">{p.dob || '—'}</td>
                    <td className="px-3 py-3 text-xs text-stone-600">{p.district || '—'}</td>
                    <td className="px-3 py-3 text-xs text-stone-400">{p.taluka || '—'}</td>
                    <td className="px-3 py-3"><span className="b-orange text-[11px]">{p.role}</span></td>
                    <td className="px-3 py-3"><span className={`${S_BADGE[p.status]||'b-gray'} text-[11px]`}>{p.status||'available'}</span></td>
                    <td className="px-3 py-3">
                      {p.paymentScreenshotURL ? (
                        <button onClick={() => window.open(p.paymentScreenshotURL, '_blank')}
                          className="text-green-600 bg-green-50 border border-green-200 rounded-lg px-2 py-1 text-[10px] font-bold hover:bg-green-100 transition">
                          ✅ View
                        </button>
                      ) : (
                        <span className="text-stone-300 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setDetail(p)} className="p-1.5 text-stone-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="View Details">
                          <FiImage size={14}/>
                        </button>
                        <button onClick={()=>handleDelete(p.id,p.name)} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <FiTrash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {shown.length===0 && (
                  <tr><td colSpan={9} className="text-center py-12 text-stone-400">
                    {players.length===0
                      ? <div><div className="text-4xl mb-2">👤</div><p>No players registered in this tournament yet.</p></div>
                      : 'No players match your filters.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Player Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border-2 border-saffron-100 animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-stone-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-extrabold text-lg">Player Details</h2>
              <button onClick={() => setDetail(null)} className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg"><FiX size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Photo */}
              <div className="text-center">
                <div className="w-24 h-24 rounded-2xl border-3 border-saffron-200 bg-saffron-50 mx-auto overflow-hidden flex items-center justify-center">
                  {detail.photoURL ? <img src={detail.photoURL} className="w-full h-full object-cover"/> : <span className="text-4xl">👤</span>}
                </div>
                <h3 className="font-extrabold text-xl mt-3">{detail.name} {detail.surname}</h3>
                <span className="b-orange text-xs">{detail.role}</span>
              </div>

              <div className="space-y-2.5">
                {[
                  ['📱', 'Mobile', detail.mobile],
                  ['🎂', 'Date of Birth', detail.dob],
                  ['📍', 'District', detail.district],
                  ['🏘️', 'Taluka', detail.taluka],
                  ['🏏', 'Status', detail.status],
                  ['💰', 'Sold To', detail.soldToName || '—'],
                  ['🏆', 'Sold Points', detail.soldPoints ? `${detail.soldPoints} pts` : '—'],
                ].map(([icon, label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-stone-50">
                    <span className="text-xs text-stone-400 font-semibold">{icon} {label}</span>
                    <span className="text-sm font-bold text-stone-700">{value || '—'}</span>
                  </div>
                ))}
              </div>

              {/* Payment Screenshot */}
              {detail.paymentScreenshotURL && (
                <div className="border-t pt-4">
                  <p className="text-xs font-bold text-stone-500 mb-2">💰 Payment Screenshot</p>
                  <img src={detail.paymentScreenshotURL} className="w-full rounded-xl border-2 border-green-100" alt="Payment"/>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
