/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: {
          50:'#fff7ed', 100:'#ffedd5', 200:'#fed7aa', 300:'#fdba74',
          400:'#fb923c', 500:'#f97316', 600:'#ea580c', 700:'#c2410c',
          800:'#9a3412', 900:'#7c2d12',
        },
        bhagwa: '#FF6B00',
      },
      fontFamily: {
        heading: ['"Tiro Devanagari Hindi"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'sold-stamp':  'soldStamp 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
        'unsold-fade': 'unsoldFade 0.6s ease-out forwards',
        'bid-pop':     'bidPop 0.25s ease-out',
        'glow-ring':   'glowRing 1.5s ease-in-out infinite',
        'confetti-fly':'confettiFly 1s ease-out forwards',
        'slide-up':    'slideUp 0.35s ease-out',
        'ticker':      'ticker 20s linear infinite',
      },
      keyframes: {
        soldStamp:  { '0%': { transform: 'scale(0) rotate(-12deg)', opacity: '0' }, '70%': { transform: 'scale(1.15) rotate(3deg)' }, '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' } },
        unsoldFade: { '0%': { transform: 'scale(1)', opacity: '1' }, '100%': { transform: 'scale(0.95)', opacity: '0' } },
        bidPop:     { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.08)' }, '100%': { transform: 'scale(1)' } },
        glowRing:   { '0%,100%': { boxShadow: '0 0 0 0 rgba(255,107,0,0.4)' }, '50%': { boxShadow: '0 0 0 12px rgba(255,107,0,0)' } },
        slideUp:    { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        ticker:     { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(-100%)' } },
      },
    },
  },
  plugins: [],
}
