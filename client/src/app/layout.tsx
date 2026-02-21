import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/shared/Providers'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: {
    default: 'FleetFlow',
    template: '%s | FleetFlow',
  },
  description: 'Modular Fleet & Logistics Management System',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1C2132',
                border: '1px solid #232840',
                color: '#F0F4FF',
                fontSize: '13px',
                fontFamily: 'DM Sans, sans-serif',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}