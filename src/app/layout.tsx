import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/nav/Sidebar';
import { MobileNavSystem } from '@/components/nav/MobileNavSystem';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TNPA Wealth OS',
  description: 'Personal Family Office Operating System',
  applicationName: 'TNPA Wealth OS',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TNPA Wealth OS',
  },
};

export const viewport: Viewport = {
  themeColor: '#818CF8',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0C0C0E] text-zinc-100 font-sans">
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
            {children}
          </div>
        </div>
        <MobileNavSystem />
      </body>
    </html>
  );
}
