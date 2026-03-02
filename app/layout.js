import './globals.css';
import Providers from './providers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://playwise.vercel.app';

export const metadata = {
  title: {
    default: 'Playwise — Calm Online Kids Games for Ages 3+',
    template: '%s | Playwise',
  },
  description:
    'Free, calm online games for kids ages 3-6. Typing, math, logic puzzles, memory and more — no ads, no tracking, just learning through play.',
  keywords: [
    'kids games',
    'educational games',
    'games for children',
    'typing games',
    'math games',
    'logic puzzles',
    'memory games',
    'preschool games',
    'toddler games',
    'free kids games',
    'ігри для дітей',
    'розвиваючі ігри',
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Playwise — Calm Online Kids Games',
    description:
      'Free, calm games for ages 3-6. Typing, math, logic & more — no ads, no tracking.',
    url: siteUrl,
    siteName: 'Playwise',
    locale: 'en_US',
    alternateLocale: 'uk_UA',
    type: 'website',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Playwise — Calm Online Kids Games',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Playwise — Calm Online Kids Games',
    description:
      'Free, calm games for ages 3-6. Typing, math, logic & more — no ads, no tracking.',
    images: ['/og-image.svg'],
  },
  icons: {
    icon: [
      { url: '/playwise-logo.svg', type: 'image/svg+xml' },
      { url: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
    apple: { url: '/playwise-logo.svg' },
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f7f2ff',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
