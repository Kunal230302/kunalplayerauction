'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getTournamentByCode, getTeams, getPlayers, addPlayer, Tournament, Team, Player } from '@/lib/db'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { FiUsers, FiShield, FiMapPin, FiZap, FiCopy, FiUpload, FiPlus, FiX, FiCamera } from 'react-icons/fi'
import toast from 'react-hot-toast'

// Device detection utility - Enhanced version with specific model detection
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent
  const platform = navigator.platform
  let deviceName = 'Unknown Device'
  let deviceModel = ''
  
  // Try to extract specific device model from user agent
  // iPhone detection with model attempt
  const iPhoneMatch = userAgent.match(/iPhone[^(]*\(([^)]+)\)/)
  const iPadMatch = userAgent.match(/iPad[^(]*\(([^)]+)\)/)
  
  if (userAgent.match(/iPhone/i)) {
    // Try to get model from various iPhone indicators
    if (userAgent.includes('iPhone16,2')) deviceModel = 'iPhone 15 Pro Max'
    else if (userAgent.includes('iPhone16,1')) deviceModel = 'iPhone 15 Pro'
    else if (userAgent.includes('iPhone15,5')) deviceModel = 'iPhone 15 Plus'
    else if (userAgent.includes('iPhone15,4')) deviceModel = 'iPhone 15'
    else if (userAgent.includes('iPhone14,8')) deviceModel = 'iPhone 14 Pro Max'
    else if (userAgent.includes('iPhone14,7')) deviceModel = 'iPhone 14 Pro'
    else if (userAgent.includes('iPhone14,6')) deviceModel = 'iPhone 14 Plus'
    else if (userAgent.includes('iPhone14,5')) deviceModel = 'iPhone 14'
    else if (userAgent.includes('iPhone13,4')) deviceModel = 'iPhone 13 Pro Max'
    else if (userAgent.includes('iPhone13,3')) deviceModel = 'iPhone 13 Pro'
    else if (userAgent.includes('iPhone13,2')) deviceModel = 'iPhone 13'
    else if (userAgent.includes('iPhone12,8')) deviceModel = 'iPhone SE (3rd gen)'
    else if (userAgent.includes('iPhone12,5')) deviceModel = 'iPhone 12 Pro Max'
    else if (userAgent.includes('iPhone12,3')) deviceModel = 'iPhone 12 Pro'
    else if (userAgent.includes('iPhone12,1')) deviceModel = 'iPhone 12'
    else if (userAgent.includes('iPhone11,8')) deviceModel = 'iPhone XR'
    else if (userAgent.includes('iPhone11,6')) deviceModel = 'iPhone XS Max'
    else if (userAgent.includes('iPhone11,4')) deviceModel = 'iPhone XS Max'
    else if (userAgent.includes('iPhone11,2')) deviceModel = 'iPhone XS'
    else if (userAgent.includes('iPhone10,6')) deviceModel = 'iPhone X'
    else if (userAgent.includes('iPhone10,4')) deviceModel = 'iPhone 8'
    else if (userAgent.includes('iPhone10,2')) deviceModel = 'iPhone 8 Plus'
    else if (userAgent.includes('iPhone10,1')) deviceModel = 'iPhone 8'
    else if (userAgent.includes('iPhone9,4')) deviceModel = 'iPhone 7 Plus'
    else if (userAgent.includes('iPhone9,3')) deviceModel = 'iPhone 7'
    else if (userAgent.includes('iPhone9,2')) deviceModel = 'iPhone 7 Plus'
    else if (userAgent.includes('iPhone9,1')) deviceModel = 'iPhone 7'
    else deviceModel = 'iPhone'
    
    deviceName = deviceModel
  }
  else if (userAgent.match(/iPad/i)) {
    if (userAgent.includes('iPad13,16') || userAgent.includes('iPad13,17')) deviceModel = 'iPad Air 5'
    else if (userAgent.includes('iPad13,4') || userAgent.includes('iPad13,5') || userAgent.includes('iPad13,6') || userAgent.includes('iPad13,7')) deviceModel = 'iPad Pro 12.9" (5th gen)'
    else if (userAgent.includes('iPad13,1') || userAgent.includes('iPad13,2')) deviceModel = 'iPad Air 4'
    else if (userAgent.includes('iPad12,1') || userAgent.includes('iPad12,2')) deviceModel = 'iPad 9'
    else if (userAgent.includes('iPad11,6') || userAgent.includes('iPad11,7')) deviceModel = 'iPad mini 6'
    else deviceModel = 'iPad'
    
    deviceName = deviceModel
  }
  else if (userAgent.match(/Android/i)) {
    // Try to extract Android device model
    const androidMatch = userAgent.match(/Android\s+([\d.]+);\s*([^;)]+)/)
    if (androidMatch) {
      const androidVersion = androidMatch[1]
      const deviceInfo = androidMatch[2].trim()
      
      // Common device patterns
      if (deviceInfo.includes('Samsung') || deviceInfo.includes('SM-')) {
        const samsungModel = deviceInfo.match(/SM-[A-Z0-9]+/)
        deviceModel = samsungModel ? `Samsung ${samsungModel[0]}` : deviceInfo
      } else if (deviceInfo.includes('Pixel')) {
        const pixelMatch = deviceInfo.match(/Pixel\s*\d+\s*(?:Pro|XL)?/i)
        deviceModel = pixelMatch ? `Google ${pixelMatch[0]}` : 'Google Pixel'
      } else if (deviceInfo.includes('OnePlus')) {
        const oneplusMatch = deviceInfo.match(/OnePlus\s*\d+/i)
        deviceModel = oneplusMatch ? oneplusMatch[0] : 'OnePlus'
      } else if (deviceInfo.includes('Xiaomi') || deviceInfo.includes('MI')) {
        deviceModel = `Xiaomi ${deviceInfo.replace('Xiaomi', '').trim()}`
      } else if (deviceInfo.includes('Redmi')) {
        deviceModel = deviceInfo
      } else if (deviceInfo.includes('OPPO')) {
        deviceModel = deviceInfo
      } else if (deviceInfo.includes('vivo')) {
        deviceModel = deviceInfo
      } else if (deviceInfo.includes('Realme')) {
        deviceModel = deviceInfo
      } else {
        deviceModel = deviceInfo
      }
      deviceName = deviceModel
    } else {
      deviceName = 'Android Device'
    }
  }
  else if (userAgent.match(/Windows/i)) {
    const windowsMatch = userAgent.match(/Windows\s+NT\s+([\d.]+)/)
    const winVersion = windowsMatch ? windowsMatch[1] : ''
    let winName = 'Windows'
    if (winVersion === '10.0') winName = 'Windows 10/11'
    else if (winVersion === '6.3') winName = 'Windows 8.1'
    else if (winVersion === '6.2') winName = 'Windows 8'
    else if (winVersion === '6.1') winName = 'Windows 7'
    
    deviceName = winName
  }
  else if (userAgent.match(/Mac/i)) {
    if (userAgent.includes('MacBook Pro')) deviceName = 'MacBook Pro'
    else if (userAgent.includes('MacBook Air')) deviceName = 'MacBook Air'
    else if (userAgent.includes('MacBook')) deviceName = 'MacBook'
    else if (userAgent.includes('iMac')) deviceName = 'iMac'
    else if (userAgent.includes('Mac mini')) deviceName = 'Mac mini'
    else if (userAgent.includes('Mac Studio')) deviceName = 'Mac Studio'
    else deviceName = 'Mac'
  }
  else if (userAgent.match(/Linux/i)) {
    deviceName = 'Linux PC'
  }
  
  // Generate device ID from user agent + screen + platform
  const deviceId = btoa(userAgent + platform + screen.width + screen.height).slice(0, 24)
  
  return { deviceId, deviceName }
}

