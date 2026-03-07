'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { subLive, subBids, getPlayers, LiveState } from '@/lib/db'

// OBS Overlay — IPL auction style, full-screen, transparent bg
// Use as Browser Source in OBS: 1920×1080, URL: yoursite.com/overlay

export default function OverlayPage() {
  const [live,   setLive]   = useState<LiveState | null>(null)
  const [timer,  setTimer]  = useState(0)
  const [stats,  setStats]  = useState({ sold: 0, unsold: 0, available: 0 })
  const [bids,   setBids]   = useState<any[]>([])

  // Subscribe to live state
  useEffect(() => {
    const unsub = subLive((data) => {
      setLive(data)
      if (data?.timerEnd) {
        setTimer(Math.max(0, Math.ceil((data.timerEnd - Date.now()) / 1000)))
      }
    })
    return unsub
  }, [])

  // Subscribe to bids
  useEffect(() => {
    const unsub = subBids((b: any[]) => setBids(b?.slice(-3) || []))
    return unsub
  }, [])

  // Countdown ticker
  useEffect(() => {
    if (!live || live.status !== 'bidding') return
    const iv = setInterval(() => {
      if (live.timerEnd) setTimer(Math.max(0, Math.ceil((live.timerEnd - Date.now()) / 1000)))
    }, 500)
    return () => clearInterval(iv)
  }, [live?.status, live?.timerEnd])

  // Stats (player counts)
  useEffect(() => {
    getPlayers().then((players: any[]) => {
      setStats({
        sold:      players.filter((p: any) => p.status === 'sold').length,
        unsold:    players.filter((p: any) => p.status === 'unsold').length,
        available: players.filter((p: any) => p.status === 'available').length,
      })
    })
  }, [live?.status])

  const show = live && (live.status === 'bidding' || live.status === 'sold' || live.status === 'unsold')
  if (!show || !live) return <div style={{ width: '100vw', height: '100vh', background: 'transparent' }} />

  const isBidding = live.status === 'bidding'
  const isSold    = live.status === 'sold'
  const isUnsold  = live.status === 'unsold'

  const timerColor = timer > 10 ? '#22c55e' : timer > 5 ? '#f97316' : '#ef4444'
  const fmtPts = (v: number) => `₹${v.toLocaleString('en-IN')}`

  return (
    <div style={{
      width: '1920px', height: '1080px',
      position: 'relative', overflow: 'hidden',
      fontFamily: '"Segoe UI", "DM Sans", Arial, sans-serif',
      background: 'transparent',
    }}>
      {/* ── Stadium Background ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, #0a1628 0%, #0f2040 25%, #0d3a1a 60%, #0a2810 100%)',
      }}/>
      {/* stadium lights glow */}
      <div style={{ position:'absolute', top:0, left:'15%', width:'70%', height:'40%',
        background:'radial-gradient(ellipse at 50% 0%, rgba(255,220,80,0.08) 0%, transparent 70%)'
      }}/>
      {/* grass pattern */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'45%',
        background:'repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 40px)',
      }}/>
      {/* pitch line */}
      <div style={{ position:'absolute', bottom:'10%', left:'30%', right:'30%', height:'1px',
        background:'rgba(255,255,255,0.1)'
      }}/>

      {/* ── Top Header ── */}
      <div style={{
        position:'absolute', top:0, left:0, right:0,
        height:'70px',
        background:'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(20,20,60,0.85) 50%, rgba(0,0,0,0.8) 100%)',
        borderBottom:'2px solid rgba(255,200,0,0.3)',
        display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px',
      }}>
        <div style={{ color:'#FFD700', fontSize:'22px', fontWeight:900, letterSpacing:'2px', textTransform:'uppercase', textShadow:'0 0 20px rgba(255,215,0,0.5)' }}>
          🏆 Player Auction Hub
        </div>
        <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'13px', letterSpacing:'3px', textTransform:'uppercase' }}>
          LIVE AUCTION
        </div>
      </div>

      {/* ── Main Player Card ── */}
      <div style={{
        position:'absolute',
        top:'90px', left:'50%',
        transform:'translateX(-50%)',
        width:'820px',
        display:'flex', alignItems:'flex-end', gap:'0',
      }}>

        {/* Player Number badge */}
        <div style={{
          position:'absolute', top:'-15px', left:'140px',
          width:'54px', height:'54px', borderRadius:'50%',
          background:'linear-gradient(135deg, #FFD700, #FFA500)',
          border:'3px solid white',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'20px', fontWeight:900, color:'#000',
          boxShadow:'0 4px 20px rgba(255,165,0,0.6)',
          zIndex:10,
        }}>
          🏏
        </div>

        {/* Player Photo */}
        <div style={{
          width:'200px', height:'260px', flexShrink:0,
          borderRadius:'50% 50% 0 0 / 60% 60% 0 0',
          overflow:'hidden', position:'relative',
          border:'3px solid #FFD700',
          boxShadow:'0 0 40px rgba(255,215,0,0.4)',
          background:'linear-gradient(180deg, #1a2a4a 0%, #0d1f3a 100%)',
        }}>
          {live.playerPhoto ? (
            <img src={live.playerPhoto} alt={live.playerName}
              style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top' }}/>
          ) : (
            <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'80px', color:'rgba(255,215,0,0.3)' }}>👤</div>
          )}
        </div>

        {/* Info Banners */}
        <div style={{ flex:1, paddingBottom:'4px', paddingLeft:'0' }}>

          {/* Name banner */}
          <div style={{
            background:'linear-gradient(90deg, #FFD700 0%, #FFC200 80%, transparent 100%)',
            padding:'10px 24px',
            marginBottom:'4px',
            clipPath:'polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%)',
          }}>
            <div style={{ fontSize:'28px', fontWeight:900, color:'#000', letterSpacing:'1px', whiteSpace:'nowrap' }}>
              {live.playerName}{(live as any).surname ? ' ' + (live as any).surname : ''}
            </div>
          </div>

          {/* Location banner */}
          {live.playerVillage && (
            <div style={{
              background:'linear-gradient(90deg, #FFD700 0%, #FFC200 85%, transparent 100%)',
              padding:'8px 24px',
              marginBottom:'4px',
              clipPath:'polygon(0 0, 94% 0, 100% 50%, 94% 100%, 0 100%)',
            }}>
              <div style={{ fontSize:'17px', fontWeight:700, color:'#000' }}>
                📍 {live.playerVillage}
              </div>
            </div>
          )}

          {/* Role banner */}
          <div style={{
            background:'linear-gradient(90deg, #FFD700 0%, #FFB300 80%, transparent 100%)',
            padding:'8px 24px',
            marginBottom:'20px',
            clipPath:'polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)',
          }}>
            <div style={{ fontSize:'17px', fontWeight:700, color:'#000' }}>
              🏏 {live.playerRole}
            </div>
          </div>

          {/* Current Bid */}
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <div style={{
              background:'rgba(0,0,0,0.6)',
              border:'2px solid #FFD700',
              borderRadius:'12px',
              padding:'10px 24px',
              display:'flex', alignItems:'center', gap:'10px',
            }}>
              <span style={{ fontSize:'28px' }}>🪙</span>
              <span style={{
                fontSize:'42px', fontWeight:900,
                color:'#FFD700',
                textShadow:'0 0 20px rgba(255,215,0,0.6)',
                fontVariantNumeric:'tabular-nums',
              }}>
                {fmtPts(live.currentPoints || 0)}
              </span>
            </div>

            {/* Current Bidder */}
            {live.currentBidder && (
              <div style={{
                background:'rgba(30,144,255,0.2)', border:'1px solid rgba(30,144,255,0.5)',
                borderRadius:'10px', padding:'8px 16px',
                color:'white', fontSize:'16px', fontWeight:700,
              }}>
                🏆 {live.currentBidder}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bid Increment label ── */}
      {isBidding && (
        <div style={{
          position:'absolute', right:'60px', top:'320px',
          textAlign:'center',
        }}>
          {/* Timer circle */}
          <div style={{
            width:'100px', height:'100px', borderRadius:'50%',
            border:`5px solid ${timerColor}`,
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            background:'rgba(0,0,0,0.6)',
            boxShadow:`0 0 30px ${timerColor}80`,
          }}>
            <div style={{ fontSize:'42px', fontWeight:900, color:timerColor, lineHeight:1 }}>{timer}</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', letterSpacing:'2px' }}>SEC</div>
          </div>
        </div>
      )}

      {/* ── SOLD / UNSOLD stamp ── */}
      {(isSold || isUnsold) && (
        <div style={{
          position:'absolute', right:'80px', top:'200px',
          transform:'rotate(-12deg)',
          border:`6px solid ${isSold ? '#22c55e' : '#ef4444'}`,
          color: isSold ? '#22c55e' : '#ef4444',
          fontSize:'64px', fontWeight:900,
          padding:'10px 24px',
          borderRadius:'8px',
          textShadow:`0 0 30px ${isSold ? '#22c55e' : '#ef4444'}`,
          boxShadow:`0 0 40px ${isSold ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
          background:'rgba(0,0,0,0.7)',
          letterSpacing:'4px',
        }}>
          {isSold ? 'SOLD !' : 'UNSOLD'}
        </div>
      )}

      {/* ── Recent Bids (right side) ── */}
      {isBidding && bids.length > 0 && (
        <div style={{
          position:'absolute', right:'40px', top:'450px',
          width:'280px',
        }}>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'11px', letterSpacing:'2px', marginBottom:'8px', textAlign:'center' }}>
            RECENT BIDS
          </div>
          {[...bids].reverse().map((bid: any, i: number) => (
            <div key={i} style={{
              background: i === 0 ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.4)',
              border: i === 0 ? '1px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius:'8px', padding:'8px 14px', marginBottom:'6px',
              display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
              <span style={{ color:'white', fontSize:'13px', fontWeight:600 }}>{bid.teamName}</span>
              <span style={{ color:'#FFD700', fontSize:'14px', fontWeight:900 }}>{fmtPts(bid.points)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Bottom Stats Bar ── */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0,
        height:'64px',
        background:'linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(10,10,40,0.95) 50%, rgba(0,0,0,0.9) 100%)',
        borderTop:'2px solid rgba(255,215,0,0.4)',
        display:'flex', alignItems:'center', justifyContent:'center', gap:'0',
      }}>
        {[
          { label:'Sold', value: stats.sold, color:'#22c55e' },
          { label:'Unsold', value: stats.unsold, color:'#ef4444' },
          { label:'Available', value: stats.available, color:'#FFD700' },
        ].map((s, i) => (
          <div key={s.label} style={{
            display:'flex', alignItems:'center', gap:'10px',
            padding:'0 40px',
            borderRight: i < 2 ? '1px solid rgba(255,255,255,0.15)' : 'none',
          }}>
            <div style={{
              width:'36px', height:'36px', borderRadius:'8px',
              background: s.color + '22', border:`2px solid ${s.color}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'20px', fontWeight:900, color:s.color,
            }}>
              {s.value}
            </div>
            <span style={{ color:'rgba(255,255,255,0.7)', fontSize:'14px', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
