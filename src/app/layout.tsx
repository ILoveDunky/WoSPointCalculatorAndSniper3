import type { Metadata } from 'next';
import { Space_Grotesk, Manrope } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import { BASE_PATH } from '@/lib/site-config';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Coldsnap \u2014 Whiteout Survival event & sniping calculator',
  description: 'Calculate event points and find the cheapest way to close a point gap in Whiteout Survival, using only what you already have on hand.',
  icons: {
    icon: [
      { url: `${BASE_PATH}/icon.svg`, type: 'image/svg+xml' },
      { url: `${BASE_PATH}/icon-32.png`, sizes: '32x32', type: 'image/png' },
      { url: `${BASE_PATH}/icon-256.png`, sizes: '256x256', type: 'image/png' },
    ],
    shortcut: `${BASE_PATH}/favicon.ico`,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable} ${manrope.variable}`}>
      <body className="font-body antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
