import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic, Tajawal } from 'next/font/google';

import './globals.css';

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic'
});

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-sans'
});

export const metadata: Metadata = {
  title: "Jam'iyya AI",
  description: 'Smart savings circle platform with AI trust scoring and escrow.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ibmPlexSansArabic.variable} ${tajawal.variable} bg-background text-foreground antialiased`}>
        {children}
      </body>
    </html>
  );
}