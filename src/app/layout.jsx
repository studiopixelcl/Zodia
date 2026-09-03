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
  themeColor: '#030308',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata = {
  title: 'Zodia | Citas Astrales y Compatibilidad',
  description: 'Conecta con personas predestinadas según tu sinergia zodiacal, arquetipos y numerología.',
  manifest: '/zodia/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Zodia',
  },
  icons: {
    icon: '/zodia/assets/icon.svg',
    apple: '/zodia/assets/icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${cinzel.variable} ${spaceGrotesk.variable}`}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}