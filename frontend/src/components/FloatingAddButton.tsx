import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingAddButtonProps {
  onClick: () => void;
  className?: string;
}

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onClick, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`aspect-square rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white flex items-center justify-center backdrop-blur-xl shadow-xl shadow-emerald-600/35 border border-emerald-500/40 hover:border-emerald-400/60 ring-1 ring-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 hover:scale-105 active:scale-95 transition-all duration-300 shrink-0 group ${className}`}
      title="Создать новую задачу"
      aria-label="Создать новую задачу"
    >
      <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.4] transition-transform duration-300 group-hover:rotate-90" />
    </button>
  );
};

