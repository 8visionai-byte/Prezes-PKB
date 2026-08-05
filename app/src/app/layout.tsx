import type { Metadata, Viewport } from 'next';
import { Nawigacja } from '@/components/Nawigacja';
import './globals.css';

export const metadata: Metadata = {
  title: 'Asystent Prezesa PKB',
  description: 'Asystent AI Partnerskich Klubów Biznesu',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Asystent PKB' },
};

export const viewport: Viewport = {
  themeColor: '#0c0908',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-dvh">
        <div className="pkb-sfery" aria-hidden>
          <span />
        </div>
        <Nawigacja />
        <div className="relative z-10 lg:pl-[264px]">{children}</div>
      </body>
    </html>
  );
}
