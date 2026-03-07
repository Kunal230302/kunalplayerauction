import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, query, orderBy, serverTimestamp, writeBatch,
  increment, setDoc, where, limit
} from 'firebase/firestore'
import { ref, set, update, onValue, push, remove, get, off } from 'firebase/database'
import { db, rtdb } from './firebase'

// ── TYPES ────────────────────────────────────────────────────────────────────

export interface Tournament {
  id: string; name: string; description: string; logoURL: string; upiQrURL: string
  entryFee: number; totalPlayersRequired: number; registeredPlayers: number
  ballType: string; groundName: string; groundLocation: string
  auctionLocation: string; status: 'upcoming' | 'live' | 'ended'
  code: string; createdBy: string; isAdmin: boolean; maxFreeTeams: number
}
export interface Player {
  id: string; name: string; surname: string; village: string; role: string
  mobile: string; dob: string; district: string; taluka: string
  photoURL: string; paymentScreenshotURL: string
  status: 'available' | 'sold' | 'unsold'
  soldTo?: string; soldToName?: string; soldPoints?: number
}
export interface Team {
  id: string; teamName: string; ownerName: string; logoURL: string
  points: number; playersBought: number
}
export interface Settings {
  auctionTitle: string; auctionDate: string
  bidIncrement: number; timerSeconds: number
  basePrice: number          // starting price per player (default 5000)
  teamBudget: number         // each team's total budget (default 500000)
  bidTier1Limit: number      // below this amount, use tier1 increment (default 50000)
  bidTier1Inc: number        // increment below tier1 limit (default 10000)
  bidTier2Limit: number      // below this amount, use tier2 increment (default 100000)
  bidTier2Inc: number        // increment above tier2 limit (default 20000)
  status: 'idle' | 'running' | 'paused' | 'ended'
}
export interface LiveState {
  playerId: string; playerName: string; playerRole: string
  playerPhoto: string; playerVillage: string
  currentPoints: number; currentBidder: string; currentBidderTeamId: string
  status: 'bidding' | 'sold' | 'unsold' | 'idle'
  timerEnd: number
}

// ── TOURNAMENT CODE GENERATOR ────────────────────────────────────────────────

const genCode = () => {
  const num = Math.floor(100 + Math.random() * 900) // 100–999
  return String(num)
}

// ── TOURNAMENTS (top-level) ──────────────────────────────────────────────────

export const getTournaments = async (): Promise<Tournament[]> => {
  const s = await getDocs(query(collection(db, 'tournaments'), orderBy('createdAt')))
  return s.docs.map(d => ({ id: d.id, ...d.data() })) as Tournament[]
}
export const getTournamentByCode = async (code: string): Promise<Tournament | null> => {
  const s = await getDocs(query(collection(db, 'tournaments'), where('code', '==', code.toUpperCase()), limit(1)))
  if (s.empty) return null
  return { id: s.docs[0].id, ...s.docs[0].data() } as Tournament
}
export const getTournament = async (id: string): Promise<Tournament | null> => {
  const s = await getDoc(doc(db, 'tournaments', id))
  return s.exists() ? { id: s.id, ...s.data() } as Tournament : null
}
export const addTournament = async (d: Omit<Tournament, 'id' | 'registeredPlayers' | 'status' | 'code'>) => {
  const code = genCode()
  const docRef = await addDoc(collection(db, 'tournaments'), {
    ...d, registeredPlayers: 0, status: 'upcoming', code,
    maxFreeTeams: d.isAdmin ? 9999 : 4, createdAt: serverTimestamp()
  })
  // Create default settings subcollection
  await setDoc(doc(db, 'tournaments', docRef.id, 'meta', 'settings'), {
    auctionTitle: d.name, auctionDate: '', bidIncrement: 50, timerSeconds: 30, status: 'idle'
  })
  return { id: docRef.id, code }
}
export const updateTournament = (id: string, d: any) => updateDoc(doc(db, 'tournaments', id), d)
export const deleteTournament = async (id: string) => {
  // Delete subcollections first (players, teams)
  const [players, teams] = await Promise.all([
    getDocs(collection(db, 'tournaments', id, 'players')),
    getDocs(collection(db, 'tournaments', id, 'teams')),
  ])
  const batch = writeBatch(db)
  players.docs.forEach(d => batch.delete(d.ref))
  teams.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
  await deleteDoc(doc(db, 'tournaments', id))
}

