import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth/auth-provider'
import { ProtectedLayout } from '@/components/auth/protected-layout'
import { Analytics } from '@vercel/analytics/next'
import ErrorBoundary from '@/components/ui/error-boundary'
import { PerformanceMonitor } from '@/components/ui/performance-monitor'
import { OfflineIndicator } from '@/hooks/use-offline'
import { AppClientProviders } from '@/components/app-client-providers'
import { ThemeProvider } from '@/components/theme/theme-provider'

const appTitle = 'Easy Health 膠囊配方管理系統'
const appDescription = 'Easy Health 內部生產管理系統'
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://capsuledb.easyhealth.internal'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2a96d1' },
    { media: '(prefers-color-scheme: dark)', color: '#1a5a7f' }
  ]
}

export const metadata: Metadata = {
  title: appTitle,
  description: appDescription,
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: baseUrl,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Easy Health',
    startupImage: [
      '/apple-touch-icon.png'
    ]
  },
  other: {
    'mobile-web-app-capable': 'yes'
  },
  applicationName: 'Easy Health',
  openGraph: {
    title: appTitle,
    description: appDescription,
    url: baseUrl,
    siteName: appTitle,
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: appTitle,
    description: appDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const theme = localStorage.getItem('easy-health-theme');
              const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (theme === 'dark' || (!theme && systemDark)) {
                document.documentElement.classList.add('dark');
              }
            })();
          `
        }} />
      </head>
      <body className="antialiased" style={{ WebkitTextSizeAdjust: '100%', textSizeAdjust: '100%', MozTextSizeAdjust: '100%', fontSize: '16px' }}>
        <ThemeProvider defaultTheme="system" storageKey="easy-health-theme">
          <AppClientProviders>
            <ErrorBoundary>
              <AuthProvider>
                <ProtectedLayout>
                  <div className="min-h-screen">
                    {children}
                  </div>
                </ProtectedLayout>
              </AuthProvider>
            </ErrorBoundary>
            <PerformanceMonitor />
            {process.env.NODE_ENV === 'production' && process.env.VERCEL && <Analytics />}
          </AppClientProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
