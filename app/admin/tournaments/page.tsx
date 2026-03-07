'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { getTournaments, addTournament, updateTournament, deleteTournament, getTournamentByCode, Tournament } from '@/lib/db'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiUpload, FiMapPin, FiUsers, FiZap } from 'react-icons/fi'
import toast from 'react-hot-toast'

const BALL_TYPES = ['Tennis Ball', 'Leather Ball', 'Heavy Tennis Ball', 'Mini Ball (Smiley)', 'Plastic Ball']
const STATUS_OPTS = ['upcoming', 'live', 'ended'] as const

const BLANK: {
  name: string; description: string; logoURL: string; entryFee: number
  totalPlayersRequired: number; registeredPlayers: number; ballType: string
  groundName: string; groundLocation: string; auctionLocation: string
  status: 'upcoming' | 'live' | 'ended'
} = {
  name: '', description: '', logoURL: '', entryFee: 0,
  totalPlayersRequired: 0, registeredPlayers: 0, ballType: 'Tennis Ball',
  groundName: '', groundLocation: '', auctionLocation: '', status: 'upcoming',
}

export default function TournamentsPage() {
  const router = useRouter()
  const [list,    setList]    = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState<Tournament | null>(null)
  const [form,    setForm]    = useState({ ...BLANK })
  const [logo,    setLogo]    = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [search,  setSearch]  = useState('')
  const [auctionCode, setAuctionCode] = useState('')
  const [startingAuction, setStartingAuction] = useState(false)

  const load = async () => {
    setLoading(true)
    setList(await getTournaments())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  // Start auction by tournament code
  const handleStartAuction = async () => {
    if (!auctionCode.trim()) { toast.error('Enter tournament code'); return }
    setStartingAuction(true)
    try {
      const t = await getTournamentByCode(auctionCode.trim().toUpperCase())
      if (!t) { toast.error('Tournament not found!'); setStartingAuction(false); return }
      await updateTournament(t.id, { status: 'live' })
      toast.success(`🏏 Auction started for "${t.name}"!`)
      router.push(`/admin/auction?tournamentId=${t.id}`)
    } catch (e: any) { toast.error(e.message) }
    setStartingAuction(false)
  }

  const shown = list.filter(t =>
    (t.name + ' ' + t.groundName + ' ' + t.ballType).toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => { setEditing(null); setForm({ ...BLANK }); setLogo(null); setPreview(''); setModal(true) }
  const openEdit = (t: Tournament) => {
    setEditing(t)
    setForm({
      name: t.name, description: t.description, logoURL: t.logoURL || '',
      entryFee: t.entryFee, totalPlayersRequired: t.totalPlayersRequired,
      registeredPlayers: t.registeredPlayers || 0, ballType: t.ballType,
      groundName: t.groundName || '', groundLocation: t.groundLocation || '',
      auctionLocation: t.auctionLocation || '', status: t.status,
    })
    setPreview(t.logoURL || '')
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Tournament name is required'); return }
    setSaving(true)
    try {
      let logoURL = form.logoURL
      if (logo) {
        logoURL = await uploadToCloudinary(logo, 'tournament-logos')
      }
      const data = { ...form, logoURL }
      if (editing) {
        await updateTournament(editing.id, data)
        toast.success('Tournament updated!')
      } else {
        const { registeredPlayers, status, ...rest } = data
        await addTournament(rest as any)
        toast.success('Tournament created!')
      }
      setModal(false); load()
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    await deleteTournament(id)
    toast.success('Tournament deleted'); load()
  }

  const changeStatus = async (id: string, status: string) => {
    await updateTournament(id, { status })
    toast.success(`Status → ${status}`)
    load()
  }

  const startAuctionForTournament = async (t: Tournament) => {
    await updateTournament(t.id, { status: 'live' })
    toast.success(`🏏 Auction started for "${t.name}"!`)
    router.push(`/admin/auction?tournamentId=${t.id}`)
  }

  const F = (k: string, val: any) => setForm({ ...form, [k]: val })
  const ballEmoji: Record<string, string> = {
    'Tennis Ball': '🎾', 'Leather Ball': '🏏', 'Heavy Tennis Ball': '🥎',
    'Mini Ball (Smiley)': '😊', 'Plastic Ball': '⚪',
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">Tournaments</h1>
            <p className="text-stone-400 text-sm">{list.length} tournament{list.length !== 1 ? 's' : ''} registered</p>
          </div>
          <button onClick={openAdd} className="btn-primary gap-2"><FiPlus size={16}/> Register Tournament</button>
        </div>

        {/* 🏏 Quick Auction Start by Code */}
        <div className="card p-5 border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">🏏 Start Auction by Tournament Code</p>
          <div className="flex gap-2">
            <input className="input flex-1 bg-white text-lg font-mono tracking-widest text-center" 
              placeholder="Enter Code (e.g. 123)" value={auctionCode} 
              onChange={e => setAuctionCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStartAuction()}/>
            <button onClick={handleStartAuction} disabled={startingAuction}
              className="bg-green-500 hover:bg-green-600 text-white font-extrabold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shrink-0">
              <FiZap size={18}/> {startingAuction ? 'Starting…' : 'Start Auction'}
            </button>
          </div>
          <p className="text-xs text-green-600 mt-2">Enter the 3-digit tournament code and hit Start — auction goes LIVE instantly!</p>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={15}/>
          <input className="input pl-11 text-sm" placeholder="Search tournament, ground, or ball type…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>

        {/* Tournament cards */}
        {loading ? (
          <div className="card p-16 text-center text-stone-400">Loading tournaments…</div>
        ) : shown.length === 0 ? (
          <div className="card p-16 text-center text-stone-400">
            {list.length === 0 ? (
              <div><div className="text-5xl mb-3">🏆</div><p>No tournaments yet.</p>
                <button onClick={openAdd} className="text-saffron-500 hover:underline text-sm mt-2">Register first tournament →</button>
              </div>
            ) : 'No tournaments match your search.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shown.map(t => (
              <div key={t.id} className="card border-2 border-stone-100 hover:border-saffron-200 hover:shadow-lg transition-all overflow-hidden">
                {/* Status ribbon */}
                <div className={`px-4 py-1.5 text-center text-xs font-extrabold uppercase tracking-widest
                  ${t.status === 'live' ? 'bg-green-500 text-white' : t.status === 'ended' ? 'bg-stone-400 text-white' : 'bg-saffron-100 text-saffron-700'}`}>
                  {t.status === 'live' ? '🔴 LIVE' : t.status === 'ended' ? '✅ ENDED' : '🕐 UPCOMING'}
                </div>

                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    {/* Logo */}
                    <div className="w-16 h-16 rounded-xl border-2 border-saffron-100 bg-saffron-50 flex items-center justify-center overflow-hidden shrink-0">
                      {t.logoURL ? <img src={t.logoURL} className="w-full h-full object-cover"/> : <span className="text-3xl">🏆</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-base leading-tight truncate">{t.name}</h3>
                      {t.description && <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">{t.description}</p>}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                          {ballEmoji[t.ballType] || '⚾'} {t.ballType}
                        </span>
                        {t.entryFee > 0 && (
                          <span className="text-xs font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            ₹{t.entryFee}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-stone-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-stone-400">Players Required</div>
                      <div className="font-extrabold text-saffron-600 text-lg">{t.totalPlayersRequired}</div>
                    </div>
                    <div className="bg-stone-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-stone-400">Registered</div>
                      <div className="font-extrabold text-green-600 text-lg">{t.registeredPlayers || 0}</div>
                    </div>
                  </div>

                  {/* Player progress bar */}
                  {t.totalPlayersRequired > 0 && (
                    <div className="mb-3">
                      <div className="w-full bg-stone-100 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${
                          (t.registeredPlayers || 0) >= t.totalPlayersRequired ? 'bg-red-500' : 'bg-green-500'
                        }`} style={{ width: `${Math.min(100, ((t.registeredPlayers || 0) / t.totalPlayersRequired) * 100)}%` }}/>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">
                        {Math.round(((t.registeredPlayers || 0) / t.totalPlayersRequired) * 100)}% filled
                        {(t.registeredPlayers || 0) >= t.totalPlayersRequired && ' · 🔒 Full'}
                      </p>
                    </div>
                  )}

                  {/* Ground info */}
                  {(t.groundName || t.groundLocation) && (
                    <div className="bg-blue-50 rounded-lg p-2.5 mb-3 flex items-start gap-2">
                      <FiMapPin size={13} className="text-blue-500 mt-0.5 shrink-0"/>
                      <div>
                        {t.groundName && <div className="text-xs font-semibold text-blue-700">{t.groundName}</div>}
                        {t.groundLocation && <div className="text-[11px] text-blue-500">{t.groundLocation}</div>}
                      </div>
                    </div>
                  )}
                  {t.auctionLocation && (
                    <div className="bg-purple-50 rounded-lg p-2.5 mb-3 flex items-start gap-2">
                      <FiUsers size={13} className="text-purple-500 mt-0.5 shrink-0"/>
                      <div>
                        <div className="text-[11px] text-purple-500">Auction Location</div>
                        <div className="text-xs font-semibold text-purple-700">{t.auctionLocation}</div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1.5 flex-wrap">
                    {STATUS_OPTS.map(s => (
                      <button key={s} onClick={() => changeStatus(t.id, s)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold capitalize transition ${
                          t.status === s
                            ? s === 'live' ? 'bg-green-500 text-white' : s === 'ended' ? 'bg-stone-500 text-white' : 'bg-saffron-500 text-white'
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}>
                        {s}
                      </button>
                    ))}
                    <button onClick={() => startAuctionForTournament(t)}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition-all flex items-center gap-1 shrink-0">
                      <FiZap size={12}/> Auction
                    </button>
                    <button onClick={() => openEdit(t)} className="p-1.5 text-stone-400 hover:text-saffron-500 hover:bg-saffron-50 rounded-lg transition-all"><FiEdit2 size={14}/></button>
                    <button onClick={() => handleDelete(t.id, t.name)} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><FiTrash2 size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Create / Edit Modal ─── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border-2 border-saffron-100 animate-slide-up my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-stone-100">
              <h2 className="font-extrabold text-lg">{editing ? 'Edit Tournament' : 'Register Tournament'}</h2>
              <button onClick={() => setModal(false)} className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg"><FiX size={18}/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Logo upload */}
              <div className="flex items-center gap-4">
                <div onClick={() => document.getElementById('tlogo')?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-saffron-300 bg-saffron-50 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-saffron-100 transition-all shrink-0">
                  {preview ? <img src={preview} className="w-full h-full object-cover"/> : <FiUpload className="text-saffron-400 text-xl"/>}
                </div>
                <div>
                  <input id="tlogo" type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0]; if (f) { setLogo(f); setPreview(URL.createObjectURL(f)) }
                  }}/>
                  <button onClick={() => document.getElementById('tlogo')?.click()} className="btn-outline btn-sm">Upload Logo</button>
                  <p className="text-xs text-stone-400 mt-1">Tournament logo / banner</p>
                </div>
              </div>

              {/* Name & Description */}
              <div>
                <label className="label">Tournament Name *</label>
                <input className="input" placeholder="e.g. Unjha Premier League 2025" value={form.name} onChange={e => F('name', e.target.value)}/>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[70px] resize-none" placeholder="Brief description, rules, format…" value={form.description} onChange={e => F('description', e.target.value)}/>
              </div>

              {/* Entry Fee & Ball Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Entry Fee (₹)</label>
                  <input className="input" type="number" min={0} placeholder="0" value={form.entryFee || ''} onChange={e => F('entryFee', parseInt(e.target.value) || 0)}/>
                </div>
                <div>
                  <label className="label">Ball Type *</label>
                  <select className="input" value={form.ballType} onChange={e => F('ballType', e.target.value)}>
                    {BALL_TYPES.map(b => <option key={b} value={b}>{ballEmoji[b]} {b}</option>)}
                  </select>
                </div>
              </div>

              {/* Player counts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Total Players Required</label>
                  <input className="input" type="number" min={0} placeholder="e.g. 60" value={form.totalPlayersRequired || ''} onChange={e => F('totalPlayersRequired', parseInt(e.target.value) || 0)}/>
                </div>
                {editing && (
                  <div>
                    <label className="label">Players Registered</label>
                    <input className="input" type="number" min={0} value={form.registeredPlayers || ''} onChange={e => F('registeredPlayers', parseInt(e.target.value) || 0)}/>
                  </div>
                )}
              </div>

              {/* Ground info */}
              <div className="border-t border-stone-100 pt-4">
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

              {/* Auction location (optional) */}
              <div className="border-t border-stone-100 pt-4">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">🏏 Auction Location <span className="text-stone-300">(Optional)</span></p>
                <input className="input" placeholder="e.g. Hotel Patil, Unjha" value={form.auctionLocation} onChange={e => F('auctionLocation', e.target.value)}/>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setModal(false)} className="btn-ghost flex-1 border-2 border-stone-200">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : editing ? 'Update Tournament' : 'Register Tournament'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
