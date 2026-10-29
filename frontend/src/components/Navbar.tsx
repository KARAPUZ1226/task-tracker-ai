import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Plus, LogOut, Key, FileCode, CheckSquare, ExternalLink } from 'lucide-react';

interface NavbarProps {
  onOpenNewTask: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewTask, onOpenSettings }) => {
  const { user, logout, apiKey } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/[0.08] bg-[#09090b]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-white/20">
            <CheckSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-white">TaskTracker</span>
              <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse" /> AI
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">Интеллектуальный трекер задач</p>
          </div>
        </div>

        {/* Actions Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.04] transition-all"
            title="Интерактивная OpenAPI / Swagger документация"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <span>Swagger API</span>
            <ExternalLink className="w-3 h-3 text-zinc-500" />
          </a>

          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
              apiKey
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                : 'border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.04]'
            }`}
            title="Настройка AI API ключа"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{apiKey ? 'AI подключен' : 'AI ключ'}</span>
          </button>

          <div className="h-4 w-[1px] bg-white/[0.08] mx-1" />

          {/* User info */}
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-semibold text-white">
              {user?.email[0].toUpperCase()}
            </div>
            <span className="text-xs text-zinc-300 max-w-[150px] truncate">{user?.email}</span>
          </div>

          <button
            onClick={logout}
            className="p-2 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
            title="Выйти"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* New task button */}
          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium shadow-md shadow-brand-500/25 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Создать задачу</span>
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={onOpenNewTask}
            className="p-2 rounded-lg bg-brand-600 text-white"
            title="Создать задачу"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border border-white/[0.1] text-zinc-300"
          >
            <span className="sr-only">Меню</span>
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className="w-full h-0.5 bg-zinc-300 rounded" />
              <span className="w-full h-0.5 bg-zinc-300 rounded" />
              <span className="w-full h-0.5 bg-zinc-300 rounded" />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#121215] px-4 py-3 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <span className="text-xs text-zinc-400 truncate">{user?.email}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
            >
              <LogOut className="w-3.5 h-3.5" /> Выйти
            </button>
          </div>
          <div className="flex items-center justify-between pt-1">
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5"
            >
              <FileCode className="w-4 h-4 text-indigo-400" /> Swagger / Docs
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSettings();
              }}
              className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5"
            >
              <Key className="w-4 h-4 text-emerald-400" /> Настройки AI
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
