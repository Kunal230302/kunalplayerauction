'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getTeams, getPlayers, getSettings, subLive, subBids, pushBid, updateLive, LiveState } from '@/lib/db'
import { FiLogOut, FiInstagram } from 'react-icons/fi'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'

const TEAM_CLASSES = [
  { btn:'bg-red-500 hover:bg-red-600',    ring:'ring-red-400',    badge:'bg-red-100 text-red-700' },
  { btn:'bg-blue-500 hover:bg-blue-600',  ring:'ring-blue-400',   badge:'bg-blue-100 text-blue-700' },
  { btn:'bg-green-600 hover:bg-green-700',ring:'ring-green-400',  badge:'bg-green-100 text-green-700' },
  { btn:'bg-purple-500 hover:bg-purple-600',ring:'ring-purple-400',badge:'bg-purple-100 text-purple-700' },
]

export default function TeamDashboard() {
  const { appUser, logout, loading } = useAuth()
  const router                = useRouter()
  const [myTeam,   setMyTeam]   = useState<any>(null)
  const [myPlayers,setMyPlayers]= useState<any[]>([])
  const [allTeams, setAllTeams] = useState<any[]>([])
  const [live,     setLiveState]= useState<LiveState|null>(null)
  const [bids,     setBids]     = useState<any[]>([])
  const [settings, setSettings] = useState<any>({})
  const [timer,    setTimer]    = useState(0)
  const [tab,      setTab]      = useState<'auction'|'squad'>('auction')
  const timerRef               = useRef<any>(null)
  const prevPhaseRef           = useRef<string>('')

  useEffect(() => {
    if (!appUser) return
    const loadData = async () => {
      const [teams, players, s] = await Promise.all([getTeams(), getPlayers(), getSettings()])
      setAllTeams(teams)
      setSettings(s)
      const mine = teams.find(t => t.id === appUser.teamId)
      setMyTeam(mine || null)
      setMyPlayers(players.filter(p => p.soldTo === appUser.teamId))
    }
    loadData()
    const u1 = subLive(data => {
      setLiveState(data)
      if (data?.status === 'bidding' && data.timerEnd) {
        startCountdown(Math.ceil((data.timerEnd - Date.now()) / 1000))
      }
    })
    const u2 = subBids(setBids)
    return () => { u1(); u2(); clearInterval(timerRef.current) }
  }, [appUser])

  // Auth guard: redirect non-team_owner users
  useEffect(() => {
    if (!appUser && !loading) router.push('/login')
  }, [appUser])

  // Refresh squad when sold + confetti celebration
  useEffect(() => {
    if (!appUser) return
    if (live?.status === 'sold' && prevPhaseRef.current === 'bidding') {
      getPlayers().then(p => setMyPlayers(p.filter(x => x.soldTo === appUser.teamId)))
      // Confetti if sold to MY team
      if (live?.currentBidderTeamId === appUser.teamId) {
        try {
          confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 },
            colors: ['#f97316','#ef4444','#3b82f6','#22c55e','#a855f7','#eab308','#ffffff'] })
          setTimeout(() => confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0 } }), 300)
          setTimeout(() => confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1 } }), 500)
        } catch {}
      }
    }
    prevPhaseRef.current = live?.status || ''
  }, [live?.status])

  const startCountdown = (seconds: number) => {
    clearInterval(timerRef.current)
    setTimer(Math.max(0, seconds))
    timerRef.current = setInterval(() => {
      setTimer(prev => { if (prev <= 1) { clearInterval(timerRef.current); return 0 } return prev - 1 })
    }, 1000)
  }

  const canBid = live?.status === 'bidding' && myTeam
  const isLeading = live?.currentBidderTeamId === myTeam?.id

  const handleBid = async () => {
    if (!canBid || !myTeam) return
    const newPts = (live?.currentPoints || 0) + (settings.bidIncrement || 50)
    await updateLive({ currentPoints: newPts, currentBidder: myTeam.teamName, currentBidderTeamId: myTeam.id })
    await pushBid(myTeam.id, myTeam.teamName, newPts)
    const newTimer = settings.timerSeconds || 30
    await updateLive({ timerEnd: Date.now() + newTimer * 1000 } as any)
    startCountdown(newTimer)
    toast(`💰 Bid placed: ${newPts} pts!`, { icon: '🏏' })
  }

  const timerPct   = settings.timerSeconds ? (timer / settings.timerSeconds) * 100 : 0
  const timerColor = timerPct > 50 ? '#22c55e' : timerPct > 25 ? '#eab308' : '#ef4444'
  const myIdx      = allTeams.findIndex(t => t.id === myTeam?.id)
  const myStyle    = TEAM_CLASSES[myIdx % 4] || TEAM_CLASSES[0]

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-saffron-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-saffron-500 rounded-xl flex items-center justify-center text-white font-extrabold">🏏</div>
            <div>
              <div className="font-extrabold text-saffron-600 text-sm leading-none">PlayerAuctionHub</div>
              <div className="text-[10px] text-stone-400">{myTeam?.teamName || appUser?.displayName}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {live?.status === 'bidding' && <span className="flex items-center gap-1.5 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-extrabold border border-red-200 animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-red-500"/>LIVE</span>}
            <button onClick={async () => { await logout(); router.push('/login') }} className="btn btn-sm border-2 border-stone-200 text-stone-500 gap-1.5">
              <FiLogOut size={13}/> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">
        {/* My team card */}
        {myTeam && (
          <div className={`card p-4 flex items-center gap-4 border-2 ${myIdx === 0 ? 'border-red-200 bg-red-50' : myIdx === 1 ? 'border-blue-200 bg-blue-50' : myIdx === 2 ? 'border-green-200 bg-green-50' : 'border-purple-200 bg-purple-50'}`}>
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border-2 border-current flex items-center justify-center font-extrabold text-2xl shrink-0">
              {myTeam.logoURL ? <img src={myTeam.logoURL} className="w-full h-full object-cover"/> : myTeam.teamName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-lg">{myTeam.teamName}</div>
              <div className="text-sm text-stone-500 font-medium">{myTeam.ownerName}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-saffron-600">{myTeam.points||0}</div>
              <div className="text-xs text-stone-400 font-semibold">points spent</div>
              <div className="text-xs text-stone-500 font-semibold mt-0.5">{myTeam.playersBought||0} players</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b-2 border-stone-100">
          {[['auction','🏏 Live Auction'],['squad','👥 My Squad']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t as any)}
              className={`px-5 py-2.5 -mb-0.5 font-extrabold text-sm border-b-4 transition-all ${tab===t ? 'border-saffron-500 text-saffron-600' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ── AUCTION TAB ── */}
        {tab === 'auction' && (
          <div className="space-y-4">
            {/* Live player card */}
            {live?.status === 'bidding' || live?.status === 'sold' || live?.status === 'unsold' ? (
              <div className="auction-card">
                {/* SOLD overlay */}
                {live.status === 'sold' && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center"
                    style={{ background: 'radial-gradient(circle, rgba(255,107,0,0.15) 0%, rgba(255,255,255,0.97) 100%)' }}>
                    <div className="animate-sold-stamp text-center">
                      <div className="text-6xl mb-2">🏆</div>
                      <div className="inline-block border-4 border-saffron-500 rounded-2xl px-8 py-4 bg-white shadow-2xl">
                        <div className="text-saffron-600 font-extrabold text-xs tracking-widest uppercase mb-1">SOLD TO</div>
                        <div className="text-2xl font-extrabold text-stone-800">{live.currentBidder}</div>
                        {isLeading && <div className="text-saffron-500 font-extrabold text-sm mt-1">🎉 That's YOU!</div>}
                      </div>
                    </div>
                  </div>
                )}
                {live.status === 'unsold' && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-900/80">
                    <div className="text-center text-white animate-unsold-fade">
                      <div className="text-6xl mb-2">❌</div>
                      <div className="text-4xl font-extrabold tracking-wider">UNSOLD</div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-6 p-6">
                  {/* Photo */}
                  <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-saffron-300 shadow-xl bg-stone-100 flex items-center justify-center shrink-0">
                    {live.playerPhoto
                      ? <img src={live.playerPhoto} className="w-full h-full object-cover" alt={live.playerName}/>
                      : <span className="text-5xl font-extrabold text-stone-300">{live.playerName?.[0]?.toUpperCase()}</span>}
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="text-3xl font-extrabold text-stone-800 mb-1">{live.playerName}</div>
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
                      <span className="b-orange">{live.playerRole}</span>
                      {live.playerVillage && <span className="b-gray">📍 {live.playerVillage}</span>}
                    </div>

                    <div className="bg-stone-50 border-2 border-stone-100 rounded-2xl p-4 inline-block min-w-[200px]">
                      <div className="text-xs font-extrabold text-stone-400 uppercase tracking-widest mb-1">Current Bid</div>
                      <div className="text-4xl font-extrabold text-saffron-600 tabular-nums">{live.currentPoints||0} <span className="text-base text-stone-400">pts</span></div>
                      {live.currentBidder && (
                        <div className={`text-sm font-bold mt-1 ${isLeading ? 'text-saffron-600' : 'text-stone-500'}`}>
                          {isLeading ? '👑 YOU are leading!' : `🏏 ${live.currentBidder} leading`}
                        </div>
                      )}
                    </div>
                  </div>

                  {live.status === 'bidding' && (
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r="27" fill="none" stroke="#e7e5e4" strokeWidth="6"/>
                          <circle cx="32" cy="32" r="27" fill="none" stroke={timerColor} strokeWidth="6"
                            strokeDasharray={`${169.6 * timerPct / 100} 169.6`} strokeLinecap="round"
                            style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s' }}/>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-extrabold tabular-nums" style={{ color: timerColor }}>{timer}</span>
                        </div>
                      </div>
                      <span className="text-xs text-stone-400 font-semibold">secs</span>
                    </div>
                  )}
                </div>

                {/* BID BUTTON */}
                {live.status === 'bidding' && myTeam && (
                  <div className="border-t-2 border-stone-100 p-5">
                    <button onClick={handleBid}
                      className={`w-full py-5 rounded-2xl text-white font-extrabold text-2xl transition-all active:scale-95 shadow-xl ${isLeading ? 'opacity-60 cursor-not-allowed' : myStyle.btn}`}
                      disabled={isLeading}>
                      {isLeading
                        ? '👑 YOU ARE LEADING'
                        : `🏏 BID ${(live.currentPoints||0) + (settings.bidIncrement||50)} pts`}
                    </button>
                    <p className="text-xs text-stone-400 text-center mt-2 font-semibold">
                      +{settings.bidIncrement||50} points per bid • Timer resets on each bid
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-16 text-center text-stone-400">
                <div className="text-5xl mb-3">⏳</div>
                <p className="font-extrabold text-lg mb-1">Waiting for auction to start</p>
                <p className="text-sm">Admin will start the auction soon. Stay ready!</p>
              </div>
            )}

            {/* Bid history */}
            {bids.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b-2 border-stone-100"><h3 className="font-extrabold text-sm">Bid History</h3></div>
                <div className="divide-y divide-stone-50 max-h-36 overflow-y-auto">
                  {bids.slice(0,6).map((b:any, i:number) => (
                    <div key={i} className={`flex justify-between px-4 py-2 text-sm ${i===0?'bg-saffron-50':''}`}>
                      <span className={`font-semibold ${b.teamId===myTeam?.id?'text-saffron-600':''}`}>{b.teamName}</span>
                      <span className="font-extrabold tabular-nums text-stone-500">{b.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SQUAD TAB ── */}
        {tab === 'squad' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-lg">{myTeam?.teamName} Squad ({myPlayers.length} players)</h2>
            </div>
            {myPlayers.length === 0 ? (
              <div className="card p-16 text-center text-stone-400">
                <div className="text-5xl mb-3">🏏</div>
                <p className="font-extrabold mb-1">No players yet</p>
                <p className="text-sm">Win some bids to build your squad!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {myPlayers.map((p:any) => (
                  <div key={p.id} className="card p-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-saffron-50 border-2 border-saffron-100 overflow-hidden mx-auto mb-2 flex items-center justify-center font-extrabold text-saffron-500 text-xl">
                      {p.photoURL ? <img src={p.photoURL} className="w-full h-full object-cover"/> : p.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="font-bold text-sm truncate">{p.name}</div>
                    <div className="text-xs text-stone-400 mt-0.5">{p.role}</div>
                    {p.village && <div className="text-xs text-stone-400">📍 {p.village}</div>}
                    <div className="text-xs font-extrabold text-saffron-600 mt-1.5">{p.soldPoints||0} pts</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer credits */}
        <div className="text-center py-4 text-stone-400 text-xs">
          <p>Made with 🏏 by <span className="text-saffron-500 font-bold">Kunal Kotak</span> &amp; <span className="text-blue-500 font-bold">Yash Jani</span></p>
          <div className="flex items-center justify-center gap-4 mt-1">
            <a href="https://instagram.com/kunallll2303" target="_blank" className="flex items-center gap-1 hover:text-saffron-500 transition-colors"><FiInstagram size={11}/> @kunallll2303</a>
            <a href="https://instagram.com/yash_jani_" target="_blank" className="flex items-center gap-1 hover:text-blue-500 transition-colors"><FiInstagram size={11}/> @yash_jani_</a>
          </div>
        </div>
      </div>
    </div>
  )
}
