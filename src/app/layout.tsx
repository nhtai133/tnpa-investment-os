import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { TopNav } from '@/components/nav/TopNav';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TNPA Investment OS',
  description: 'Personal Family Office Operating System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#0C0C0E] text-zinc-100 font-sans">
        <TopNav />
        {children}
      </body>
    </html>
  );
}
