import type { Metadata } from 'next';
import { themeBootstrap } from '@/lib/theme';
import './globals.css';
export const metadata: Metadata = {
  icons: { icon: '/favicon.svg?v=contested-worlds' },
  title: 'Contested Worlds — The Caribbean, 1450–2026',
  description:
    'Follow 36 island histories through conquest, treaties, occupation and independence. A sourced interactive atlas of the Caribbean.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