// ── SETTINGS (tournament-scoped) ─────────────────────────────────────────────

export const getSettings = async (tournamentId?: string): Promise<Settings> => {
  const path = tournamentId ? `tournaments/${tournamentId}/meta/settings` : 'settings/main'
  const s = await getDoc(doc(db, path))
  return s.exists() ? s.data() as Settings : {
    auctionTitle: 'Local Cricket Auction 2026', auctionDate: '',
    bidIncrement: 10000, timerSeconds: 30, status: 'idle',
    basePrice: 5000, teamBudget: 500000,
    bidTier1Limit: 50000, bidTier1Inc: 10000,
    bidTier2Limit: 100000, bidTier2Inc: 20000,
  }
}
export const saveSettings = async (data: Partial<Settings>, tournamentId?: string) => {
  const path = tournamentId ? `tournaments/${tournamentId}/meta/settings` : 'settings/main'
  const r = doc(db, path)
  const s = await getDoc(r)
  s.exists() ? await updateDoc(r, data as any) : await setDoc(r, data)
}

// ── PLAYERS (tournament-scoped) ──────────────────────────────────────────────

const playersCol = (tid: string) => collection(db, 'tournaments', tid, 'players')

export const getPlayers = async (tournamentId?: string): Promise<Player[]> => {
  if (!tournamentId) {
    // Legacy fallback for global players
    const s = await getDocs(query(collection(db, 'players'), orderBy('name')))
    return s.docs.map(d => ({ id: d.id, ...d.data() })) as Player[]
  }
  const s = await getDocs(query(playersCol(tournamentId), orderBy('name')))
  return s.docs.map(d => ({ id: d.id, ...d.data() })) as Player[]
}
export const addPlayer = (d: Omit<Player, 'id' | 'status'>, tournamentId?: string) => {
  const col = tournamentId ? playersCol(tournamentId) : collection(db, 'players')
  return addDoc(col, { ...d, status: 'available', createdAt: serverTimestamp() })
}
export const updatePlayer = (id: string, d: any, tournamentId?: string) => {
  const path = tournamentId ? `tournaments/${tournamentId}/players/${id}` : `players/${id}`
  return updateDoc(doc(db, path), d)
}
export const deletePlayer = (id: string, tournamentId?: string) => {
  const path = tournamentId ? `tournaments/${tournamentId}/players/${id}` : `players/${id}`
  return deleteDoc(doc(db, path))
}

// ── TEAMS (tournament-scoped) ────────────────────────────────────────────────

const teamsCol = (tid: string) => collection(db, 'tournaments', tid, 'teams')

export const getTeams = async (tournamentId?: string): Promise<Team[]> => {
  if (!tournamentId) {
    const s = await getDocs(query(collection(db, 'teams'), orderBy('createdAt')))
    return s.docs.map(d => ({ id: d.id, ...d.data() })) as Team[]
  }
  const s = await getDocs(query(teamsCol(tournamentId), orderBy('createdAt')))
  return s.docs.map(d => ({ id: d.id, ...d.data() })) as Team[]
}
export const getTeamCount = async (tournamentId: string): Promise<number> => {
  const s = await getDocs(teamsCol(tournamentId))
  return s.size
}
export const addTeam = (d: Omit<Team, 'id' | 'points' | 'playersBought'>, tournamentId?: string) => {
  const col = tournamentId ? teamsCol(tournamentId) : collection(db, 'teams')
  return addDoc(col, { ...d, points: 0, playersBought: 0, createdAt: serverTimestamp() })
}
export const updateTeam = (id: string, d: any, tournamentId?: string) => {
  const path = tournamentId ? `tournaments/${tournamentId}/teams/${id}` : `teams/${id}`
  return updateDoc(doc(db, path), d)
}
export const deleteTeam = (id: string, tournamentId?: string) => {
  const path = tournamentId ? `tournaments/${tournamentId}/teams/${id}` : `teams/${id}`
  return deleteDoc(doc(db, path))
}

