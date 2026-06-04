import { useApp } from '../context/AppContext.js';
import { Menu, Sun, Moon, Calendar, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  onMenuToggle: () => void;
  isLoading?: boolean;
}

export default function Header({ onMenuToggle, isLoading = false }: HeaderProps) {
  const { user, theme, toggleTheme } = useApp();
  const [greeting, setGreeting] = useState('');
  const [timeStr, setTimeStr] = useState('');

  // Auto Greeting + Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = now.getHours();

      if (hrs < 12) setGreeting('Good morning');
      else if (hrs < 18) setGreeting('Good afternoon');
      else setGreeting('Good evening');

      // Nice short and elegant format: "Mon, May 25, 08:30 PM"
      const formatted = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setTimeStr(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 px-6 flex items-center justify-between sticky top-0 z-30 transition-all duration-200 glass-header">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Dynamic Greeting */}
        <div className="hidden sm:block">
          <h1 className="text-base font-medium text-gray-900 dark:text-slate-100">
            {user ? `${greeting}, ${user.fullName}` : 'Welcome back'}
          </h1>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            Enjoy full administrative system access.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Status Indicators (e.g. Loading progress) */}
        {isLoading && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold animate-pulse mr-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Syncing</span>
          </div>
        )}

        {/* Real-time Clock Widget */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-gray-700 dark:text-slate-300 font-medium glass-input">
          <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500" />
          <span>{timeStr || 'Loading clock...'}</span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle visual theme"
          className="p-2.5 rounded-xl text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white cursor-pointer shadow-sm transition-all glass-input"
        >
          {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5 text-amber-400" />}
        </button>
      </div>
    </header>
  );
}
