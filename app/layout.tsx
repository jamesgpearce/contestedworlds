import type { Metadata } from 'next';
import { themeBootstrap } from '@/lib/theme';
import { Analytics } from '@/components/analytics';
import {
  assetPath,
  absoluteAssetUrl,
  siteUrl,
  siteTitle,
  siteDescription,
} from '@/lib/site-config';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: assetPath('/favicon.svg'),
    apple: assetPath('/apple-touch-icon.png'),
  },
  title: siteTitle,
  description: siteDescription,
  applicationName: 'Contested Worlds',
  authors: [{ name: 'James Pearce', url: 'https://github.com/jamesgpearce' }],
  alternates: { canonical: siteUrl },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'Contested Worlds',
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    images: [
      {
        url: absoluteAssetUrl('/social-card.png'),
        width: 1200,
        height: 630,
        alt: 'Contested Worlds. Caribbean island histories traced across Indigenous, Spanish, British, French and independent power bands.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: absoluteAssetUrl('/social-card.png'),
        alt: 'Contested Worlds — an interactive history of Caribbean political power.',
      },
    ],
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
