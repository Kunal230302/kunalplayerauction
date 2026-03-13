'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getSettings, saveSettings } from '@/lib/db'
import { FiSave } from 'react-icons/fi'
import toast from 'react-hot-toast'

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`

export default function SettingsPage() {
  const [form, setForm] = useState({
    auctionTitle: '', auctionDate: '',
    timerSeconds: 30,
    basePrice: 5000,
    teamBudget: 500000,
    bidTier1Limit: 50000,
    bidTier1Inc: 10000,
    bidTier2Limit: 100000,
    bidTier2Inc: 20000,
  })
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getSettings().then(s => {
      setForm({
        auctionTitle: s.auctionTitle || '',
        auctionDate: s.auctionDate || '',
        timerSeconds: s.timerSeconds || 30,
        basePrice: s.basePrice ?? 5000,
        teamBudget: s.teamBudget ?? 500000,
        bidTier1Limit: s.bidTier1Limit ?? 50000,
        bidTier1Inc: s.bidTier1Inc ?? 10000,
        bidTier2Limit: s.bidTier2Limit ?? 100000,
        bidTier2Inc: s.bidTier2Inc ?? 20000,
      })
      setLoaded(true)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try { await saveSettings(form as any); toast.success('Settings saved!') }
    catch { toast.error('Save failed') }
    setSaving(false)
  }

  const N = (k: string, v: any) => setForm({ ...form, [k]: parseInt(v) || 0 })

  if (!loaded) return <AdminLayout><div className="flex items-center justify-center h-40 text-stone-400">Loading…</div></AdminLayout>

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <h1 className="page-title">Auction Settings</h1>

        {/* General */}
        <div className="card p-6 space-y-5">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">🏆 General</p>
          <div>
            <label className="label">Tournament / Auction Title</label>
            <input className="input" placeholder="e.g. DTPL 2026"
              value={form.auctionTitle} onChange={e=>setForm({...form,auctionTitle:e.target.value})}/>
          </div>
          <div>
            <label className="label">Auction Date & Time</label>
            <input className="input" type="datetime-local"
              value={form.auctionDate} onChange={e=>setForm({...form,auctionDate:e.target.value})}/>
            <p className="text-xs text-stone-400 mt-1">Used for countdown timer on homepage.</p>
          </div>
          <div>
            <label className="label">Auction Timer (Seconds)</label>
            <input className="input" type="number" min={5} max={120} placeholder="30"
              value={form.timerSeconds} onChange={e=>N('timerSeconds',e.target.value)}/>
            <p className="text-xs text-stone-400 mt-1">Timer resets on each new bid. Player sold when hits 0.</p>
          </div>
        </div>

        {/* Budget */}
        <div className="card p-6 space-y-5">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">💰 Budget & Base Price</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Base Price per Player (₹)</label>
              <input className="input" type="number" min={0} step={500} placeholder="5000"
                value={form.basePrice} onChange={e=>N('basePrice',e.target.value)}/>
              <p className="text-xs text-stone-400 mt-1">Auction starts at this price</p>
            </div>
            <div>
              <label className="label">Team Budget (₹)</label>
              <input className="input" type="number" min={0} step={50000} placeholder="500000"
                value={form.teamBudget} onChange={e=>N('teamBudget',e.target.value)}/>
              <p className="text-xs text-stone-400 mt-1">Total budget per team</p>
            </div>
          </div>

          {/* Budget preview */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800 font-semibold flex gap-4 flex-wrap">
            <span>🏏 Base: {fmt(form.basePrice)}</span>
            <span>💰 Budget: {fmt(form.teamBudget)}</span>
            <span>📊 Max players (avg): {Math.floor(form.teamBudget / Math.max(form.basePrice,1))}</span>
          </div>
        </div>

        {/* Tiered Bid Increments */}
        <div className="card p-6 space-y-5">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">📈 Tiered Bid Increments</p>
          <p className="text-xs text-stone-400">Bid increment changes automatically based on current bid price.</p>

          {/* Tier 1 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-blue-700">🔵 Tier 1 — Low Bids</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Up to Amount (₹)</label>
                <input className="input" type="number" min={0} step={5000}
                  value={form.bidTier1Limit} onChange={e=>N('bidTier1Limit',e.target.value)}/>
                <p className="text-xs text-stone-400 mt-1">Apply this increment below this price</p>
              </div>
              <div>
                <label className="label text-xs">Increment (₹)</label>
                <input className="input" type="number" min={100} step={1000}
                  value={form.bidTier1Inc} onChange={e=>N('bidTier1Inc',e.target.value)}/>
                <p className="text-xs text-stone-400 mt-1">Each bid adds this amount</p>
              </div>
            </div>
            <p className="text-xs text-blue-600 font-semibold">
              👉 Below {fmt(form.bidTier1Limit)} → each bid = +{fmt(form.bidTier1Inc)}
            </p>
          </div>

          {/* Tier 2 */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-orange-700">🟠 Tier 2 — High Bids</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Up to Amount (₹)</label>
                <input className="input" type="number" min={0} step={10000}
                  value={form.bidTier2Limit} onChange={e=>N('bidTier2Limit',e.target.value)}/>
              </div>
              <div>
                <label className="label text-xs">Increment (₹)</label>
                <input className="input" type="number" min={100} step={5000}
                  value={form.bidTier2Inc} onChange={e=>N('bidTier2Inc',e.target.value)}/>
              </div>
            </div>
            <p className="text-xs text-orange-600 font-semibold">
              👉 {fmt(form.bidTier1Limit)} – {fmt(form.bidTier2Limit)} → each bid = +{fmt(form.bidTier2Inc)}
            </p>
          </div>

          {/* Visual summary */}
          <div className="bg-saffron-50 border border-saffron-200 rounded-xl p-4 space-y-1 text-sm text-saffron-700 font-semibold">
            <div>⏱️ Timer: {form.timerSeconds} sec per bid</div>
            <div>🏏 Base: {fmt(form.basePrice)} → {fmt(form.bidTier1Limit)}: +{fmt(form.bidTier1Inc)}/bid</div>
            <div>📈 {fmt(form.bidTier1Limit)} → {fmt(form.bidTier2Limit)}: +{fmt(form.bidTier2Inc)}/bid</div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 gap-2 text-base">
          <FiSave size={17}/> {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </AdminLayout>
  )
}
