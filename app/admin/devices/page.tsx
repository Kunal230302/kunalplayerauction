'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getTournaments, getPlayers, getTeams, Tournament, Player, Team } from '@/lib/db'
import { FiSmartphone, FiDownload, FiSearch, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface DeviceRecord {
  id: string
  userName: string
  mobile: string
  type: 'Player' | 'Team Owner'
  tournamentName: string
  deviceName: string | undefined
  deviceId: string | undefined
  registeredAt: number | undefined
}

export default function DevicesPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [records, setRecords] = useState<DeviceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const ts = await getTournaments()
      setTournaments(ts)

      let allRecords: DeviceRecord[] = []

      // Fetch from all tournaments
      for (const t of ts) {
        const [players, teams] = await Promise.all([
          getPlayers(t.id),
          getTeams(t.id)
        ])

        // Add Players
        for (const p of players) {
          if (p.deviceName || p.deviceId) {
            allRecords.push({
              id: `p_${p.id}`,
              userName: `${p.name} ${p.surname || ''}`.trim(),
              mobile: p.mobile || '—',
              type: 'Player',
              tournamentName: t.name,
              deviceName: p.deviceName,
              deviceId: p.deviceId,
              registeredAt: p.registeredAt
            })
          }
        }

        // Add Teams
        for (const tm of teams) {
          if (tm.deviceName || tm.deviceId) {
            allRecords.push({
              id: `t_${tm.id}`,
              userName: tm.ownerName || '—',
              mobile: '—', // Teams don't have mobile in interface
              type: 'Team Owner',
              tournamentName: t.name,
              deviceName: tm.deviceName,
              deviceId: tm.deviceId,
              registeredAt: tm.registeredAt
            })
          }
        }
      }
      
      // Sort by registered time, newest first
      allRecords.sort((a, b) => (b.registeredAt || 0) - (a.registeredAt || 0))
      setRecords(allRecords)
    } catch (e: any) {
      toast.error('Failed to load devices: ' + e.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records
    const lower = search.toLowerCase()
    return records.filter(r => 
      r.userName.toLowerCase().includes(lower) || 
      (r.deviceName || '').toLowerCase().includes(lower) ||
      (r.deviceId || '').toLowerCase().includes(lower) ||
      r.tournamentName.toLowerCase().includes(lower)
    )
  }, [search, records])

  const downloadCSV = () => {
    if (filteredRecords.length === 0) {
      toast.error('No records to download')
      return
    }
    
    const headers = ['User Name', 'Type', 'Mobile', 'Tournament', 'Android Model/Name', 'Device ID', 'Registered Date']
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(r => {
        const dateStr = r.registeredAt ? new Date(r.registeredAt).toLocaleString() : '—'
        return [
          `"${r.userName.replace(/"/g, '""')}"`,
          `"${r.type}"`,
          `"${r.mobile}"`,
          `"${r.tournamentName.replace(/"/g, '""')}"`,
          `"${(r.deviceName || '').replace(/"/g, '""')}"`,
          `"${(r.deviceId || '').replace(/"/g, '""')}"`,
          `"${dateStr}"`
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = `registered_devices_${new Date().toISOString().split('T')[0]}.csv`
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Downloaded CSV')
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <FiSmartphone className="text-saffron-500" /> 
              Registered Devices
            </h1>
            <p className="text-stone-400 text-sm">
              {loading ? 'Loading...' : `Found ${records.length} devices across all tournaments`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={downloadCSV} className="btn-primary gap-2 flex items-center">
              <FiDownload size={15} /> Export CSV
            </button>
            <button onClick={loadData} className="btn-outline gap-2 flex items-center" disabled={loading}>
              <FiRefreshCw size={15} className={loading ? 'animate-spin' : ''} /> 
              Refresh
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="card p-4 border-2 border-slate-100 flex items-center">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
            <input 
              className="input pl-11 text-sm bg-stone-50" 
              placeholder="Search by name, device model, or ID..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden border-2 border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b-2 border-slate-100">
                <tr>
                  {['User Name', 'Type', 'Mobile', 'Android Model/Name', 'Device ID', 'Tournament', 'Reg. Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-extrabold text-stone-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-stone-400">
                      Loading devices...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-stone-400">
                      <div className="mb-2 text-4xl">📱</div>
                      No devices found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-stone-700">{r.userName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${r.type === 'Player' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-600 font-mono text-xs">{r.mobile}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{r.deviceName || 'Unknown'}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-500">
                        {r.deviceId || '—'}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {r.tournamentName}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500">
                        {r.registeredAt ? new Date(r.registeredAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
