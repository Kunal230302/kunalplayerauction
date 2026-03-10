'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { subLive, subBids, getPlayers, LiveState } from '@/lib/db'

// OBS Professional Overlay — IPL auction style, full-screen, transparent bg
// Use as Browser Source in OBS: 1920×1080
// Pass tournament ID in URL: /overlay?tid=YOUR_TOURNAMENT_ID
//
// 📺 VIEWING INSTRUCTIONS:
// 💻 PC/Mac: Use OBS Studio → Add Browser Source → URL: yourdomain.com/overlay?tid=TOURNAMENT_ID
// 📱 Mobile: Open browser → Full screen → Cast to TV/streaming software
// 🍎 iOS: Safari → Full screen → AirPlay to Apple TV/Streamlabs
// 📲 Android: Chrome → Full screen → Screen recording/streaming apps

function OverlayPageContent() {
  const searchParams = useSearchParams()
  const tid = searchParams.get('tid') || undefined   // ← reads ?tid= from URL

  const [live, setLive] = useState<LiveState | null>(null)
  const [timer, setTimer] = useState(0)
  const [stats, setStats] = useState({ sold: 0, unsold: 0, available: 0 })
  const [bids, setBids] = useState<any[]>([])
  const [animKey, setAnimKey] = useState(0)   // bumped every time status changes
  const [playerStatus, setPlayerStatus] = useState<'sold' | 'unsold' | null>(null) // persistent status
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)
  const prevStatusRef = useRef<string | null>(null)

  // Subscribe to live state — using tid so it watches the right path
  useEffect(() => {
    const unsub = subLive(
      ...(tid ? [tid, (data: LiveState | null) => handleLive(data)] : [(data: LiveState | null) => handleLive(data)]) as any
    )
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tid])

  function handleLive(data: LiveState | null) {
    if (data?.status !== prevStatusRef.current) {
      prevStatusRef.current = data?.status || null
      setAnimKey(k => k + 1)            // triggers animation re-mount
    }
    
    // Check if new player has arrived
    if (data?.playerId !== currentPlayerId) {
      setCurrentPlayerId(data?.playerId || null)
      setPlayerStatus(null) // Reset status for new player
    }
    
    // Set persistent status when player is sold/unsold
    if (data?.status === 'sold' || data?.status === 'unsold') {
      setPlayerStatus(data.status)
    }
    
    setLive(data)
    if (data?.timerEnd) {
      setTimer(Math.max(0, Math.ceil((data.timerEnd - Date.now()) / 1000)))
    }
  }

  // Subscribe to bids — tournament-scoped
  useEffect(() => {
    const unsub = subBids(
      ...(tid ? [tid, (b: any[]) => setBids(b?.slice(-3) || [])] : [(b: any[]) => setBids(b?.slice(-3) || [])]) as any
    )
    return unsub
  }, [tid])

  // Countdown ticker
  useEffect(() => {
    if (!live || live.status !== 'bidding') return
    const iv = setInterval(() => {
      if (live.timerEnd) setTimer(Math.max(0, Math.ceil((live.timerEnd - Date.now()) / 1000)))
    }, 500)
    return () => clearInterval(iv)
  }, [live?.status, live?.timerEnd])

  // Stats
  useEffect(() => {
    getPlayers(tid).then((players: any[]) => {
      setStats({
        sold: players.filter((p: any) => p.status === 'sold').length,
        unsold: players.filter((p: any) => p.status === 'unsold').length,
        available: players.filter((p: any) => p.status === 'available').length,
      })
    })
  }, [live?.status, tid])

  // Responsive scale
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const DESIGN_W = 1920, DESIGN_H = 1080
    const update = () => {
      setScale(Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H))
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', () => setTimeout(update, 200))
    return () => window.removeEventListener('resize', update)
  }, [])

  // Stable confetti data
  const [confetti] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      left: `${(i * 37 + 11) % 100}%`,
      width: 6 + (i % 6) * 3,
      height: 6 + (i % 4) * 2,
      color: ['#FFD700', '#FF6B35', '#22c55e', '#60a5fa', '#f472b6', '#a78bfa', '#fff', '#FFA500'][i % 8],
      delay: `${(i * 0.13) % 3}s`,
      duration: `${2 + (i % 3) * 0.8}s`,
    }))
  )

  const show = live && (live.status === 'bidding' || live.status === 'sold' || live.status === 'unsold' || playerStatus)
  if (!show || !live) return (
    <div style={{ width: '100vw', height: '100dvh', minHeight: '100vh', background: 'transparent' }} />
  )

  const isBidding = live.status === 'bidding' || playerStatus
  const isSold = live.status === 'sold' || playerStatus === 'sold'
  const isUnsold = live.status === 'unsold' || playerStatus === 'unsold'

  const timerCritical = timer <= 5
  const timerWarn = timer <= 10 && timer > 5
  const timerColor = timerCritical ? '#ef4444' : timerWarn ? '#f97316' : '#22c55e'
  const fmtPts = (v: number) => `₹${v.toLocaleString('en-IN')}`

  return (
    <div style={{ width: '100vw', height: '100dvh', minHeight: '100vh', overflow: 'hidden', position: 'fixed', top: 0, left: 0, background: 'transparent' }}>

      {/* ── All keyframe animations ── */}
      <style>{`
        @keyframes slideInUp {
          0%  { transform: translateY(80px); opacity: 0; }
          100%{ transform: translateY(0);    opacity: 1; }
        }
        @keyframes slideInDown {
          0%  { transform: translateY(-60px); opacity: 0; }
          100%{ transform: translateY(0);     opacity: 1; }
        }
        @keyframes slideInLeft {
          0%  { transform: translateX(-80px); opacity: 0; }
          100%{ transform: translateX(0);     opacity: 1; }
        }
        @keyframes scaleIn {
          0%  { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
          70% { transform: translate(-50%, -50%) scale(1.06); opacity: 1; }
          100%{ transform: translate(-50%, -50%) scale(1);    opacity: 1; }
        }
        @keyframes soldStamp {
          0%  { transform: translate(-50%, -50%) scale(3)    rotate(-20deg); opacity: 0; }
          40% { transform: translate(-50%, -50%) scale(0.88) rotate(-8deg);  opacity: 1; }
          60% { transform: translate(-50%, -50%) scale(1.1)  rotate(-8deg);  opacity: 1; }
          75% { transform: translate(-50%, -50%) scale(0.95) rotate(-8deg);  opacity: 1; }
          90% { transform: translate(-50%, -50%) scale(1.02) rotate(-8deg);  opacity: 1; }
          100%{ transform: translate(-50%, -50%) scale(1)    rotate(-8deg);  opacity: 1; }
        }
        @keyframes glowRing {
          0%  { opacity: 0.6; transform: translate(-50%,-50%) scale(0.85); }
          100%{ opacity: 0;   transform: translate(-50%,-50%) scale(1.7);  }
        }
        @keyframes confettiFall {
          0%  { transform: translateY(-40px) rotate(0deg);     opacity: 1;   }
          50% { transform: translateY(400px)  rotate(200deg);  opacity: 0.8; }
          100%{ transform: translateY(900px)  rotate(360deg);  opacity: 0;   }
        }
        @keyframes timerPulse {
          0%, 100%{ transform: scale(1);    }
          50%     { transform: scale(1.18); }
        }
        @keyframes timerShake {
          0%, 100%{ transform: translateX(0); }
          20%     { transform: translateX(-5px); }
          40%     { transform: translateX(5px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }
        @keyframes shimmer {
          0%  { background-position: -200% center; }
          100%{ background-position:  200% center; }
        }
        @keyframes bidSlideIn {
          0%  { transform: translateX(30px); opacity: 0; }
          100%{ transform: translateX(0);    opacity: 1; }
        }
        @keyframes fadeIn {
          0%  { opacity: 0; }
          100%{ opacity: 1; }
        }
        @keyframes headerSlide {
          0%  { transform: translateY(-100%); opacity: 0; }
          100%{ transform: translateY(0);     opacity: 1; }
        }
        @keyframes statsSlide {
          0%  { transform: translateY(100%); opacity: 0; }
          100%{ transform: translateY(0);    opacity: 1; }
        }
        @keyframes unsoldShake {
          0%, 100%{ transform: translate(-50%,-50%) rotate(0deg); }
          15%     { transform: translate(-50%,-50%) rotate(-2deg) scale(1.02); }
          30%     { transform: translate(-50%,-50%) rotate(2deg)  scale(1.02); }
          45%     { transform: translate(-50%,-50%) rotate(-1.5deg); }
          60%     { transform: translate(-50%,-50%) rotate(1.5deg);  }
          75%     { transform: translate(-50%,-50%) rotate(0deg); }
        }
        @keyframes liveDot {
          0%, 100%{ opacity: 1; transform: scale(1); }
          50%     { opacity: 0.4; transform: scale(1.5); }
        }
      `}</style>

      {/* Inner 1920×1080 canvas */}
      <div style={{
        width: '1920px', height: '1080px',
        transform: `scale(${scale})`, WebkitTransform: `scale(${scale})`,
        transformOrigin: 'top left',
        position: 'absolute', top: 0, left: 0, overflow: 'hidden',
        fontFamily: '"Segoe UI", "DM Sans", Arial, sans-serif',
        background: 'transparent',
      }}>

        {/* ── Dynamic Background ── */}
        <div style={{
          position: 'absolute', inset: 0,
          background: isSold
            ? 'linear-gradient(180deg, #050d20 0%, #0a1a10 40%, #072010 100%)'
            : isUnsold
              ? 'linear-gradient(180deg, #120808 0%, #200a0a 40%, #0f0505 100%)'
              : 'linear-gradient(180deg, #050d20 0%, #0a1530 40%, #061a0e 100%)',
          transition: 'background 1s ease',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: '10%', width: '80%', height: '50%',
          background: isSold
            ? 'radial-gradient(ellipse at 50% 0%, rgba(255,215,0,0.1) 0%, transparent 65%)'
            : isUnsold
              ? 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.08) 0%, transparent 65%)'
              : 'radial-gradient(ellipse at 50% 0%, rgba(30,144,255,0.06) 0%, transparent 65%)',
          transition: 'background 1s ease',
        }} />
        {/* Field lines */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
          background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 42px)',
        }} />

        {/* ── Top Header ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '72px', zIndex: 20,
          background: 'linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(15,20,50,0.95) 50%, rgba(0,0,0,0.92) 100%)',
          borderBottom: '2px solid rgba(255,200,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px',
          animation: 'headerSlide 0.6s ease forwards',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src="/icon.png" alt="Logo" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
            <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', textShadow: '0 0 25px rgba(255,215,0,0.6)' }}>
              Player Auction Hub
            </div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>
            INDIA'S DEDICATED DIGITAL PLATFORM FOR CRICKET AUCTIONS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', animation: 'liveDot 1s ease-in-out infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: 700, letterSpacing: '2px' }}>LIVE</span>
          </div>
        </div>


        {/* ═══════════════════════════════ SOLD SCREEN ═══════════════════════════ */}
        {isSold && (
          <>
            {/* Confetti */}
            {confetti.map((c, i) => (
              <div key={i} style={{
                position: 'absolute', left: c.left, top: '-20px',
                width: `${c.width}px`, height: `${c.height}px`,
                background: c.color,
                borderRadius: i % 3 === 0 ? '50%' : '2px',
                animation: `confettiFall ${c.duration} ${c.delay} ease-in infinite`,
                transform: `rotate(${i * 37 % 360}deg)`,
                zIndex: 5,
              }} />
            ))}

            {/* Glow rings */}
            {[700, 500].map((size, i) => (
              <div key={size} style={{
                position: 'absolute', top: '50%', left: '50%',
                width: `${size}px`, height: `${size}px`, borderRadius: '50%',
                border: '3px solid rgba(255,215,0,0.4)',
                animation: `glowRing 2s ${i * 0.4}s ease-out infinite`,
                pointerEvents: 'none', zIndex: 3,
              }} />
            ))}

            {/* Gold ambient glow */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '1000px', height: '1000px', borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(255,215,0,0.2) 0%, transparent 70%)',
              pointerEvents: 'none', zIndex: 2,
            }} />

            {/* Main SOLD card */}
            <div key={`sold-${animKey}`} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: '920px',
              background: 'linear-gradient(145deg, rgba(8,15,35,0.98) 0%, rgba(5,20,12,0.98) 100%)',
              border: '3px solid #FFD700',
              borderRadius: '32px',
              boxShadow: '0 0 80px rgba(255,215,0,0.5), 0 0 200px rgba(255,215,0,0.15)',
              overflow: 'hidden',
              animation: 'scaleIn 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards',
              zIndex: 10,
            }}>
              {/* Shimmer gold header */}
              <div style={{
                width: '100%',
                background: 'linear-gradient(90deg, #7a5800 0%, #FFD700 30%, #FFF176 50%, #FFD700 70%, #7a5800 100%)',
                backgroundSize: '200% auto',
                padding: '16px 0', textAlign: 'center',
                letterSpacing: '7px', fontSize: '28px', fontWeight: 900, color: '#000',
                textTransform: 'uppercase', animation: 'shimmer 2.5s linear infinite',
              }}>
                ⚡ PLAYER SOLD ! ⚡
              </div>

              <div style={{ display: 'flex', alignItems: 'stretch', width: '100%', minHeight: '360px' }}>
                {/* Photo */}
                <div style={{
                  width: '310px', flexShrink: 0,
                  background: 'linear-gradient(180deg, #1a2a4a 0%, #0d1f3a 100%)',
                  position: 'relative', overflow: 'hidden',
                  borderRight: '2px solid rgba(255,215,0,0.3)',
                  animation: 'slideInLeft 0.5s 0.3s ease forwards', opacity: 0,
                }}>
                  {live.playerPhoto
                    ? <img src={live.playerPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', position: 'absolute', inset: 0 }} />
                    : <div style={{ fontSize: '130px', color: 'rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>👤</div>
                  }
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, padding: '36px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px', animation: 'slideInUp 0.5s 0.4s ease forwards', opacity: 0 }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '6px' }}>PLAYER</div>
                    <div style={{ fontSize: '52px', fontWeight: 900, color: '#fff', lineHeight: 1.05 }}>
                      {live.playerName}{(live as any).surname ? ` ${(live as any).surname}` : ''}
                    </div>
                    {live.playerVillage && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', marginTop: '6px' }}>📍 {live.playerVillage}</div>}
                    <div style={{ display: 'inline-block', marginTop: '8px', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.4)', borderRadius: '8px', padding: '5px 16px', color: '#FFD700', fontSize: '15px', fontWeight: 700 }}>
                      🏏 {live.playerRole}
                    </div>
                  </div>
                  <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.4), transparent)' }} />
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>FINAL PRICE</div>
                    <div style={{ fontSize: '60px', fontWeight: 900, color: '#FFD700', textShadow: '0 0 40px rgba(255,215,0,0.8)', lineHeight: 1 }}>
                      {fmtPts(live.currentPoints || 0)}
                    </div>
                  </div>
                  <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.4), transparent)' }} />
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>SOLD TO</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '58px', height: '58px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        border: '2px solid rgba(34,197,94,0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '26px', boxShadow: '0 0 25px rgba(34,197,94,0.5)',
                        animation: 'timerPulse 1.5s ease-in-out infinite',
                      }}>🏆</div>
                      <div style={{ fontSize: '42px', fontWeight: 900, color: '#22c55e', textShadow: '0 0 25px rgba(34,197,94,0.7)', letterSpacing: '1px' }}>
                        {live.currentBidder || '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                width: '100%',
                background: 'linear-gradient(90deg, #052e16 0%, #16a34a 40%, #22c55e 60%, #052e16 100%)',
                backgroundSize: '200% auto',
                padding: '14px 0', textAlign: 'center',
                fontSize: '20px', fontWeight: 900, letterSpacing: '5px',
                color: '#fff', textTransform: 'uppercase', animation: 'shimmer 3s linear infinite',
              }}>✅ CONGRATULATIONS !</div>
            </div>

            {/* SOLD stamp — zIndex 30 to always be on top */}
            <div key={`stamp-${animKey}`} style={{
              position: 'absolute', top: '50%', left: '50%',
              fontSize: '110px', fontWeight: 900, color: '#FFD700',
              textShadow: '0 0 60px rgba(255,215,0,0.7), 0 0 120px rgba(255,215,0,0.3)',
              border: '8px solid #FFD700', borderRadius: '16px',
              padding: '4px 28px', letterSpacing: '8px',
              opacity: 0,
              animation: 'soldStamp 0.9s 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
              zIndex: 30,
              pointerEvents: 'none',
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
              boxShadow: '0 0 80px rgba(255,215,0,0.4), inset 0 0 30px rgba(255,215,0,0.05)',
            }}>
              SOLD!
            </div>
          </>
        )}


        {/* ═══════════════════════════════ UNSOLD SCREEN ═══════════════════════ */}
        {isUnsold && (
          <>
            {[800, 600].map((size, i) => (
              <div key={size} style={{
                position: 'absolute', top: '50%', left: '50%',
                width: `${size}px`, height: `${size}px`, borderRadius: '50%',
                border: '2px solid rgba(239,68,68,0.2)',
                animation: `glowRing 2s ${i * 0.5}s ease-out infinite`,
                pointerEvents: 'none', zIndex: 3,
              }} />
            ))}

            <div key={`unsold-${animKey}`} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: '780px',
              background: 'linear-gradient(145deg, rgba(15,4,4,0.98) 0%, rgba(25,5,5,0.98) 100%)',
              border: '3px solid #ef4444', borderRadius: '32px',
              boxShadow: '0 0 80px rgba(239,68,68,0.45), 0 0 160px rgba(239,68,68,0.15)',
              overflow: 'hidden',
              animation: 'scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards, unsoldShake 0.8s 0.7s ease forwards',
              zIndex: 10,
            }}>
              <div style={{
                width: '100%',
                background: 'linear-gradient(90deg, #450a0a 0%, #dc2626 35%, #ef4444 50%, #dc2626 65%, #450a0a 100%)',
                backgroundSize: '200% auto',
                padding: '16px 0', textAlign: 'center',
                letterSpacing: '6px', fontSize: '26px', fontWeight: 900, color: '#fff', textTransform: 'uppercase',
                animation: 'shimmer 3s linear infinite',
              }}>❌ PLAYER UNSOLD</div>

              <div style={{ display: 'flex', alignItems: 'stretch', width: '100%', minHeight: '300px' }}>
                <div style={{
                  width: '260px', flexShrink: 0,
                  background: 'linear-gradient(180deg, #2a0a0a 0%, #1a0505 100%)',
                  position: 'relative', overflow: 'hidden',
                  borderRight: '2px solid rgba(239,68,68,0.3)',
                  animation: 'slideInLeft 0.5s 0.3s ease forwards', opacity: 0,
                }}>
                  {live.playerPhoto
                    ? <img src={live.playerPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', position: 'absolute', inset: 0, filter: 'grayscale(50%) brightness(0.7)' }} />
                    : <div style={{ fontSize: '110px', color: 'rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>👤</div>
                  }
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(239,68,68,0.06)' }} />
                </div>

                <div style={{ flex: 1, padding: '32px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px', animation: 'slideInUp 0.5s 0.4s ease forwards', opacity: 0 }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '4px' }}>PLAYER</div>
                    <div style={{ fontSize: '44px', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                      {live.playerName}{(live as any).surname ? ` ${(live as any).surname}` : ''}
                    </div>
                    {live.playerVillage && <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginTop: '4px' }}>📍 {live.playerVillage}</div>}
                    <div style={{ display: 'inline-block', marginTop: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '8px', padding: '5px 16px', color: '#f87171', fontSize: '14px', fontWeight: 700 }}>
                      🏏 {live.playerRole}
                    </div>
                  </div>
                  <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.4), transparent)' }} />
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '6px' }}>BASE PRICE</div>
                    <div style={{ fontSize: '42px', fontWeight: 900, color: '#f87171', textShadow: '0 0 25px rgba(239,68,68,0.6)' }}>
                      {fmtPts(live.currentPoints || 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                width: '100%', background: 'linear-gradient(90deg, #450a0a 0%, #991b1b 50%, #450a0a 100%)',
                padding: '13px 0', textAlign: 'center',
                fontSize: '16px', fontWeight: 900, letterSpacing: '5px', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase',
              }}>NO BIDS — PLAYER RELEASED</div>
            </div>
          </>
        )}


        {/* ═══════════════════════════════ BIDDING SCREEN ══════════════════════ */}
        {isBidding && (
          <>
            <div key={`bid-${animKey}`} style={{
              position: 'absolute', top: '95px', left: '50%',
              transform: 'translateX(-50%)',
              width: '860px', display: 'flex', alignItems: 'flex-end',
              animation: 'slideInUp 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
            }}>
              {/* Gavel badge */}
              <div style={{
                position: 'absolute', top: '-18px', left: '148px',
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                border: '3px solid white', zIndex: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', boxShadow: '0 4px 25px rgba(255,165,0,0.7)',
                animation: 'timerPulse 2s ease-in-out infinite',
              }}>🏏</div>

              {/* Player Photo */}
              <div style={{
                width: '210px', height: '270px', flexShrink: 0,
                borderRadius: '50% 50% 0 0 / 60% 60% 0 0',
                overflow: 'hidden', position: 'relative',
                border: '3px solid #FFD700',
                boxShadow: '0 0 50px rgba(255,215,0,0.45)',
                background: 'linear-gradient(180deg, #1a2a4a 0%, #0d1f3a 100%)',
                animation: 'slideInLeft 0.5s 0.1s ease forwards', opacity: 0,
              }}>
                {live.playerPhoto
                  ? <img src={live.playerPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '85px', color: 'rgba(255,215,0,0.3)' }}>👤</div>
                }
              </div>

              {/* Info banners */}
              <div style={{ flex: 1, paddingBottom: '4px', animation: 'slideInUp 0.5s 0.15s ease forwards', opacity: 0 }}>
                <div style={{ background: 'linear-gradient(90deg, #FFD700 0%, #FFC200 82%, transparent 100%)', padding: '11px 26px', marginBottom: '5px', clipPath: 'polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%)' }}>
                  <div style={{ fontSize: '30px', fontWeight: 900, color: '#000', whiteSpace: 'nowrap' }}>
                    {live.playerName}{(live as any).surname ? ' ' + (live as any).surname : ''}
                  </div>
                </div>
                {live.playerVillage && (
                  <div style={{ background: 'linear-gradient(90deg, #FFD700 0%, #FFC200 85%, transparent 100%)', padding: '8px 26px', marginBottom: '5px', clipPath: 'polygon(0 0, 93% 0, 100% 50%, 93% 100%, 0 100%)' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#000' }}>📍 {live.playerVillage}</div>
                  </div>
                )}
                <div style={{ background: 'linear-gradient(90deg, #FFD700 0%, #FFB300 80%, transparent 100%)', padding: '8px 26px', marginBottom: '22px', clipPath: 'polygon(0 0, 91% 0, 100% 50%, 91% 100%, 0 100%)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#000' }}>🏏 {live.playerRole}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.65)', border: '2px solid #FFD700', borderRadius: '14px', padding: '11px 26px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 0 30px rgba(255,215,0,0.2)' }}>
                    <span style={{ fontSize: '30px' }}>🪙</span>
                    <span style={{ fontSize: '46px', fontWeight: 900, color: '#FFD700', textShadow: '0 0 25px rgba(255,215,0,0.7)' }}>
                      {fmtPts(live.currentPoints || 0)}
                    </span>
                  </div>
                  {live.currentBidder && (
                    <div style={{ background: 'rgba(30,144,255,0.18)', border: '1.5px solid rgba(30,144,255,0.5)', borderRadius: '12px', padding: '9px 18px', color: 'white', fontSize: '18px', fontWeight: 700, animation: 'bidSlideIn 0.4s ease forwards' }}>
                      🏆 {live.currentBidder}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Persistent SOLD/UNSOLD Stamp Overlay */}
            {playerStatus && (
              <div key={`stamp-${playerStatus}-${currentPlayerId}`} style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%) rotate(-15deg)',
                fontSize: '120px', fontWeight: 900,
                color: playerStatus === 'sold' ? '#FFD700' : '#ef4444',
                textShadow: `0 0 60px ${playerStatus === 'sold' ? 'rgba(255,215,0,0.7)' : 'rgba(239,68,68,0.7)'}, 0 0 120px ${playerStatus === 'sold' ? 'rgba(255,215,0,0.3)' : 'rgba(239,68,68,0.3)'}`,
                border: `8px solid ${playerStatus === 'sold' ? '#FFD700' : '#ef4444'}`,
                borderRadius: '16px',
                padding: '8px 32px',
                letterSpacing: '8px',
                opacity: 0,
                animation: 'soldStamp 0.9s 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
                zIndex: 30,
                pointerEvents: 'none',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                boxShadow: `0 0 80px ${playerStatus === 'sold' ? 'rgba(255,215,0,0.4)' : 'rgba(239,68,68,0.4)'}, inset 0 0 30px ${playerStatus === 'sold' ? 'rgba(255,215,0,0.05)' : 'rgba(239,68,68,0.05)'}`,
                textTransform: 'uppercase',
              }}>
                {playerStatus === 'sold' ? 'SOLD!' : 'UNSOLD!'}
              </div>
            )}

            {/* Timer - Only show during active bidding */}
            {live.status === 'bidding' && (
              <div style={{ position: 'absolute', right: '65px', top: '305px', textAlign: 'center' }}>
              <div style={{
                width: '110px', height: '110px', borderRadius: '50%',
                border: `6px solid ${timerColor}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.65)',
                boxShadow: `0 0 40px ${timerColor}70`,
                transition: 'border-color 0.5s, box-shadow 0.5s',
                animation: timerCritical ? 'timerShake 0.4s ease infinite, timerPulse 0.4s ease-in-out infinite'
                  : timerWarn ? 'timerPulse 0.8s ease-in-out infinite' : 'none',
              }}>
                <div style={{ fontSize: '46px', fontWeight: 900, color: timerColor, lineHeight: 1, transition: 'color 0.5s' }}>{timer}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', letterSpacing: '2px' }}>SEC</div>
              </div>
              </div>
            )}

            {/* Recent bids */}
            {bids.length > 0 && (
              <div style={{ position: 'absolute', right: '40px', top: '450px', width: '290px', animation: 'fadeIn 0.5s ease forwards' }}>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', letterSpacing: '3px', marginBottom: '10px', textAlign: 'center', textTransform: 'uppercase' }}>Recent Bids</div>
                {[...bids].reverse().map((bid: any, i: number) => (
                  <div key={i} style={{
                    background: i === 0 ? 'rgba(255,215,0,0.14)' : 'rgba(0,0,0,0.4)',
                    border: i === 0 ? '1.5px solid rgba(255,215,0,0.45)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px', padding: '9px 16px', marginBottom: '6px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    animation: `bidSlideIn 0.3s ${i * 0.08}s ease forwards`, opacity: 0,
                  }}>
                    <span style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>{bid.teamName}</span>
                    <span style={{ color: '#FFD700', fontSize: '15px', fontWeight: 900 }}>{fmtPts(bid.points)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}


        {/* ── Bottom Stats Bar ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '68px', zIndex: 20,
          background: 'linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(10,10,40,0.96) 50%, rgba(0,0,0,0.92) 100%)',
          borderTop: '2px solid rgba(255,215,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'statsSlide 0.6s ease forwards',
        }}>
          {[
            { label: 'Sold', value: stats.sold, color: '#22c55e', icon: '✅' },
            { label: 'Unsold', value: stats.unsold, color: '#ef4444', icon: '❌' },
            { label: 'Available', value: stats.available, color: '#FFD700', icon: '🏏' },
          ].map((s, i) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 50px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.12)' : 'none' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.color + '22', border: `2px solid ${s.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 900, color: s.color }}>
                {s.value}
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>{s.label}</div>
                <div style={{ color: s.color, fontSize: '11px', fontWeight: 700 }}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default function OverlayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 text-white">⚡</div>
          <p className="text-xl text-white">Loading overlay...</p>
        </div>
      </div>
    }>
      <OverlayPageContent />
    </Suspense>
  )
}
