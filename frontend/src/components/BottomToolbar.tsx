import React, { useState } from 'react';
import { Priority, Status } from '../types';
import { Search, X, Kanban, LayoutGrid, CheckCircle2 } from 'lucide-react';

interface BottomToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: Status | 'all';
  onStatusChange: (status: Status | 'all') => void;
  priorityFilter: Priority | 'all';
  onPriorityChange: (priority: Priority | 'all') => void;
  viewMode: 'kanban' | 'list';
  onViewModeChange: (mode: 'kanban' | 'list') => void;
  totalCount: number;
  completedCount: number;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  viewMode,
  onViewModeChange,
  totalCount,
  completedCount,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);

  const priorities: { id: Priority | 'all'; label: string; dot?: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'urgent', label: 'Срочный', dot: 'bg-rose-500' },
    { id: 'high', label: 'Высокий', dot: 'bg-amber-500' },
    { id: 'medium', label: 'Средний', dot: 'bg-slate-400' },
    { id: 'low', label: 'Низкий', dot: 'bg-zinc-400' },
  ];

  const statuses: { id: Status | 'all'; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'todo', label: 'К выполнению' },
    { id: 'in_progress', label: 'В работе' },
    { id: 'done', label: 'Готово' },
  ];

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-4 sm:left-1/2 sm:-translate-x-1/2 right-20 sm:right-auto z-40 max-w-3xl">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-white/85 dark:bg-[#12141a]/85 backdrop-blur-xl border border-zinc-200/80 dark:border-white/[0.1] shadow-2xl transition-all duration-300">
        {/* Search Bar or Toggle */}
        <div className="relative flex items-center">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Поиск задач..."
              className="w-full bg-zinc-100/80 dark:bg-black/30 border border-zinc-200/80 dark:border-white/[0.06] focus:border-emerald-500 rounded-xl pl-8 pr-7 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Priority Filter with Dots (Задача 3 & Фото 3) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {priorities.map((item) => {
            const isActive = priorityFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPriorityChange(item.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.06]'
                }`}
              >
                {item.dot && <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden sm:block h-4 w-[1px] bg-zinc-200 dark:bg-white/[0.1] mx-0.5" />

        {/* View Mode Switcher: Kanban / List */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5">
          <div className="flex items-center bg-zinc-100/90 dark:bg-black/30 p-0.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => onViewModeChange('kanban')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Kanban className="w-3 h-3" />
              <span>Канбан</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Список</span>
            </button>
          </div>

          {/* Counter pill */}
          {totalCount > 0 && (
            <div className="hidden lg:flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 px-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>{completedCount}/{totalCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
