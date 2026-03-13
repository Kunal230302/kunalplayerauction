'use client'
import { useEffect, useState, Suspense } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { FiPrinter, FiArrowLeft } from 'react-icons/fi'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Team { id: string; teamName: string; ownerName: string }

function SheetsContent() {
  const searchParams = useSearchParams()
  const tournamentId = searchParams.get('tournamentId') || '653'
  
  const [teams, setTeams] = useState<Team[]>([])
  const [tournamentName, setTournamentName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        if (tournamentId && tournamentId !== 'global') {
          const tDoc = await getDoc(doc(db, 'tournaments', tournamentId))
          if (tDoc.exists()) {
            setTournamentName(tDoc.data().name)
          }
          const snap = await getDocs(collection(db, 'tournaments', tournamentId, 'teams'))
          setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Team)))
        } else {
          const snap = await getDocs(collection(db, 'teams'))
          setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Team)))
        }
      } catch (error) {
        console.error('Error loading teams:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tournamentId])

  if (loading) return <div className="p-10 text-center text-xl">Loading team sheets...</div>
  if (teams.length === 0) return <div className="p-10 text-center text-xl">No teams found for this tournament.</div>

  return (
    <div className="min-h-screen bg-[#d3c0ad] print:bg-[#d3c0ad] text-black font-sans relative pb-10" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>
      <div className="print:hidden fixed top-4 right-4 flex gap-3 z-50">
        <Link href="/admin/teams/dashboard" className="bg-white text-black px-4 py-2 rounded-lg shadow font-medium flex items-center gap-2 hover:bg-gray-50">
          <FiArrowLeft /> Back
        </Link>
        <button onClick={() => window.print()} className="bg-[#4a3a31] text-white px-4 py-2 rounded-lg shadow font-medium flex items-center gap-2 hover:bg-[#382b24]">
          <FiPrinter /> Print Sheets
        </button>
      </div>

      <div className="flex flex-col items-center">
        {teams.map((team, index) => (
          <div key={team.id} className="team-sheet relative overflow-hidden bg-[#d3c0ad] w-[210mm] h-[297mm] shadow-2xl my-8 print:my-0 print:shadow-none print:break-after-page flex justify-center items-center">
            
            {/* Background design elements */}
            <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-[#bca188] rounded-full mix-blend-multiply filter blur-sm opacity-50 z-0 border-[3px] border-black border-dashed"></div>
            <div className="absolute bottom-[-100px] right-[-50px] w-96 h-96 bg-[#e4d5c7] rounded-full mix-blend-multiply filter blur-sm z-0"></div>
            
            {/* SVG curves for the background */}
            <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" viewBox="0 0 800 1100" preserveAspectRatio="none">
              <path d="M 0 100 Q 200 50 400 300 T 800 200" fill="none" stroke="#222" strokeWidth="2" strokeDasharray="10 5" opacity="0.3" />
              <path d="M 0 800 Q 300 900 600 700 T 800 900" fill="none" stroke="#222" strokeWidth="2" opacity="0.5" />
              <path d="M -50 400 Q 150 450 100 600" fill="none" stroke="#222" strokeWidth="3" opacity="0.6" />
              <path d="M 700 -50 Q 600 150 750 250" fill="none" stroke="#222" strokeWidth="2" opacity="0.6" />
              <path d="M -20 0 Q 300 250 820 -20" fill="none" stroke="#222" strokeWidth="2" opacity="0.6" />
              <path d="M -20 1120 Q 400 900 820 1120" fill="none" stroke="#222" strokeWidth="2" opacity="0.6" />
              <path d="M 820 400 Q 700 450 750 600" fill="none" stroke="#222" strokeWidth="3" opacity="0.6" />
            </svg>

            {/* Inner White Box */}
            <div className="bg-white w-[88%] h-[92%] z-10 p-10 flex flex-col items-center">
              <h1 className="text-[#3c312a] font-[900] text-center leading-[1.1] mb-8 tracking-wide font-sans mt-4 uppercase flex flex-col gap-2">
                {tournamentName && <span className="text-[32px]">{tournamentName}</span>}
                <span className="text-[48px]">{team.teamName}</span>
                <span className="text-[48px]">PLAYER LIST</span>
              </h1>

              <div className="w-full max-w-[90%] border border-gray-400 mt-2">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#dcc0a8]">
                      <th className="w-20 border-r border-[#999] border-b text-center py-3 font-extrabold text-[#3c312a] text-xl">#</th>
                      <th className="border-b border-[#999] text-center py-3 font-extrabold text-[#3c312a] text-xl tracking-wider">PLAYER NAME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({length: 13}).map((_, i) => (
                      <tr key={i} className="border-b border-gray-400 border-dotted last:border-b-0">
                        <td className="w-20 border-r border-gray-400 text-center py-[17px] font-bold text-2xl text-[#444]">{i + 1}</td>
                        <td className="py-[17px] px-4"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SheetsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SheetsContent />
    </Suspense>
  )
}
