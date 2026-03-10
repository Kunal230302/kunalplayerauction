'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getTournamentByCode, getPlayers, addPlayer, Tournament, Player } from '@/lib/db'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { FiArrowLeft, FiUpload, FiPlus, FiX, FiCamera } from 'react-icons/fi'
import toast from 'react-hot-toast'

const getDeviceInfo = async () => {
  const userAgent = navigator.userAgent
  const platform = navigator.platform
  let deviceName = 'Unknown Device'

  // Try modern Client Hints API (gives exact models like "vivo V30" on Chrome/Android)
  try {
    const navAny = navigator as any
    if (navAny.userAgentData && navAny.userAgentData.getHighEntropyValues) {
      const hd = await navAny.userAgentData.getHighEntropyValues(['model', 'platform'])
      if (hd.model) {
        deviceName = hd.model
        if (hd.platform) deviceName = `${hd.platform} ${hd.model}`
      }
    }
  } catch (e) { }

  // Fallback to User-Agent parsing if Client Hints failed or wasn't available
  if (deviceName === 'Unknown Device') {
    if (userAgent.match(/iPhone/i)) {
      deviceName = 'iPhone'
      // Try to guess iPhone model roughly
      if (typeof screen !== 'undefined') {
        // iPhone 16 Series
        if (screen.width === 440 && screen.height === 956) deviceName = 'iPhone 16 Pro Max'
        else if (screen.width === 402 && screen.height === 874) deviceName = 'iPhone 16 Pro'
        else if (screen.width === 430 && screen.height === 932) deviceName = 'iPhone 16 Plus / 15 Pro Max'
        else if (screen.width === 393 && screen.height === 852) deviceName = 'iPhone 16 / 15 Pro'
        else if (screen.width === 428 && screen.height === 926) deviceName = 'iPhone 13/14 Pro Max'
        else if (screen.width === 390 && screen.height === 844) deviceName = 'iPhone 13/14'
      }
    }
    else if (userAgent.match(/iPad/i)) deviceName = 'iPad'
    else if (userAgent.match(/Android/i)) {
      const m = userAgent.match(/Android\s+[\d.]+;\s*([^;)]+)/)
      deviceName = m && m[1] && m[1].trim() !== 'K' && !m[1].includes('Android') ? m[1].trim() : 'Android Device'
    }
    else if (userAgent.match(/Windows/i)) deviceName = 'Windows PC'
    else if (userAgent.match(/Mac/i)) deviceName = 'Mac'
    else if (userAgent.match(/Linux/i)) deviceName = 'Linux PC'
  }

  const deviceId = btoa(userAgent + platform + screen.width + screen.height).slice(0, 24)
  return { deviceId, deviceName }
}

const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper']

const DISTRICT_TALUKAS: Record<string, string[]> = {
  'Ahmedabad': ['Ahmedabad City', 'Daskroi', 'Dholka', 'Sanand', 'Bavla', 'Dhandhuka', 'Viramgam'],
  'Mehsana': ['Mehsana', 'Visnagar', 'Unjha', 'Patan', 'Kadi', 'Kalol', 'Kheralu', 'Vadnagar', 'Becharaji'],
  'Banaskantha': ['Palanpur', 'Deesa', 'Dhanera', 'Tharad', 'Vadgam', 'Kankrej', 'Dantiwada'],
  'Sabarkantha': ['Himmatnagar', 'Idar', 'Prantij', 'Khedbrahma', 'Modasa', 'Bhiloda'],
  'Gandhinagar': ['Gandhinagar', 'Kalol', 'Dehgam', 'Mansa'],
  'Patan': ['Patan', 'Chanasma', 'Harij', 'Santalpur', 'Radhanpur', 'Sidhpur'],
  'Kutch': ['Bhuj', 'Gandhidham', 'Anjar', 'Mandvi', 'Mundra', 'Nakhatrana'],
  'Rajkot': ['Rajkot', 'Morbi', 'Gondal', 'Jetpur', 'Dhoraji', 'Upleta', 'Wankaner'],
  'Surat': ['Surat City', 'Olpad', 'Kamrej', 'Bardoli', 'Mahuva', 'Mangrol'],
  'Vadodara': ['Vadodara City', 'Savli', 'Padra', 'Karjan', 'Dabhoi', 'Waghodia'],
  'Junagadh': ['Junagadh', 'Visavadar', 'Manavadar', 'Keshod', 'Mangrol', 'Veraval'],
  'Bhavnagar': ['Bhavnagar', 'Sihor', 'Palitana', 'Mahua', 'Talaja', 'Gariadhar'],
  'Jamnagar': ['Jamnagar', 'Dhrol', 'Kalavad', 'Jamjodhpur', 'Lalpur', 'Khambhalia'],
  'Amreli': ['Amreli', 'Savarkundla', 'Rajula', 'Babra', 'Dhari', 'Bagasara'],
  'Anand': ['Anand', 'Petlad', 'Khambhat', 'Borsad', 'Sojitra', 'Umreth'],
  'Kheda': ['Nadiad', 'Kheda', 'Kapadvanj', 'Thasra', 'Matar', 'Mehmedabad'],
  'Bharuch': ['Bharuch', 'Ankleshwar', 'Hansot', 'Jambusar', 'Jhagadia', 'Netrang'],
  'Valsad': ['Valsad', 'Pardi', 'Dharampur', 'Umbergaon', 'Kaparada'],
  'Navsari': ['Navsari', 'Gandevi', 'Jalalpore', 'Chikhli', 'Vansda'],
  'Aravalli': ['Modasa', 'Bayad', 'Bhiloda', 'Dhansura', 'Malpur', 'Meghraj'],
  'Gir Somnath': ['Veraval', 'Somnath', 'Una', 'Kodinar', 'Talala'],
  'Morbi': ['Morbi', 'Wankaner', 'Halvad', 'Maliya', 'Tankara'],
  'Surendranagar': ['Surendranagar', 'Wadhwan', 'Limbdi', 'Chotila', 'Dhrangadhra'],
  'Botad': ['Botad', 'Gadhada', 'Barwala', 'Ranpur'],
  'Porbandar': ['Porbandar', 'Kutiyana', 'Ranavav'],
}
const DISTRICTS = Object.keys(DISTRICT_TALUKAS).sort()

