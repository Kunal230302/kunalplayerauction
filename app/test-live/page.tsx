'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { setLive, updateLive } from '@/lib/db'

// Test page to manually trigger live auction data
export default function TestLivePage() {
  const [status, setStatus] = useState('')

  const testLiveAuction = async () => {
    try {
      setStatus('Creating test live auction...')
      
      // Create test live auction data
      const testData = {
        playerId: 'test123',
        playerName: 'Test Player',
        playerRole: 'Batsman',
        playerPhoto: '',
        playerVillage: 'Test Village',
        currentPoints: 50000,
        currentBidder: 'Test Team',
        currentBidderTeamId: 'AUzkuHdcUyw8B7ohgc2L',
        status: 'bidding',
        timerEnd: Date.now() + 30000 // 30 seconds from now
      }

      // Try tournament-specific first
      await setLive(testData, '653')
      setStatus('✅ Test auction created! Check remote interface now.')
      
      // Update after 2 seconds to test real-time updates
      setTimeout(async () => {
        await updateLive({
          ...testData,
          currentPoints: 60000,
          currentBidder: 'Another Team'
        }, '653')
        setStatus('✅ Updated auction with new bid!')
      }, 2000)

    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`)
    }
  }

  const clearAuction = async () => {
    try {
      const { clearLive } = await import('@/lib/db')
      await clearLive('653')
      setStatus('✅ Auction cleared')
    } catch (error: any) {
      setStatus(`❌ Error clearing: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">🧪 Live Auction Test</h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div>
            <h2 className="font-bold mb-2">Test Remote Connection:</h2>
            <p className="text-sm text-gray-600 mb-4">
              This will create a test auction to verify the remote bidding interface works.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={testLiveAuction}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600"
            >
              🎯 Create Test Auction
            </button>
            
            <button
              onClick={clearAuction}
              className="w-full bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600"
            >
              🗑️ Clear Auction
            </button>
          </div>

          {status && (
            <div className={`p-3 rounded-lg text-sm ${status.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {status}
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
            <strong>Instructions:</strong><br/>
            1. Click "Create Test Auction"<br/>
            2. Open remote link in another tab<br/>
            3. Should show Live Data: ✅<br/>
            4. Test bidding functionality
          </div>

          <div className="bg-gray-100 p-3 rounded-lg text-xs">
            <strong>Remote Link:</strong><br/>
            <code className="break-all">
              http://localhost:3000/remote?teamId=AUzkuHdcUyw8B7ohgc2L&tournamentId=653
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
