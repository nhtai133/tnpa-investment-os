import type { Metadata, Viewport } from 'next';
import { Sidebar } from '@/components/nav/Sidebar';
import { MobileNavSystem } from '@/components/nav/MobileNavSystem';
import { DevelopmentBanner } from '@/components/nav/DevelopmentBanner';
import { APP_ENV, APP_NAME } from '@/lib/env';
import './globals.css';
export const dynamic = 'force-dynamic';


export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Quản lý gia sản cá nhân',
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
    <html lang="vi">
      <body className="bg-[#0C0C0E] text-zinc-100 font-sans">
        <DevelopmentBanner environment={APP_ENV} />
        <div className={`flex ${APP_ENV === 'development' ? 'h-[calc(100vh-2rem)]' : 'h-screen'}`}>
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
