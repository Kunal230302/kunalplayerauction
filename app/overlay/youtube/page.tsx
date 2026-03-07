'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { subLive, LiveState, getTeams } from '@/lib/db'

// YouTube Live Overlay — full-width branded overlay for YouTube Live streaming
// URL: yoursite.com/overlay/youtube
// Use as a Browser Source in OBS at 1920x1080

export default function YouTubeOverlay() {
  const [live, setLive] = useState<LiveState | null>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [timer, setTimer] = useState(0)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    getTeams().then(setTeams)
    const unsub = subLive((data) => {
      setLive(prev => {
        if (prev?.currentPoints !== data?.currentPoints && data?.currentPoints) {
          setFlash(true)
          setTimeout(() => setFlash(false), 600)
        }
        return data
      })
    })
    return unsub
  }, [])

  // Timer countdown
  useEffect(() => {
    if (!live || live.status !== 'bidding') return
    const interval = setInterval(() => {
      if (live.timerEnd) {
        setTimer(Math.max(0, Math.ceil((live.timerEnd - Date.now()) / 1000)))
      }
    }, 200)
    return () => clearInterval(interval)
  }, [live?.status, live?.timerEnd])

  const show = live && (live.status === 'bidding' || live.status === 'sold' || live.status === 'unsold')
  const isBidding = live?.status === 'bidding'
  const isSold = live?.status === 'sold'
  const isUnsold = live?.status === 'unsold'

  if (!show || !live) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'transparent',
        fontFamily: '"DM Sans", "Segoe UI", Arial, sans-serif',
      }}>
        {/* Idle: Show just the branded top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          background: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #ea580c 100%)',
          height: '48px', display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: '12px',
          boxShadow: '0 4px 20px rgba(249,115,22,0.5)',
        }}>
          <span style={{ fontSize: '22px' }}>🏏</span>
          <span style={{ color: 'white', fontSize: '16px', fontWeight: 900, letterSpacing: '1px' }}>
            PLAYERAUCTIONHUB
          </span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 700, marginLeft: '8px', letterSpacing: '0.5px' }}>
            PROFESSIONAL CRICKET AUCTION PLATFORM | પ્રોફેશનલ ઓક્શન પ્લેટફોર્મ
          </span>
          <div style={{ flex: 1 }} />
          <div style={{
            background: 'rgba(255,255,255,0.2)', borderRadius: '20px',
            padding: '4px 14px', fontSize: '11px', fontWeight: 800,
            color: 'white', letterSpacing: '1px',
          }}>
            ⏸ WAITING FOR AUCTION
          </div>
        </div>

        {/* Team scoreboard at bottom */}
        {teams.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            display: 'flex', gap: '2px',
          }}>
            {teams.slice(0, 4).map((t, i) => {
              const colors = ['#dc2626', '#2563eb', '#16a34a', '#9333ea']
              return (
                <div key={t.id} style={{
                  flex: 1, background: `linear-gradient(180deg, ${colors[i]}dd 0%, ${colors[i]}99 100%)`,
                  padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px',
                  backdropFilter: 'blur(8px)',
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 900, color: 'white',
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    {t.logoURL ? <img src={t.logoURL} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : t.teamName?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'white', fontSize: '13px', fontWeight: 800, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {t.teamName}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 600 }}>
                      {t.playersBought || 0} players · {t.points || 0} pts
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const timerColor = timer > 15 ? '#22c55e' : timer > 5 ? '#f97316' : '#ef4444'
  const statusColor = isSold ? '#22c55e' : isUnsold ? '#ef4444' : '#f97316'

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'transparent',
      fontFamily: '"DM Sans", "Segoe UI", Arial, sans-serif',
      pointerEvents: 'none',
    }}>

      {/* ===== TOP BAR — Branded header + Live indicator ===== */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        background: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #ea580c 100%)',
        height: '48px', display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: '12px',
        boxShadow: `0 4px 20px ${statusColor}66`,
      }}>
        <span style={{ fontSize: '22px' }}>🏏</span>
        <span style={{ color: 'white', fontSize: '16px', fontWeight: 900, letterSpacing: '1px' }}>
          PLAYERAUCTIONHUB
        </span>
        <div style={{ flex: 1 }} />

        {/* Live indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: isSold ? '#22c55e' : isUnsold ? '#ef4444' : '#dc2626',
          borderRadius: '20px', padding: '5px 14px',
        }}>
          {isBidding && <div style={{
            width: '8px', height: '8px', borderRadius: '50%', background: 'white',
            animation: 'pulse 1s ease-in-out infinite',
          }} />}
          <span style={{ color: 'white', fontSize: '11px', fontWeight: 900, letterSpacing: '2px' }}>
            {isSold ? '✅ SOLD' : isUnsold ? '❌ UNSOLD' : '🔴 LIVE'}
          </span>
        </div>

        {/* Timer in top bar */}
        {isBidding && (
          <div style={{
            background: 'rgba(0,0,0,0.3)', borderRadius: '12px',
            padding: '4px 16px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ color: timerColor, fontSize: '24px', fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
              {timer}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '1px' }}>SEC</span>
          </div>
        )}
      </div>

      {/* ===== MAIN PLAYER CARD — Left side ===== */}
      <div style={{
        position: 'absolute', top: '64px', left: '24px',
        background: 'linear-gradient(135deg, rgba(15,10,5,0.92) 0%, rgba(30,15,5,0.92) 100%)',
        border: `2px solid ${statusColor}`,
        borderRadius: '20px', width: '420px',
        backdropFilter: 'blur(10px)',
        boxShadow: `0 8px 40px ${statusColor}44`,
        overflow: 'hidden',
      }}>
        {/* Status ribbon */}
        <div style={{
          background: statusColor, padding: '6px',
          textAlign: 'center', fontSize: '11px', fontWeight: 900,
          color: 'white', letterSpacing: '3px',
        }}>
          {isSold ? '🎉 SOLD!' : isUnsold ? 'UNSOLD' : 'NOW BIDDING'}
        </div>

        <div style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Player photo */}
          {live.playerPhoto ? (
            <img src={live.playerPhoto} alt={live.playerName}
              style={{
                width: '80px', height: '80px', borderRadius: '16px',
                objectFit: 'cover', border: `3px solid ${statusColor}`,
                flexShrink: 0,
              }} />
          ) : (
            <div style={{
              width: '80px', height: '80px', borderRadius: '16px',
              background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', fontWeight: 900, color: '#6b7280', flexShrink: 0,
              border: `3px solid ${statusColor}`,
            }}>
              {live.playerName?.[0]?.toUpperCase() || '?'}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fb923c', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
              {live.playerRole}
            </div>
            <div style={{
              color: 'white', fontSize: '22px', fontWeight: 900, lineHeight: 1.1,
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>
              {live.playerName}
            </div>
            {live.playerVillage && (
              <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '3px' }}>
                📍 {live.playerVillage}
              </div>
            )}
          </div>
        </div>

        {/* Current bid section */}
        <div style={{
          background: flash ? `${statusColor}33` : 'rgba(255,255,255,0.03)',
          padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
          transition: 'background 0.3s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ color: '#9ca3af', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2px' }}>
                CURRENT BID
              </div>
              <div style={{
                color: '#fb923c', fontSize: '36px', fontWeight: 900,
                lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                transition: 'all 0.3s ease',
                transform: flash ? 'scale(1.08)' : 'scale(1)',
              }}>
                {live.currentPoints || 0} <span style={{ fontSize: '16px', color: '#9ca3af' }}>pts</span>
              </div>
            </div>
            {live.currentBidder && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#6b7280', fontSize: '10px', letterSpacing: '1px' }}>LEADING</div>
                <div style={{ color: '#d1d5db', fontSize: '15px', fontWeight: 800 }}>
                  🏏 {live.currentBidder}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SOLD stamp overlay */}
        {(isSold || isUnsold) && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%) rotate(-15deg)',
            border: `5px solid ${statusColor}`,
            color: statusColor,
            borderRadius: '10px', padding: '10px 24px',
            fontSize: '32px', fontWeight: 900,
            letterSpacing: '5px',
            background: 'rgba(0,0,0,0.7)',
            animation: 'stampIn 0.4s ease-out',
          }}>
            {isSold ? 'SOLD!' : 'UNSOLD'}
          </div>
        )}
      </div>

      {/* ===== BOTTOM SCOREBOARD — All 4 teams ===== */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        display: 'flex', gap: '2px',
      }}>
        {teams.slice(0, 4).map((t, i) => {
          const colors = ['#dc2626', '#2563eb', '#16a34a', '#9333ea']
          const isLeading = live?.currentBidderTeamId === t.id
          return (
            <div key={t.id} style={{
              flex: 1,
              background: isLeading
                ? `linear-gradient(180deg, ${colors[i]} 0%, ${colors[i]}dd 100%)`
                : `linear-gradient(180deg, ${colors[i]}bb 0%, ${colors[i]}88 100%)`,
              padding: isLeading ? '12px 16px' : '10px 16px',
              display: 'flex', alignItems: 'center', gap: '10px',
              backdropFilter: 'blur(8px)',
              borderTop: isLeading ? '3px solid white' : '3px solid transparent',
              transition: 'all 0.3s ease',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 900, color: 'white',
                overflow: 'hidden', flexShrink: 0,
                border: isLeading ? '2px solid white' : '2px solid transparent',
              }}>
                {t.logoURL ? <img src={t.logoURL} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : t.teamName?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: 'white', fontSize: '13px', fontWeight: 800,
                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                }}>
                  {t.teamName}
                  {isLeading && <span style={{ marginLeft: '6px', fontSize: '11px' }}>⬆️</span>}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 600 }}>
                  {t.playersBought || 0} players · {t.points || 0} pts
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Keyframe animations via style tag */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes stampIn {
          0% { transform: translate(-50%, -50%) rotate(-15deg) scale(2); opacity: 0; }
          100% { transform: translate(-50%, -50%) rotate(-15deg) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
