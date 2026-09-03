import '../styles/globals.css';
import { Cinzel, Space_Grotesk } from 'next/font/google';
import AuthProvider from "../components/AuthProvider";

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const viewport = {
  themeColor: '#07080D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata = {
  metadataBase: new URL('https://zodia.studiopixel.cl'),
  title: 'Zodia | Astrología & Compatibilidad Consciente',
  description: 'Conexiones auténticas basadas en quién eres realmente. Descubre tu perfil astral, química de elementos y numerología.',
  applicationName: 'Zodia',
  authors: [{ name: 'Studio Pixel' }],
  keywords: ['Zodia', 'Astrología', 'Compatibilidad', 'Citas conscientes', 'Numerología', 'Signos zodiacales', 'Horóscopo', 'Sinastría'],
  manifest: '/zodia/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Zodia',
  },
  icons: {
    icon: [
      { url: '/zodia/assets/ico.png', type: 'image/png' },
    ],
    apple: [
      { url: '/zodia/assets/ico.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/zodia/assets/ico.png',
  },
  openGraph: {
    title: 'Zodia | Astrología & Compatibilidad Consciente',
    description: 'Conexiones auténticas basadas en quién eres realmente. Descubre tu perfil astral, química de elementos y numerología.',
    url: 'https://zodia.studiopixel.cl/zodia',
    siteName: 'Zodia',
    images: [
      {
        url: 'https://zodia.studiopixel.cl/zodia/assets/ico.png',
        width: 1024,
        height: 1024,
        type: 'image/png',
        alt: 'Zodia Logo Oficial',
      },
    ],
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Zodia | Astrología & Compatibilidad Consciente',
    description: 'Conexiones auténticas basadas en quién eres realmente. Descubre tu perfil astral, química de elementos y numerología.',
    images: ['https://zodia.studiopixel.cl/zodia/assets/ico.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${cinzel.variable} ${spaceGrotesk.variable}`}>
      <head>
        {/* Fallback directo para crawlers de WhatsApp y mensajería */}
        <meta property="og:image" content="https://zodia.studiopixel.cl/zodia/assets/ico.png" />
        <meta property="og:image:secure_url" content="https://zodia.studiopixel.cl/zodia/assets/ico.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <link rel="image_src" href="https://zodia.studiopixel.cl/zodia/assets/ico.png" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}