const ballEmoji: Record<string, string> = {
  'Tennis Ball': '🎾', 'Leather Ball': '🏏', 'Heavy Tennis Ball': '🥎',
  'Mini Ball (Smiley)': '😊', 'Plastic Ball': '⚪',
}
const T_RING = ['border-red-400 text-red-700 bg-red-50', 'border-blue-400 text-blue-700 bg-blue-50', 'border-green-500 text-green-700 bg-green-50', 'border-purple-500 text-purple-700 bg-purple-50']
const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper']

/* ── Gujarat Talukas by district ── */
const DISTRICT_TALUKAS: Record<string, string[]> = {
  'Ahmedabad': ['Ahmedabad City', 'Daskroi', 'Dholka', 'Sanand', 'Bavla', 'Dhandhuka', 'Viramgam', 'Detroj-Rampura', 'Mandal'],
  'Mehsana': ['Mehsana', 'Visnagar', 'Unjha', 'Patan', 'Kadi', 'Kalol', 'Kheralu', 'Satlasana', 'Jotana', 'Vadnagar', 'Becharaji'],
  'Banaskantha': ['Palanpur', 'Deesa', 'Dhanera', 'Tharad', 'Vadgam', 'Kankrej', 'Dantiwada', 'Amirgadh', 'Deodar', 'Bhabhar', 'Lakhani', 'Suigam', 'Vav'],
  'Sabarkantha': ['Himmatnagar', 'Idar', 'Prantij', 'Khedbrahma', 'Modasa', 'Bhiloda', 'Vijaynagar', 'Bayad', 'Dhansura', 'Malpur', 'Meghraj'],
  'Gandhinagar': ['Gandhinagar', 'Kalol', 'Dehgam', 'Mansa'],
  'Patan': ['Patan', 'Chanasma', 'Harij', 'Santalpur', 'Radhanpur', 'Sami', 'Shankheshwar', 'Sidhpur'],
  'Kutch': ['Bhuj', 'Gandhidham', 'Anjar', 'Mandvi', 'Mundra', 'Nakhatrana', 'Abdasa', 'Lakhpat', 'Rapar', 'Bhachau'],
  'Rajkot': ['Rajkot', 'Morbi', 'Gondal', 'Jetpur', 'Dhoraji', 'Upleta', 'Jasdan', 'Wankaner', 'Paddhari', 'Lodhika', 'Kotda Sangani', 'Jamkandorna'],
  'Surat': ['Surat City', 'Olpad', 'Kamrej', 'Bardoli', 'Mahuva', 'Mandvi', 'Mangrol', 'Palsana', 'Choryasi', 'Umarpada'],
  'Vadodara': ['Vadodara City', 'Savli', 'Padra', 'Karjan', 'Dabhoi', 'Waghodia', 'Sinor', 'Sankheda', 'Nasvadi'],
  'Junagadh': ['Junagadh', 'Visavadar', 'Manavadar', 'Vanthali', 'Mendarda', 'Keshod', 'Mangrol', 'Malia', 'Una', 'Kodinar', 'Sutrapada', 'Veraval'],
  'Bhavnagar': ['Bhavnagar', 'Sihor', 'Palitana', 'Mahua', 'Talaja', 'Gariadhar', 'Ghogha', 'Jesar', 'Umrala', 'Vallabhipur'],
  'Jamnagar': ['Jamnagar', 'Dhrol', 'Kalavad', 'Jamjodhpur', 'Lalpur', 'Jodia', 'Khambhalia'],
  'Amreli': ['Amreli', 'Savarkundla', 'Lilia', 'Liliya', 'Rajula', 'Jafrabad', 'Babra', 'Dhari', 'Khambha', 'Bagasara', 'Lathi', 'Kunkavav'],
  'Anand': ['Anand', 'Petlad', 'Khambhat', 'Borsad', 'Sojitra', 'Tarapur', 'Umreth'],
  'Kheda': ['Nadiad', 'Kheda', 'Kapadvanj', 'Thasra', 'Kathlal', 'Galteshwar', 'Matar', 'Mehmedabad'],
  'Bharuch': ['Bharuch', 'Ankleshwar', 'Hansot', 'Jambusar', 'Amod', 'Jhagadia', 'Netrang', 'Vagra', 'Valia'],
  'Narmada': ['Rajpipla', 'Dediapada', 'Garudeshwar', 'Sagbara', 'Tilakwada'],
  'Valsad': ['Valsad', 'Pardi', 'Dharampur', 'Umbergaon', 'Kaparada'],
  'Navsari': ['Navsari', 'Gandevi', 'Jalalpore', 'Chikhli', 'Khergam', 'Vansda'],
  'Tapi': ['Vyara', 'Songadh', 'Uchchhal', 'Valod', 'Nizar', 'Dolvan'],
  'Dang': ['Ahwa', 'Waghai', 'Subir'],
  'Aravalli': ['Modasa', 'Bayad', 'Bhiloda', 'Dhansura', 'Malpur', 'Meghraj'],
  'Gir Somnath': ['Veraval', 'Somnath', 'Una', 'Kodinar', 'Sutrapada', 'Talala'],
  'Devbhoomi Dwarka': ['Dwarka', 'Khambhalia', 'Kalyanpur', 'Bhanvad'],
  'Mahisagar': ['Lunawada', 'Kadana', 'Santrampur', 'Khanpur', 'Balasinor'],
  'Chhota Udepur': ['Chhota Udepur', 'Kavant', 'Nasvadi', 'Jetpur Pavi', 'Bodeli', 'Sankheda'],
  'Botad': ['Botad', 'Gadhada', 'Barwala', 'Ranpur'],
  'Morbi': ['Morbi', 'Wankaner', 'Halvad', 'Maliya', 'Tankara'],
  'Surendranagar': ['Surendranagar', 'Wadhwan', 'Limbdi', 'Chotila', 'Sayla', 'Dhrangadhra', 'Halvad', 'Muli', 'Lakhtar', 'Thangadh'],
  'Porbandar': ['Porbandar', 'Kutiyana', 'Ranavav'],
}

