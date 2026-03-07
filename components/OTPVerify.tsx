'use client'
import { useState, useEffect, useRef } from 'react'
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface OTPVerifyProps {
  phoneNumber: string           // e.g. "9876543210"
  onVerified: () => void        // called when OTP verified successfully
  onCancel?: () => void         // optional cancel button
  countryCode?: string          // default "+91"
}

export default function OTPVerify({ phoneNumber, onVerified, onCancel, countryCode = '+91' }: OTPVerifyProps) {
  const [step, setStep] = useState<'send' | 'verify'>('send')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(0)
  const confirmRef = useRef<ConfirmationResult | null>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)

  // Countdown timer for resend
  useEffect(() => {
    if (timer <= 0) return
    const iv = setInterval(() => setTimer(t => t - 1), 1000)
    return () => clearInterval(iv)
  }, [timer])

  const setupRecaptcha = () => {
    if (recaptchaRef.current) return
    recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {},
    })
  }

  const sendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Enter valid 10-digit phone number first')
      return
    }
    setLoading(true)
    setError('')
    try {
      setupRecaptcha()
      const fullNumber = `${countryCode}${phoneNumber.replace(/\D/g, '').slice(-10)}`
      const result = await signInWithPhoneNumber(auth, fullNumber, recaptchaRef.current!)
      confirmRef.current = result
      setStep('verify')
      setTimer(60) // 60 sec resend cooldown
    } catch (e: any) {
      if (e.code === 'auth/too-many-requests') {
        setError('Too many OTP requests. Wait and try again.')
      } else if (e.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number. Use format: 9876543210')
      } else {
        setError(e.message || 'Failed to send OTP')
      }
    }
    setLoading(false)
  }

  const verifyOTP = async () => {
    if (otp.length !== 6) { setError('Enter 6-digit OTP'); return }
    if (!confirmRef.current) { setError('OTP expired. Send again.'); return }
    setLoading(true)
    setError('')
    try {
      await confirmRef.current.confirm(otp)
      onVerified()
    } catch {
      setError('Wrong OTP. Try again.')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      <div id="recaptcha-container" />

      {step === 'send' ? (
        <>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-700 font-semibold">📱 Phone Verification Required</p>
            <p className="text-xs text-blue-500 mt-1">OTP will be sent to <strong>{countryCode} {phoneNumber}</strong></p>
          </div>
          <button onClick={sendOTP} disabled={loading}
            className="btn-primary w-full py-3 gap-2">
            {loading ? '⏳ Sending OTP…' : '📲 Send OTP'}
          </button>
        </>
      ) : (
        <>
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
            <p className="text-sm text-green-700 font-semibold">✅ OTP Sent!</p>
            <p className="text-xs text-green-500 mt-1">Enter the 6-digit OTP sent to {countryCode} {phoneNumber}</p>
          </div>
          <input
            className="input text-center text-2xl tracking-[0.5em] font-bold"
            type="text" maxLength={6} placeholder="● ● ● ● ● ●"
            value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            autoFocus
          />
          <button onClick={verifyOTP} disabled={loading || otp.length !== 6}
            className="btn-primary w-full py-3 gap-2">
            {loading ? '⏳ Verifying…' : '✅ Verify OTP'}
          </button>
          <div className="flex items-center justify-between text-xs">
            <button onClick={sendOTP} disabled={timer > 0 || loading}
              className="text-saffron-600 font-bold hover:underline disabled:text-stone-300">
              {timer > 0 ? `Resend in ${timer}s` : '🔄 Resend OTP'}
            </button>
            {onCancel && (
              <button onClick={onCancel} className="text-stone-400 hover:text-stone-600">Cancel</button>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
          <p className="text-xs text-red-600 font-semibold">❌ {error}</p>
        </div>
      )}
    </div>
  )
}
