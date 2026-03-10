'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { getSettings, saveSettings } from '@/lib/db'

export default function TestSettingsPage() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const testSettings = async () => {
    setLoading(true)
    setStatus('Testing tournament settings...')
    
    try {
      console.log('Getting settings for tournament 653...')
      const settings = await getSettings('653')
      console.log('Current settings:', settings)
      setStatus(`✅ Current Settings: ${JSON.stringify(settings, null, 2)}`)
      
      // If no teamBudget, set it
      if (!settings.teamBudget || settings.teamBudget === 0) {
        console.log('No team budget found, setting default...')
        await saveSettings({ teamBudget: 500000 }, '653')
        setStatus('✅ Set default team budget to ₹5,00,000')
        
        // Check again
        const newSettings = await getSettings('653')
        console.log('New settings:', newSettings)
        setStatus(`✅ Updated Settings: ${JSON.stringify(newSettings, null, 2)}`)
      } else {
        setStatus(`✅ Team budget already set: ₹${settings.teamBudget.toLocaleString('en-IN')}`)
      }
      
    } catch (error: any) {
      console.error('Settings test failed:', error)
      setStatus(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const setCustomBudget = async () => {
    setLoading(true)
    setStatus('Setting custom team budget...')
    
    try {
      await saveSettings({ teamBudget: 300000 }, '653')
      setStatus('✅ Set custom team budget to ₹3,00,000')
      
      const settings = await getSettings('653')
      console.log('Updated settings:', settings)
      setStatus(`✅ New Settings: ${JSON.stringify(settings, null, 2)}`)
      
    } catch (error: any) {
      console.error('Custom budget failed:', error)
      setStatus(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🧪 Tournament Settings Test</h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div>
            <h2 className="font-bold mb-2">Test Tournament 653 Settings:</h2>
            <p className="text-sm text-gray-600 mb-4">
              This will test if tournament 653 has settings and set team budget if needed.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={testSettings}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : '🔍 Test Settings'}
            </button>
            
            <button
              onClick={setCustomBudget}
              disabled={loading}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Setting...' : '💰 Set Budget to ₹3,00,000'}
            </button>
          </div>

          {status && (
            <div className={`p-4 rounded-lg text-sm whitespace-pre-wrap ${status.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <div className="font-bold mb-2">Status:</div>
              <div>{status}</div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-700">
            <strong>Instructions:</strong><br/>
            1. Open browser console (F12)<br/>
            2. Click "Test Settings"<br/>
            3. Check console for detailed logs<br/>
            4. This will create/set tournament settings if needed
          </div>

          <div className="bg-gray-100 p-4 rounded-lg text-xs">
            <strong>Quick Links:</strong><br/>
            <a href="/team-balance" className="text-blue-600 hover:underline">Team Balance Dashboard</a><br/>
            <a href="/admin/tournaments" className="text-blue-600 hover:underline">Admin Tournaments</a>
          </div>
        </div>
      </div>
    </div>
  )
}