const DISTRICTS = Object.keys(DISTRICT_TALUKAS).sort()

export default function TournamentPage() {
  const params = useParams()
  const code = (params.code as string)?.toUpperCase()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Player registration form
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [paymentSS, setPaymentSS] = useState<File | null>(null)
  const [paymentPreview, setPaymentPreview] = useState('')
  const [form, setForm] = useState({
    name: '', surname: '', mobile: '', dob: '', district: '', taluka: '', role: 'Batsman',
  })

  const load = async () => {
    if (!code) return
    const t = await getTournamentByCode(code)
    if (!t) { setNotFound(true); setLoading(false); return }
    setTournament(t)
    const [te, pl] = await Promise.all([getTeams(t.id), getPlayers(t.id)])
    setTeams(te); setPlayers(pl)
    setLoading(false)
  }

  useEffect(() => { load() }, [code])

  const copyCode = () => { navigator.clipboard.writeText(code); toast.success('Code copied!') }
  const sold = players.filter(p => p.status === 'sold').length
  const F = (k: string, v: any) => setForm({ ...form, [k]: v })

  // Auto-fill taluka when district changes
  const handleDistrictChange = (district: string) => {
    setForm({ ...form, district, taluka: DISTRICT_TALUKAS[district]?.[0] || '' })
  }

  // Get location permission & detect district
  const detectLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return }
    toast.loading('Getting your location...', { id: 'loc' })
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
          const data = await res.json()
          const addr = data.address || {}
          const district = addr.state_district || addr.county || addr.city || ''
          // Try to match with our districts
          const matched = DISTRICTS.find(d => district.toLowerCase().includes(d.toLowerCase()))
          if (matched) {
            handleDistrictChange(matched)
            toast.success(`📍 District: ${matched}`, { id: 'loc' })
          } else {
            setForm(f => ({ ...f, district: district }))
            toast.success(`📍 Location: ${district}`, { id: 'loc' })
          }
        } catch { toast.error('Could not detect location', { id: 'loc' }) }
      },
      () => toast.error('Location permission denied', { id: 'loc' }),
      { timeout: 10000 }
    )
  }

  const handleRegister = async () => {
    if (!form.name.trim()) { toast.error('Player name required'); return }
    if (!form.surname.trim()) { toast.error('Surname required'); return }
    if (!form.mobile.trim() || form.mobile.length < 10) { toast.error('Enter valid 10-digit mobile number'); return }
    if (!form.dob) { toast.error('Date of birth required'); return }
    if (!tournament) return
    const isFull = tournament.totalPlayersRequired > 0 && players.length >= tournament.totalPlayersRequired
    if (isFull) { toast.error('Player registrations are full!'); return }
    setSaving(true)
    try {
      let photoURL = ''
      if (photo) {
        photoURL = await uploadToCloudinary(photo, 'tournament-players')
      }
      let paymentScreenshotURL = ''
      if (paymentSS) {
        paymentScreenshotURL = await uploadToCloudinary(paymentSS, 'tournament-payments')
      }
      // Get device info
      const { deviceId, deviceName } = getDeviceInfo()
      
      await addPlayer({
        name: form.name.trim(), surname: form.surname.trim(), village: '', role: form.role,
        mobile: form.mobile.trim(), dob: form.dob, district: form.district, taluka: form.taluka,
        photoURL, paymentScreenshotURL, deviceId, deviceName
      }, tournament.id)
      toast.success(`${form.name} ${form.surname} registered! 🏏`)
      setForm({ name: '', surname: '', mobile: '', dob: '', district: '', taluka: '', role: 'Batsman' })
      setPhoto(null); setPhotoPreview(''); setPaymentSS(null); setPaymentPreview('')
      setShowForm(false); load()
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center overflow-hidden mx-auto mb-3 animate-bounce">
          <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <p className="text-stone-400 font-medium">Loading tournament…</p>
      </div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-extrabold text-stone-800 mb-2">Tournament Not Found</h1>
        <p className="text-stone-400 mb-6">Code <strong className="font-mono">{code}</strong> doesn't match any tournament.</p>
        <Link href="/" className="btn-primary px-8 py-3">← Back to Home</Link>
      </div>
    </div>
  )

  const t = tournament!
  const pct = t.totalPlayersRequired > 0 ? Math.round((players.length / t.totalPlayersRequired) * 100) : 0
  const isFull = t.totalPlayersRequired > 0 && players.length >= t.totalPlayersRequired
  const talukas = DISTRICT_TALUKAS[form.district] || []

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-saffron-700 via-saffron-600 to-orange-500 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-white/30 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-4">
            {ballEmoji[t.ballType] || '⚾'} {t.ballType}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">{t.name}</h1>
          {t.description && <p className="text-saffron-100 text-sm mb-4 max-w-xl mx-auto">{t.description}</p>}

          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/30 rounded-xl px-5 py-2 mb-6">
            <span className="text-saffron-200 text-xs font-bold uppercase tracking-widest">Code:</span>
            <span className="text-2xl font-black tracking-widest">{code}</span>
            <button onClick={copyCode} className="p-1 hover:bg-white/20 rounded-lg transition"><FiCopy size={14} /></button>
          </div>

          <div className="mb-6">
            <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest
              ${t.status === 'live' ? 'bg-green-500' : t.status === 'ended' ? 'bg-stone-500' : 'bg-white/20'}`}>
              {t.status === 'live' ? '🔴 LIVE NOW' : t.status === 'ended' ? '✅ ENDED' : '🕐 UPCOMING'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            {[['👤', players.length, 'Players'], ['🏆', sold, 'Sold'], ['🛡️', teams.length, 'Teams']].map(([ic, v, l]) => (
              <div key={l as string} className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <span className="text-lg">{ic}</span>
                <div className="text-2xl font-extrabold">{v}</div>
                <div className="text-xs text-saffron-200 font-semibold">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="max-w-4xl mx-auto px-4 -mt-6 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={() => { if (!isFull) setShowForm(true); else toast.error('Registrations full!') }}
            className="card p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all border-2 border-blue-100 hover:border-blue-300">
            <FiUsers className="mx-auto mb-1 text-blue-500" size={22} />
            <div className="font-bold text-sm text-stone-700">Register Player</div>
            <div className="text-xs text-stone-400">Add new player</div>
          </button>
          <Link href={`/t/${code}/teams`} className="card p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all border-2 border-green-100 hover:border-green-300">
            <FiShield className="mx-auto mb-1 text-green-500" size={22} />
            <div className="font-bold text-sm text-stone-700">Register Team</div>
            <div className="text-xs text-stone-400">Add new team</div>
          </Link>
          <Link href={`/login`} className="card p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all border-2 border-saffron-100 hover:border-saffron-300">
            <FiZap className="mx-auto mb-1 text-saffron-500" size={22} />
            <div className="font-bold text-sm text-stone-700">Live Auction</div>
            <div className="text-xs text-stone-400">Admin login</div>
          </Link>
          <Link href="/" className="card p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all border-2 border-stone-100 hover:border-stone-300">
            <span className="text-xl block mb-1">🏠</span>
            <div className="font-bold text-sm text-stone-700">Home</div>
            <div className="text-xs text-stone-400">Back to main</div>
          </Link>
        </div>
      </div>

      {/* ── PLAYER REGISTRATION FORM ── */}
      {showForm && (
        <div className="max-w-4xl mx-auto px-4 mb-6">
          <div className="card border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-white p-6 shadow-xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-extrabold text-xl text-stone-800">👤 Register as Player</h3>
                <p className="text-xs text-stone-400 mt-0.5">Fill all required fields to complete registration</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 text-stone-400 hover:bg-stone-100 rounded-lg"><FiX size={20} /></button>
            </div>

            <div className="space-y-5">
              {/* ── Photo upload ── */}
              <div className="flex items-center gap-4">
                <div onClick={() => document.getElementById('playerPhoto')?.click()}
                  className="w-20 h-20 rounded-2xl border-3 border-dashed border-blue-300 bg-blue-50 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-blue-100 transition shrink-0 group">
                  {photoPreview
                    ? <img src={photoPreview} className="w-full h-full object-cover" />
                    : <div className="text-center"><FiCamera className="mx-auto text-blue-400 group-hover:scale-110 transition" size={22} /><span className="text-[10px] text-blue-400 font-bold">Photo</span></div>}
                </div>
                <div>
                  <input id="playerPhoto" type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0]; if (f) { setPhoto(f); setPhotoPreview(URL.createObjectURL(f)) }
                  }} />
                  <button onClick={() => document.getElementById('playerPhoto')?.click()} className="btn-outline btn-sm gap-1.5">
                    <FiCamera size={14} /> {photoPreview ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  <p className="text-xs text-stone-400 mt-0.5">Player photo (recommended)</p>
                </div>
              </div>

              {/* ── Name & Surname ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name *</label>
                  <input className="input" placeholder="e.g. Rohit" value={form.name} onChange={e => F('name', e.target.value)} autoFocus />
                </div>
                <div>
                  <label className="label">Surname *</label>
                  <input className="input" placeholder="e.g. Patel" value={form.surname} onChange={e => F('surname', e.target.value)} />
                </div>
              </div>

              {/* ── Mobile & DOB ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">📱 Mobile Number *</label>
                  <input className="input" type="tel" maxLength={10} placeholder="9876543210" value={form.mobile}
                    onChange={e => F('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} />
                </div>
                <div>
                  <label className="label">🎂 Date of Birth *</label>
                  <input className="input" type="date" value={form.dob} onChange={e => F('dob', e.target.value)} />
                </div>
              </div>

              {/* ── District & Taluka ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">📍 District *</label>
                  <div className="flex gap-2">
                    <select className="input flex-1" value={form.district} onChange={e => handleDistrictChange(e.target.value)}>
                      <option value="">Select District</option>
                      {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button onClick={detectLocation} type="button" title="Detect my location"
                      className="px-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-blue-500 hover:bg-blue-100 transition text-sm font-bold shrink-0">
                      📍
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">🏘️ Taluka {talukas.length > 0 && <span className="text-green-500 text-[10px]">✅ Auto-filled</span>}</label>
                  <select className="input" value={form.taluka} onChange={e => F('taluka', e.target.value)}>
                    <option value="">{talukas.length === 0 ? 'Select district first' : 'Select Taluka'}</option>
                    {talukas.map(tk => <option key={tk} value={tk}>{tk}</option>)}
                  </select>
                </div>
              </div>

              {/* ── Role ── */}
              <div>
                <label className="label">🏏 Player Role</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ROLES.map(r => (
                    <button key={r} onClick={() => F('role', r)} type="button"
                      className={`border-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all
                        ${form.role === r ? 'border-saffron-400 bg-saffron-50 text-saffron-700 shadow-sm' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                      {r === 'Batsman' ? '🏏' : r === 'Bowler' ? '🎯' : r === 'All-Rounder' ? '⭐' : '🧤'} {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Payment Section ── */}
              {t.entryFee > 0 && (
                <div className="border-t-2 border-stone-100 pt-5">
                  <h4 className="font-extrabold text-base text-stone-800 mb-3">💰 Registration Fee: ₹{t.entryFee}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* QR Code */}
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-4 text-center">
                      <p className="text-xs font-bold text-green-700 mb-2">📱 Scan to Pay via GPay / UPI</p>
                      {t.upiQrURL ? (
                        <img src={t.upiQrURL} alt="UPI QR Code" className="w-40 h-40 mx-auto rounded-xl border-2 border-green-100 object-contain bg-white p-1" />
                      ) : (
                        <div className="w-40 h-40 mx-auto rounded-xl border-2 border-green-100 bg-white flex items-center justify-center"><span className="text-stone-300 text-sm">QR not uploaded</span></div>
                      )}
                      <p className="text-xs text-green-600 font-semibold mt-2">Entry Fee: ₹{t.entryFee} • Upload screenshot if paid (optional)</p>
                    </div>
                    {/* Upload payment screenshot */}
                    <div className="flex flex-col justify-center">
                      <label className="label mb-2">📸 Upload Payment Screenshot (optional)</label>
                      <div onClick={() => document.getElementById('paymentSS')?.click()}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all hover:bg-green-50
                          ${paymentPreview ? 'border-green-400 bg-green-50' : 'border-stone-300'}`}>
                        {paymentPreview ? (
                          <div><img src={paymentPreview} className="w-full max-h-32 object-contain rounded-lg mx-auto" /><p className="text-xs text-green-600 font-bold mt-2">✅ Screenshot uploaded</p></div>
                        ) : (
                          <><FiUpload className="mx-auto text-stone-400 mb-1"/><p className="text-xs text-stone-400">Upload payment screenshot (optional)</p></>
                        )}
                      </div>
                      <input id="paymentSS" type="file" accept="image/*" className="hidden" onChange={e => {
                        const f = e.target.files?.[0]; if (f) { setPaymentSS(f); setPaymentPreview(URL.createObjectURL(f)) }
                      }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button onClick={handleRegister} disabled={saving}
                className="btn-primary w-full py-3.5 text-base gap-2 mt-2">
                {saving ? '⏳ Registering…' : <><FiPlus size={18} /> Register Player</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tournament info */}
      <div className="max-w-4xl mx-auto px-4 space-y-6 pb-12">
        {/* Details row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(t.groundName || t.groundLocation) && (
            <div className="card p-4 border-2 border-blue-100">
              <div className="flex items-start gap-3">
                <FiMapPin className="text-blue-500 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">Ground</p>
                  {t.groundName && <p className="font-bold text-stone-700">{t.groundName}</p>}
                  {t.groundLocation && <p className="text-sm text-stone-400">{t.groundLocation}</p>}
                </div>
              </div>
            </div>
          )}
          {t.auctionLocation && (
            <div className="card p-4 border-2 border-purple-100">
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">🏏</span>
                <div>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">Auction Location</p>
                  <p className="font-bold text-stone-700">{t.auctionLocation}</p>
                </div>
              </div>
            </div>
          )}
          {t.entryFee > 0 && (
            <div className="card p-4 border-2 border-green-100">
              <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">💰 Entry Fee</p>
              <p className="text-2xl font-extrabold text-green-600">₹{t.entryFee}</p>
            </div>
          )}
          <div className="card p-4 border-2 border-saffron-100">
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">{ballEmoji[t.ballType]} Ball Type</p>
            <p className="text-lg font-extrabold text-saffron-600">{t.ballType}</p>
          </div>
        </div>

        {/* Player progress */}
        {t.totalPlayersRequired > 0 && (
          <div className="card p-4 border-2 border-stone-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-stone-600">Player Registrations</span>
              <span className="text-sm font-extrabold text-saffron-600">{players.length}/{t.totalPlayersRequired}</span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-3">
              <div className={`h-3 rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
            <p className="text-xs text-stone-400 mt-1">{pct}% filled{pct >= 100 && ' · 🔒 Full'}</p>
          </div>
        )}

        {/* Player count summary (no list - admin only) */}
        {players.length > 0 && (
          <div className="card p-4 border-2 border-blue-100 text-center">
            <span className="text-lg">👤</span>
            <div className="text-2xl font-extrabold text-stone-800">{players.length}</div>
            <div className="text-xs text-stone-400 font-semibold">Players Registered</div>
          </div>
        )}

        {/* Teams */}
        <div>
          <h2 className="text-xl font-extrabold text-stone-800 mb-3">🛡️ Registered Teams ({teams.length})</h2>
          {teams.length === 0 ? (
            <div className="card border-2 border-dashed border-stone-200 p-8 text-center text-stone-400">
              <p>No teams registered yet</p>
              <Link href={`/t/${code}/teams`} className="text-saffron-500 hover:underline text-sm mt-1 inline-block">Register first team →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {teams.map((tm, i) => (
                <div key={tm.id} className={`card border-4 p-4 text-center hover:shadow-lg transition ${T_RING[i % 4]}`}>
                  <div className={`w-14 h-14 rounded-full mx-auto mb-2 border-4 overflow-hidden flex items-center justify-center font-extrabold text-xl ${T_RING[i % 4]}`}>
                    {tm.logoURL ? <img src={tm.logoURL} className="w-full h-full object-cover rounded-full" alt={tm.teamName} /> : tm.teamName?.[0]?.toUpperCase()}
                  </div>
                  <div className="font-extrabold text-sm">{tm.teamName}</div>
                  <div className="text-xs text-stone-400">{tm.ownerName}</div>
                  <div className="text-xs font-bold text-stone-500 mt-1">{tm.playersBought || 0} players</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-stone-300 text-xs pt-4">
          Powered by <Link href="/" className="text-saffron-400 font-bold hover:underline">PlayerAuctionHub</Link>
        </div>
      </div>
    </div>
  )
}
