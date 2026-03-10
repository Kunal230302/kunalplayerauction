'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { FiCopy, FiExternalLink, FiLink, FiUsers, FiMonitor, FiSmartphone } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function LinkMakerPage() {
  const [tournamentId, setTournamentId] = useState('653')
  const [teams, setTeams] = useState([
    { name: 'TEAM 01', id: 'AUzkuHdcUyw8B7ohgc2L' },
    { name: 'TEAM 02', id: 'VvUwh6KorJxmnHLtR6ti' }
  ])
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamId, setNewTeamId] = useState('')

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

  const generateRemoteLink = (teamId: string) => {
    return `${baseUrl}/remote?teamId=${teamId}&tournamentId=${tournamentId}`
  }

  const generateOverlayLink = (tid?: string) => {
    const id = tid || tournamentId
    return `${baseUrl}/overlay?tid=${id}`
  }

  const generateYouTubeLink = () => {
    return `${baseUrl}/overlay/youtube`
  }

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text)
    toast.success(`${type} link copied!`)
  }

  const openLink = (url: string) => {
    window.open(url, '_blank')
  }

  const addTeam = () => {
    if (newTeamName.trim() && newTeamId.trim()) {
      setTeams([...teams, { name: newTeamName.trim(), id: newTeamId.trim() }])
      setNewTeamName('')
      setNewTeamId('')
      toast.success('Team added!')
    }
  }

  const removeTeam = (index: number) => {
    setTeams(teams.filter((_, i) => i !== index))
    toast.success('Team removed!')
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="page-title flex items-center justify-center gap-2">
            <FiLink size={28} />
            Overlay Link Maker
          </h1>
          <p className="text-stone-400">Generate bidding and overlay links instantly</p>
        </div>

        {/* Tournament Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiMonitor size={20} />
            Tournament Settings
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Tournament ID</label>
              <input
                type="text"
                className="input"
                value={tournamentId}
                onChange={(e) => setTournamentId(e.target.value)}
                placeholder="Enter tournament ID"
              />
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <strong>Current:</strong> {tournamentId}
              </div>
            </div>
          </div>
        </div>

        {/* Overlay Links */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiMonitor size={20} />
            Overlay Links
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">Professional OBS</h3>
              <div className="text-xs text-blue-600 mb-3 font-mono break-all">
                {generateOverlayLink()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(generateOverlayLink(), 'OBS Overlay')}
                  className="btn-outline btn-sm flex-1"
                >
                  <FiCopy size={14} /> Copy
                </button>
                <button
                  onClick={() => openLink(generateOverlayLink())}
                  className="btn-primary btn-sm flex-1"
                >
                  <FiExternalLink size={14} /> Open
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
              <h3 className="font-bold text-purple-800 mb-2">Mobile Stream</h3>
              <div className="text-xs text-purple-600 mb-3 font-mono break-all">
                {generateYouTubeLink()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(generateYouTubeLink(), 'YouTube Overlay')}
                  className="btn-outline btn-sm flex-1"
                >
                  <FiCopy size={14} /> Copy
                </button>
                <button
                  onClick={() => openLink(generateYouTubeLink())}
                  className="btn-primary btn-sm flex-1"
                >
                  <FiExternalLink size={14} /> Open
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
              <h3 className="font-bold text-green-800 mb-2">Setup Guide</h3>
              <div className="text-xs text-green-600 mb-3 font-mono break-all">
                {baseUrl}/overlay/help
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(`${baseUrl}/overlay/help`, 'Setup Guide')}
                  className="btn-outline btn-sm flex-1"
                >
                  <FiCopy size={14} /> Copy
                </button>
                <button
                  onClick={() => openLink(`${baseUrl}/overlay/help`)}
                  className="btn-primary btn-sm flex-1"
                >
                  <FiExternalLink size={14} /> Open
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Team Management */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiUsers size={20} />
            Team Remote Bidding Links
          </h2>

          {/* Add New Team */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="label text-sm">Team Name</label>
                <input
                  type="text"
                  className="input text-sm"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. TEAM 03"
                />
              </div>
              <div>
                <label className="label text-sm">Team ID</label>
                <input
                  type="text"
                  className="input text-sm"
                  value={newTeamId}
                  onChange={(e) => setNewTeamId(e.target.value)}
                  placeholder="e.g. abc123xyz"
                />
              </div>
              <div className="flex items-end">
                <button onClick={addTeam} className="btn-primary w-full">
                  Add Team
                </button>
              </div>
            </div>
          </div>

          {/* Team Links */}
          <div className="grid md:grid-cols-2 gap-4">
            {teams.map((team, index) => (
              <div key={index} className="bg-gradient-to-r from-saffron-50 to-orange-50 p-4 rounded-lg border border-saffron-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-saffron-800">{team.name}</h3>
                    <p className="text-xs text-saffron-600 font-mono">ID: {team.id}</p>
                  </div>
                  <button
                    onClick={() => removeTeam(index)}
                    className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                    title="Remove team"
                  >
                    ×
                  </button>
                </div>
                <div className="text-xs text-gray-600 mb-3 font-mono break-all">
                  {generateRemoteLink(team.id)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(generateRemoteLink(team.id), `${team.name} Remote`)}
                    className="btn-outline btn-sm flex-1"
                  >
                    <FiCopy size={14} /> Copy
                  </button>
                  <button
                    onClick={() => openLink(generateRemoteLink(team.id))}
                    className="btn-primary btn-sm flex-1"
                  >
                    <FiSmartphone size={14} /> Open
                  </button>
                </div>
              </div>
            ))}
          </div>

          {teams.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <FiUsers size={48} className="mx-auto mb-3" />
              <p>No teams added yet. Add teams above to generate remote bidding links.</p>
            </div>
          )}
        </div>

        {/* Quick Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-800 mb-3">📋 Quick Instructions</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <strong>For Overlays:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Use OBS Overlay for professional streaming</li>
                <li>• Use Mobile Stream for social media</li>
                <li>• Check Setup Guide for device instructions</li>
              </ul>
            </div>
            <div>
              <strong>For Teams:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Share remote links with team owners</li>
                <li>• Teams can bid from mobile phones</li>
                <li>• Links work on all devices</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
