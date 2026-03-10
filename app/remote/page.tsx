'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { subLive, subBids, placeBid, passBid, getTeams, LiveState } from '@/lib/db'

// Mobile Remote Bidding Interface
// URL: /remote?teamId=TEAM_ID&tournamentId=TOURNAMENT_ID
// Team owners can bid, pass, and see live auction status

export default function RemoteBidding() {
  const searchParams = useSearchParams()
  const teamId = searchParams.get('teamId') || ''
  const tournamentId = searchParams.get('tournamentId') || ''

  const [live, setLive] = useState<LiveState | null>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [currentTeam, setCurrentTeam] = useState<any>(null)
  const [timer, setTimer] = useState(0)
  const [bidAmount, setBidAmount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!teamId || !tournamentId) return

    // Load teams from both global and tournament-specific collections
    const loadTeams = async () => {
      try {
        // First try tournament-specific teams
        const tournamentTeams = await getTeams(tournamentId)
        let team = tournamentTeams.find(t => t.id === teamId)
        
        // If not found, try global teams
        if (!team) {
          const globalTeams = await getTeams() // No tournamentId = global
          team = globalTeams.find(t => t.id === teamId)
          setTeams(globalTeams)
        } else {
          setTeams(tournamentTeams)
        }
        
        setCurrentTeam(team || null)
      } catch (error) {
        console.error('Error loading teams:', error)
        setCurrentTeam(null)
      }
    }

    loadTeams()

    // Subscribe to live auction
    const unsubLive = subLive(tournamentId, (data) => {
      console.log('Live auction data:', data)
      setLive(data)
      if (data?.timerEnd) {
        setTimer(Math.max(0, Math.ceil((data.timerEnd - Date.now()) / 1000)))
      }
      // Set bid amount to current bid + minimum increment
      if (data?.currentPoints) {
        setBidAmount(data.currentPoints + 5000) // 5000 increment as requested
      }
    })

    // Also try global auction if tournament-specific doesn't work
    const unsubGlobal = subLive((globalData) => {
      console.log('Global auction data:', globalData)
      if (!live && globalData) { // Only use global if tournament data is empty
        setLive(globalData)
        if (globalData?.timerEnd) {
          setTimer(Math.max(0, Math.ceil((globalData.timerEnd - Date.now()) / 1000)))
        }
        if (globalData?.currentPoints) {
          setBidAmount(globalData.currentPoints + 5000)
        }
      }
    })

    // Subscribe to bids
    const unsubBids = subBids(tournamentId, (bids) => {
      // Handle bid updates if needed
    })

    return () => {
      unsubLive()
      unsubGlobal()
      unsubBids()
    }
  }, [teamId, tournamentId])

  // Timer countdown
  useEffect(() => {
    if (!live || live.status !== 'bidding') return
    const interval = setInterval(() => {
      if (live.timerEnd) {
        setTimer(Math.max(0, Math.ceil((live.timerEnd - Date.now()) / 1000)))
      }
    }, 500)
    return () => clearInterval(interval)
  }, [live?.status, live?.timerEnd])

  const handlePlaceBid = async () => {
    if (!currentTeam || !live || isSubmitting) return
    
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      console.log('Placing bid:', { tournamentId, teamId, bidAmount, teamName: currentTeam.teamName })
      await placeBid(tournamentId, teamId, bidAmount, currentTeam.teamName)
      setSuccess('Bid placed successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Bid error:', err)
      setError(err.message || 'Failed to place bid')
      setTimeout(() => setError(''), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePass = async () => {
    if (!currentTeam || !live || isSubmitting) return
    
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      console.log('Passing bid:', { tournamentId, teamId, teamName: currentTeam.teamName })
      await passBid(tournamentId, teamId, currentTeam.teamName)
      setSuccess('Passed successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Pass error:', err)
      setError(err.message || 'Failed to pass')
      setTimeout(() => setError(''), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const increaseBid = () => {
    setBidAmount(prev => prev + 5000)
  }

  const decreaseBid = () => {
    const minBid = live?.currentPoints ? live.currentPoints + 5000 : 5000
    setBidAmount(prev => Math.max(minBid, prev - 5000))
  }

  if (!teamId || !tournamentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Missing Parameters</h1>
          <p className="text-gray-600 mb-4">Please provide team ID and tournament ID</p>
          <code className="bg-gray-100 px-3 py-2 rounded text-sm">
            /remote?teamId=TEAM_ID&tournamentId=TOURNAMENT_ID
          </code>
        </div>
      </div>
    )
  }

  if (!currentTeam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Team Not Found</h1>
          <p className="text-gray-600 mb-2">Team ID: {teamId}</p>
          <p className="text-gray-500 text-sm mb-4">Please check your team ID and try again</p>
          <div className="bg-gray-50 p-3 rounded-lg text-left">
            <p className="text-xs text-gray-600 font-bold mb-2">Troubleshooting:</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Check if team ID is correct</li>
              <li>• Ensure team is registered</li>
              <li>• Contact admin for correct team ID</li>
            </ul>
          </div>
          <div className="mt-4">
            <button
              onClick={() => window.location.href = '/admin/link-maker'}
              className="text-saffron-600 hover:text-saffron-700 text-sm underline"
            >
              Get Team IDs from Link Maker →
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isBidding = live?.status === 'bidding'
  const isSold = live?.status === 'sold'
  const isUnsold = live?.status === 'unsold'
  const isCurrentBidder = live?.currentBidderTeamId === teamId

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-saffron-600 to-orange-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🏏 Remote Bidding
          </h1>
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm opacity-90">
              Team: <span className="font-bold">{currentTeam.teamName}</span>
            </div>
            <div className="text-sm opacity-90">
              Points: <span className="font-bold">{currentTeam.points || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Live Status */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Live Auction Status</h2>
            {isBidding && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-600 font-bold">LIVE</span>
                {timer > 0 && (
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm font-bold">
                    {timer}s
                  </span>
                )}
              </div>
            )}
          </div>

          {live ? (
            <div className="space-y-4">
              {/* Player Info */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  {live.playerPhoto ? (
                    <img src={live.playerPhoto} alt={live.playerName} className="w-20 h-20 rounded-lg object-cover" />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
                      👤
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800">
                      {live.playerName} {(live as any).surname}
                    </h3>
                    <p className="text-gray-600">{live.playerRole}</p>
                    {live.playerVillage && (
                      <p className="text-sm text-gray-500">📍 {live.playerVillage}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Current Bid */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Current Bid</p>
                    <p className="text-2xl font-bold text-yellow-700">
                      ₹{live.currentPoints?.toLocaleString('en-IN') || 0}
                    </p>
                  </div>
                  {live.currentBidder && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Leading</p>
                      <p className="font-bold text-gray-800">🏆 {live.currentBidder}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Display */}
              {isSold && (
                <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">✅ SOLD!</p>
                  <p className="text-green-600">To {live.currentBidder} for ₹{live.currentPoints?.toLocaleString('en-IN')}</p>
                </div>
              )}

              {isUnsold && (
                <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">❌ UNSOLD</p>
                  <p className="text-red-600">No bids received</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">Waiting for auction to start...</p>
            </div>
          )}
        </div>

        {/* Bidding Controls */}
        {isBidding && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Place Your Bid</h3>
            
            {/* Bid Amount Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bid Amount</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={decreaseBid}
                  className="bg-red-500 text-white w-12 h-12 rounded-full font-bold text-xl hover:bg-red-600 transition-colors"
                  disabled={isSubmitting}
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <div className="text-3xl font-bold text-saffron-600">
                    ₹{bidAmount.toLocaleString('en-IN')}
                  </div>
                </div>
                <button
                  onClick={increaseBid}
                  className="bg-green-500 text-white w-12 h-12 rounded-full font-bold text-xl hover:bg-green-600 transition-colors"
                  disabled={isSubmitting}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handlePlaceBid}
                disabled={isSubmitting || bidAmount <= (live?.currentPoints || 0)}
                className="bg-gradient-to-r from-saffron-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:from-saffron-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Placing...' : '🏏 BID'}
              </button>
              <button
                onClick={handlePass}
                disabled={isSubmitting}
                className="bg-gray-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Passing...' : '❌ PASS'}
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="mt-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Current Bidder Indicator */}
            {isCurrentBidder && (
              <div className="mt-4 bg-blue-100 border border-blue-300 text-blue-700 px-4 py-3 rounded-lg text-center">
                🏆 You are currently leading this bid!
              </div>
            )}
          </div>
        )}

        {/* Debug Panel */}
        <div className="bg-gray-100 rounded-xl shadow-lg p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-2">🔧 Debug Info</h3>
          <div className="text-xs text-gray-600 space-y-1 font-mono">
            <div>Tournament ID: {tournamentId}</div>
            <div>Team ID: {teamId}</div>
            <div>Team Found: {currentTeam ? '✅' : '❌'}</div>
            <div>Live Data: {live ? '✅' : '❌'}</div>
            <div>Status: {live?.status || 'None'}</div>
            <div>Player: {live?.playerName || 'None'}</div>
            <div>Current Bid: {live?.currentPoints || 0}</div>
            <div>Current Bidder: {live?.currentBidder || 'None'}</div>
            <div className="mt-2 pt-2 border-t border-gray-300">
              <div className="text-xs font-bold text-blue-600">💡 Quick Test:</div>
              <div className="text-xs">1. Start auction in admin panel</div>
              <div className="text-xs">2. Select a player to bid</div>
              <div className="text-xs">3. Click "Start Bidding"</div>
              <div className="text-xs">4. Check console for data</div>
            </div>
          </div>
        </div>

        {/* Team Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Your Team Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{currentTeam.playersBought || 0}</p>
              <p className="text-sm text-gray-600">Players Bought</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{currentTeam.points || 0}</p>
              <p className="text-sm text-gray-600">Points Remaining</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
