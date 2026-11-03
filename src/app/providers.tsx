'use client'

import { Toaster } from 'react-hot-toast'
import { LanguageProvider } from '@/contexts/language-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
        }}
      />
    </LanguageProvider>
  )
}
