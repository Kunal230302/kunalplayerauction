'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { FiPlay, FiPause, FiRefreshCw } from 'react-icons/fi'

interface Player {
  id: string
  name: string
  runs: number
  balls: number
  fours: number
  sixes: number
  wickets: number
  overs: number
  runsConceded: number
  strikeRate: number
  catches: number
  isOut: boolean
  isStriker: boolean
}

interface Over {
  overNumber: number
  runs: number
  wickets: number
  balls: { runs: number; isWicket: boolean; wide: boolean; noBall: boolean }[]
}

interface Match {
  id: string
  team1: string
  team2: string
  team1Score: { runs: number; wickets: number; overs: number }
  team2Score: { runs: number; wickets: number; overs: number }
  status: 'live' | 'completed' | 'scheduled'
  currentInning: 'team1' | 'team2'
  striker: Player | null
  nonStriker: Player | null
  currentBowler: Player | null
  thisOver: Over
}

interface Series {
  id: string
  name: string
  matches: Match[]
  totalMatches: number
  completed: number
}

export default function CricketScoring() {
  const [match, setMatch] = useState<Match | null>(null)
  const [team1Players, setTeam1Players] = useState<Player[]>([
    { id: '1', name: 'TABREJ I SHAIKH', runs: 11, balls: 7, fours: 1, sixes: 0, wickets: 0, overs: 0, runsConceded: 0, strikeRate: 157.14, catches: 0, isOut: false, isStriker: true },
    { id: '2', name: 'Ahad', runs: 9, balls: 5, fours: 1, sixes: 0, wickets: 0, overs: 0, runsConceded: 0, strikeRate: 180.00, catches: 0, isOut: false, isStriker: false }
  ])
  const [team2Players, setTeam2Players] = useState<Player[]>([
    { id: '3', name: 'Akram', runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 1, overs: 0.1, runsConceded: 1, strikeRate: 0, catches: 0, isOut: false, isStriker: false }
  ])
  const [currentOver, setCurrentOver] = useState<Over>({ overNumber: 4, runs: 1, wickets: 0, balls: [{ runs: 1, isWicket: false, wide: false, noBall: false }] })
  const [ballCount, setBallCount] = useState(1)
  const [isLive, setIsLive] = useState(true)
  const [tickerText, setTickerText] = useState('KK1V 26/2 vs AX - TABREJ I SHAIKH 11* (7), Ahad 9 (5) - Akram 0/1')
  const [series, setSeries] = useState<Series[]>([])
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)
  const [showSetup, setShowSetup] = useState(true)
  const [youtubeMode, setYoutubeMode] = useState(false)
  const [projectedScore, setProjectedScore] = useState(66)

  const tickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sampleSeries: Series[] = [
      { id: '1', name: 'IPL 2024', matches: [], totalMatches: 10, completed: 3 }
    ]
    setSeries(sampleSeries)
    setSelectedSeries(sampleSeries[0])
  }, [])

  useEffect(() => {
    const messages = [
      '🏏 KK1V 26/2 (3.1) vs AX - Projected: 66',
      '⭐ TABREJ I SHAIKH 11* (7 balls) - SR 157.14',
      '🔥 Ahad 9 (5 balls) - SR 180.00',
      '⚡ Akram 0/1 in 0.1 overs',
      '🎯 Last ball: 1 run scored',
      '📊 Current Run Rate: 8.21'
    ]
    
    let index = 0
    const interval = setInterval(() => {
      setTickerText(messages[index % messages.length])
      index++
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const addBall = (runs: number, isWicket: boolean = false, wide: boolean = false, noBall: boolean = false) => {
    const actualRuns = wide || noBall ? runs + 1 : runs
    
    if (!wide && !noBall) {
      if (ballCount >= 6) {
        setCurrentOver({ overNumber: currentOver.overNumber + 1, runs: actualRuns, wickets: isWicket ? 1 : 0, balls: [{ runs, isWicket, wide, noBall }] })
        setBallCount(1)
      } else {
        setCurrentOver(prev => ({ ...prev, runs: prev.runs + actualRuns, wickets: prev.wickets + (isWicket ? 1 : 0), balls: [...prev.balls, { runs, isWicket, wide, noBall }] }))
        setBallCount(prev => prev + 1)
      }
    } else {
      setCurrentOver(prev => ({ ...prev, runs: prev.runs + actualRuns }))
    }

    if (match && !isWicket) {
      setMatch(prev => prev ? {
        ...prev,
        team1Score: { ...prev.team1Score, runs: prev.team1Score.runs + actualRuns }
      } : null)
    }
  }

  const startMatch = () => {
    setShowSetup(false)
    setIsLive(true)
    
    const newMatch: Match = {
      id: Date.now().toString(),
      team1: 'KK1V',
      team2: 'AX',
      team1Score: { runs: 26, wickets: 2, overs: 3.1 },
      team2Score: { runs: 0, wickets: 0, overs: 0 },
      status: 'live',
      currentInning: 'team1',
      striker: team1Players[0],
      nonStriker: team1Players[1],
      currentBowler: team2Players[0],
      thisOver: currentOver
    }
    setMatch(newMatch)
  }

  const toggleLive = () => {
    setIsLive(!isLive)
  }

  const renderBallDots = () => {
    const dots = []
    for (let i = 0; i < 6; i++) {
      const ball = currentOver.balls[i]
      let color = 'bg-gray-400'
      let content = ''
      
      if (ball) {
        if (ball.isWicket) { color = 'bg-red-500'; content = 'W' }
        else if (ball.wide) { color = 'bg-white border-2 border-gray-600'; content = 'Wd' }
        else if (ball.noBall) { color = 'bg-yellow-400'; content = 'NB' }
        else if (ball.runs === 4) { color = 'bg-green-500'; content = '4' }
        else if (ball.runs === 6) { color = 'bg-purple-500'; content = '6' }
        else if (ball.runs > 0) { color = 'bg-blue-500'; content = ball.runs.toString() }
        else { color = 'bg-gray-600'; content = '•' }
      }
      
      dots.push(
        <div key={i} className={`w-5 h-5 rounded-full ${color} flex items-center justify-center text-xs font-bold text-white`}>
          {content}
        </div>
      )
    }
    return dots
  }

  if (showSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">🏏 Cricket Scoring System</h1>
            <p className="text-emerald-300">Professional Broadcast-Style Live Cricket Scoring</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">🏆 Select Series</h2>
              <div className="space-y-3">
                {series.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSeries(s)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedSeries?.id === s.id 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <div className="font-bold">{s.name}</div>
                    <div className="text-sm text-emerald-200">{s.completed}/{s.totalMatches} matches</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">⚡ Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setYoutubeMode(!youtubeMode)}
                  className={`w-full p-4 rounded-lg font-bold transition-all ${
                    youtubeMode 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {youtubeMode ? '📺 YouTube Ticker Mode' : '📊 Standard Scoring Mode'}
                </button>
                <button
                  onClick={startMatch}
                  className="w-full bg-emerald-500 text-white p-4 rounded-lg font-bold hover:bg-emerald-600 transition-all"
                >
                  🏏 Start Live Match
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900">
      {/* Broadcast-Style Score Ticker */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white py-3 px-4 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          {/* Main Score Board */}
          <div className="flex items-center justify-between">
            {/* Team 1 - Batting Team */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg border-2 border-white/30">
                <span className="text-xs font-bold">KK1V</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{match?.team1 || 'KK1V'}</div>
                <div className="text-emerald-400 text-sm">Batting</div>
              </div>
            </div>

            {/* Score Center */}
            <div className="text-center">
              <div className="text-4xl font-black tracking-wider">
                {match?.team1Score.runs || 26}/{match?.team1Score.wickets || 2}
              </div>
              <div className="text-emerald-400 text-lg font-semibold">
                ({Math.floor(match?.team1Score.overs || 3)}.{Math.floor(((match?.team1Score.overs || 3.1) % 1) * 10)})
              </div>
              <div className="text-slate-400 text-xs mt-1">
                PROJECTED SCORE: {projectedScore}
              </div>
            </div>

            {/* Team 2 - Bowling Team */}
            <div className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold">{match?.team2 || 'AX'}</div>
                <div className="text-orange-400 text-sm">Bowling</div>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center shadow-lg border-2 border-white/30">
                <span className="text-xs font-bold">AX</span>
              </div>
            </div>
          </div>

          {/* Batsmen & Bowler Info */}
          <div className="mt-4 grid grid-cols-3 gap-4 bg-black/30 rounded-lg p-3">
            {/* Striker */}
            <div className="text-left">
              <div className="text-emerald-400 text-xs font-bold mb-1">STRIKER</div>
              <div className="text-lg font-bold">{match?.striker?.name || 'TABREJ I SHAIKH'} *</div>
              <div className="text-emerald-300 text-sm">
                {match?.striker?.runs || 11} ({match?.striker?.balls || 7})
              </div>
            </div>

            {/* Non-Striker */}
            <div className="text-center border-x border-white/20">
              <div className="text-blue-400 text-xs font-bold mb-1">NON-STRIKER</div>
              <div className="text-lg font-bold">{match?.nonStriker?.name || 'Ahad'}</div>
              <div className="text-blue-300 text-sm">
                {match?.nonStriker?.runs || 9} ({match?.nonStriker?.balls || 5})
              </div>
            </div>

            {/* Bowler */}
            <div className="text-right">
              <div className="text-orange-400 text-xs font-bold mb-1">BOWLER</div>
              <div className="text-lg font-bold">{match?.currentBowler?.name || 'Akram'}</div>
              <div className="text-orange-300 text-sm">
                {match?.currentBowler?.wickets || 0}/{match?.currentBowler?.runsConceded || 1} ({Math.floor(match?.currentBowler?.overs || 0)}.{Math.floor(((match?.currentBowler?.overs || 0.1) % 1) * 10)})
              </div>
            </div>
          </div>

          {/* This Over - Ball by Ball */}
          <div className="mt-3 flex items-center justify-center gap-3 bg-black/20 rounded-full py-2 px-4">
            <span className="text-slate-400 text-sm font-bold">THIS OVER:</span>
            <div className="flex gap-2">
              {renderBallDots()}
            </div>
            <span className="text-emerald-400 text-sm font-bold ml-2">
              {currentOver.runs} runs
            </span>
          </div>
        </div>
      </div>

      {/* Scrolling Ticker */}
      <div className="bg-black text-yellow-400 py-2 overflow-hidden border-y border-yellow-500/30">
        <div className="whitespace-nowrap animate-marquee text-sm font-bold">
          {tickerText} • {tickerText} • {tickerText} •
        </div>
      </div>

      {/* Main Scoring Interface */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Control Panel */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">⚡ Scoring Controls</h2>
              <p className="text-emerald-300 text-sm">Click to add runs or wickets</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={toggleLive}
                className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  isLive 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {isLive ? <FiPause size={20} /> : <FiPlay size={20} />}
                {isLive ? 'Pause' : 'Resume'}
              </button>
              <button className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 transition-all flex items-center gap-2">
                <FiRefreshCw size={20} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Run Buttons Grid */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-6">
          {[0, 1, 2, 3, 4, 6].map(runs => (
            <button
              key={runs}
              onClick={() => addBall(runs)}
              className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-4 rounded-xl font-bold text-2xl hover:from-blue-600 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg"
            >
              {runs === 0 ? '•' : runs}
            </button>
          ))}
          
          <button
            onClick={() => addBall(0, true)}
            className="bg-gradient-to-br from-red-500 to-red-700 text-white p-4 rounded-xl font-bold text-lg hover:from-red-600 hover:to-red-800 transition-all transform hover:scale-105 shadow-lg"
          >
            W
          </button>
          
          <button
            onClick={() => addBall(0, false, true)}
            className="bg-gradient-to-br from-white to-gray-200 text-gray-800 p-4 rounded-xl font-bold text-sm hover:from-gray-100 hover:to-gray-300 transition-all transform hover:scale-105 shadow-lg border-2 border-gray-400"
          >
            WD
          </button>
          
          <button
            onClick={() => addBall(0, false, false, true)}
            className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-900 p-4 rounded-xl font-bold text-sm hover:from-yellow-500 hover:to-yellow-700 transition-all transform hover:scale-105 shadow-lg"
          >
            NB
          </button>
        </div>

        {/* Statistics Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-emerald-500/30">
            <h3 className="text-xl font-bold text-emerald-400 mb-4">🏏 Best Batsman</h3>
            <div className="text-white">
              <div className="text-2xl font-bold">{match?.striker?.name || 'TABREJ I SHAIKH'}</div>
              <div className="text-emerald-300">{match?.striker?.runs || 11} runs ({match?.striker?.balls || 7} balls)</div>
              <div className="text-sm text-emerald-400 mt-2">SR: {match?.striker?.strikeRate?.toFixed(2) || '157.14'}</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-700/20 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-blue-500/30">
            <h3 className="text-xl font-bold text-blue-400 mb-4">⚡ Best Bowler</h3>
            <div className="text-white">
              <div className="text-2xl font-bold">{match?.currentBowler?.name || 'Akram'}</div>
              <div className="text-blue-300">{match?.currentBowler?.wickets || 0}/{match?.currentBowler?.runsConceded || 1}</div>
              <div className="text-sm text-blue-400 mt-2">Overs: {match?.currentBowler?.overs || 0.1}</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-700/20 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-purple-400 mb-4">📊 Match Stats</h3>
            <div className="text-white space-y-2">
              <div className="flex justify-between">
                <span>Current RR:</span>
                <span className="font-bold text-emerald-400">8.21</span>
              </div>
              <div className="flex justify-between">
                <span>Req RR:</span>
                <span className="font-bold text-orange-400">-</span>
              </div>
              <div className="flex justify-between">
                <span>Extras:</span>
                <span className="font-bold text-yellow-400">2</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          padding-left: 100%;
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  )
}