// ── USERS ────────────────────────────────────────────────────────────────────

export const getUsers = async () => {
  const s = await getDocs(collection(db, 'users'))
  return s.docs.map(d => ({ id: d.id, ...d.data() }))
}
export const saveUser = (uid: string, data: any) => setDoc(doc(db, 'users', uid), data)

// ── LIVE AUCTION (Realtime DB — tournament-scoped) ────────────────────────────

const livePath = (tid?: string) => tid ? `tournaments/${tid}/live` : 'auction/live'
const bidsPath = (tid?: string) => tid ? `tournaments/${tid}/bids` : 'auction/bids'

export const setLive = (d: any, tid?: string) => set(ref(rtdb, livePath(tid)), d)
export const updateLive = (d: any, tid?: string) => update(ref(rtdb, livePath(tid)), d)
export const clearLive = (tid?: string) => remove(ref(rtdb, tid ? `tournaments/${tid}` : 'auction'))
export const getLive = async (tid?: string) => { const s = await get(ref(rtdb, livePath(tid))); return s.val() }

export const subLive = (cbOrTid: ((v: LiveState | null) => void) | string, cb?: (v: LiveState | null) => void) => {
  let tid: string | undefined
  let callback: (v: LiveState | null) => void
  if (typeof cbOrTid === 'string') { tid = cbOrTid; callback = cb! }
  else { callback = cbOrTid }
  const r = ref(rtdb, livePath(tid))
  onValue(r, s => callback(s.val()))
  return () => off(r)
}

export const pushBid = (teamId: string, teamName: string, points: number, tid?: string) =>
  push(ref(rtdb, bidsPath(tid)), { teamId, teamName, points, ts: Date.now() })
export const clearBids = (tid?: string) => remove(ref(rtdb, bidsPath(tid)))
export const subBids = (cbOrTid: ((v: any[]) => void) | string, cb?: (v: any[]) => void) => {
  let tid: string | undefined
  let callback: (v: any[]) => void
  if (typeof cbOrTid === 'string') { tid = cbOrTid; callback = cb! }
  else { callback = cbOrTid }
  const r = ref(rtdb, bidsPath(tid))
  onValue(r, s => { const v = s.val(); callback(v ? Object.values(v).sort((a: any, b: any) => b.ts - a.ts) : []) })
  return () => off(r)
}

// ── AUCTION ACTIONS (tournament-scoped) ───────────────────────────────────────

export const markSold = async (playerId: string, teamId: string, teamName: string, points: number, tid?: string) => {
  const pPath = tid ? `tournaments/${tid}/players/${playerId}` : `players/${playerId}`
  const tPath = tid ? `tournaments/${tid}/teams/${teamId}` : `teams/${teamId}`
  const resCol = tid ? collection(db, 'tournaments', tid, 'auction_results') : collection(db, 'auction_results')
  const batch = writeBatch(db)
  batch.update(doc(db, pPath), { status: 'sold', soldTo: teamId, soldToName: teamName, soldPoints: points })
  batch.update(doc(db, tPath), { playersBought: increment(1), points: increment(points) })
  await batch.commit()
  await addDoc(resCol, { playerId, teamId, teamName, points, soldAt: serverTimestamp() })
  await updateLive({ status: 'sold' }, tid)
}

export const markUnsold = async (playerId: string, tid?: string) => {
  await updatePlayer(playerId, { status: 'unsold' }, tid)
  await updateLive({ status: 'unsold' }, tid)
}

export const resetTournament = async (tid?: string) => {
  const [players, teams] = await Promise.all([getPlayers(tid), getTeams(tid)])
  const batch = writeBatch(db)
  const pBase = tid ? `tournaments/${tid}/players` : 'players'
  const tBase = tid ? `tournaments/${tid}/teams` : 'teams'
  players.forEach(p => batch.update(doc(db, pBase, p.id), { status: 'available', soldTo: null, soldToName: null, soldPoints: null }))
  teams.forEach(t => batch.update(doc(db, tBase, t.id), { points: 0, playersBought: 0 }))
  await batch.commit()
  await remove(ref(rtdb, tid ? `tournaments/${tid}` : 'auction'))
}
