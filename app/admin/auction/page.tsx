'use client'
import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  getPlayers, getTeams, getSettings, getTournaments,
  setLive, updateLive, clearLive, clearBids,
  subLive, subBids, pushBid, markSold, markUnsold
} from '@/lib/db'
import { generateAllPDFs } from '@/lib/pdf'
import { FiPlay, FiSkipForward, FiDownload, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'

const TEAM_CLASSES = [
  { btn:'t1', ring:'ring-red-400',    label:'bg-red-500',    text:'text-red-700' },
  { btn:'t2', ring:'ring-blue-400',   label:'bg-blue-500',   text:'text-blue-700' },
  { btn:'t3', ring:'ring-green-500',  label:'bg-green-600',  text:'text-green-700' },
  { btn:'t4', ring:'ring-purple-500', label:'bg-purple-500', text:'text-purple-700' },
]

// Inner component uses useSearchParams — must be inside Suspense
function LiveAuctionInner() {
  const searchParams = useSearchParams()
  const tournamentId = searchParams.get('tournamentId') || ''

  const [players,  setPlayers]  = useState<any[]>([])
  const [teams,    setTeams]    = useState<any[]>([])
  const [settings, setSettings] = useState<any>({})
  const [queue,    setQueue]    = useState<any[]>([])
  const [qIdx,     setQIdx]     = useState(0)
  const [live,     setLiveState]= useState<any>(null)
  const [bids,     setBids]     = useState<any[]>([])
  const [timer,    setTimer]    = useState(0)
  const [running,  setRunning]  = useState(false)
  const [phase,    setPhase]    = useState<'idle'|'bidding'|'sold'|'unsold'>('idle')
  const [complete, setComplete] = useState(false)
  const [genPdf,   setGenPdf]   = useState(false)
  const [tournamentName, setTournamentName] = useState('')

  const timerRef    = useRef<any>(null)
  const allPlayersRef = useRef<any[]>([])

  /* ── Load static data (scoped to tournament) ── */
  useEffect(() => {
    const load = async () => {
      const tid = tournamentId || undefined
      const [p, t, s] = await Promise.all([getPlayers(tid), getTeams(tid), getSettings(tid)])
      allPlayersRef.current = p
      setPlayers(p); setTeams(t); setSettings(s)
      const available = p.filter((x:any) => x.status === 'available' || x.status === 'unsold')
      setQueue(available)
      // Get tournament name
      if (tid) {
        getTournaments().then(ts => {
          const found = ts.find(t => t.id === tid)
          if (found) setTournamentName(found.name)
        })
      }
    }
    load()
  }, [tournamentId])

  /* ── Subscribe realtime ── */
  useEffect(() => {
    const u1 = subLive(setLiveState)
    const u2 = subBids(setBids)
    return () => { u1(); u2() }
  }, [])

  /* ── Timer ── */
  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = null
    setRunning(false)
  }, [])

  const startTimer = useCallback((seconds: number) => {
    stopTimer()
    setTimer(seconds)
    setRunning(true)
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [stopTimer])

  // Auto-close when timer hits 0
  useEffect(() => {
    if (timer === 0 && running === false && phase === 'bidding' && live) {
      handleAutoClose()
    }
  }, [timer, running, phase])

  const handleAutoClose = async () => {
    if (!live) return
    if (live.currentBidderTeamId) {
      await doSold(live.currentBidderTeamId, live.currentBidder, live.currentPoints)
    } else {
      await doUnsold()
    }
  }

  /* ── Start player ── */
  const startPlayer = async (player: any) => {
    if (!player) return
    await clearBids()
    const bidStart = settings.basePrice ?? 5000
    await setLive({
      playerId: player.id,
      playerName: player.name,
      playerRole: player.role,
      playerPhoto: player.photoURL || '',
      playerVillage: player.village || '',
      currentPoints: bidStart,
      currentBidder: '',
      currentBidderTeamId: '',
      status: 'bidding',
      timerEnd: Date.now() + (settings.timerSeconds || 30) * 1000,
    })
    setPhase('bidding')
    startTimer(settings.timerSeconds || 30)
    toast.success(`🏏 ${player.name} is up for auction! Base: ₹${bidStart.toLocaleString('en-IN')}`)
  }

  /* ── Tiered bid increment ── */
  const getBidIncrement = (currentPrice: number) => {
    const t1Limit = settings.bidTier1Limit ?? 50000
    const t1Inc   = settings.bidTier1Inc   ?? 10000
    const t2Limit = settings.bidTier2Limit ?? 100000
    const t2Inc   = settings.bidTier2Inc   ?? 20000
    if (currentPrice < t1Limit)  return t1Inc
    if (currentPrice < t2Limit)  return t2Inc
    return t2Inc * 2   // above tier 2 = double
  }

  /* ── Manual bid ── */
  const handleBid = async (team: any) => {
    if (phase !== 'bidding') return
    const currentPrice = live?.currentPoints || 0
    const inc = getBidIncrement(currentPrice)
    const newPts = currentPrice + inc
    await updateLive({ currentPoints: newPts, currentBidder: team.teamName, currentBidderTeamId: team.id })
    await pushBid(team.id, team.teamName, newPts)
    startTimer(settings.timerSeconds || 30)  // reset timer on bid
    toast(`💰 ${team.teamName} → ₹${newPts.toLocaleString('en-IN')} (+₹${inc.toLocaleString('en-IN')})`, { icon:'🏏' })
  }

  /* ── SOLD ── */
  const doSold = async (teamId: string, teamName: string, points: number) => {
    stopTimer()
    setPhase('sold')
    const player = queue[qIdx]
    if (!player) return

    // confetti!
    try {
      const confetti = (await import('canvas-confetti')).default
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 },
        colors: ['#f97316','#ef4444','#3b82f6','#22c55e','#a855f7','#eab308','#ffffff'] })
      setTimeout(() => confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0 } }), 300)
      setTimeout(() => confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1 } }), 500)
    } catch {}

    const tid = tournamentId || undefined
    await markSold(player.id, teamId, teamName, points, tid)
    toast.success(`🏆 SOLD! ${player.name} → ${teamName} for ₹${points.toLocaleString('en-IN')}`, { duration: 5000 })

    setTimeout(async () => {
      setPhase('idle')
      const newQ = queue.filter((_:any, i:number) => i !== qIdx)
      setQueue(newQ)
      if (newQ.length === 0) { setComplete(true); await clearLive(tid) }
      else setQIdx(Math.min(qIdx, newQ.length - 1))
    }, 3500)
  }

  /* ── UNSOLD ── */
  const doUnsold = async () => {
    stopTimer()
    setPhase('unsold')
    const player = queue[qIdx]
    if (!player) return
    const tid = tournamentId || undefined
    await markUnsold(player.id, tid)
    toast(`❌ ${player.name} — UNSOLD`, { icon:'❌' })
    setTimeout(async () => {
      setPhase('idle')
      const newQ = queue.filter((_:any, i:number) => i !== qIdx)
      setQueue(newQ)
      if (newQ.length === 0) { setComplete(true); await clearLive(tid) }
      else setQIdx(Math.min(qIdx, newQ.length - 1))
    }, 2500)
  }

  const skipPlayer = () => {
    stopTimer(); setPhase('idle')
    if (qIdx < queue.length - 1) setQIdx(i => i + 1)
    else setQIdx(0)
  }

  const handleGeneratePDFs = async () => {
    setGenPdf(true)
    try {
      await generateAllPDFs(teams, allPlayersRef.current, settings)
      toast.success('📄 All team PDFs downloaded!')
    } catch { toast.error('PDF generation failed') }
    setGenPdf(false)
  }

  /* ── Derived ── */
  const currentPlayer = queue[qIdx]
  const timerPct      = settings.timerSeconds ? (timer / settings.timerSeconds) * 100 : 0
  const timerColor    = timerPct > 50 ? '#22c55e' : timerPct > 25 ? '#eab308' : '#ef4444'

  /* ── AUCTION COMPLETE SCREEN ── */
  if (complete) return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto text-center py-16 space-y-6">
        <div className="text-7xl mb-2">🏆</div>
        <h1 className="text-4xl font-extrabold text-stone-800">Auction Complete!</h1>
        <p className="text-stone-400">All players have been auctioned. Download team PDFs below.</p>
        <button onClick={handleGeneratePDFs} disabled={genPdf} className="btn-primary btn-lg gap-2 mx-auto">
          <FiDownload size={18}/> {genPdf ? 'Generating PDFs…' : 'Download All Team PDFs'}
        </button>
        <button onClick={() => { setComplete(false); setQIdx(0) }} className="btn-ghost border-2 border-stone-200 btn-sm mx-auto">
          <FiRefreshCw size={14}/> Start New Round
        </button>
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-extrabold border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/> LIVE AUCTION
            </span>
            {tournamentName && (
              <span className="bg-saffron-100 text-saffron-700 px-3 py-1 rounded-full text-xs font-bold border border-saffron-200">
                🏆 {tournamentName}
              </span>
            )}
            {!tournamentId && (
              <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                ⚠️ No tournament selected — Go to Tournaments → Start Auction
              </span>
            )}
            <span className="text-stone-400 text-sm font-medium">{queue.length} players remaining</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleGeneratePDFs} disabled={genPdf} className="btn btn-sm border-2 border-stone-200 text-stone-600 hover:bg-stone-50 gap-1.5">
              <FiDownload size={13}/> Export PDFs
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-5">

          {/* ── LEFT: Player card + Bid buttons ── */}
          <div className="space-y-4">

            {/* Player card */}
            <div className={`auction-card ${phase === 'bidding' ? 'animate-glow-ring' : ''}`}>
              {/* SOLD overlay */}
              {phase === 'sold' && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center"
                  style={{ background: 'radial-gradient(circle at 50% 40%, rgba(255,107,0,0.18) 0%, rgba(255,255,255,0.97) 100%)' }}>
                  <div className="animate-sold-stamp text-center px-6">
                    <div className="text-7xl mb-3">🏆</div>
                    <div className="inline-block border-4 border-saffron-500 rounded-2xl px-8 py-3 bg-white shadow-2xl shadow-saffron-200">
                      <div className="text-saffron-600 font-extrabold text-xs tracking-widest uppercase mb-1">SOLD TO</div>
                      <div className="text-3xl font-extrabold text-stone-800">{live?.currentBidder}</div>
                      <div className="text-2xl font-bold text-saffron-500 mt-1">{live?.currentPoints} pts</div>
                    </div>
                  </div>
                </div>
              )}

              {/* UNSOLD overlay */}
              {phase === 'unsold' && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-stone-900/80 backdrop-blur-sm">
                  <div className="animate-unsold-fade text-center">
                    <div className="text-8xl mb-3">❌</div>
                    <div className="text-5xl font-extrabold text-white tracking-wider">UNSOLD</div>
                    <div className="text-stone-400 mt-2">{currentPlayer?.name}</div>
                  </div>
                </div>
              )}

              {currentPlayer ? (
                <div className="flex flex-col sm:flex-row items-center gap-6 p-7">
                  {/* Photo */}
                  <div className="relative shrink-0">
                    <div className={`w-36 h-36 rounded-2xl overflow-hidden border-4 ${phase === 'bidding' ? 'border-saffron-400' : 'border-stone-200'} shadow-xl bg-stone-100 flex items-center justify-center`}>
                      {currentPlayer.photoURL
                        ? <img src={currentPlayer.photoURL} className="w-full h-full object-cover" alt={currentPlayer.name}/>
                        : <span className="text-6xl font-extrabold text-stone-300">{currentPlayer.name?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    {phase === 'bidding' && (
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-saffron-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                        LIVE BIDDING
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="text-3xl sm:text-4xl font-extrabold text-stone-800 mb-1">{currentPlayer.name}</div>
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-4">
                      <span className="b-orange text-sm">{currentPlayer.role}</span>
                      {currentPlayer.village && <span className="b-gray text-sm">📍 {currentPlayer.village}</span>}
                    </div>

                    {/* Current bid */}
                    <div className="bg-stone-50 border-2 border-stone-100 rounded-2xl p-4 inline-block min-w-[220px]">
                      <div className="text-xs font-extrabold text-stone-400 uppercase tracking-widest mb-1">Current Bid</div>
                      <div className="text-4xl font-extrabold text-saffron-600 tabular-nums">
                        {live?.currentPoints || 0} <span className="text-lg text-stone-400">pts</span>
                      </div>
                      {live?.currentBidder && (
                        <div className="text-sm text-stone-600 font-semibold mt-1">🏏 {live.currentBidder} leading</div>
                      )}
                    </div>
                  </div>

                  {/* Timer ring */}
                  {phase === 'bidding' && (
                    <div className="shrink-0 flex flex-col items-center gap-2">
                      <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="34" fill="none" stroke="#e7e5e4" strokeWidth="7"/>
                          <circle cx="40" cy="40" r="34" fill="none" stroke={timerColor} strokeWidth="7"
                            strokeDasharray={`${213.6 * timerPct / 100} 213.6`} strokeLinecap="round"
                            style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s' }}/>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-extrabold tabular-nums" style={{ color: timerColor }}>{timer}</span>
                        </div>
                      </div>
                      <div className="text-xs text-stone-400 font-semibold">seconds</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-16 text-center text-stone-400">
                  <div className="text-5xl mb-3">🏏</div>
                  <p className="font-semibold">No players in queue</p>
                  <p className="text-sm mt-1">Add players in the Players section</p>
                </div>
              )}

              {/* Controls */}
              {currentPlayer && (
                <div className="border-t-2 border-stone-100 px-7 py-4 flex flex-wrap gap-3 justify-center bg-stone-50">
                  {phase === 'idle' && (
                    <button onClick={() => startPlayer(currentPlayer)} className="btn-primary btn-lg gap-2">
                      <FiPlay size={18}/> Start Bidding
                    </button>
                  )}
                  {phase === 'bidding' && (
                    <>
                      <button onClick={() => doSold(live?.currentBidderTeamId, live?.currentBidder, live?.currentPoints || 0)}
                        disabled={!live?.currentBidderTeamId} className="btn-success btn-lg">
                        ✅ Mark SOLD
                      </button>
                      <button onClick={doUnsold} className="btn-danger btn-lg">❌ Mark UNSOLD</button>
                      <button onClick={skipPlayer} className="btn btn-lg border-2 border-stone-300 text-stone-600 hover:bg-stone-100 gap-2">
                        <FiSkipForward size={16}/> Skip
                      </button>
                    </>
                  )}
                  {(phase === 'sold' || phase === 'unsold') && (
                    <div className="text-stone-400 text-sm font-semibold py-2">Moving to next player…</div>
                  )}
                </div>
              )}
            </div>

            {/* ── Team Bid Buttons ── */}
            {phase === 'bidding' && teams.length > 0 && (
              <div>
                <div className="text-xs font-extrabold text-stone-400 uppercase tracking-widest mb-3 text-center">Team Bid Buttons</div>
                <div className="grid grid-cols-2 gap-3">
                  {teams.slice(0,4).map((team, i) => {
                    const tc = TEAM_CLASSES[i % 4]
                    const isLeading = live?.currentBidderTeamId === team.id
                    return (
                      <button key={team.id} onClick={() => handleBid(team)}
                        className={`bid-btn t${i+1} ${isLeading ? 'leading' : ''}`}
                        style={{ ['--tc' as any]: ['#dc2626','#2563eb','#16a34a','#7c3aed'][i], ['--tb' as any]: ['#fef2f2','#eff6ff','#f0fdf4','#f5f3ff'][i], ['--tbr' as any]: ['#fca5a5','#93c5fd','#86efac','#c4b5fd'][i] }}>
                        <div className="text-sm font-bold opacity-70 mb-1">{isLeading ? '👑 LEADING' : 'BID'}</div>
                        <div className="text-xl font-extrabold truncate">{team.teamName}</div>
                        <div className="text-sm mt-1 opacity-80">+{settings.bidIncrement||50} pts</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Queue + Bids + Teams ── */}
          <div className="space-y-4">

            {/* Player queue */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b-2 border-stone-100 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-stone-700">Queue ({queue.length})</h3>
              </div>
              <div className="divide-y divide-stone-50 max-h-52 overflow-y-auto">
                {queue.slice(0, 10).map((p:any, i:number) => (
                  <div key={p.id} onClick={() => { if (phase === 'idle') { setQIdx(i) } }}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${i === qIdx ? 'bg-saffron-50 border-l-4 border-saffron-500' : 'hover:bg-stone-50 cursor-pointer'}`}>
                    <div className="w-8 h-8 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center font-bold text-stone-500 text-xs shrink-0">
                      {p.photoURL ? <img src={p.photoURL} className="w-full h-full object-cover"/> : p.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold truncate ${i === qIdx ? 'text-saffron-700' : ''}`}>{p.name}</div>
                      <div className="text-xs text-stone-400">{p.role} · {p.village||'—'}</div>
                    </div>
                    {i === qIdx && <span className="text-[10px] font-extrabold text-saffron-500 shrink-0">UP NEXT</span>}
                  </div>
                ))}
                {queue.length === 0 && <div className="py-8 text-center text-stone-400 text-sm">No players in queue</div>}
              </div>
            </div>

            {/* Bid history */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b-2 border-stone-100">
                <h3 className="font-extrabold text-sm text-stone-700">Bid History</h3>
              </div>
              <div className="divide-y divide-stone-50 max-h-40 overflow-y-auto">
                {bids.slice(0,8).map((b:any, i:number) => (
                  <div key={i} className={`flex items-center justify-between px-4 py-2 text-sm ${i === 0 ? 'bg-saffron-50' : ''}`}>
                    <span className={`font-semibold ${i === 0 ? 'text-saffron-700' : 'text-stone-600'}`}>{b.teamName}</span>
                    <span className={`font-extrabold tabular-nums ${i === 0 ? 'text-saffron-500' : 'text-stone-400'}`}>{b.points} pts</span>
                  </div>
                ))}
                {bids.length === 0 && <div className="py-6 text-center text-stone-400 text-xs">No bids yet</div>}
              </div>
            </div>

            {/* Teams */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b-2 border-stone-100">
                <h3 className="font-extrabold text-sm text-stone-700">Team Standings</h3>
              </div>
              <div className="divide-y divide-stone-50">
                {teams.map((t:any, i:number) => (
                  <div key={t.id} className={`flex items-center gap-3 px-4 py-3 ${live?.currentBidderTeamId === t.id ? 'bg-saffron-50' : ''}`}>
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-stone-100 border flex items-center justify-center font-bold text-sm shrink-0">
                      {t.logoURL ? <img src={t.logoURL} className="w-full h-full object-cover"/> : t.teamName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{t.teamName}</div>
                      <div className="text-xs text-stone-400">{t.playersBought||0} players</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-sm text-saffron-600">{t.points||0} pts</div>
                      {live?.currentBidderTeamId === t.id && <div className="text-[10px] text-saffron-500 font-bold">LEADING</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

// Suspense wrapper required by Next.js 14 for useSearchParams
export default function LiveAuctionAdmin() {
  return (
    <Suspense fallback={<AdminLayout><div className="flex items-center justify-center h-40 text-stone-400">Loading…</div></AdminLayout>}>
      <LiveAuctionInner />
    </Suspense>
  )
}

