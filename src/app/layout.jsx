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

export const metadata = {
  title: 'Zodia | El Espejo Astral',
  description: 'Plataforma de Resonancia Astral',
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