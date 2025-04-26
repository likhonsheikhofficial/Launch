import { VersionControl } from '@/components/ui/version-control'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'agent App',
  description: 'Created with agent',
  generator: 'agent.dev',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen">
            <div className="flex-1">
              {children}
            </div>
            <div className="w-80 border-l p-4 bg-background">
              <VersionControl
                componentName="current"
                currentCode=""
              />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
