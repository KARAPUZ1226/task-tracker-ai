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
  LayoutGrid,
  List,
  Check,
  Plus,
} from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenCreate: () => void;
  viewMode: 'kanban' | 'list';
  onViewModeChange: (mode: 'kanban' | 'list') => void;
}

export const AppLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M12 2.5L3 7.5L12 12.5L21 7.5L12 2.5Z"
      className="fill-md-primary/20 stroke-md-primary"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 12L12 17L21 12"
      className="stroke-md-primary"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 16.5L12 21.5L21 16.5"
      className="stroke-md-primary"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onOpenCreate,
  viewMode,
  onViewModeChange,
}) => {
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
    <header className="sticky top-0 z-40 w-full border-b border-md-outline-variant/20 bg-md-surface/85 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand with Minimalist Logo */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-md-surface-container flex items-center justify-center border border-md-outline-variant/30 shadow-xs hover:scale-105 transition-transform">
            <AppLogo className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-md-on-surface">
                TaskTracker
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-md-primary-container text-md-on-primary-container flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </div>
            <p className="text-[11px] text-md-on-surface-variant hidden sm:block">
              Material You Task Manager
            </p>
          </div>
        </div>

        {/* Center: M3 Segmented Button for View Switch (Канбан / Список) */}
        <div className="flex items-center bg-md-surface-container rounded-full p-1 border border-md-outline-variant/30 shadow-xs">
          <button
            type="button"
            onClick={() => onViewModeChange('kanban')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              viewMode === 'kanban'
                ? 'bg-md-primary-container text-md-on-primary-container shadow-xs'
                : 'text-md-on-surface-variant hover:text-md-on-surface'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Канбан</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              viewMode === 'list'
                ? 'bg-md-primary-container text-md-on-primary-container shadow-xs'
                : 'text-md-on-surface-variant hover:text-md-on-surface'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Список</span>
          </button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3" ref={menuRef}>
          {/* Quick AI key status */}
          <button
            type="button"
            onClick={onOpenSettings}
            className={`hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
              apiKey
                ? 'border-md-primary/30 text-md-on-primary-container bg-md-primary-container'
                : 'border-md-outline-variant/30 text-md-on-surface-variant hover:bg-md-surface-container'
            }`}
            title="Настройки AI"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{apiKey ? 'AI готов' : 'AI ключ'}</span>
          </button>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-full text-md-on-surface-variant hover:bg-md-surface-container hover:text-md-on-surface active:scale-95 transition-all"
            title="Переключить тему"
            aria-label="Переключить тему"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 rotate-0 transition-transform" />
            ) : (
              <Moon className="w-5 h-5 text-md-primary transition-transform" />
            )}
          </button>

          {/* User Profile Avatar / Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-full bg-md-primary-container text-md-on-primary-container border border-md-primary/20 flex items-center justify-center text-sm font-bold shadow-xs hover:scale-105 active:scale-95 transition-all"
              title="Профиль и меню"
              aria-label="Меню пользователя"
            >
              {user?.email[0].toUpperCase()}
            </button>

            {/* M3 Menu Dialog */}
            {menuOpen && (
              <div className="absolute right-0 top-12 z-50 w-72 rounded-[28px] bg-md-surface-container-low border border-md-outline-variant/30 shadow-2xl p-3 space-y-2.5 animate-pop-in">
                {/* User Section */}
                <div className="p-3 rounded-2xl bg-md-surface-container border border-md-outline-variant/20 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-md-primary text-md-on-primary flex items-center justify-center text-xs font-bold shadow-xs">
                    {user?.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-md-on-surface truncate">
                      {user?.email}
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      В сети
                    </div>
                  </div>
                </div>

                {/* Theme Selector */}
                <div className="p-2.5 rounded-2xl bg-md-surface-container border border-md-outline-variant/20 space-y-1.5">
                  <div className="text-[11px] font-semibold text-md-on-surface-variant px-1">
                    Тема оформления
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 bg-md-surface-container-high p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        theme === 'light'
                          ? 'bg-md-surface text-md-on-surface shadow-xs font-semibold'
                          : 'text-md-on-surface-variant hover:text-md-on-surface'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Светлая</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        theme === 'dark'
                          ? 'bg-md-surface text-md-on-surface shadow-xs font-semibold'
                          : 'text-md-on-surface-variant hover:text-md-on-surface'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Тёмная</span>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenCreate();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-md-on-surface hover:bg-md-surface-container transition-colors"
                  >
                    <Plus className="w-4 h-4 text-md-primary" />
                    <span>Создать новую задачу</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-md-on-surface hover:bg-md-surface-container transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Key className="w-4 h-4 text-md-primary" />
                      <span>Настройки AI ключа</span>
                    </div>
                    {apiKey && <Check className="w-3.5 h-3.5 text-md-primary" />}
                  </button>

                  <a
                    href="/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-md-on-surface hover:bg-md-surface-container transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileCode className="w-4 h-4 text-md-primary" />
                      <span>Swagger API Docs</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-md-on-surface-variant" />
                  </a>

                  <div className="my-1 border-t border-md-outline-variant/20" />

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
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
