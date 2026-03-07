'use client'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiUpload } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface Team { id:string; teamName:string; ownerName:string; logoURL:string; points:number; playersBought:number }
const BLANK = { teamName:'', ownerName:'', logoURL:'' }

export default function AdminTeamsPage() {
  const [teams,   setTeams]   = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState<Team|null>(null)
  const [form,    setForm]    = useState({...BLANK})
  const [logo,    setLogo]    = useState<File|null>(null)
  const [preview, setPreview] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [search,  setSearch]  = useState('')

  const load = async () => {
    setLoading(true)
    const snap = await getDocs(collection(db, 'teams'))
    setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Team)))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const shown = teams.filter(t =>
    (t.teamName+' '+t.ownerName).toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => { setEditing(null); setForm({...BLANK}); setLogo(null); setPreview(''); setModal(true) }
  const openEdit = (t: Team) => { setEditing(t); setForm({ teamName:t.teamName, ownerName:t.ownerName, logoURL:t.logoURL||'' }); setPreview(t.logoURL||''); setModal(true) }

  const handleSave = async () => {
    if (!form.teamName.trim() || !form.ownerName.trim()) { toast.error('Team name and owner name are required'); return }
    setSaving(true)
    try {
      let logoURL = form.logoURL
      if (logo) {
        logoURL = await uploadToCloudinary(logo, 'team-logos')
      }
      const data = { teamName: form.teamName.trim(), ownerName: form.ownerName.trim(), logoURL }
      if (editing) {
        await updateDoc(doc(db, 'teams', editing.id), data)
        toast.success('Team updated!')
      } else {
        await addDoc(collection(db, 'teams'), { ...data, points:0, playersBought:0, createdAt: serverTimestamp() })
        toast.success('Team added!')
      }
      setModal(false); load()
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    await deleteDoc(doc(db, 'teams', id))
    toast.success('Team deleted'); load()
  }

  const TC = ['border-red-300 bg-red-50','border-blue-300 bg-blue-50','border-green-300 bg-green-50','border-purple-300 bg-purple-50']

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">Team Management</h1>
            <p className="text-stone-400 text-sm">{teams.length} teams · Admin can add unlimited teams</p>
          </div>
          <button onClick={openAdd} className="btn-primary gap-2"><FiPlus size={16}/> Add Team</button>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={15}/>
          <input className="input pl-11 text-sm" placeholder="Search team or owner…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>

        {/* Teams grid */}
        {loading ? (
          <div className="card p-16 text-center text-stone-400">Loading teams…</div>
        ) : shown.length === 0 ? (
          <div className="card p-16 text-center text-stone-400">
            {teams.length === 0 ? (
              <div><div className="text-5xl mb-3">🛡️</div><p>No teams yet.</p><button onClick={openAdd} className="text-saffron-500 hover:underline text-sm mt-2">Add first team →</button></div>
            ) : 'No teams match your search.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {shown.map((t, i) => (
              <div key={t.id} className={`card border-2 p-5 text-center hover:shadow-lg transition-all hover:-translate-y-0.5 ${TC[i%4]}`}>
                <div className={`w-16 h-16 rounded-full mx-auto mb-3 border-4 overflow-hidden flex items-center justify-center font-extrabold text-2xl ${TC[i%4]}`}>
                  {t.logoURL ? <img src={t.logoURL} className="w-full h-full object-cover rounded-full" alt={t.teamName}/> : t.teamName?.[0]?.toUpperCase()}
                </div>
                <div className="font-extrabold text-sm leading-tight">{t.teamName}</div>
                <div className="text-xs text-stone-400 mt-0.5 font-medium">{t.ownerName}</div>
                <div className="text-xs text-stone-500 font-semibold mt-1">{t.playersBought||0} players · {t.points||0} pts</div>
                <div className="flex gap-1.5 mt-3 justify-center">
                  <button onClick={()=>openEdit(t)} className="p-1.5 text-stone-400 hover:text-saffron-500 hover:bg-saffron-50 rounded-lg transition-all"><FiEdit2 size={14}/></button>
                  <button onClick={()=>handleDelete(t.id, t.teamName)} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><FiTrash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border-2 border-saffron-100 animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-stone-100">
              <h2 className="font-extrabold text-lg">{editing ? 'Edit Team' : 'Add New Team'}</h2>
              <button onClick={()=>setModal(false)} className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg"><FiX size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div onClick={()=>document.getElementById('tl')?.click()}
                  className="w-20 h-20 rounded-full border-2 border-dashed border-saffron-300 bg-saffron-50 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-saffron-100 transition-all">
                  {preview ? <img src={preview} className="w-full h-full object-cover"/> : <FiUpload className="text-saffron-400 text-xl"/>}
                </div>
                <div>
                  <input id="tl" type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f){setLogo(f);setPreview(URL.createObjectURL(f))}}}/>
                  <button onClick={()=>document.getElementById('tl')?.click()} className="btn-outline btn-sm">Upload Logo</button>
                  <p className="text-xs text-stone-400 mt-1">JPG/PNG</p>
                </div>
              </div>
              <div>
                <label className="label">Team Name *</label>
                <input className="input" placeholder="e.g. Unjha Warriors" value={form.teamName} onChange={e=>setForm({...form, teamName:e.target.value})}/>
              </div>
              <div>
                <label className="label">Owner Name *</label>
                <input className="input" placeholder="e.g. Rahul Shah" value={form.ownerName} onChange={e=>setForm({...form, ownerName:e.target.value})}/>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={()=>setModal(false)} className="btn-ghost flex-1 border-2 border-stone-200">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : editing ? 'Update Team' : 'Add Team'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
