'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { FiPlay, FiPause, FiRotateCcw, FiUserPlus } from 'react-icons/fi'
import { saveCricketMatch, subscribeCricketMatch, CricketMatch } from '@/lib/db'

// Comprehensive Cricket Scoring Controller
// Features: Batting, Bowling, Extras, Wickets, Playing XI, Partnerships, Match Management

interface ControllerPlayer {
  id: string
  name: string
  runs: number
  balls: number
  fours: number
  sixes: number
  wickets: number
  overs: number
  maidens: number
  runsConceded: number
  strikeRate: number
  economy: number
  catches: number
  stumpings: number
  runOuts: number
  isOut: boolean
  isStriker: boolean
  isCaptain: boolean
  isViceCaptain: boolean
  isWicketkeeper: boolean
  battingPosition: number
  outType: string
  outBowler: string
  outFielder: string
}

interface Partnership {
  player1: string
  player2: string
  runs: number
  balls: number
}

interface Over {
  overNumber: number
  bowler: string
  runs: number
  wickets: number
  maidens: number
  balls: { runs: number; isWicket: boolean; wide: boolean; noBall: boolean; bye: boolean; legBye: boolean; wicketType: string }[]
}

// Local match state interface (extends CricketMatch with controller-specific fields)
interface ControllerMatch extends CricketMatch {
  team1Players: ControllerPlayer[]
  team2Players: ControllerPlayer[]
  currentOver: Over
  target: number
  result: string
}

const WICKET_TYPES = [
  { code: 'BOWLED', label: 'Bowled', icon: '🎯' },
  { code: 'CAUGHT', label: 'Caught', icon: '🤲' },
  { code: 'LBW', label: 'LBW', icon: '🦵' },
  { code: 'RUN_OUT', label: 'Run Out', icon: '🏃' },
  { code: 'STUMPED', label: 'Stumped', icon: '🧤' },
  { code: 'HIT_WICKET', label: 'Hit Wicket', icon: '💥' }
]

