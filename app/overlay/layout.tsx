export const metadata = { title: 'Auction Overlay' }

export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'transparent', margin: 0, padding: 0, overflow: 'hidden', minHeight: '100vh' }}>
      {children}
    </div>
  )
}
