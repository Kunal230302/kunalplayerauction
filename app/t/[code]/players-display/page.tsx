'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getTournamentByCode, getPlayers, Tournament, Player } from '@/lib/db'
import Link from 'next/link'
import { FiArrowLeft, FiChevronLeft, FiChevronRight, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'

// Default cricket player avatar
const DefaultAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    {/* Cricket Helmet */}
    <rect x="20" y="25" width="60" height="45" rx="20" fill="#374151" />
    <rect x="25" y="30" width="50" height="35" rx="15" fill="#4B5563" />
    {/* Face opening */}
    <rect x="30" y="40" width="40" height="25" rx="10" fill="#F3F4F6" />
    {/* Grill lines */}
    <line x1="30" y1="50" x2="70" y2="50" stroke="#6B7280" strokeWidth="2" />
    <line x1="30" y1="55" x2="70" y2="55" stroke="#6B7280" strokeWidth="2" />
    <line x1="40" y1="40" x2="40" y2="65" stroke="#6B7280" strokeWidth="2" />
    <line x1="50" y1="40" x2="50" y2="65" stroke="#6B7280" strokeWidth="2" />
    <line x1="60" y1="40" x2="60" y2="65" stroke="#6B7280" strokeWidth="2" />
    {/* Helmet top */}
    <path d="M20 35 Q50 20 80 35" fill="none" stroke="#374151" strokeWidth="4" />
    {/* Collar */}
    <rect x="25" y="65" width="50" height="15" rx="5" fill="#DC2626" />
    <rect x="30" y="70" width="40" height="10" rx="3" fill="#EF4444" />
  </svg>
)

export default function PlayersDisplayPage() {
  const params = useParams()
  const code = (params.code as string)?.toUpperCase()
  
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const playersPerPage = 10

  useEffect(() => {
    const load = async () => {
      if (!code) return
      try {
        const t = await getTournamentByCode(code)
        if (!t) {
          setNotFound(true)
          setLoading(false)
          return
        }
        setTournament(t)
        const p = await getPlayers(t.id)
        setPlayers(p)
      } catch (error) {
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [code])

  // Pagination logic
  const totalPages = Math.ceil(players.length / playersPerPage)
  const startIndex = (currentPage - 1) * playersPerPage
  const displayedPlayers = players.slice(startIndex, startIndex + playersPerPage)

  // Generate player number (with leading zeros for single digit)
  const getPlayerNumber = (index: number) => {
    const number = startIndex + index + 1
    return number.toString().padStart(2, '0')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-5xl animate-bounce">🏏</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
          <Link href="/" className="text-blue-500 hover:underline">← Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/t/${code}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <FiArrowLeft /> Back to Tournament
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{tournament?.name} - Players</h1>
          <p className="text-gray-600 mt-2">Total Players: {players.length}</p>
        </div>

        {/* Players Grid - 10 players per row with prominent photos */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 mb-8">
          {displayedPlayers.map((player, index) => (
            <div
              key={player.id}
              className="bg-black rounded-lg shadow-sm border border-gray-700 p-2 flex flex-col items-center text-center hover:shadow-md transition-shadow"
            >
              {/* Player Info */}
              <div className="w-full">
                <div className="text-xs text-gray-400 font-medium mb-0.5">
                  No: {getPlayerNumber(index)}
                </div>
                <h3 className="text-xs font-bold text-white truncate leading-tight">
                  {player.name}
                </h3>
                <h4 className="text-xs font-bold text-white truncate leading-tight">
                  {player.surname}
                </h4>
                <div className="text-[10px] text-gray-300 mt-0.5">
                  Age: {player.age || 'N/A'} YR
                </div>
                {player.role && (
                  <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                    {player.role}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {displayedPlayers.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👤</div>
            <p className="text-gray-500">No players registered yet</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <FiChevronLeft /> Previous
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Next <FiChevronRight />
            </button>
          </div>
        )}

        {/* Page Info */}
        <div className="text-center text-gray-500 text-sm mt-4">
          Page {currentPage} of {totalPages} • Showing {displayedPlayers.length} of {players.length} players
        </div>
      </div>
    </div>
  )
}
