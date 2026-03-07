import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'PlayerAuctionHub – Local Cricket Auction',
  description: 'Live cricket player auction platform for local tournaments. playerauctionhub.in',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
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
