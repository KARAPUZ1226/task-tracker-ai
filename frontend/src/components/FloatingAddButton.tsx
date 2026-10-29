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
      className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-600/30 ring-1 ring-white/20 hover:scale-105 active:scale-95 transition-all duration-200"
      title="Создать новую задачу"
      aria-label="Создать новую задачу"
    >
      <Plus className="w-7 h-7 stroke-[2.2]" />
    </button>
  );
};
