import { useRouter } from 'next/navigation';
import { ArrowLeft, FileBox } from 'lucide-react';

const Navbar = () => {
    const router = useRouter();
  
    return (
      <nav className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-primary border-b border-color z-40 shadow-md">
        <div className="flex items-center justify-between h-full px-4">
          {/* Logo y titulo */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <FileBox className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          {/* Titulo central */}
          <h1 className="absolute left-1/2 transform -translate-x-1/2 text-lg font-medium text-label bg-primary/50 px-4 py-1 rounded-full backdrop-blur-sm">
            Volver Atras
          </h1>

          {/* Boton de regreso */}
          <button 
            onClick={() => router.push('/views/dashboard')}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-secondary transition-all duration-200 active:scale-95"
          >
            <ArrowLeft className="w-6 h-6 text-label" />
          </button>
        </div>
      </nav>
    );
};

export default Navbar;