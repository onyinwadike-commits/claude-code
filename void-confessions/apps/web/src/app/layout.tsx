import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Void Confessions',
    template: '%s | Void Confessions',
  },
  description: 'Release your thoughts into the void. Anonymous confessions for grief, rage, guilt, longing, and relief.',
  keywords: ['confessions', 'anonymous', 'mental health', 'catharsis', 'emotional release'],
  authors: [{ name: 'Void Confessions' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Void Confessions',
    title: 'Void Confessions',
    description: 'Release your thoughts into the void',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Void Confessions',
    description: 'Release your thoughts into the void',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1e1033' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-void-950 text-white min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
