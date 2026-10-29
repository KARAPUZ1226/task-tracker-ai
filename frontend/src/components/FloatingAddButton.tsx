import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingAddButtonProps {
  onClick: () => void;
}

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-600/90 hover:bg-emerald-500 text-white flex items-center justify-center backdrop-blur-xl shadow-2xl shadow-emerald-600/35 ring-1 ring-white/25 hover:scale-105 active:scale-95 transition-all duration-200"
      title="Создать новую задачу"
      aria-label="Создать новую задачу"
    >
      <Plus className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
    </button>
  );
};
