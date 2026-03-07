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
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-700 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="relative mb-12">
        {/* Gavel Icon with "Hit" Animation */}
        <div className="animate-gavel-hit transform-origin-bottom-right drop-shadow-[0_10px_35px_rgba(234,179,8,0.2)]">
          <img src="/gavel.png" alt="Gavel" className="w-28 h-28 sm:w-36 sm:h-36 object-contain" />
        </div>
        {/* Impact Base */}
        <div className="h-2 w-20 sm:w-24 bg-stone-900/50 rounded-full mx-auto mt-[-5px] blur-[1px] shadow-[0_5px_15px_rgba(234,179,8,0.1)]" />
      </div>

      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter bg-gradient-to-b from-saffron-300 via-saffron-500 to-saffron-700 bg-clip-text text-transparent animate-pulse-slow px-4">
          Bidding...
        </h1>
        <p className="mt-6 text-saffron-500/60 font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs px-6">
          India's Dedicated Digital Platform for Cricket Auctions
        </p>
      </div>

      <style jsx global>{`
        @keyframes gavelHit {
          0% { transform: rotate(-25deg); }
          45% { transform: rotate(10deg); }
          50% { transform: rotate(15deg); }
          55% { transform: rotate(10deg); }
          100% { transform: rotate(-25deg); }
        }
        .animate-gavel-hit {
          animation: gavelHit 0.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          transform-origin: bottom right;
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.98); }
        }
        .animate-pulse-slow {
          animation: pulseSlow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
