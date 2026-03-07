'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSettings, getPlayers, getTournaments, Tournament } from '@/lib/db'
import { FiLogIn, FiInstagram, FiMapPin } from 'react-icons/fi'

/* ── Countdown timer ── */
function Countdown({ target }: { target: string }) {
  const [t, setT] = useState({ d:0, h:0, m:0, s:0, done:false })
  useEffect(() => {
    const tick = () => {
      const ms = new Date(target).getTime() - Date.now()
      if (ms <= 0) { setT(x => ({ ...x, done: true })); return }
      setT({ d: Math.floor(ms/86400000), h: Math.floor(ms%86400000/3600000), m: Math.floor(ms%3600000/60000), s: Math.floor(ms%60000/1000), done: false })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [target])
  if (t.done) return <p className="text-saffron-200 font-bold text-lg tracking-wide">🏏 The Auction is LIVE now!</p>
  return (
    <div className="flex gap-3 justify-center">
      {([['Days',t.d],['Hrs',t.h],['Min',t.m],['Sec',t.s]] as [string,number][]).map(([l,v]) => (
        <div key={l} className="text-center">
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-3 min-w-[68px]">
            <div className="text-4xl font-extrabold tabular-nums leading-none">{String(v).padStart(2,'0')}</div>
          </div>
          <div className="text-saffron-200 text-xs font-bold mt-1.5 tracking-widest uppercase">{l}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Hammer animation on enter ── */
/* ── Cricket gavel animation on click ── */
function GavelOverlay({ show, onDone }: { show: boolean; onDone: () => void }) {
  useEffect(() => {
    if (show) { const t = setTimeout(onDone, 900); return () => clearTimeout(t) }
  }, [show, onDone])
  if (!show) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="gavel-hit">
        <img src="/gavel.png" alt="Gavel" className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-2xl object-contain"/>
      </div>
      <style>{`
        .gavel-hit {
          animation: gavelSwing 0.4s ease-in-out 0.05s 1;
          transform-origin: 70% 90%;
        }
        @keyframes gavelSwing {
          0% { transform: rotate(-45deg) scale(0.8); opacity: 0.5; }
          50% { transform: rotate(15deg) scale(1.15); opacity: 1; }
          75% { transform: rotate(-5deg) scale(1); opacity: 1; }
          100% { transform: rotate(0deg) scale(0.9); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

function useGavel() {
  const [show, setShow] = useState(true)    // true = fires on page load too
  const trigger = () => { if (!show) setShow(true) }
  const done = () => setShow(false)
  return { show, trigger, done }
}

export default function Home() {
  const [settings, setSettings] = useState<any>({})
  const [stats,    setStats]    = useState({ total:0, sold:0 })
  const [tournaments, setTournaments] = useState<Tournament[]>([])

  useEffect(() => {
    Promise.all([getSettings(), getPlayers(), getTournaments()]).then(([s,p,tr]) => {
      setSettings(s); setTournaments(tr)
      setStats({ total: p.length, sold: p.filter((x:any)=>x.status==='sold').length })
    })
  }, [])

  const ballEmoji: Record<string, string> = {
    'Tennis Ball': '🎾', 'Leather Ball': '🏏', 'Heavy Tennis Ball': '🥎',
    'Mini Ball (Smiley)': '😊', 'Plastic Ball': '⚪',
  }

  const gavel = useGavel()

  return (
    <div className="min-h-screen bg-stone-50">
      <GavelOverlay show={gavel.show} onDone={gavel.done} />

      {/* ── Top nav ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b-2 border-saffron-100 shadow-sm">
        <div className="max-w-5xl mx-auto h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-saffron-500 rounded-lg flex items-center justify-center text-white font-extrabold text-base leading-none">🏏</div>
            <div>
              <div className="font-extrabold text-saffron-600 text-sm leading-none tracking-tight">PlayerAuctionHub</div>
              <div className="text-[10px] text-stone-400 font-medium">playerauctionhub.in</div>
            </div>
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            {[['#how','How It Works'],['#tournaments','Tournaments'],['#rules','Rules']].map(([h,l]) => (
              <a key={h} href={h} className="px-3 py-1.5 text-sm font-semibold text-stone-500 hover:text-saffron-600 hover:bg-saffron-50 rounded-lg transition-all">{l}</a>
            ))}
          </nav>
          <Link href="/login" onClick={gavel.trigger} className="btn-primary btn-sm flex items-center gap-1.5">
            <FiLogIn size={14}/> Login
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative pt-14 overflow-hidden">
        {/* Layered bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-saffron-700 via-saffron-600 to-orange-500"/>
        <div className="absolute inset-0 opacity-[0.07]" style={{backgroundImage:'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',backgroundSize:'20px 20px'}}/>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-stone-50" style={{clipPath:'ellipse(55% 100% at 50% 100%)'}}/>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 sm:py-20 text-white text-center">
          <div className="inline-flex items-center gap-2 border border-white/30 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-6 text-saffron-100">
            🏆 Welcome to Player Auction Hub
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-4 drop-shadow-lg">
            {settings.auctionTitle || 'Cricket Player Auction 2025'}
          </h1>

          {settings.auctionDate && (
            <p className="text-saffron-100 text-sm font-semibold mb-8 tracking-wide">
              📅 {new Date(settings.auctionDate).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </p>
          )}

          {settings.auctionDate && (
            <div className="mb-10">
              <p className="text-saffron-200 text-xs font-bold tracking-widest uppercase mb-4">⏱ Auction Begins In</p>
              <Countdown target={settings.auctionDate}/>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" onClick={gavel.trigger}
              className="bg-white text-saffron-600 font-extrabold px-8 py-4 rounded-2xl hover:bg-saffron-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 text-base active:scale-95">
              🏏 Enter Auction Room
            </Link>
            <Link href="/register-tournament" onClick={gavel.trigger}
              className="bg-white/20 backdrop-blur border-2 border-white/50 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/30 transition-all text-base">
              🏆 Register Tournament
            </Link>
            <a href="#tournaments" onClick={gavel.trigger}
              className="border-2 border-white/30 text-white/80 font-bold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all text-base">
              View Tournaments ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── Ticker ──────────────────────────────────────────────────── */}
      <div className="ticker-wrap py-2 overflow-hidden">
        <span className="ticker-text px-8">
          🏏 Welcome to PlayerAuctionHub &nbsp;•&nbsp; {settings.auctionTitle || 'Cricket Auction 2025'} &nbsp;•&nbsp;
          {stats.total} Players Registered &nbsp;•&nbsp; {stats.sold} Players Sold &nbsp;•&nbsp;
          {tournaments.length} Tournaments Registered &nbsp;•&nbsp;
          Login to participate in Live Auction &nbsp;•&nbsp; playerauctionhub.in &nbsp;•&nbsp; 🏆
        </span>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────── */}
      <section className="bg-white border-b border-stone-200 py-5">
        <div className="max-w-3xl mx-auto px-4 grid grid-cols-3 gap-4 text-center">
          {[['👤',stats.total,'Players'],['🏆',stats.sold,'Sold'],['🏆',tournaments.length,'Tournaments']].map(([ic,v,l]) => (
            <div key={l as string} className="flex flex-col items-center">
              <span className="text-2xl mb-0.5">{ic}</span>
              <span className="text-2xl font-extrabold text-stone-800">{v}</span>
              <span className="text-xs text-stone-400 font-semibold">{l}</span>
            </div>
          ))}
        </div>
      </section>



      {/* ── How it works ───────────────────────────────────────────── */}
      <section id="how" className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-stone-800 mb-2">How the Auction Works</h2>
            <p className="text-stone-400 text-sm">Simple step-by-step process</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { n:'01', e:'📋', t:'Admin Puts Player', d:'Tournament admin calls each player for auction. Player photo, name and role shows on all screens.' },
              { n:'02', e:'🏏', t:'Teams Bid Points',  d:'4 teams click their bid buttons. Points increase with each bid. Highest bidder leads the auction.' },
              { n:'03', e:'🏆', t:'SOLD! Celebrate!',  d:'Timer ends. Player is SOLD to the highest bidding team. Confetti celebration! PDF report generated.' },
            ].map(s => (
              <div key={s.n} className="bg-saffron-50 border-2 border-saffron-100 rounded-2xl p-6 text-center">
                <div className="text-5xl mb-3">{s.e}</div>
                <div className="text-saffron-500 text-xs font-extrabold tracking-widest mb-2">STEP {s.n}</div>
                <h3 className="font-extrabold text-base mb-2 text-stone-800">{s.t}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tournaments ──────────────────────────────────────────── */}
      <section id="tournaments" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-stone-800 mb-2">🏆 Registered Tournaments</h2>
            <p className="text-stone-400 text-sm font-medium">Tournaments currently registered on the platform</p>
          </div>

          {tournaments.length === 0 ? (
            <div className="card border-2 border-dashed border-stone-200 py-14 text-center">
              <div className="text-5xl mb-3">🏆</div>
              <p className="text-stone-400 font-medium">No tournaments registered yet</p>
              <p className="text-stone-300 text-sm mt-1">Admin will register tournaments soon — stay tuned!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {tournaments.map(t => {
                const pct = t.totalPlayersRequired > 0 ? Math.round(((t.registeredPlayers || 0) / t.totalPlayersRequired) * 100) : 0
                const full = t.totalPlayersRequired > 0 && (t.registeredPlayers || 0) >= t.totalPlayersRequired
                return (
                  <div key={t.id} className="card border-2 border-stone-100 hover:border-saffron-200 hover:shadow-xl transition-all overflow-hidden">
                    {/* Status ribbon */}
                    <div className={`px-4 py-1.5 text-center text-xs font-extrabold uppercase tracking-widest
                      ${t.status === 'live' ? 'bg-green-500 text-white' : t.status === 'ended' ? 'bg-stone-400 text-white' : 'bg-saffron-100 text-saffron-700'}`}>
                      {t.status === 'live' ? '🔴 LIVE' : t.status === 'ended' ? '✅ ENDED' : '🕐 UPCOMING'}
                    </div>

                    <div className="p-5">
                      {/* Logo + Name */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 rounded-xl border-2 border-saffron-100 bg-saffron-50 flex items-center justify-center overflow-hidden shrink-0">
                          {t.logoURL ? <img src={t.logoURL} className="w-full h-full object-cover" alt={t.name}/> : <span className="text-3xl">🏆</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-extrabold text-lg leading-tight">{t.name}</h3>
                          {t.description && <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">{t.description}</p>}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                              {ballEmoji[t.ballType] || '⚾'} {t.ballType}
                            </span>
                            {t.entryFee > 0 && (
                              <span className="text-xs font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">₹{t.entryFee}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Player stats */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-stone-50 rounded-lg p-2.5 text-center">
                          <div className="text-xs text-stone-400">Players Required</div>
                          <div className="font-extrabold text-saffron-600 text-xl">{t.totalPlayersRequired}</div>
                        </div>
                        <div className="bg-stone-50 rounded-lg p-2.5 text-center">
                          <div className="text-xs text-stone-400">Registered</div>
                          <div className="font-extrabold text-green-600 text-xl">{t.registeredPlayers || 0}</div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      {t.totalPlayersRequired > 0 && (
                        <div className="mb-3">
                          <div className="w-full bg-stone-100 rounded-full h-2.5">
                            <div className={`h-2.5 rounded-full transition-all ${full ? 'bg-red-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(100, pct)}%` }}/>
                          </div>
                          <p className="text-[11px] text-stone-400 mt-1 font-medium">
                            {pct}% filled{full && ' · 🔒 Registrations Full'}
                          </p>
                        </div>
                      )}

                      {/* Ground & location */}
                      {(t.groundName || t.groundLocation) && (
                        <div className="bg-blue-50 rounded-xl p-3 mb-2 flex items-start gap-2">
                          <FiMapPin size={14} className="text-blue-500 mt-0.5 shrink-0"/>
                          <div>
                            {t.groundName && <div className="text-xs font-bold text-blue-700">{t.groundName}</div>}
                            {t.groundLocation && <div className="text-[11px] text-blue-500">{t.groundLocation}</div>}
                          </div>
                        </div>
                      )}

                      {/* Auction location */}
                      {t.auctionLocation && (
                        <div className="bg-purple-50 rounded-xl p-3 flex items-start gap-2">
                          <span className="text-sm shrink-0">🏏</span>
                          <div>
                            <div className="text-[11px] text-purple-500">Auction Location</div>
                            <div className="text-xs font-bold text-purple-700">{t.auctionLocation}</div>
                          </div>
                        </div>
                      )}

                      {/* Register button */}
                      <Link href={`/t/${t.code}`}
                        className="btn-primary w-full py-2.5 text-center mt-3 gap-2 text-sm">
                        🏏 Register in Tournament
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Rules ──────────────────────────────────────────────────── */}
      <section id="rules" className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-stone-800 mb-8 text-center">Auction Rules</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              '🏏 Only 4 teams are allowed to participate',
              '💰 All players start from 0 base points',
              '🚫 No public player registration allowed',
              '⚙️ Admin-only control over the auction',
              '📱 Team owners bid from their own devices',
              '⏱️ Highest bid wins when timer expires',
              '❌ Unsold players can be re-auctioned',
              '📄 PDF squad report after auction ends',
            ].map((r,i) => (
              <div key={i} className="flex items-center gap-2.5 bg-white border-2 border-stone-100 rounded-xl px-4 py-3 text-sm font-medium text-stone-600 hover:border-saffron-200 hover:bg-saffron-50 transition-all">
                {r}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="bg-stone-900 text-stone-400 py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🏏</span>
            <span className="font-extrabold text-white text-lg">PlayerAuctionHub</span>
          </div>
          <p className="text-sm mb-1">playerauctionhub.in — Local Cricket Auction Platform</p>
          <p className="text-sm font-semibold">
            Made with 🏏 by{' '}
            <span className="text-saffron-400">Kunal Kotak</span> &amp;{' '}
            <span className="text-blue-400">Yash Jani</span>
          </p>
          <div className="flex items-center justify-center gap-6 mt-4">
            <a href="https://instagram.com/kunallll2303" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-stone-500 hover:text-saffron-400 transition-colors text-sm">
              <FiInstagram size={14}/> @kunallll2303
            </a>
            <a href="https://instagram.com/yash_jani_" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-stone-500 hover:text-blue-400 transition-colors text-sm">
              <FiInstagram size={14}/> @yash_jani_
            </a>
          </div>
          <p className="text-xs text-stone-600 mt-4">© 2025 PlayerAuctionHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
