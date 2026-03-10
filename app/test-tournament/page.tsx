'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, serverTimestamp, doc, setDoc } from 'firebase/firestore'

export default function TestTournamentPage() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const testTournamentCreation = async () => {
    setLoading(true)
    setStatus('Testing tournament creation...')
    
    try {
      // First, check if tournament 653 exists
      console.log('Checking if tournament 653 exists...')
      const tournamentRef = doc(db, 'tournaments', '653')
      
      // Create tournament if it doesn't exist
      await setDoc(tournamentRef, {
        id: '653',
        name: 'Test Tournament 653',
        description: 'Test tournament for team management',
        status: 'upcoming',
        createdAt: serverTimestamp()
      }, { merge: true })
      
      setStatus('✅ Tournament 653 created/verified')
      
      // Test adding a team to the tournament
      console.log('Testing team addition to tournament 653...')
      const teamRef = collection(db, 'tournaments', '653', 'teams')
      
      const testTeam = {
        teamName: 'Test Team ' + Date.now(),
        ownerName: 'Test Owner',
        logoURL: '',
        points: 500000,
        playersBought: 0,
        createdAt: serverTimestamp()
      }
      
      const teamDoc = await addDoc(teamRef, testTeam)
      console.log('Team added with ID:', teamDoc.id)
      setStatus(`✅ Team added successfully! ID: ${teamDoc.id}`)
      
      // Test reading teams back
      console.log('Reading teams from tournament 653...')
      const teamsSnap = await getDocs(teamRef)
      const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      console.log('Teams found:', teams)
      setStatus(`✅ Success! Found ${teams.length} teams in tournament 653`)
      
    } catch (error: any) {
      console.error('Test failed:', error)
      setStatus(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testGlobalTeams = async () => {
    setLoading(true)
    setStatus('Testing global teams...')
    
    try {
      // Test adding to global teams
      const globalTeamRef = collection(db, 'teams')
      
      const testTeam = {
        teamName: 'Global Test Team ' + Date.now(),
        ownerName: 'Global Test Owner',
        logoURL: '',
        points: 500000,
        playersBought: 0,
        createdAt: serverTimestamp()
      }
      
      const teamDoc = await addDoc(globalTeamRef, testTeam)
      console.log('Global team added with ID:', teamDoc.id)
      setStatus(`✅ Global team added! ID: ${teamDoc.id}`)
      
    } catch (error: any) {
      console.error('Global test failed:', error)
      setStatus(`❌ Global Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🧪 Tournament/Team Test</h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div>
            <h2 className="font-bold mb-2">Test Tournament 653:</h2>
            <p className="text-sm text-gray-600 mb-4">
              This will test if we can create tournament 653 and add teams to it.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={testTournamentCreation}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : '🏏 Test Tournament 653'}
            </button>
            
            <button
              onClick={testGlobalTeams}
              disabled={loading}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : '🌍 Test Global Teams'}
            </button>
          </div>

          {status && (
            <div className={`p-4 rounded-lg text-sm ${status.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <div className="font-bold mb-2">Status:</div>
              <div>{status}</div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-700">
            <strong>Instructions:</strong><br/>
            1. Open browser console (F12)<br/>
            2. Click "Test Tournament 653"<br/>
            3. Check console for detailed logs<br/>
            4. This will help identify the issue
          </div>
        </div>
      </div>
    </div>
  )
}
