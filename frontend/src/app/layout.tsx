import { Inter } from 'next/font/google';
import AppShell from '@/components/AppShell';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.className} suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          as="image"
          href="/img/logo.png"
          imageSizes="(max-width: 768px) 200px, (max-width: 1200px) 300px, 400px"
          imageSrcSet="/_next/image?url=%2Fimg%2Flogo.png&w=256&q=85 256w, /_next/image?url=%2Fimg%2Flogo.png&w=384&q=85 384w, /_next/image?url=%2Fimg%2Flogo.png&w=640&q=85 640w"
        />
      </head>
      <body suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
