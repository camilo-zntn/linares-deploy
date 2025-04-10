'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg hover:bg-emerald-500/10"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-gray-400 hover:text-emerald-500" />
      ) : (
        <Moon className="h-5 w-5 text-gray-400 hover:text-emerald-500" />
      )}
    </button>
  );
};