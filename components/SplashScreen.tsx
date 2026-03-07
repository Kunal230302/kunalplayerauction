'use client'
import { useState, useEffect } from 'react'

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(onComplete, 800) // Match transition duration
    }, 2200)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-stone-950 transition-opacity duration-700 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="relative mb-8">
        {/* Gavel Icon with Up-Down Animation */}
        <div className="animate-gavel-swing transform-origin-bottom-right">
          <img src="/gavel.png" alt="Gavel" className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-[0_0_25px_rgba(234,179,8,0.3)] object-contain" />
        </div>
        {/* Block */}
        <div className="h-2 w-16 sm:w-20 bg-stone-800 rounded-full mx-auto mt-[-10px] shadow-lg border-b-2 border-stone-700" />
      </div>

      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter bg-gradient-to-b from-saffron-300 via-saffron-500 to-saffron-700 bg-clip-text text-transparent animate-pulse-slow">
          Bidding...
        </h1>
        <p className="mt-4 text-saffron-500/80 font-bold uppercase tracking-[0.3em] text-[10px] sm:text-xs">
          Professional Cricket Auction Platform
        </p>
      </div>

      <style jsx global>{`
        @keyframes gavelSwing {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }
        .animate-gavel-swing {
          animation: gavelSwing 0.6s ease-in-out infinite;
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.98); }
        }
        .animate-pulse-slow {
          animation: pulseSlow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
