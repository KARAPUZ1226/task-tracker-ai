import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingAddButtonProps {
  onClick: () => void;
  className?: string;
  extended?: boolean;
}

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onClick, className = '', extended = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-30 h-14 ${
        extended ? 'px-6 rounded-2xl gap-3' : 'w-14 rounded-2xl'
      } bg-md-primary-container text-md-on-primary-container hover:shadow-xl hover:shadow-cyan-900/20 active:scale-95 border border-md-outline-variant/30 flex items-center justify-center transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-primary ${className}`}
      title="Создать задачу (N)"
      aria-label="Создать новую задачу"
    >
      <Plus className="w-6 h-6 stroke-[2.2] transition-transform duration-300 group-hover:rotate-90 text-md-on-primary-container" />
      {extended && <span className="font-semibold text-sm tracking-wide">Новая задача</span>}
    </button>
  );
};