export default function CricketController() {
  const [match, setMatch] = useState<ControllerMatch | null>(null)
  const [showSetup, setShowSetup] = useState(true)
  const [showWicketModal, setShowWicketModal] = useState(false)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [selectedWicketType, setSelectedWicketType] = useState('')
  const [outBowler, setOutBowler] = useState('')
  const [outFielder, setOutFielder] = useState('')
  const [ballCount, setBallCount] = useState(0)
  const [isLive, setIsLive] = useState(false)
  const [currentBowlerName, setCurrentBowlerName] = useState('')

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeCricketMatch('default', (data) => {
      if (data) {
        // Merge Firebase data with controller-specific fields
        setMatch({
          ...data,
          team1Players: (data as any).team1Players || match?.team1Players || [],
          team2Players: (data as any).team2Players || match?.team2Players || [],
          currentOver: match?.currentOver || { overNumber: 1, bowler: '', runs: 0, wickets: 0, maidens: 0, balls: [] },
          target: (data as any).target || 0,
          result: (data as any).result || ''
        } as ControllerMatch)
      }
    })
    return () => unsubscribe()
  }, [])

  // Save to Firebase when match changes
  useEffect(() => {
    if (match) {
      saveCricketMatch(match, 'default')
    }
  }, [match])

  // Initialize match
  const startMatch = () => {
    const newMatch: ControllerMatch = {
      id: Date.now().toString(),
      team1: 'Team A',
      team2: 'Team B',
      team1Players: [],
      team2Players: [],
      team1Score: { runs: 0, wickets: 0, overs: 0 },
      team2Score: { runs: 0, wickets: 0, overs: 0 },
      currentInning: 'team1',
      striker: null,
      nonStriker: null,
      currentBowler: null,
      thisOver: { runs: 0, wickets: 0, balls: [] },
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalties: 0, total: 0 },
      partnerships: [],
      projectedScore: 0,
      requiredRate: '-',
      status: 'live',
      lastUpdated: Date.now(),
      currentOver: { overNumber: 1, bowler: '', runs: 0, wickets: 0, maidens: 0, balls: [] },
      target: 0,
      result: ''
    }
    setMatch(newMatch)
    setShowSetup(false)
    setIsLive(true)
  }

  // Add ball with runs
  const addBall = (runs: number, extraType: string = '', wicket: boolean = false) => {
    if (!match) return

    const ball = {
      runs,
      isWicket: wicket,
      wide: extraType === 'WD',
      noBall: extraType === 'NB',
      bye: extraType === 'B',
      legBye: extraType === 'LB',
      wicketType: wicket ? selectedWicketType : ''
    }

    let actualRuns = runs
    if (extraType === 'WD' || extraType === 'NB') actualRuns += 1

    // Update match state
    const updatedMatch = { ...match }
    
    // Add to current over
    if (!extraType || extraType === 'B' || extraType === 'LB') {
      if (ballCount < 6) {
        updatedMatch.currentOver.balls.push(ball)
        setBallCount(prev => prev + 1)
      } else {
        // New over
        updatedMatch.currentOver = { overNumber: updatedMatch.currentOver.overNumber + 1, bowler: '', runs: actualRuns, wickets: wicket ? 1 : 0, maidens: 0, balls: [ball] }
        setBallCount(1)
      }
    }

    // Update bowler stats if valid ball (not wide/no-ball for over count, but runs count)
    if (updatedMatch.currentBowler) {
      updatedMatch.currentBowler.runs += actualRuns
      if (wicket) {
        updatedMatch.currentBowler.wickets += 1
      }
      // Calculate overs: only legal balls count toward over
      if (!extraType || (extraType !== 'WD' && extraType !== 'NB')) {
        const currentOvers = updatedMatch.currentBowler.overs || 0
        const ballsInCurrentOver = Math.round((currentOvers % 1) * 10)
        if (ballsInCurrentOver >= 5) {
          // Over complete
          updatedMatch.currentBowler.overs = Math.floor(currentOvers) + 1
        } else {
          updatedMatch.currentBowler.overs = Math.floor(currentOvers) + (ballsInCurrentOver + 1) / 10
        }
      }
      // Calculate economy
      const totalOvers = updatedMatch.currentBowler.overs || 0.1
      updatedMatch.currentBowler.economy = updatedMatch.currentBowler.runs / (totalOvers < 0.1 ? 0.1 : totalOvers)
    }
    if (match.currentInning === 'team1') {
      updatedMatch.team1Score.runs += actualRuns
      if (!extraType || extraType === 'B' || extraType === 'LB') {
        if (ballCount >= 6) {
          updatedMatch.team1Score.overs = Math.floor(updatedMatch.team1Score.overs) + 1
        }
      }
    }

    // Update extras
    if (extraType) {
      switch(extraType) {
        case 'WD': updatedMatch.extras.wides++; break
        case 'NB': updatedMatch.extras.noBalls++; break
        case 'B': updatedMatch.extras.byes++; break
        case 'LB': updatedMatch.extras.legByes++; break
        case 'P': updatedMatch.extras.penalties += 5; break
      }
      updatedMatch.extras.total = updatedMatch.extras.wides + updatedMatch.extras.noBalls + updatedMatch.extras.byes + updatedMatch.extras.legByes + updatedMatch.extras.penalties
    }

    setMatch(updatedMatch)
  }

  // Handle wicket
  const handleWicket = () => {
    if (!match || !selectedWicketType) return

    addBall(0, '', true)
    
    const updatedMatch = { ...match }
    if (match.currentInning === 'team1') {
      updatedMatch.team1Score.wickets++
    }

    // Update striker as out - store out info in separate field since striker type doesn't have these fields
    if (updatedMatch.striker && selectedWicketType) {
      // Create out info object to track dismissal details
      const outInfo = {
        isOut: true,
        outType: selectedWicketType,
        outBowler: outBowler,
        outFielder: selectedWicketType === 'CAUGHT' ? outFielder : undefined
      }
      // Store in match state for reference
      updatedMatch.target = updatedMatch.target // trigger update
    }

    setMatch(updatedMatch)
    setShowWicketModal(false)
    setSelectedWicketType('')
    setOutBowler('')
    setOutFielder('')
  }

  // Add player to team
  const addPlayer = (name: string, role: 'captain' | 'vice-captain' | 'wicketkeeper' | 'player' = 'player') => {
    if (!match) return

    const newPlayer: ControllerPlayer = {
      id: Date.now().toString(),
      name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      wickets: 0,
      overs: 0,
      maidens: 0,
      runsConceded: 0,
      strikeRate: 0,
      economy: 0,
      catches: 0,
      stumpings: 0,
      runOuts: 0,
      isOut: false,
      isStriker: false,
      isCaptain: role === 'captain',
      isViceCaptain: role === 'vice-captain',
      isWicketkeeper: role === 'wicketkeeper',
      battingPosition: 0,
      outType: '',
      outBowler: '',
      outFielder: ''
    }

    const updatedMatch = { ...match }
    if (match.currentInning === 'team1') {
      updatedMatch.team1Players.push(newPlayer)
      if (!updatedMatch.striker) updatedMatch.striker = newPlayer
      else if (!updatedMatch.nonStriker) updatedMatch.nonStriker = newPlayer
    } else {
      updatedMatch.team2Players.push(newPlayer)
    }

    setMatch(updatedMatch)
    setShowPlayerModal(false)
  }

  if (showSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">🏏 Cricket Controller</h1>
            <p className="text-emerald-300">Professional Cricket Scoring Management System</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-white/20 text-center">
            <h2 className="text-2xl font-bold text-white mb-6">⚡ Start New Match</h2>
            <button
              onClick={startMatch}
              className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-xl hover:bg-emerald-600 transition-all transform hover:scale-105 shadow-lg"
            >
              🏏 Start Match
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🏏 Cricket Controller</h1>
            <p className="text-emerald-200 text-sm">
              {match?.team1} vs {match?.team2} • {isLive ? '🔴 LIVE' : '⏸️ PAUSED'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                isLive ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              {isLive ? '⏸️ Pause' : '▶️ Resume'}
            </button>
            <button
              onClick={() => setShowPlayerModal(true)}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-bold transition-all"
            >
              <FiUserPlus className="inline mr-2" /> Add Player
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Score Display */}
        <div className="space-y-4">
          {/* Current Score */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
            <h2 className="text-xl font-bold text-blue-400 mb-4">📊 Current Score</h2>
            <div className="text-center">
              <div className="text-5xl font-black">
                {match?.team1Score.runs || 0}<span className="text-red-400">/{match?.team1Score.wickets || 0}</span>
              </div>
              <div className="text-emerald-400 text-lg">
                {Math.floor(match?.team1Score.overs || 0)}.{Math.floor(((match?.team1Score.overs || 0) % 1) * 10)} Overs
              </div>
            </div>
          </div>

          {/* Current Batsmen */}
          <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/30">
            <h2 className="text-xl font-bold text-emerald-400 mb-4">🏏 Current Batsmen</h2>
            <div className="space-y-3">
              <div className="bg-black/30 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold">{match?.striker?.name || 'Striker'} *</span>
                  <span className="text-emerald-400">{match?.striker?.runs || 0} ({match?.striker?.balls || 0})</span>
                </div>
                <div className="text-xs text-emerald-300 mt-1">
                  4s: {match?.striker?.fours || 0} | 6s: {match?.striker?.sixes || 0} | SR: {match?.striker?.strikeRate?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold">{match?.nonStriker?.name || 'Non-Striker'}</span>
                  <span className="text-blue-400">{match?.nonStriker?.runs || 0} ({match?.nonStriker?.balls || 0})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Extras */}
          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">✳️ Extras</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between"><span>Wide:</span><span className="font-bold">{match?.extras.wides || 0}</span></div>
              <div className="flex justify-between"><span>No Ball:</span><span className="font-bold">{match?.extras.noBalls || 0}</span></div>
              <div className="flex justify-between"><span>Bye:</span><span className="font-bold">{match?.extras.byes || 0}</span></div>
              <div className="flex justify-between"><span>Leg Bye:</span><span className="font-bold">{match?.extras.legByes || 0}</span></div>
              <div className="flex justify-between col-span-2 border-t border-yellow-500/30 pt-2 mt-2">
                <span className="font-bold">Total Extras:</span>
                <span className="font-bold text-yellow-400">{match?.extras.total || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Scoring Controls */}
        <div className="space-y-4">
          {/* Runs Controls */}
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
            <h2 className="text-xl font-bold text-purple-400 mb-4">🔢 Runs</h2>
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2, 3, 4, 6].map(runs => (
                <button
                  key={runs}
                  onClick={() => addBall(runs)}
                  className="bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white p-4 rounded-xl font-bold text-2xl transition-all transform hover:scale-105 shadow-lg"
                >
                  {runs === 0 ? '•' : runs}
                </button>
              ))}
            </div>
          </div>

          {/* Extras Controls */}
          <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 backdrop-blur-sm rounded-xl p-6 border border-orange-500/30">
            <h2 className="text-xl font-bold text-orange-400 mb-4">✳️ Extras</h2>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => addBall(0, 'WD')} className="bg-white text-gray-800 p-3 rounded-xl font-bold hover:bg-gray-100 transition-all border-2 border-gray-400">
                WD
              </button>
              <button onClick={() => addBall(0, 'NB')} className="bg-yellow-400 text-gray-900 p-3 rounded-xl font-bold hover:bg-yellow-500 transition-all">
                NB
              </button>
              <button onClick={() => addBall(1, 'B')} className="bg-gray-600 p-3 rounded-xl font-bold hover:bg-gray-700 transition-all">
                B+1
              </button>
              <button onClick={() => addBall(1, 'LB')} className="bg-gray-600 p-3 rounded-xl font-bold hover:bg-gray-700 transition-all">
                LB+1
              </button>
              <button onClick={() => addBall(5, 'P')} className="bg-red-500 p-3 rounded-xl font-bold hover:bg-red-600 transition-all col-span-2">
                Penalty +5
              </button>
            </div>
          </div>

          {/* Wicket Button */}
          <button
            onClick={() => setShowWicketModal(true)}
            className="w-full bg-gradient-to-br from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white p-6 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
          >
            🎯 WICKET
          </button>
        </div>

        {/* Right Panel - Stats & Info */}
        <div className="space-y-4">
          {/* Current Bowler */}
          <div className="bg-gradient-to-br from-pink-600/20 to-pink-800/20 backdrop-blur-sm rounded-xl p-6 border border-pink-500/30">
            <h2 className="text-xl font-bold text-pink-400 mb-4">🎳 Current Bowler</h2>
            
            {/* Bowler Name Input */}
            <div className="mb-4">
              <input
                type="text"
                value={currentBowlerName}
                onChange={(e) => {
                  setCurrentBowlerName(e.target.value)
                  if (match) {
                    const updatedMatch = { ...match }
                    updatedMatch.currentBowler = { 
                      name: e.target.value, 
                      wickets: updatedMatch.currentBowler?.wickets || 0, 
                      runs: updatedMatch.currentBowler?.runs || 0, 
                      overs: updatedMatch.currentBowler?.overs || 0, 
                      economy: updatedMatch.currentBowler?.economy || 0 
                    }
                    setMatch(updatedMatch)
                  }
                }}
                placeholder="Enter bowler name"
                className="w-full bg-black/30 border border-pink-500/50 rounded-lg p-2 text-white text-center font-bold"
              />
            </div>

            <div className="text-center">
              <div className="text-pink-300 text-lg font-black text-3xl">
                {match?.currentBowler?.wickets || 0}/{match?.currentBowler?.runs || 0} 
              </div>
              <div className="text-white/80 text-lg mt-1">
                Overs: <span className="font-bold text-pink-300">{Math.floor(match?.currentBowler?.overs || 0)}.{Math.floor(((match?.currentBowler?.overs || 0) % 1) * 10)}</span>
              </div>
              <div className="text-sm text-pink-300 mt-2">
                Economy: <span className="font-bold">{match?.currentBowler?.economy?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Partnership */}
          <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-800/20 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/30">
            <h2 className="text-xl font-bold text-cyan-400 mb-4">🤝 Partnership</h2>
            <div className="text-center">
              <div className="text-3xl font-black text-cyan-300">
                {match?.partnerships && match.partnerships.length > 0 ? match.partnerships[match.partnerships.length - 1].runs : 0}
              </div>
              <div className="text-cyan-400">
                {match?.partnerships && match.partnerships.length > 0 ? match.partnerships[match.partnerships.length - 1].balls : 0} balls
              </div>
            </div>
          </div>

          {/* This Over */}
          <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-800/20 backdrop-blur-sm rounded-xl p-6 border border-indigo-500/30">
            <h2 className="text-xl font-bold text-indigo-400 mb-4">🎯 This Over</h2>
            <div className="flex justify-center gap-2">
              {match?.currentOver.balls.map((ball, i) => (
                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  ball.isWicket ? 'bg-red-500' : 
                  ball.wide ? 'bg-white text-gray-800' :
                  ball.noBall ? 'bg-yellow-400 text-gray-900' :
                  ball.runs === 4 ? 'bg-green-500' :
                  ball.runs === 6 ? 'bg-purple-500' :
                  ball.runs > 0 ? 'bg-blue-500' : 'bg-gray-600'
                }`}>
                  {ball.isWicket ? 'W' : ball.wide ? 'Wd' : ball.noBall ? 'NB' : ball.runs || '•'}
                </div>
              ))}
            </div>
            <div className="text-center mt-3 text-indigo-300">
              {match?.currentOver.runs || 0} runs • {match?.currentOver.wickets || 0} wickets
            </div>
          </div>
        </div>
      </div>

      {/* Wicket Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-red-500/50">
            <h2 className="text-3xl font-bold text-red-400 mb-6 text-center">🎯 WICKET!</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Out Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {WICKET_TYPES.map(type => (
                    <button
                      key={type.code}
                      onClick={() => setSelectedWicketType(type.code)}
                      className={`p-3 rounded-xl font-bold transition-all ${
                        selectedWicketType === type.code 
                          ? 'bg-red-500 text-white' 
                          : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                      }`}
                    >
                      {type.icon} {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Bowler</label>
                <input
                  type="text"
                  value={outBowler}
                  onChange={(e) => setOutBowler(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white"
                  placeholder="Bowler name"
                />
              </div>

              {selectedWicketType === 'CAUGHT' && (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Fielder (Caught By)</label>
                  <input
                    type="text"
                    value={outFielder}
                    onChange={(e) => setOutFielder(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white"
                    placeholder="Fielder name"
                  />
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowWicketModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWicket}
                  disabled={!selectedWicketType || !outBowler}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white p-4 rounded-xl font-bold transition-all"
                >
                  Confirm Wicket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Modal */}
      {showPlayerModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-blue-500/50">
            <h2 className="text-2xl font-bold text-blue-400 mb-6">👤 Add Player</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Player Name</label>
                <input
                  type="text"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white"
                  placeholder="Enter player name"
                  id="playerName"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => addPlayer((document.getElementById('playerName') as HTMLInputElement).value, 'captain')} className="bg-yellow-500/20 border border-yellow-500/50 p-3 rounded-xl font-bold text-yellow-400 hover:bg-yellow-500/30 transition-all">
                    © Captain
                  </button>
                  <button onClick={() => addPlayer((document.getElementById('playerName') as HTMLInputElement).value, 'vice-captain')} className="bg-blue-500/20 border border-blue-500/50 p-3 rounded-xl font-bold text-blue-400 hover:bg-blue-500/30 transition-all">
                    Ⓥ Vice Captain
                  </button>
                  <button onClick={() => addPlayer((document.getElementById('playerName') as HTMLInputElement).value, 'wicketkeeper')} className="bg-green-500/20 border border-green-500/50 p-3 rounded-xl font-bold text-green-400 hover:bg-green-500/30 transition-all">
                    🧤 Wicketkeeper
                  </button>
                  <button onClick={() => addPlayer((document.getElementById('playerName') as HTMLInputElement).value, 'player')} className="bg-gray-600 p-3 rounded-xl font-bold hover:bg-gray-700 transition-all">
                    👤 Player
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowPlayerModal(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-xl font-bold transition-all mt-4"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
