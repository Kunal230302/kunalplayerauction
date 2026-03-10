'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getTournaments, getPlayers, deletePlayer, Tournament, Player } from '@/lib/db'
import { FiTrash2, FiSearch, FiX, FiImage, FiRefreshCw, FiDownload, FiFileText } from 'react-icons/fi'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

  const downloadPlayerList = () => {
    // Create CSV content with all details (excluding status)
    const headers = ['Name', 'Surname', 'Role', 'Village', 'Address', 'Mobile', 'Age', 'Sold To', 'Sold Points']
    const csvContent = [
      headers.join(','),
      ...shown.map(player => [
        `"${player.name || ''}"`,
        `"${player.surname || ''}"`,
        `"${player.role || ''}"`,
        `"${player.village || ''}"`,
        `"${player.address || ''}"`,
        `"${player.mobile || ''}"`,
        `"${player.age || ''}"`,
        `"${player.soldToName || ''}"`,
        `"${player.soldPoints || ''}"`
      ].join(','))
    ].join('\n')

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `players_${currentTournament?.name || 'tournament'}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success(`Downloaded ${shown.length} players (CSV)`)
  }

  const downloadPlayerPDF = async () => {
    try {
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(20)
      doc.text(`Player List - ${currentTournament?.name || 'Tournament'}`, 14, 15)
      doc.setFontSize(12)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 25)
      doc.text(`Total Players: ${shown.length}`, 14, 32)
      
      // Prepare table data (excluding status)
      const tableData = shown.map((player, index) => [
        index + 1,
        player.name || '',
        player.surname || '',
        player.role || '',
        player.age || '',
        player.village || '',
        player.address || '',
        player.mobile || '',
        player.soldToName || '',
        player.soldPoints || ''
      ])
      
      // Add table
      autoTable(doc, {
        head: [['#', 'Name', 'Surname', 'Role', 'Age', 'Village', 'Address', 'Mobile', 'Sold To', 'Points']],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [255, 140, 0], // Saffron color
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 15 }, // #
          1: { cellWidth: 25 }, // Name
          2: { cellWidth: 25 }, // Surname
          3: { cellWidth: 20 }, // Role
          4: { cellWidth: 15 }, // Age
          5: { cellWidth: 30 }, // Village
          6: { cellWidth: 35 }, // Address
          7: { cellWidth: 25 }, // Mobile
          8: { cellWidth: 20 }, // Status
          9: { cellWidth: 30 }, // Sold To
          10: { cellWidth: 20 }  // Points
        }
      })
      
      // Save PDF
      doc.save(`players_${currentTournament?.name || 'tournament'}_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success(`Downloaded ${shown.length} players (PDF)`)
      
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF')
    }
  }

  const downloadPlayerPDFWithPhotos = async () => {
    try {
      const doc = new jsPDF()
      
      // Add header with tournament logo and name
      if (currentTournament?.logoURL) {
        try {
          // Add tournament logo on the left
          const img = new Image()
          img.crossOrigin = 'anonymous'
          
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = currentTournament.logoURL
          })
          
          doc.addImage(img, 'JPEG', 20, 10, 30, 30)
          
          // Add tournament name in the middle
          doc.setFontSize(18)
          doc.setTextColor(255, 140, 0) // Saffron color
          doc.text(currentTournament.name, 105, 25, { align: 'center' })
        } catch (error) {
          console.log('Could not load tournament logo')
          // Fallback: just tournament name centered
          doc.setFontSize(20)
          doc.setTextColor(255, 140, 0)
          doc.text(currentTournament?.name || 'Tournament', 105, 20, { align: 'center' })
        }
      } else {
        // No logo, just tournament name centered
        doc.setFontSize(20)
        doc.setTextColor(255, 140, 0)
        doc.text(currentTournament?.name || 'Tournament', 105, 20, { align: 'center' })
      }
      
      // Add subtitle
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(`Player Profiles - ${new Date().toLocaleDateString()}`, 105, 35, { align: 'center' })
      doc.text(`Total Players: ${shown.length}`, 105, 42, { align: 'center' })
      
      // Add separator line
      doc.setDrawColor(200, 200, 200)
      doc.line(20, 48, 190, 48)
      
      let yPosition = 55
      
      for (let i = 0; i < shown.length; i++) {
        const player = shown[i]
        
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }
        
        // Player number starting from 1
        doc.setFontSize(14)
        doc.setTextColor(255, 140, 0) // Saffron color
        doc.text(`${i + 1}. ${player.name} ${player.surname}`, 20, yPosition)
        
        yPosition += 12
        
        // Player details
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0) // Black color
        
        const details = [
          `Role: ${player.role || ''}`,
          `Age: ${player.age || ''}`,
          `Village: ${player.village || ''}`,
          `Address: ${player.address || ''}`,
          `Mobile: ${player.mobile || ''}`,
          `Sold To: ${player.soldToName || 'Not Sold'}`,
          `Sold Points: ${player.soldPoints || '0'}`
        ]
        
        details.forEach(detail => {
          doc.text(detail, 25, yPosition)
          yPosition += 6
        })
        
        // Add photo if available
        if (player.photoURL) {
          try {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            
            await new Promise((resolve, reject) => {
              img.onload = resolve
              img.onerror = reject
              img.src = player.photoURL
            })
            
            // Add photo to the right side
            if (yPosition > 180) {
              doc.addPage()
              yPosition = 40
            }
            
            // Add photo with border
            doc.setDrawColor(150, 150, 150)
            doc.rect(140, yPosition - 50, 40, 40)
            doc.addImage(img, 'JPEG', 140, yPosition - 50, 40, 40)
          } catch (error) {
            console.log('Could not load photo for player:', player.name)
            // Add placeholder box
            doc.setDrawColor(200, 200, 200)
            doc.rect(140, yPosition - 50, 40, 40)
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text('No Photo', 160, yPosition - 30, { align: 'center' })
          }
        }
        
        yPosition += 25
        
        // Add separator line between players
        doc.setDrawColor(220, 220, 220)
        doc.line(20, yPosition, 190, yPosition)
        yPosition += 15
      }
      
      // Add footer
      const pageCount = doc.internal.pages.length
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' })
        doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 290, { align: 'center' })
      }
      
      // Save PDF
      doc.save(`player_profiles_${currentTournament?.name || 'tournament'}_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success(`Downloaded ${shown.length} player profiles with photos (PDF)`)
      
    } catch (error) {
      console.error('PDF with photos generation error:', error)
      toast.error('Failed to generate PDF with photos')
    }
  }

  const currentTournament = tournaments.find(t => t.id === selectedTournament)

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">Players</h1>
            <p className="text-stone-400 text-sm">0 total · 0 available</p>
          </div>
          <div className="flex gap-2">
            <div className="relative group">
              <button className="btn-primary gap-2 flex items-center">
                <FiDownload size={15}/> Download
              </button>
              <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[200px]">
                <button onClick={downloadPlayerList} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                  <FiDownload size={14}/> Download CSV
                </button>
                <button onClick={downloadPlayerPDF} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                  <FiFileText size={14}/> Download PDF (Table)
                </button>
                <button onClick={downloadPlayerPDFWithPhotos} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                  <FiFileText size={14}/> Download PDF (With Photos)
                </button>
              </div>
            </div>
            <button onClick={() => load()} className="btn-outline gap-2 flex items-center">
              <FiRefreshCw size={15}/> Refresh
            </button>
          </div>
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