export default function TournamentPlayersPage() {
  const params = useParams()
  const code = (params.code as string)?.toUpperCase()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [paymentSS, setPaymentSS] = useState<File | null>(null)
  const [paymentPreview, setPaymentPreview] = useState('')
  const [form, setForm] = useState({ name: '', surname: '', mobile: '', dob: '', district: '', taluka: '', role: 'Batsman' })

  const load = async () => {
    if (!code) return
    const t = await getTournamentByCode(code)
    if (!t) { setNotFound(true); setLoading(false); return }
    setTournament(t)
    setPlayers(await getPlayers(t.id))
    setLoading(false)
  }

  useEffect(() => { load() }, [code])

  const F = (k: string, v: any) => setForm({ ...form, [k]: v })
  const handleDistrictChange = (district: string) => setForm({ ...form, district, taluka: DISTRICT_TALUKAS[district]?.[0] || '' })
  const talukas = DISTRICT_TALUKAS[form.district] || []

  const handleAdd = async () => {
    if (!form.name.trim()) { toast.error('Player name required'); return }
    if (!form.surname.trim()) { toast.error('Surname required'); return }
    if (!form.mobile.trim() || form.mobile.length < 10) { toast.error('Enter valid 10-digit mobile'); return }
    if (!form.dob) { toast.error('Date of birth required'); return }
    if (!tournament) return
    if (tournament.totalPlayersRequired > 0 && players.length >= tournament.totalPlayersRequired) {
      toast.error('Registrations full!'); return
    }
    // Payment proof disabled - players can register without payment screenshot
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
      const { deviceId, deviceName } = await getDeviceInfo()
      await addPlayer({
        name: form.name.trim(), surname: form.surname.trim(), village: '', role: form.role,
        mobile: form.mobile.trim(), dob: form.dob, district: form.district, taluka: form.taluka,
        photoURL, paymentScreenshotURL, deviceId, deviceName,
      }, tournament.id)
      toast.success(`${form.name} ${form.surname} registered!`)
      setForm({ name: '', surname: '', mobile: '', dob: '', district: '', taluka: '', role: 'Batsman' })
      setPhoto(null); setPhotoPreview(''); setPaymentSS(null); setPaymentPreview('')
      setModal(false); load()
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="text-5xl animate-bounce">🏏</div></div>
  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4 text-center">
      <div><div className="text-6xl mb-4">😕</div><h1 className="text-2xl font-extrabold mb-2">Tournament Not Found</h1>
        <Link href="/" className="btn-primary px-6 py-2">← Home</Link></div>
    </div>
  )

  const t = tournament!
  const isFull = t.totalPlayersRequired > 0 && players.length >= t.totalPlayersRequired

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-gradient-to-r from-saffron-600 to-orange-500 text-white py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href={`/t/${code}`} className="inline-flex items-center gap-1.5 text-saffron-100 hover:text-white text-sm mb-3"><FiArrowLeft size={14} /> Back to Tournament</Link>
          <h1 className="text-2xl font-extrabold">👤 Player Registration</h1>
          <p className="text-saffron-100 text-sm">{t.name} · Code: {code}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {!isFull ? (
          <button onClick={() => setModal(true)} className="btn-primary w-full py-3.5 gap-2 text-base">
            <FiPlus size={18} /> Register New Player
          </button>
        ) : (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center text-red-700 font-bold text-sm">
            🔒 Registrations Full ({players.length}/{t.totalPlayersRequired})
          </div>
        )}

        <div className="text-sm text-stone-400 font-medium">
          {players.length} player{players.length !== 1 ? 's' : ''} registered
          {t.totalPlayersRequired > 0 && ` / ${t.totalPlayersRequired} required`}
        </div>
      </div>

      {/* Registration Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border-2 border-saffron-100 animate-slide-up my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-stone-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-extrabold text-lg">Register Player</h2>
              <button onClick={() => setModal(false)} className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg"><FiX size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Photo */}
              <div className="flex items-center gap-4">
                <div onClick={() => document.getElementById('pphoto')?.click()}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-saffron-300 bg-saffron-50 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-saffron-100 transition shrink-0">
                  {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <FiCamera className="text-saffron-400" />}
                </div>
                <div>
                  <input id="pphoto" type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0]; if (f) { setPhoto(f); setPhotoPreview(URL.createObjectURL(f)) }
                  }} />
                  <button onClick={() => document.getElementById('pphoto')?.click()} className="btn-outline btn-sm">Upload Photo</button>
                  <p className="text-xs text-stone-400 mt-0.5">Recommended</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">First Name *</label><input className="input" placeholder="Rohit" value={form.name} onChange={e => F('name', e.target.value)} /></div>
                <div><label className="label">Surname *</label><input className="input" placeholder="Patel" value={form.surname} onChange={e => F('surname', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">📱 Mobile *</label><input className="input" type="tel" maxLength={10} placeholder="9876543210" value={form.mobile} onChange={e => F('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} /></div>
                <div><label className="label">🎂 DOB *</label><input className="input" type="date" value={form.dob} onChange={e => F('dob', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">📍 District</label>
                  <select className="input" value={form.district} onChange={e => handleDistrictChange(e.target.value)}>
                    <option value="">Select</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">🏘️ Taluka</label>
                  <select className="input" value={form.taluka} onChange={e => F('taluka', e.target.value)}>
                    <option value="">{talukas.length === 0 ? '—' : 'Select'}</option>
                    {talukas.map(tk => <option key={tk} value={tk}>{tk}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">🏏 Role</label>
                <select className="input" value={form.role} onChange={e => F('role', e.target.value)}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Payment */}
              {t.entryFee > 0 && (
                <div className="border-t pt-4 space-y-3">
                  <p className="font-bold text-sm text-stone-700">💰 Fee: ₹{t.entryFee}</p>
                  {t.upiQrURL ? (
                    <img src={t.upiQrURL} alt="UPI QR" className="w-36 h-36 mx-auto rounded-xl border-2 border-green-100 object-contain bg-white p-1" />
                  ) : (
                    <div className="w-36 h-36 mx-auto rounded-xl border-2 border-green-100 bg-white flex items-center justify-center"><span className="text-stone-300 text-xs">QR not uploaded</span></div>
                  )}
                  <p className="text-xs text-green-600 text-center font-semibold">Scan → Pay ₹{t.entryFee} → Upload screenshot (optional)</p>
                  <div onClick={() => document.getElementById('payModal')?.click()}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition ${paymentPreview ? 'border-green-400 bg-green-50' : 'border-stone-300'}`}>
                    {paymentPreview ? <><img src={paymentPreview} className="max-h-24 mx-auto rounded-lg" /><p className="text-xs text-green-600 font-bold mt-1">✅ Uploaded</p></> :
                      <><FiUpload className="mx-auto text-stone-400 mb-1" /><p className="text-xs text-stone-400">Upload payment screenshot (optional)</p></>}
                  </div>
                  <input id="payModal" type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0]; if (f) { setPaymentSS(f); setPaymentPreview(URL.createObjectURL(f)) }
                  }} />
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setModal(false)} className="btn-ghost flex-1 border-2 border-stone-200">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1">{saving ? 'Registering…' : 'Register Player'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
