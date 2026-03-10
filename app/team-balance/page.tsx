'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { getTeams, getPlayers, getSettings } from '@/lib/db'
import { FiTrendingUp, FiUsers, FiDollarSign, FiEye, FiX } from 'react-icons/fi'

interface Team {
  id: string
  teamName: string
  ownerName: string
  logoURL: string
  points: number
  playersBought: number
}

interface Player {
  id: string
  name: string
  surname: string
  role: string
  village: string
  photoURL: string
  soldTo?: string
  soldToName?: string
  soldPoints?: number
  status: 'available' | 'sold' | 'unsold'
}

interface Settings {
  teamBudget: number
  bidIncrement: number
  timerSeconds: number
  basePrice: number
}

export default function TeamBalancePage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [tournamentId, setTournamentId] = useState('653')
  const [settings, setSettings] = useState<Settings>({ teamBudget: 500000, bidIncrement: 10000, timerSeconds: 30, basePrice: 5000 })

  useEffect(() => {
    loadData()
  }, [tournamentId])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('Loading data for tournament:', tournamentId)
      
      const [teamsData, playersData, settingsData] = await Promise.all([
        getTeams(tournamentId),
        getPlayers(tournamentId),
        getSettings(tournamentId)
      ])
      
      console.log('Teams loaded:', teamsData)
      console.log('Players loaded:', playersData)
      console.log('Settings loaded:', settingsData)
      
      setTeams(teamsData)
      setPlayers(playersData)
      setSettings(settingsData)
      
      console.log('Team budget from settings:', settingsData.teamBudget)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team)
    // Get all players bought by this team
    const boughtPlayers = players.filter(player => 
      player.soldTo === team.id && player.status === 'sold'
    )
    setTeamPlayers(boughtPlayers)
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const teamBudget = settings.teamBudget || 500000 // Use tournament budget or default

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚡</div>
          <p className="text-xl text-gray-600">Loading team balances...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-saffron-600 to-orange-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <FiTrendingUp size={32} />
            Team Balance Dashboard
          </h1>
          <p className="text-saffron-100">Tournament ID: {tournamentId}</p>
          <p className="text-saffron-100 text-sm">Team Budget: {formatCurrency(settings.teamBudget)}</p>
          <p className="text-saffron-100 text-xs">Debug: Settings loaded = {JSON.stringify(settings).substring(0, 100)}...</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Team Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {teams.map((team, index) => {
            const amountSpent = teamBudget - (team.points || 0)
            const remainingBudget = team.points || 0
            const budgetPercentage = (amountSpent / teamBudget) * 100
            const teamColor = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'][index % 4]
            
            return (
              <div
                key={team.id}
                onClick={() => handleTeamClick(team)}
                className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl border-2 border-gray-100"
              >
                {/* Team Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-full ${teamColor} flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg`}>
                    {team.logoURL ? (
                      <img src={team.logoURL} alt={team.teamName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      team.teamName?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800">{team.teamName}</h3>
                    <p className="text-sm text-gray-500">{team.ownerName}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Players Bought</span>
                    <span className="font-bold text-lg text-saffron-600">{team.playersBought || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Team Budget</span>
                    <span className="font-bold text-lg text-blue-600">{formatCurrency(teamBudget)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Amount Spent</span>
                    <span className="font-bold text-lg text-orange-600">{formatCurrency(amountSpent)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Remaining Budget</span>
                    <span className="font-bold text-lg text-green-600">{formatCurrency(remainingBudget)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`${teamColor} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{budgetPercentage.toFixed(1)}% budget used</p>
                  </div>

                  {/* View Players Button */}
                  <button className="w-full bg-gradient-to-r from-saffron-500 to-orange-500 text-white py-2 rounded-lg font-bold mt-4 hover:from-saffron-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2">
                    <FiEye size={16} />
                    View Players
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Team Players Modal */}
        {selectedTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-saffron-600 to-orange-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-saffron-600 font-bold text-xl">
                      {selectedTeam.logoURL ? (
                        <img src={selectedTeam.logoURL} alt={selectedTeam.teamName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        selectedTeam.teamName?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedTeam.teamName}</h2>
                      <p className="text-saffron-100">{selectedTeam.ownerName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTeam(null)}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                  >
                    <FiX size={24} />
                  </button>
                </div>
              </div>

              {/* Players List */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {teamPlayers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamPlayers.map((player) => (
                      <div key={player.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                            {player.photoURL ? (
                              <img src={player.photoURL} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">
                                👤
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-gray-800">
                              {player.name} {player.surname}
                            </h4>
                            <p className="text-sm text-gray-600">{player.role}</p>
                            {player.village && (
                              <p className="text-xs text-gray-500">📍 {player.village}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Purchase Price</span>
                            <span className="font-bold text-lg text-saffron-600">
                              {formatCurrency(player.soldPoints || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiUsers size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Players Bought Yet</h3>
                    <p className="text-gray-500">This team hasn't purchased any players yet.</p>
                  </div>
                )}

                {/* Team Summary */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600">{teamPlayers.length}</div>
                      <div className="text-sm text-gray-600">Total Players</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedTeam.points || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Remaining Budget</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(teamBudget - (selectedTeam.points || 0))}
                      </div>
                      <div className="text-sm text-gray-600">Amount Spent</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tournament Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiDollarSign size={24} />
            Tournament Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{teams.length}</div>
              <div className="text-sm text-gray-600">Total Teams</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {teams.reduce((sum, team) => sum + (team.playersBought || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Players Sold</div>
            </div>
            <div className="bg-saffron-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-saffron-600">
                {formatCurrency(teams.length * teamBudget)}
              </div>
              <div className="text-sm text-gray-600">Total Budget (All Teams)</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {formatCurrency(teams.reduce((sum, team) => sum + (teamBudget - (team.points || 0)), 0))}
              </div>
              <div className="text-sm text-gray-600">Total Amount Spent</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(teams.reduce((sum, team) => sum + (team.points || 0), 0))}
              </div>
              <div className="text-sm text-gray-600">Total Remaining Budget</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
