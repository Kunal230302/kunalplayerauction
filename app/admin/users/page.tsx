'use client'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getTeams } from '@/lib/db'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore'
import { FiPlus, FiTrash2, FiSearch, FiX, FiShield, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'

type Role = 'admin' | 'team_owner'
interface AppUser { id: string; displayName: string; email: string; role: Role; teamId?: string; teamName?: string }

export default function UsersPage() {
  const [users,    setUsers]    = useState<AppUser[]>([])
  const [teams,    setTeams]    = useState<any[]>([])
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [form, setForm] = useState({ displayName:'', email:'', password:'', role:'team_owner' as Role, teamId:'', teamName:'' })

  const load = async () => {
    setLoading(true)
    const [snap, t] = await Promise.all([getDocs(collection(db, 'users')), getTeams()])
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser)))
    setTeams(t)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = users.filter(u =>
    (u.displayName||'').toLowerCase().includes(search.toLowerCase()) ||
    (u.email||'').toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!form.displayName.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('Fill all required fields'); return
    }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setSaving(true)
    try {
      // Use API route to create Firebase Auth user on server-side
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          displayName: form.displayName.trim(),
          role: form.role,
          teamId: form.teamId || '',
          teamName: form.teamName || '',
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create user')
      toast.success(`✅ ${form.displayName} account created!`)
      setModal(false)
      setForm({ displayName:'', email:'', password:'', role:'team_owner', teamId:'', teamName:'' })
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed to create user')
    }
    setSaving(false)
  }

  const toggleRole = async (u: AppUser) => {
    const newRole: Role = u.role === 'admin' ? 'team_owner' : 'admin'
    await updateDoc(doc(db, 'users', u.id), { role: newRole })
    toast.success(`${u.displayName} → ${newRole}`)
    load()
  }

  const handleDelete = async (u: AppUser) => {
    if (!confirm(`Delete "${u.displayName}" from database?`)) return
    await deleteDoc(doc(db, 'users', u.id))
    toast.success('User removed from database')
    load()
  }

  const selectedTeam = teams.find(t => t.id === form.teamId)

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">User Accounts</h1>
            <p className="text-stone-400 text-sm">{users.length} total · {users.filter(u=>u.role==='admin').length} admins · {users.filter(u=>u.role==='team_owner').length} team owners</p>
          </div>
          <button onClick={() => setModal(true)} className="btn-primary gap-2">
            <FiPlus size={16}/> Create User
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={15}/>
          <input className="input pl-11 text-sm" placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>

        {/* Users list */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-saffron-50 border-b-2 border-saffron-100">
                <tr>
                  {['User','Email','Role','Team','Actions'].map(h=>(
                    <th key={h} className="text-left px-4 py-3 text-xs font-extrabold text-stone-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-stone-400">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-stone-400">
                    {users.length === 0 ? (
                      <div><div className="text-4xl mb-2">👤</div><p>No users yet.</p>
                        <button onClick={()=>setModal(true)} className="text-saffron-500 hover:underline text-sm mt-2">Create first user →</button>
                      </div>
                    ) : 'No users match your search.'}
                  </td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id} className="hover:bg-saffron-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 ${u.role==='admin' ? 'bg-saffron-100 text-saffron-600' : 'bg-blue-100 text-blue-600'}`}>
                          {(u.displayName||'?')[0].toUpperCase()}
                        </div>
                        <span className="font-semibold">{u.displayName||'—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-400 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={u.role==='admin' ? 'b-orange' : 'b-blue'}>{u.role==='admin' ? '👑 Admin' : '🏏 Team Owner'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-400">{u.teamName||'—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={()=>toggleRole(u)} className="p-1.5 text-stone-400 hover:text-saffron-500 hover:bg-saffron-50 rounded-lg transition-all" title="Toggle role">
                          {u.role==='admin' ? <FiUser size={14}/> : <FiShield size={14}/>}
                        </button>
                        <button onClick={()=>handleDelete(u)} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                          <FiTrash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 text-center font-semibold">
          ⚠️ Deleting removes the Firestore profile only. Firebase Auth account remains.
        </div>
      </div>

      {/* Create user modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border-2 border-saffron-100 animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-stone-100">
              <h2 className="font-extrabold text-lg">Create New User</h2>
              <button onClick={()=>setModal(false)} className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg"><FiX size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input className="input" placeholder="e.g. Rahul Shah" value={form.displayName} onChange={e=>setForm({...form, displayName:e.target.value})}/>
              </div>
              <div>
                <label className="label">Email *</label>
                <input className="input" type="email" placeholder="user@email.com" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
              </div>
              <div>
                <label className="label">Password *</label>
                <input className="input" type="text" placeholder="Minimum 6 characters" value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
              </div>
              <div>
                <label className="label">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['team_owner','admin'] as Role[]).map(r => (
                    <button key={r} type="button" onClick={()=>setForm({...form, role:r})}
                      className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.role===r ? 'border-saffron-500 bg-saffron-50 text-saffron-700' : 'border-stone-200 text-stone-500 hover:border-stone-300 bg-white'}`}>
                      {r==='admin' ? '👑 Admin' : '🏏 Team Owner'}
                    </button>
                  ))}
                </div>
              </div>
              {form.role === 'team_owner' && (
                <div>
                  <label className="label">Assign Team</label>
                  <select className="input" value={form.teamId} onChange={e => {
                    const t = teams.find(t => t.id === e.target.value)
                    setForm({...form, teamId: e.target.value, teamName: t?.teamName || ''})
                  }}>
                    <option value="">— No team assigned —</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.teamName} ({t.ownerName})</option>)}
                  </select>
                  <p className="text-xs text-stone-400 mt-1">Optional. You can assign later from Team Management.</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={()=>setModal(false)} className="btn-ghost flex-1 border-2 border-stone-200">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1">{saving ? 'Creating…' : 'Create User'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
