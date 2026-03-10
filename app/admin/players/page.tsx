'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getTournaments, getPlayers, deletePlayer, Tournament, Player } from '@/lib/db'
import { FiTrash2, FiSearch, FiX, FiImage, FiRefreshCw, FiDownload, FiFileText } from 'react-icons/fi'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper']
const S_BADGE: Record<string, string> = { available: 'b-gray', sold: 'b-green', unsold: 'b-red' }

export default function PlayersPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<string>('')
  const [players, setPlayers] = useState<Player[]>([])
  const [shown, setShown] = useState<Player[]>([])
  const [search, setSearch] = useState('')
  const [roleF, setRoleF] = useState('All')
  const [detail, setDetail] = useState<Player | null>(null)

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
    if (search.trim()) f = f.filter(p => (p.name + ' ' + p.surname + ' ' + p.district + ' ' + p.mobile).toLowerCase().includes(search.toLowerCase()))
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

      // Page dimensions
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15

      // Card dimensions - 5 cards per row, 2 rows = 10 per page
      const cardsPerRow = 5
      const cardWidth = (pageWidth - (margin * 2) - (cardsPerRow - 1) * 4) / cardsPerRow // 4px gap
      const cardHeight = (pageHeight - (margin * 2) - 20 - 4) / 2 // 20px for header, 4px gap

      let currentPage = 1
      let x = margin
      let y = margin + 20 // Leave space for title

      // Add title
      doc.setFontSize(16)
      doc.setTextColor(255, 140, 0) // Saffron color
      doc.text(`${currentTournament?.name || 'Tournament'} - Players`, pageWidth / 2, margin + 10, { align: 'center' })
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Page ${currentPage} • ${shown.length} Total Players`, pageWidth / 2, margin + 16, { align: 'center' })

      // Draw player cards
      for (let i = 0; i < shown.length; i++) {
        const player = shown[i]
        const playerNum = i + 1

        // Check if we need a new page (after 10 players)
        if (i > 0 && i % 10 === 0) {
          doc.addPage()
          currentPage++
          x = margin
          y = margin + 20

          // Add title to new page
          doc.setFontSize(16)
          doc.setTextColor(255, 140, 0)
          doc.text(`${currentTournament?.name || 'Tournament'} - Players`, pageWidth / 2, margin + 10, { align: 'center' })
          doc.setFontSize(10)
          doc.setTextColor(100, 100, 100)
          doc.text(`Page ${currentPage} • ${shown.length} Total Players`, pageWidth / 2, margin + 16, { align: 'center' })
        }

        // Draw card border
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.5)
        doc.rect(x, y, cardWidth, cardHeight, 'S')

        // Card background
        doc.setFillColor(255, 255, 255)
        doc.rect(x, y, cardWidth, cardHeight, 'F')

        // Player Number
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(`No: ${playerNum.toString().padStart(2, '0')}`, x + 3, y + 8)

        // Player Name
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'bold')
        const fullName = `${player.name || ''} ${player.surname || ''}`.trim()
        // Truncate if too long
        if (fullName.length > 18) {
          doc.text(fullName.substring(0, 18) + '...', x + 3, y + 18)
        } else {
          doc.text(fullName, x + 3, y + 18)
        }

        // Age
        doc.setFontSize(8)
        doc.setTextColor(80, 80, 80)
        doc.setFont('helvetica', 'normal')
        doc.text(`Age: ${player.age || 'N/A'} YR`, x + 3, y + 26)

        // Role/Skill
        if (player.role) {
          doc.setTextColor(100, 100, 100)
          // Truncate role if too long
          const role = player.role.length > 15 ? player.role.substring(0, 15) + '...' : player.role
          doc.text(`Skill: ${role}`, x + 3, y + 32)
        }

        // Photo placeholder (helmet icon representation)
        doc.setFillColor(240, 240, 240)
        doc.roundedRect(x + cardWidth - 22, y + 5, 18, 18, 3, 3, 'F')
        doc.setTextColor(150, 150, 150)
        doc.setFontSize(12)
        doc.text('🏏', x + cardWidth - 17, y + 17)

        // Move to next position
        x += cardWidth + 4

        // Move to next row after 5 cards
        if ((i + 1) % 5 === 0) {
          x = margin
          y += cardHeight + 4
        }
      }

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
      // A4 portrait: 210mm × 297mm  (jsPDF default unit = mm)
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageWidth = doc.internal.pageSize.getWidth()   // 210
      const pageHeight = doc.internal.pageSize.getHeight()  // 297

      // ── Grid constants ──────────────────────────────────────────────
      const COLS = 2
      const ROWS = 5
      const PER_PAGE = COLS * ROWS          // 10
      const marginX = 10                   // left & right margin (mm)
      const marginTop = 22                   // top margin below header (mm)
      const gapX = 5                    // horizontal gap between cards (mm)
      const gapY = 4                    // vertical gap between cards (mm)
      const cardW = (pageWidth - marginX * 2 - gapX * (COLS - 1)) / COLS   // ~92.5
      const headerH = marginTop - 4
      const cardH = (pageHeight - marginTop - 8 - gapY * (ROWS - 1)) / ROWS // ~50

      // ── Pre-load Website Logo ───────────────────────────────────────
      const siteLogoImg = await new Promise<HTMLImageElement | null>(resolve => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        // Use full URL to ensure jsPDF can fetch it from the browser
        img.src = window.location.origin + '/icon.png'
      })

      // ── Helpers ─────────────────────────────────────────────────────
      const drawPageHeader = (pageNum: number, totalPages: number) => {
        // Background strip
        doc.setFillColor(255, 140, 0)
        doc.rect(0, 0, pageWidth, headerH, 'F')

        // Left side: Logo + Website Name (optional small text if desired, but we'll just put logo)
        if (siteLogoImg) {
          doc.addImage(siteLogoImg, 'PNG', marginX, 3, 12, 12)
        }

        // Center: Tournament Name & Page Info
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text(currentTournament?.name || 'Tournament', pageWidth / 2, headerH - 5, { align: 'center' })
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.text(`${shown.length} Players  •  Page ${pageNum} / ${totalPages}`, pageWidth / 2, headerH - 1, { align: 'center' })

        // Right side: Website Name
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('Player Auction Hub', pageWidth - marginX, headerH - 4, { align: 'right' })
      }

      // ── Compute total pages ─────────────────────────────────────────
      const totalPages = Math.ceil(shown.length / PER_PAGE)

      // ── Render pages ────────────────────────────────────────────────
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) doc.addPage()

        drawPageHeader(page + 1, totalPages)

        const startIdx = page * PER_PAGE
        const endIdx = Math.min(startIdx + PER_PAGE, shown.length)

        for (let pi = startIdx; pi < endIdx; pi++) {
          const player = shown[pi]
          const playerNum = pi + 1
          const posInPage = pi - startIdx

          const col = posInPage % COLS
          const row = Math.floor(posInPage / COLS)

          const cx = marginX + col * (cardW + gapX)
          const cy = marginTop + row * (cardH + gapY)

          // ── Card background + border ──
          doc.setFillColor(255, 255, 255)
          doc.setDrawColor(210, 210, 210)
          doc.setLineWidth(0.3)
          doc.roundedRect(cx, cy, cardW, cardH, 2, 2, 'FD')

          const textX = cx + 4
          const textMaxW = cardW - 8

          // Player number badge
          doc.setFillColor(255, 140, 0)
          doc.roundedRect(textX, cy + 3, 16, 5.5, 1, 1, 'F')
          doc.setFontSize(6)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(255, 255, 255)
          doc.text(`No: ${playerNum.toString().padStart(2, '0')}`, textX + 8, cy + 7.2, { align: 'center' })

          // Name
          const fullName = `${player.name || ''} ${player.surname || ''}`.trim()
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(20, 20, 20)
          const nameLines = doc.splitTextToSize(fullName, textMaxW) as string[]
          doc.text(nameLines.slice(0, 2), textX, cy + 14)

          // Age
          const nameEndY = cy + 14 + (nameLines.slice(0, 2).length - 1) * 4.5
          doc.setFontSize(7.5)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(80, 80, 80)
          doc.text(`Age: ${player.age || 'N/A'} YR`, textX, nameEndY + 5)

          // Skill / Role
          if (player.role) {
            doc.setTextColor(120, 80, 0)
            const roleLines = doc.splitTextToSize(`Skill: ${player.role}`, textMaxW) as string[]
            doc.text(roleLines.slice(0, 2), textX, nameEndY + 11)
          }
        }
      }

      // ── Save ────────────────────────────────────────────────────────
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
                <FiDownload size={15} /> Download
              </button>
              <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[200px]">
                <button onClick={downloadPlayerList} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                  <FiDownload size={14} /> Download CSV
                </button>
                <button onClick={downloadPlayerPDF} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                  <FiFileText size={14} /> Download PDF (Table)
                </button>
                <button onClick={downloadPlayerPDFWithPhotos} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                  <FiFileText size={14} /> Download PDF (With Photos)
                </button>
              </div>
            </div>
            <button onClick={() => load()} className="btn-outline gap-2 flex items-center">
              <FiRefreshCw size={15} /> Refresh
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
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
            <input className="input pl-11 text-sm" placeholder="Search name, surname, mobile, district…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['All', ...ROLES].map(r => (
              <button key={r} onClick={() => setRoleF(r)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all ${roleF === r ? 'bg-saffron-500 text-white border-saffron-500' : 'border-stone-200 text-stone-500 hover:border-saffron-300 bg-white'}`}>
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
                  {['Player', '📱 Mobile', '🎂 DOB', '📍 District', '🏘️ Taluka', '🏏 Role', 'Status', '📲 Device', '💰 Payment', 'Actions'].map(h => (
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
                          {p.photoURL ? <img src={p.photoURL} className="w-full h-full object-cover" /> : (p.name?.[0] || '?').toUpperCase()}
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
                    <td className="px-3 py-3"><span className={`${S_BADGE[p.status] || 'b-gray'} text-[11px]`}>{p.status || 'available'}</span></td>
                    <td className="px-3 py-3">
                      {p.deviceName ? (
                        <div className="text-xs">
                          <div className="font-semibold text-stone-700">{p.deviceName}</div>
                          <div className="text-stone-400 font-mono text-[10px]">{p.deviceId?.slice(0, 10)}…</div>
                        </div>
                      ) : <span className="text-stone-300 text-[10px]">—</span>}
                    </td>
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
                          <FiImage size={14} />
                        </button>
                        <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-12 text-stone-400">
                    {players.length === 0
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
              <button onClick={() => setDetail(null)} className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg"><FiX size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Photo */}
              <div className="text-center">
                <div className="w-24 h-24 rounded-2xl border-3 border-saffron-200 bg-saffron-50 mx-auto overflow-hidden flex items-center justify-center">
                  {detail.photoURL ? <img src={detail.photoURL} className="w-full h-full object-cover" /> : <span className="text-4xl">👤</span>}
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
                  ['📱', 'Device', detail.deviceName ? `${detail.deviceName} (${detail.deviceId?.slice(0, 8)}...)` : '—'],
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
                  <img src={detail.paymentScreenshotURL} className="w-full rounded-xl border-2 border-green-100" alt="Payment" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
