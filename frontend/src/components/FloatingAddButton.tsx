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
      className={`w-12 h-12 sm:w-[54px] sm:h-[54px] rounded-2xl bg-emerald-600/95 hover:bg-emerald-500 text-white flex items-center justify-center backdrop-blur-xl shadow-xl shadow-emerald-600/35 ring-1 ring-white/25 hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 ${className}`}
      title="Создать новую задачу"
      aria-label="Создать новую задачу"
    >
      <Plus className="w-6 h-6 stroke-[2.3]" />
    </button>
  );
};

