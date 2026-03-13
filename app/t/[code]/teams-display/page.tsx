'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { getTournamentByCode, getTeams } from '@/lib/db'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function TeamsDisplayPage() {
  const params = useParams()
  const code = (params.code as string)?.toUpperCase()
  const [tournament, setTournament] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!code) return
      const t = await getTournamentByCode(code)
      if (!t) {
        setLoading(false)
        return
      }
      setTournament(t)
      
      const teamList = await getTeams(t.id)
      setTeams(teamList)
      setLoading(false)
    }
    load()
  }, [code])

  const generateTeamSheetHTML = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 20px; 
            background: #fafaf9;
            color: #1e293b;
            line-height: 1.6;
          }
          
          .page {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .tournament-header { 
            text-align: center; 
            margin-bottom: 25px; 
            border: 2px solid #ea580c;
            padding: 20px;
            background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
            border-radius: 8px;
          }
          
          .tournament-header h1 {
            font-size: 24px;
            font-weight: 800;
            color: #9a3412;
            margin-bottom: 8px;
          }
          
          .tournament-header h2 {
            font-size: 18px;
            font-weight: 600;
            color: #c2410c;
            margin-bottom: 4px;
          }
          
          .tournament-header p {
            font-size: 14px;
            font-weight: 500;
            color: #ea580c;
          }
          
          .team { 
            margin-bottom: 20px; 
            border: 2px solid #0f172a; 
            padding: 15px;
            page-break-inside: avoid;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }
          
          .team-title { 
            font-size: 18px; 
            font-weight: 700; 
            margin-bottom: 12px;
            text-align: center;
            color: #1e293b;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 8px;
            border-radius: 6px;
            border-bottom: 2px solid #0f172a;
          }
          
          .players-table { 
            width: 100%; 
            border-collapse: collapse; 
            border: 2px solid #0f172a;
            font-size: 12px;
          }
          
          .players-table th, .players-table td { 
            border: 1px solid #cbd5e1; 
            padding: 6px; 
            text-align: left; 
            vertical-align: middle;
          }
          
          .players-table th { 
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
          }
          
          .players-table tr:nth-child(even) {
            background-color: #f8fafc;
          }
          
          .players-table tr:hover {
            background-color: #f1f5f9;
          }
          
          .player-number { 
            width: 40px; 
            font-weight: 600;
            text-align: center;
            color: #475569;
          }
          
          .player-name { 
            width: 180px; 
            font-weight: 500;
          }
          
          .player-role { 
            width: 80px; 
            font-weight: 500;
            text-align: center;
          }
          
          .player-price { 
            width: 80px; 
            font-weight: 600;
            text-align: center;
            color: #059669;
          }
          
          .empty-cell {
            color: #94a3b8;
            font-style: italic;
          }
          
          @media print {
            body { margin: 0; }
            .page { margin: 0; box-shadow: none; }
            .team { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="tournament-header">
            <h1>${tournament?.name || 'TOURNAMENT NAME'}</h1>
            <h2>Registered Teams</h2>
            <p>Entry Fee: ₹${tournament?.entryFee || 0}</p>
          </div>
          
          ${teams.map((team, index) => `
            <div class="team">
              <div class="team-title">${team.teamName || `Team ${index + 1}`}</div>
              <table class="players-table">
                <thead>
                  <tr>
                    <th class="player-number">No.</th>
                    <th class="player-name">Player Name</th>
                    <th class="player-role">Role</th>
                    <th class="player-price">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${Array(13).fill(null).map((_, i) => {
                    const player = team.players?.[i]
                    return `
                      <tr>
                        <td class="player-number">${i + 1}</td>
                        <td class="player-name">${player?.name || '<span class="empty-cell">Empty</span>'}</td>
                        <td class="player-role">${player?.role || '<span class="empty-cell">-</span>'}</td>
                        <td class="player-price">${player?.soldPrice ? '₹' + player.soldPrice : '<span class="empty-cell">-</span>'}</td>
                      </tr>
                    `
                  }).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `
    
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `teams-${tournament?.name?.replace(/[^a-z0-9]/gi, '_') || 'tournament'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Team sheets downloaded successfully! 📄')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center overflow-hidden mx-auto mb-3 animate-bounce">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <p className="text-stone-400 font-medium">Loading teams…</p>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Tournament Not Found</h1>
          <p className="text-stone-600 mb-6">The tournament code you entered doesn't exist.</p>
          <Link href="/" className="btn-primary">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">{tournament.name}</h1>
              <p className="text-stone-600">Registered Teams</p>
            </div>
            <div className="flex gap-3">
              <Link href={`/t/${code}`} className="btn-outline">
                ← Back to Tournament
              </Link>
              <button onClick={generateTeamSheetHTML} className="btn-primary">
                📄 Download Team Sheets
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Teams Display */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {teams.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-bold text-stone-800 mb-2">No Teams Registered Yet</h2>
            <p className="text-stone-600 mb-6">Teams haven't been registered for this tournament yet.</p>
            <Link href={`/t/${code}`} className="btn-primary">
              Register Teams
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {teams.map((team, index) => (
              <div key={team.id} className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
                {/* Team Header */}
                <div className="bg-gradient-to-r from-saffron-500 to-saffron-600 text-white p-4">
                  <h2 className="text-xl font-bold">{team.teamName || `Team ${index + 1}`}</h2>
                  <p className="text-saffron-100 text-sm mt-1">
                    {team.players?.length || 0} players registered
                  </p>
                </div>

                {/* Players Table */}
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-2 border-stone-800">
                      <thead>
                        <tr className="bg-stone-100">
                          <th className="border border-stone-800 px-4 py-2 text-left font-bold">No.</th>
                          <th className="border border-stone-800 px-4 py-2 text-left font-bold">Player Name</th>
                          <th className="border border-stone-800 px-4 py-2 text-left font-bold">Role</th>
                          <th className="border border-stone-800 px-4 py-2 text-left font-bold">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array(13).fill(null).map((_, i) => {
                          const player = team.players?.[i]
                          return (
                            <tr key={i} className="hover:bg-stone-50">
                              <td className="border border-stone-800 px-4 py-2 font-medium">{i + 1}</td>
                              <td className="border border-stone-800 px-4 py-2">
                                {player?.name || <span className="text-stone-400">Empty</span>}
                              </td>
                              <td className="border border-stone-800 px-4 py-2">
                                {player?.role || <span className="text-stone-400">-</span>}
                              </td>
                              <td className="border border-stone-800 px-4 py-2">
                                {player?.soldPrice ? `₹${player.soldPrice}` : <span className="text-stone-400">-</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
