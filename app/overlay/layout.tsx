import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = { title: 'Auction Overlay' }

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'transparent',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      width: '100%',
      height: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
    }}>
      {children}
    </div>
  )
}
