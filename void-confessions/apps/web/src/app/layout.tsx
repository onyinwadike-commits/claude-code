import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Void Confessions',
  description: 'Share your anonymous confessions into the void',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
