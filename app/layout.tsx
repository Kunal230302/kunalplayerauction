import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: "Player Auction Hub – India's Dedicated Digital Platform for Cricket Auctions",
  description: "Cricket Auction Hub is India’s most trusted digital platform designed specifically for cricket. We’ve removed the clutter of other sports to focus 100% on the gentleman's game. From local club leagues to massive corporate tournaments, manage your player bidding with professional-grade tools.",
  icons: {
    icon: '/icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-stone-50">
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#fff', color: '#1c1917',
                border: '2px solid #f97316', borderRadius: '14px',
                fontFamily: '"DM Sans", sans-serif', fontWeight: 600, fontSize: 14,
              },
              success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
              duration: 3500,
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
