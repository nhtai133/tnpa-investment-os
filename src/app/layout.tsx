import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/nav/Sidebar';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TNPA Investment OS',
  description: 'Personal Family Office Operating System',
  applicationName: 'TNPA Investment OS',
  themeColor: '#818CF8',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TNPA OS',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0C0C0E] text-zinc-100 font-sans">
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
