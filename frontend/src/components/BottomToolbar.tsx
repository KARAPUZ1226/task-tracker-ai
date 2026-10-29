import React from 'react';
import { Priority } from '../types';
import { Search, X } from 'lucide-react';
import { FloatingAddButton } from './FloatingAddButton';

interface BottomToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  priorityFilter: Priority | 'all';
  onPriorityChange: (priority: Priority | 'all') => void;
  onOpenCreate: () => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  search,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  onOpenCreate,
}) => {
  const priorities: { id: Priority | 'all'; label: string; dot?: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'urgent', label: 'Срочный', dot: 'bg-rose-500' },
    { id: 'high', label: 'Высокий', dot: 'bg-amber-500' },
    { id: 'medium', label: 'Средний', dot: 'bg-slate-400' },
    { id: 'low', label: 'Низкий', dot: 'bg-zinc-400' },
  ];

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[calc(100%-2rem)] flex flex-col items-end gap-2 pointer-events-none">
      {/* Кнопка «+» (FAB) - на 15% меньше и над строкой поиска справа */}
      <div className="pointer-events-auto">
        <FloatingAddButton onClick={onOpenCreate} />
      </div>

      {/* Единая плавающая панель: поиск над категориями */}
      <div className="pointer-events-auto w-full flex flex-col gap-2 p-2 sm:p-2.5 rounded-2xl bg-white/85 dark:bg-[#12141a]/85 backdrop-blur-xl border border-zinc-200/80 dark:border-white/[0.1] shadow-2xl shadow-black/15 transition-all duration-300">
        {/* Строка поиска (спустилась вниз над категориями) */}
        <div className="relative flex items-center bg-zinc-100/90 dark:bg-black/35 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] px-3 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500 transition-all">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 mr-2 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск задач..."
            className="w-full bg-transparent text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded-md transition-colors"
              title="Очистить поиск"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Категории приоритетов (Все, Срочный, Высокий, Средний, Низкий) */}
        <div className="flex items-center justify-center gap-1 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {priorities.map((item) => {
            const isActive = priorityFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPriorityChange(isActive && item.id !== 'all' ? 'all' : item.id)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs font-semibold scale-[1.02]'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                {item.dot && <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
