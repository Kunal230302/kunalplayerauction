'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getTournamentByCode, getTeams, getTeamCount, addTeam, Tournament, Team } from '@/lib/db'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { FiArrowLeft, FiUpload, FiPlus, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

const T_RING = ['border-red-400 text-red-700 bg-red-50','border-blue-400 text-blue-700 bg-blue-50','border-green-500 text-green-700 bg-green-50','border-purple-500 text-purple-700 bg-purple-50']

export default function TournamentTeamsPage() {
  const params = useParams()
  const code = (params.code as string)?.toUpperCase()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logo, setLogo] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [form, setForm] = useState({ teamName: '', ownerName: '' })

  const load = async () => {
    if (!code) return
    const t = await getTournamentByCode(code)
    if (!t) { setNotFound(true); setLoading(false); return }
    setTournament(t)
    setTeams(await getTeams(t.id))
    setLoading(false)
  }

  useEffect(() => { load() }, [code])

  const maxTeams = tournament?.maxFreeTeams || 4
  const isFull = teams.length >= maxTeams

  const handleAdd = async () => {
    if (!form.teamName.trim()) { toast.error('Team name required'); return }
    if (!tournament) return
    if (isFull) {
      toast.error(`Max ${maxTeams} teams allowed (free plan). Contact admin for ₹199/team upgrade.`)
      return
    }
    setSaving(true)
    try {
      let logoURL = ''
      if (logo) {
        try {
          logoURL = await uploadToCloudinary(logo, 'team-logos')
        } catch (uploadErr: any) {
          // If logo upload fails, still register team without logo
          toast(`⚠️ Logo upload failed: ${uploadErr.message}. Team registered without logo.`, { duration: 5000 })
        }
      }
      await addTeam({ teamName: form.teamName.trim(), ownerName: form.ownerName.trim(), logoURL }, tournament.id)
      toast.success(`✅ ${form.teamName} registered!`)
      setForm({ teamName: '', ownerName: '' }); setLogo(null); setPreview('')
      setModal(false); load()
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="text-5xl animate-bounce">🏏</div></div>
  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4 text-center">
      <div><div className="text-6xl mb-4">😕</div><h1 className="text-2xl font-extrabold mb-2">Tournament Not Found</h1>
        <Link href="/" className="btn-primary px-6 py-2">← Home</Link></div>
    </div>
  )

  const t = tournament!

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-saffron-600 to-orange-500 text-white py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href={`/t/${code}`} className="inline-flex items-center gap-1.5 text-saffron-100 hover:text-white text-sm mb-3"><FiArrowLeft size={14}/> Back to Tournament</Link>
          <h1 className="text-2xl font-extrabold">🛡️ Team Registration</h1>
          <p className="text-saffron-100 text-sm">{t.name} · Code: {code}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Team limit info */}
        <div className={`border-2 rounded-xl p-4 text-sm font-semibold text-center ${
          isFull ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {isFull ? (
            <div>🔒 Maximum {maxTeams} teams reached (free plan)<br/>
              <span className="text-xs font-normal">Contact admin for ₹199/team upgrade</span>
            </div>
          ) : (
            <>🆓 {teams.length}/{maxTeams} teams registered (free tier: {maxTeams} teams max)</>
          )}
        </div>

        {/* Register button */}
        {!isFull && (
          <button onClick={() => setModal(true)} className="btn-primary w-full py-3.5 gap-2 text-base">
            <FiPlus size={18}/> Register New Team
          </button>
        )}

        {/* Team list */}
        {teams.length === 0 ? (
          <div className="card p-12 text-center text-stone-400">
            <div className="text-4xl mb-2">🛡️</div><p>No teams registered yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {teams.map((tm, i) => (
              <div key={tm.id} className={`card border-4 p-5 text-center hover:shadow-lg transition ${T_RING[i % 4]}`}>
                <div className={`w-14 h-14 rounded-full mx-auto mb-2 border-4 overflow-hidden flex items-center justify-center font-extrabold text-xl ${T_RING[i % 4]}`}>
                  {tm.logoURL ? <img src={tm.logoURL} className="w-full h-full object-cover rounded-full" alt={tm.teamName}/> : tm.teamName?.[0]?.toUpperCase()}
                </div>
                <div className="font-extrabold text-sm">{tm.teamName}</div>
                <div className="text-xs text-stone-400">{tm.ownerName}</div>
                <div className="text-xs font-bold text-stone-500 mt-1">{tm.playersBought || 0} players</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add team modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border-2 border-saffron-100 animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-stone-100">
              <h2 className="font-extrabold text-lg">Register Team</h2>
              <button onClick={() => setModal(false)} className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg"><FiX size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Logo */}
              <div className="flex items-center gap-4">
                <div onClick={() => document.getElementById('tlogo')?.click()}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-saffron-300 bg-saffron-50 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-saffron-100 transition shrink-0">
                  {preview ? <img src={preview} className="w-full h-full object-cover"/> : <FiUpload className="text-saffron-400"/>}
                </div>
                <div>
                  <input id="tlogo" type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0]; if (f) { setLogo(f); setPreview(URL.createObjectURL(f)) }
                  }}/>
                  <button onClick={() => document.getElementById('tlogo')?.click()} className="btn-outline btn-sm">Upload Logo</button>
                  <p className="text-xs text-stone-400 mt-0.5">Optional team logo</p>
                </div>
              </div>
              <div>
                <label className="label">Team Name *</label>
                <input className="input" placeholder="e.g. Unjha Lions" value={form.teamName} onChange={e => setForm({ ...form, teamName: e.target.value })} autoFocus/>
              </div>
              <div>
                <label className="label">Owner Name</label>
                <input className="input" placeholder="e.g. Rahul Patel" value={form.ownerName} onChange={e => setForm({ ...form, ownerName: e.target.value })}/>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setModal(false)} className="btn-ghost flex-1 border-2 border-stone-200">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1">{saving ? 'Registering…' : 'Register Team'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
