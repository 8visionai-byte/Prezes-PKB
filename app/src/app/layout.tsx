import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Asystent Prezesa PKB',
  description: 'Asystent AI Partnerskich Klubów Biznesu',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Asystent PKB' },
};

export const viewport: Viewport = {
  themeColor: '#14100c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="pkb-glow min-h-dvh antialiased">{children}</body>
    </html>
  );
}
