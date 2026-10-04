import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Shell } from '@/components/Shell';

export const metadata: Metadata = {
  title: 'TrialSetu · AIIA Clinical Trial & PV Platform',
  description: 'Auditable, role-based CTMS with built-in pharmacovigilance for Ayurveda/ASU studies (SIH26046 prototype, synthetic data).',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = { themeColor: '#1d7a69' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
