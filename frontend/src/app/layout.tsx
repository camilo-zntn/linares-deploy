import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { Inter } from 'next/font/google';
import AuthCheck from '@/components/AuthCheck/page';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.className} suppressHydrationWarning>
      <body>
        <AuthProvider>
          <AuthCheck>
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#333',
                  color: '#fff'
                }
              }}
            />
            {children}
          </AuthCheck>
        </AuthProvider>
      </body>
    </html>
  );
}