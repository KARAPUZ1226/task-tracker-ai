import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Sparkles,
  LogOut,
  Key,
  FileCode,
  ExternalLink,
  Sun,
  Moon,
  User,
  Check,
} from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
}

export const AppLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M12 2.5L3 7.5L12 12.5L21 7.5L12 2.5Z"
      className="fill-emerald-500/20 stroke-emerald-500"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 12L12 17L21 12"
      className="stroke-emerald-500"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 16.5L12 21.5L21 16.5"
      className="stroke-emerald-600 dark:stroke-emerald-400"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings }) => {
  const { user, logout, apiKey } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#090a0f]/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand with Minimalist Logo (Задача 6) */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-[#13161c] border border-zinc-200 dark:border-white/[0.1] flex items-center justify-center shadow-sm">
            <AppLogo className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-white">
                TaskTracker
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 hidden sm:block">Интеллектуальный трекер задач</p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3" ref={menuRef}>
          {/* Desktop quick links */}
          <div className="hidden md:flex items-center gap-2">
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.15] hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-all"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-500" />
              <span>Swagger API</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>

            <button
              onClick={onOpenSettings}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                apiKey
                  ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'border-zinc-200 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{apiKey ? 'AI подключен' : 'AI ключ'}</span>
            </button>
          </div>

          {/* Three Stripes Hamburger Button (Задача 5) */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center p-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-200 transition-all shadow-sm active:scale-95"
              title="Главное меню"
              aria-label="Главное меню"
            >
              <div className="w-4 h-3.5 flex flex-col justify-between">
                <span className="w-full h-0.5 bg-zinc-700 dark:bg-zinc-200 rounded transition-all" />
                <span className="w-full h-0.5 bg-zinc-700 dark:bg-zinc-200 rounded transition-all" />
                <span className="w-full h-0.5 bg-zinc-700 dark:bg-zinc-200 rounded transition-all" />
              </div>
            </button>

            {/* Dropdown Menu (Задача 5 & Задача 8) */}
            {menuOpen && (
              <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl bg-white dark:bg-[#141720] border border-zinc-200 dark:border-white/[0.1] shadow-2xl p-2.5 space-y-2 animate-fade-in">
                {/* User Section */}
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#1a1d26] border border-zinc-200/60 dark:border-white/[0.04] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {user?.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                      {user?.email}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      В сети
                    </div>
                  </div>
                </div>

                {/* Theme Selector (Задача 8) */}
                <div className="p-2 rounded-xl bg-zinc-50 dark:bg-[#1a1d26] border border-zinc-200/60 dark:border-white/[0.04] space-y-1.5">
                  <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 px-1">
                    Тема оформления
                  </div>
                  <div className="grid grid-cols-2 gap-1 bg-zinc-200/60 dark:bg-black/30 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        theme === 'light'
                          ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Светлая</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        theme === 'dark'
                          ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Тёмная</span>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-0.5 pt-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-500" />
                      <span>Настройки AI ключа</span>
                    </div>
                    {apiKey && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                  </button>

                  <a
                    href="/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-blue-500" />
                      <span>Swagger API Docs</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  </a>

                  <div className="my-1 border-t border-zinc-200 dark:border-white/[0.06]" />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Выйти из аккаунта</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
