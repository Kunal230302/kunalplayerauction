'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import Link from 'next/link'
import { getPlayers, getTournaments, getTeams, getAuctionResults } from '@/lib/db'
import { FiRefreshCw, FiZap, FiAlertTriangle, FiDownload } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [players, setPlayers] = useState<any[]>([])
  const [tournaments, setTournaments] = useState<any[]>([])
  const [selectedTournament, setSelectedTournament] = useState<string>('all')
  const [teams, setTeams] = useState<any[]>([])
  const [auctionResults, setAuctionResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    console.log('Loading data from all tournaments...')
    
    // Get all tournaments first
    const allTournaments = await getTournaments()
    console.log('Tournaments loaded:', allTournaments.length)
    setTournaments(allTournaments)
    
    let allPlayers: any[] = []
    let allTeams: any[] = []
    let allAuctionResults: any[] = []
    
    if (selectedTournament === 'all') {
      // Get players and teams from each tournament
      for (const tournament of allTournaments) {
        console.log('Loading data for tournament:', tournament.id, tournament.name)
        const tournamentPlayers = await getPlayers(tournament.id)
        const tournamentTeams = await getTeams(tournament.id)
        const tournamentAuctionResults = await getAuctionResults(tournament.id)
        console.log(`Tournament ${tournament.name}:`, tournamentPlayers.length, 'players,', tournamentTeams.length, 'teams,', tournamentAuctionResults.length, 'sold')
        // Add tournamentId to each team for filtering
        const teamsWithTournamentId = tournamentTeams.map(team => ({
          ...team,
          tournamentId: tournament.id
        }))
        allPlayers = [...allPlayers, ...tournamentPlayers]
        allTeams = [...allTeams, ...teamsWithTournamentId]
        allAuctionResults = [...allAuctionResults, ...tournamentAuctionResults]
      }
    } else {
      // Get players and teams from selected tournament only
      console.log('Loading data for selected tournament:', selectedTournament)
      allPlayers = await getPlayers(selectedTournament)
      allTeams = await getTeams(selectedTournament)
      allAuctionResults = await getAuctionResults(selectedTournament)
      // Add tournamentId to each team
      allTeams = allTeams.map(team => ({
        ...team,
        tournamentId: selectedTournament
      }))
      console.log('Selected tournament data:', allPlayers.length, 'players,', allTeams.length, 'teams,', allAuctionResults.length, 'sold')
    }
    
    console.log('Total players loaded:', allPlayers.length)
    console.log('Total teams loaded:', allTeams.length)
    console.log('Total sold players:', allAuctionResults.length)
    console.log('First team data:', allTeams[0]) // Debug first team
    setPlayers(allPlayers)
    setTeams(allTeams)
    setAuctionResults(allAuctionResults)
    setLoading(false)
  }
  
  useEffect(() => { 
    load()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('Auto-refreshing players...')
      load()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    load()
  }, [selectedTournament])

  const avail = players.filter(p => p.status === 'available').length

  const printTeamSheets = () => {
    console.log('Printing team sheets...')
    console.log('Available teams:', teams)
    
    // Get teams data for selected tournament
    const targetTournaments = selectedTournament === 'all' 
      ? tournaments 
      : tournaments.filter(t => t.id === selectedTournament)
    
    if (targetTournaments.length === 0) {
      toast.error('No tournaments selected')
      return
    }
    
    // Filter teams for selected tournament(s)
    const targetTeams = selectedTournament === 'all'
      ? teams
      : teams.filter(team => team.tournamentId === selectedTournament)
    
    console.log('Target teams for print:', targetTeams)
    
    if (targetTeams.length === 0) {
      toast.error('No teams registered for this tournament')
      return
    }
    
    // Create HTML content with improved design for printing
    let html = '<!DOCTYPE html><html><head><title>Team Registration Sheets</title>'
    html += '<style>@import url(\'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap\');'
    html += '* { margin: 0; padding: 0; box-sizing: border-box; }'
    html += 'body { font-family: \'Inter\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; margin: 20px; background: #fafaf9; color: #1e293b; line-height: 1.6; }'
    html += '.page { max-width: 210mm; margin: 0 auto; background: white; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }'
    html += '.tournament-info { text-align: center; margin-bottom: 25px; border: 2px solid #ea580c; padding: 20px; background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); border-radius: 8px; }'
    html += '.tournament-info h1 { font-size: 24px; font-weight: 800; color: #9a3412; margin-bottom: 8px; }'
    html += '.tournament-info p { font-size: 14px; font-weight: 500; color: #ea580c; margin-bottom: 4px; }'
    html += '.teams-section { margin-bottom: 20px; border: 2px solid #0f172a; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }'
    html += '.teams-title { font-size: 18px; font-weight: 700; margin-bottom: 15px; text-align: center; color: #1e293b; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 8px; border-radius: 6px; border-bottom: 2px solid #0f172a; }'
    html += '.registered-teams { margin-bottom: 20px; }'
    html += '.team-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 8px; border-left: 4px solid #059669; }'
    html += '.team-name { font-weight: 600; color: #1e293b; font-size: 14px; }'
    html += '.team-contact { font-size: 12px; color: #64748b; font-weight: 500; }'
    html += '.team { margin-bottom: 20px; border: 2px solid #0f172a; padding: 15px; page-break-inside: avoid; background: white; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }'
    html += '.team-title { font-size: 18px; font-weight: 700; margin-bottom: 12px; text-align: center; color: #1e293b; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 8px; border-radius: 6px; border-bottom: 2px solid #0f172a; }'
    html += '.players-table { width: 100%; border-collapse: collapse; border: 2px solid #0f172a; font-size: 12px; }'
    html += '.players-table th, .players-table td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; vertical-align: middle; }'
    html += '.players-table th { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }'
    html += '.players-table tr:nth-child(even) { background-color: #f8fafc; }'
    html += '.player-number { width: 40px; font-weight: 600; text-align: center; color: #475569; }'
    html += '.player-name { flex: 1; font-weight: 500; margin-left: 20px; }'
    html += '.player-role { width: 80px; font-weight: 500; text-align: center; }'
    html += '.player-price { width: 80px; font-weight: 600; text-align: center; color: #059669; }'
    html += '.print-btn { display: block; margin: 20px auto; padding: 12px 24px; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 16px; }'
    html += '.print-btn:hover { background: linear-gradient(135deg, #c2410c 0%, #9a3412 100%); }'
    html += '@media print { body { margin: 0; } .page { margin: 0; box-shadow: none; } .team { page-break-inside: avoid; } .print-btn { display: none; } }'
    html += '</style></head><body><div class="page">'
    html += '<button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>'
    
    targetTournaments.forEach(tournament => {
      html += '<div class="tournament-info"><h1>' + tournament.name + '</h1><p>Entry Fee: ₹' + (tournament.entryFee || 0) + '</p><p>Contact: ' + (tournament.contact || 'Not provided') + '</p></div>'
      
      // Get teams for this specific tournament
      const tournamentTeams = targetTeams.filter(team => team.tournamentId === tournament.id)
      
      html += '<div class="teams-section"><div class="teams-title">Registered Teams (' + tournamentTeams.length + ')</div><div class="registered-teams">'
      
      // Show registered teams with their names
      tournamentTeams.forEach((team, index) => {
        const teamName = team.teamName || team.name || 'Team ' + (index + 1)
        html += '<div class="team-item"><span class="team-name">' + (index + 1) + '. ' + teamName + '</span><span class="team-contact">Contact: ' + (team.contact || '_________________') + '</span></div>'
      })
      
      html += '</div></div>'
      
      // Generate team sheets only for registered teams
      tournamentTeams.forEach((team, index) => {
        const teamName = team.teamName || team.name || 'Team ' + (index + 1)
        html += '<div class="team"><div class="team-title">' + teamName + '</div><table class="players-table"><thead><tr><th class="player-number">No.</th><th class="player-name">Player Name</th><th class="player-role">Role</th><th class="player-price">Price</th></tr></thead><tbody>'
        
        for (let j = 0; j < 13; j++) {
          html += '<tr><td class="player-number">' + (j + 1) + '</td><td class="player-name">&nbsp;</td><td class="player-role">&nbsp;</td><td class="player-price">&nbsp;</td></tr>'
        }
        
        html += '</tbody></table></div>'
      })
    })
    
    html += '</div></body></html>'
    
    // Open in new window and print
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      toast.success('Print window opened! Click "Print / Save as PDF" button 🖨️')
    } else {
      toast.error('Popup blocked! Please allow popups for this site')
    }
  }

  const printAuctionResults = () => {
    if (auctionResults.length === 0) {
      toast.error('No auction results yet')
      return
    }

    // Group by team
    const teamMap = new Map()
    auctionResults.forEach((result: any) => {
      const teamName = result.teamName || 'Unknown Team'
      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, { players: [], totalSpent: 0 })
      }
      const team = teamMap.get(teamName)
      team.players.push(result)
      team.totalSpent += result.points || 0
    })

    // Get tournament info
    const tournament = tournaments.find(t => t.id === selectedTournament) || tournaments[0]

    let html = '<!DOCTYPE html><html><head><title>Auction Results</title>'
    html += '<style>@import url(\'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap\');'
    html += '* { margin: 0; padding: 0; box-sizing: border-box; }'
    html += 'body { font-family: \'Inter\', sans-serif; margin: 20px; background: #fafaf9; color: #1e293b; }'
    html += '.page { max-width: 210mm; margin: 0 auto; background: white; padding: 20px; }'
    html += '.header { text-align: center; margin-bottom: 30px; border: 3px solid #ea580c; padding: 25px; background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); border-radius: 12px; }'
    html += '.header h1 { font-size: 32px; font-weight: 800; color: #9a3412; margin-bottom: 10px; }'
    html += '.header p { font-size: 16px; font-weight: 600; color: #c2410c; margin: 5px 0; }'
    html += '.summary { display: flex; justify-content: center; gap: 40px; margin: 20px 0; flex-wrap: wrap; }'
    html += '.summary-box { text-align: center; padding: 15px 25px; background: white; border-radius: 8px; border: 2px solid #ea580c; }'
    html += '.summary-box .number { font-size: 28px; font-weight: 800; color: #ea580c; }'
    html += '.summary-box .label { font-size: 12px; font-weight: 600; color: #9a3412; text-transform: uppercase; }'
    html += '.team-section { margin-bottom: 25px; border: 2px solid #0f172a; border-radius: 10px; overflow: hidden; page-break-inside: avoid; }'
    html += '.team-header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }'
    html += '.team-header h2 { font-size: 20px; font-weight: 700; }'
    html += '.team-header .spent { font-size: 18px; font-weight: 700; color: #fbbf24; }'
    html += '.players-table { width: 100%; border-collapse: collapse; font-size: 13px; }'
    html += '.players-table th { background: #f8fafc; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }'
    html += '.players-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }'
    html += '.players-table tr:hover { background: #f8fafc; }'
    html += '.player-name { font-weight: 600; }'
    html += '.price { font-weight: 700; color: #059669; font-size: 14px; }'
    html += '.print-btn { display: block; margin: 20px auto; padding: 15px 30px; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 16px; }'
    html += '@media print { body { margin: 0; } .page { margin: 0; } .print-btn { display: none; } .team-section { page-break-inside: avoid; } }'
    html += '</style></head><body><div class="page">'
    html += '<button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>'
    
    // Header
    html += '<div class="header">'
    html += '<h1>🏆 Auction Results</h1>'
    html += '<p>' + (tournament?.name || 'Tournament') + '</p>'
    html += '<div class="summary">'
    html += '<div class="summary-box"><div class="number">' + auctionResults.length + '</div><div class="label">Players Sold</div></div>'
    html += '<div class="summary-box"><div class="number">' + teamMap.size + '</div><div class="label">Teams</div></div>'
    html += '<div class="summary-box"><div class="number">₹' + auctionResults.reduce((sum: number, r: any) => sum + (r.points || 0), 0).toLocaleString() + '</div><div class="label">Total Spent</div></div>'
    html += '</div></div>'

    // Teams
    teamMap.forEach((data, teamName) => {
      html += '<div class="team-section">'
      html += '<div class="team-header">'
      html += '<h2>🛡️ ' + teamName + '</h2>'
      html += '<div class="spent">Total: ₹' + data.totalSpent.toLocaleString() + '</div>'
      html += '</div>'
      html += '<table class="players-table">'
      html += '<thead><tr><th>#</th><th>Player Name</th><th>Price</th></tr></thead><tbody>'
      data.players.forEach((player: any, idx: number) => {
        html += '<tr>'
        html += '<td>' + (idx + 1) + '</td>'
        html += '<td class="player-name">' + (player.playerName || player.playerId || 'Unknown') + '</td>'
        html += '<td class="price">₹' + (player.points || 0).toLocaleString() + '</td>'
        html += '</tr>'
      })
      html += '</tbody></table></div>'
    })

    html += '</div></body></html>'

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      toast.success('Auction results opened! Click Print to save PDF 🏆')
    } else {
      toast.error('Popup blocked! Allow popups for this site')
    }
  }

  const generateSimpleTeamSheet = () => {
    console.log('Generating team sheet with actual team names...')
    console.log('Available teams:', teams)
    
    // Get teams data for selected tournament
    const targetTournaments = selectedTournament === 'all' 
      ? tournaments 
      : tournaments.filter(t => t.id === selectedTournament)
    
    if (targetTournaments.length === 0) {
      toast.error('No tournaments selected')
      return
    }
    
    // Filter teams for selected tournament(s)
    const targetTeams = selectedTournament === 'all'
      ? teams
      : teams.filter(team => team.tournamentId === selectedTournament)
    
    console.log('Target teams for sheets:', targetTeams)
    
    if (targetTeams.length === 0) {
      toast.error('No teams registered for this tournament')
      return
    }
    
    // Create HTML content with improved design and actual team data
    let html = '<!DOCTYPE html><html><head>'
    html += '<style>@import url(\'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap\');'
    html += '* { margin: 0; padding: 0; box-sizing: border-box; }'
    html += 'body { font-family: \'Inter\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; margin: 20px; background: #fafaf9; color: #1e293b; line-height: 1.6; }'
    html += '.page { max-width: 210mm; margin: 0 auto; background: white; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }'
    html += '.tournament-info { text-align: center; margin-bottom: 25px; border: 2px solid #ea580c; padding: 20px; background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); border-radius: 8px; }'
    html += '.tournament-info h1 { font-size: 24px; font-weight: 800; color: #9a3412; margin-bottom: 8px; }'
    html += '.tournament-info p { font-size: 14px; font-weight: 500; color: #ea580c; margin-bottom: 4px; }'
    html += '.teams-section { margin-bottom: 20px; border: 2px solid #0f172a; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }'
    html += '.teams-title { font-size: 18px; font-weight: 700; margin-bottom: 15px; text-align: center; color: #1e293b; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 8px; border-radius: 6px; border-bottom: 2px solid #0f172a; }'
    html += '.registered-teams { margin-bottom: 20px; }'
    html += '.team-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 8px; border-left: 4px solid #059669; }'
    html += '.team-name { font-weight: 600; color: #1e293b; font-size: 14px; }'
    html += '.team-contact { font-size: 12px; color: #64748b; font-weight: 500; }'
    html += '.team { margin-bottom: 20px; border: 2px solid #0f172a; padding: 15px; page-break-inside: avoid; background: white; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }'
    html += '.team-title { font-size: 18px; font-weight: 700; margin-bottom: 12px; text-align: center; color: #1e293b; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 8px; border-radius: 6px; border-bottom: 2px solid #0f172a; }'
    html += '.players-table { width: 100%; border-collapse: collapse; border: 2px solid #0f172a; font-size: 12px; }'
    html += '.players-table th, .players-table td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; vertical-align: middle; }'
    html += '.players-table th { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }'
    html += '.players-table tr:nth-child(even) { background-color: #f8fafc; }'
    html += '.players-table tr:hover { background-color: #f1f5f9; }'
    html += '.player-number { width: 40px; font-weight: 600; text-align: center; color: #475569; }'
    html += '.player-name { flex: 1; font-weight: 500; margin-left: 20px; }'
    html += '.player-role { width: 80px; font-weight: 500; text-align: center; }'
    html += '.player-price { width: 80px; font-weight: 600; text-align: center; color: #059669; }'
    html += '.empty-cell { color: #94a3b8; font-style: italic; }'
    html += '@media print { body { margin: 0; } .page { margin: 0; box-shadow: none; } .team { page-break-inside: avoid; } }'
    html += '</style></head><body><div class="page">'
    
    targetTournaments.forEach(tournament => {
      html += '<div class="tournament-info"><h1>' + tournament.name + '</h1><p>Entry Fee: ₹' + (tournament.entryFee || 0) + '</p><p>Contact: ' + (tournament.contact || 'Not provided') + '</p></div>'
      
      // Get teams for this specific tournament
      const tournamentTeams = targetTeams.filter(team => team.tournamentId === tournament.id)
      
      html += '<div class="teams-section"><div class="teams-title">Registered Teams (' + tournamentTeams.length + ')</div><div class="registered-teams">'
      
      // Show registered teams with their names
      tournamentTeams.forEach((team, index) => {
        const teamName = team.teamName || team.name || 'Team ' + (index + 1)
        html += '<div class="team-item"><span class="team-name">' + (index + 1) + '. ' + teamName + '</span><span class="team-contact">Contact: ' + (team.contact || '_________________') + '</span></div>'
      })
      
      html += '</div></div>'
      
      // Generate team sheets only for registered teams
      tournamentTeams.forEach((team, index) => {
        const teamName = team.teamName || team.name || 'Team ' + (index + 1)
        html += '<div class="team"><div class="team-title">' + teamName + '</div><table class="players-table"><thead><tr><th class="player-number">No.</th><th class="player-name">Player Name</th><th class="player-role">Role</th><th class="player-price">Price</th></tr></thead><tbody>'
        
        for (let j = 0; j < 13; j++) {
          html += '<tr><td class="player-number">' + (j + 1) + '</td><td class="player-name">&nbsp;</td><td class="player-role">&nbsp;</td><td class="player-price">&nbsp;</td></tr>'
        }
        
        html += '</tbody></table></div>'
      })
    })
    
    html += '</div></body></html>'
    
    // Download as HTML file
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'team-registration-sheet.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Team sheets downloaded for ' + targetTeams.length + ' registered teams! 📄')
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">Live Player Registration</h1>
            <p className="text-stone-400 text-sm font-medium mt-0.5">Real-time player registration status</p>
            
            {/* Tournament Selector */}
            <div className="mt-3">
              <label className="label text-xs">Filter by Tournament</label>
              <select 
                className="input text-sm"
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
              >
                <option value="all">All Tournaments</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={load} className="btn-outline btn-sm gap-1.5">
              <FiRefreshCw size={13}/> Refresh
            </button>
            <Link href="/admin/players" className="btn-primary btn-sm gap-1.5">
              <FiZap size={13}/> Register Players
            </Link>
            <button onClick={() => window.location.reload()} className="btn-ghost btn-sm gap-1.5 text-red-600 hover:bg-red-50">
              <FiAlertTriangle size={13}/> Force Reload
            </button>
          </div>
        </div>

        {/* Live Registration Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { e:'👤', v:players.length, l:'Total Players',  sub:`${avail} available`, c:'bg-blue-50 border-blue-200' },
            { e:'📝', v:avail,           l:'Available',       sub:'Ready for auction',    c:'bg-emerald-50 border-emerald-200' },
            { e:'🔄', v:0,               l:'In Progress',      sub:'Registration active',   c:'bg-saffron-50 border-saffron-200' },
          ].map((s: any, i: number) => (
            <div key={i} className={`card border-2 p-4 ${s.c}`}>
              <div className="text-3xl mb-1">{s.e}</div>
              <div className="text-3xl font-extrabold text-stone-800">{loading ? '—' : s.v}</div>
              <div className="text-sm font-bold text-stone-600 mt-0.5">{s.l}</div>
              <div className="text-xs text-stone-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Registration Progress */}
        {players.length > 0 && (
          <div className="card p-5">
            <h2 className="sec-title mb-3">Registration Progress</h2>
            <div className="h-4 bg-stone-100 rounded-full overflow-hidden flex">
              <div className="bg-emerald-400 h-full transition-all" style={{width:`${avail/players.length*100}%`}}/>
              <div className="bg-stone-200 h-full transition-all" style={{width:`${(players.length-avail)/players.length*100}%`}}/>
            </div>
            <div className="flex gap-4 text-xs mt-2 text-stone-500 font-semibold">
              <span><span className="inline-block w-3 h-3 rounded bg-emerald-400 mr-1"/>Available {avail}</span>
              <span><span className="inline-block w-3 h-3 rounded bg-stone-200 mr-1"/>Processing {players.length-avail}</span>
            </div>
          </div>
        )}

        {/* Registered Teams Display */}
        <div className="card border-2 border-purple-200 bg-purple-50/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="sec-title">Registered Teams ({teams.length})</h2>
            {teams.length > 0 && (
              <div className="flex gap-2">
                <button onClick={generateSimpleTeamSheet} className="btn-primary btn-sm gap-1.5">
                  <FiDownload size={14}/> Download HTML
                </button>
                <button onClick={printTeamSheets} className="btn-outline btn-sm gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50">
                  🖨️ Print / PDF
                </button>
              </div>
            )}
          </div>
          
          {teams.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🏏</div>
              <p className="text-stone-500 font-medium">No teams registered yet</p>
              <p className="text-stone-400 text-sm">Teams will appear here after registration</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {teams.map((team, index) => (
                <div key={team.id} className="bg-white rounded-lg border border-purple-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-stone-800">{index + 1}. {team.teamName || team.name || 'Unnamed Team'}</h3>
                      <p className="text-stone-500 text-sm mt-1">📞 {team.contact || 'No contact'}</p>
                      <p className="text-purple-600 text-sm font-medium mt-1">
                        👥 {team.players?.length || 0} players
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Auction Results Section */}
        <div className="card border-2 border-orange-200 bg-orange-50/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="sec-title flex items-center gap-2">
              🏆 Auction Results 
              <span className="text-sm font-normal text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                {auctionResults.length} sold
              </span>
            </h2>
            {auctionResults.length > 0 && (
              <button onClick={printAuctionResults} className="btn-primary btn-sm gap-1.5 bg-orange-600 hover:bg-orange-700 border-orange-600">
                🏆 Print Results PDF
              </button>
            )}
          </div>
          
          {auctionResults.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🏏</div>
              <p className="text-stone-500 font-medium">No auction results yet</p>
              <p className="text-stone-400 text-sm">Start live auction to see sold players</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(() => {
                // Group by team
                const teamMap = new Map()
                auctionResults.forEach((result: any) => {
                  const teamName = result.teamName || 'Unknown Team'
                  if (!teamMap.has(teamName)) {
                    teamMap.set(teamName, [])
                  }
                  teamMap.get(teamName).push(result)
                })
                
                return Array.from(teamMap.entries()).map(([teamName, players], teamIndex) => (
                  <div key={teamName} className="bg-white rounded-lg border border-orange-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-100 to-orange-50 px-4 py-3 border-b border-orange-200 flex justify-between items-center">
                      <h3 className="font-bold text-stone-800 flex items-center gap-2">
                        🛡️ {teamName}
                      </h3>
                      <span className="text-sm font-semibold text-orange-700">
                        ₹{players.reduce((sum: number, p: any) => sum + (p.points || 0), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {players.map((player: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2">
                            <span className="text-sm font-medium text-stone-700 truncate">
                              {idx + 1}. {player.playerName || player.playerId?.slice(0, 8) || 'Unknown'}
                            </span>
                            <span className="text-sm font-bold text-emerald-600 ml-2">
                              ₹{(player.points || 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button onClick={generateSimpleTeamSheet} className="card border-2 p-4 text-center font-bold text-sm transition-all hover:-translate-y-0.5 bg-purple-50 border-purple-200 text-purple-700">
            <div className="text-2xl mb-1">📄</div>Download Team Sheets
          </button>
          <Link href="/admin/players" className="card border-2 p-4 text-center font-bold text-sm transition-all hover:-translate-y-0.5 bg-blue-50 border-blue-200 text-blue-700">
            <div className="text-2xl mb-1">➕</div>Register New Player
          </Link>
          <Link href="/admin/auction" className="card border-2 p-4 text-center font-bold text-sm transition-all hover:-translate-y-0.5 bg-red-50 border-red-200 text-red-700">
            <div className="text-2xl mb-1">🔴</div>Start Live Auction
          </Link>
        </div>
      </div>
    </AdminLayout>
  )
}
