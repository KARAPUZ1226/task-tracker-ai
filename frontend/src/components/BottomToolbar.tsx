import React from 'react';
import { Priority, Status } from '../types';
import { Search, X, Circle, Clock, CheckCircle2 } from 'lucide-react';
import { FloatingAddButton } from './FloatingAddButton';

interface BottomToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  priorityFilter: Priority | 'all';
  onPriorityChange: (priority: Priority | 'all') => void;
  activeColumn: Status;
  onColumnChange: (status: Status) => void;
  columnCounts: { todo: number; in_progress: number; done: number };
  onOpenCreate: () => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  search,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  activeColumn,
  onColumnChange,
  columnCounts,
  onOpenCreate,
}) => {
  const priorities: { id: Priority | 'all'; label: string; dot?: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'urgent', label: 'Срочный', dot: 'bg-rose-500' },
    { id: 'high', label: 'Высокий', dot: 'bg-amber-500' },
    { id: 'medium', label: 'Средний', dot: 'bg-slate-400' },
    { id: 'low', label: 'Низкий', dot: 'bg-zinc-400' },
  ];

  const columnTabs: { id: Status; title: string; count: number; icon: React.ReactNode }[] = [
    {
      id: 'todo',
      title: 'К выполнению',
      count: columnCounts.todo,
      icon: <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />,
    },
    {
      id: 'in_progress',
      title: 'В работе',
      count: columnCounts.in_progress,
      icon: <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 animate-spin-slow" />,
    },
    {
      id: 'done',
      title: 'Готово',
      count: columnCounts.done,
      icon: <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />,
    },
  ];

  return (
    <>
      {/* Кнопка «+» (FAB) на десктопе: плавающая в правом нижнем углу (на мобильных экранах кнопка строго сверху) */}
      <div className="pointer-events-auto">
        <FloatingAddButton
          onClick={onOpenCreate}
          className="hidden md:flex fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-40"
        />
      </div>

      {/* Стек полупрозрачных блоков внизу (снизу вверх: Категории -> Приоритеты -> Поиск) */}
      <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[calc(100%-1.5rem)] flex flex-col items-center pointer-events-none">
        {/* 1. Блок поиска (чуть выше приоритетов, в отдельном полупрозрачном блоке) */}
        <div className="pointer-events-auto w-full mb-2 sm:mb-2.5 p-1.5 sm:p-2 rounded-2xl bg-white/75 dark:bg-[#12141a]/75 backdrop-blur-xl border border-zinc-200/70 dark:border-white/10 shadow-xl shadow-black/10 transition-all duration-300 hover:border-zinc-300 dark:hover:border-white/20 hover:-translate-y-0.5 animate-slide-up-1">
          <div className="relative flex items-center bg-zinc-100/80 dark:bg-black/40 rounded-xl border border-zinc-200/60 dark:border-white/[0.08] px-3 py-2 sm:py-2.5 focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500 transition-all duration-200">
            <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 mr-2 shrink-0 transition-colors" />
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
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md transition-all active:scale-90 hover:rotate-90"
                title="Очистить поиск"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Блок фильтра приоритетов (отцентрованно, уменьшен на 25%, близко к блоку категорий) */}
        <div className="pointer-events-auto mx-auto mb-1.5 p-1 rounded-xl bg-white/75 dark:bg-[#12141a]/75 backdrop-blur-xl border border-zinc-200/70 dark:border-white/10 shadow-md shadow-black/10 transition-all duration-300 animate-slide-up-2">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {priorities.map((item) => {
              const isActive = priorityFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPriorityChange(isActive && item.id !== 'all' ? 'all' : item.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap active:scale-95 hover:scale-105 transition-all duration-200 ${
                    isActive
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs font-semibold scale-100'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100/60 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {item.dot && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${item.dot} ${
                        item.id === 'urgent' ? 'animate-pulse animate-pulse-glow' : ''
                      }`}
                    />
                  )}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Блок категории-колонки («К выполнению», «В работе», «Готово» - самый нижний отдельный блок) */}
        <div className="pointer-events-auto w-full p-1.5 sm:p-2 rounded-2xl bg-white/75 dark:bg-[#12141a]/75 backdrop-blur-xl border border-zinc-200/70 dark:border-white/10 shadow-xl shadow-black/10 transition-all duration-300 animate-slide-up-3">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {columnTabs.map((tab) => {
              const isActive = activeColumn === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onColumnChange(tab.id)}
                  className={`flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-sm font-semibold active:scale-95 transition-all duration-200 ${
                    isActive
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md scale-[1.02] relative z-10'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-white/[0.05] hover:scale-[1.01]'
                  }`}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="truncate">{tab.title}</span>
                  <span
                    className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold shrink-0 transition-transform ${
                      isActive
                        ? 'bg-white/20 dark:bg-zinc-900/15 text-white dark:text-zinc-900'
                        : 'bg-zinc-200/70 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
