import React from 'react';
import { Priority, Status } from '../types';

interface BottomToolbarProps {
  activeColumn: Status;
  onSelectColumn: (status: Status) => void;
  columnCounts: {
    todo: number;
    in_progress: number;
    done: number;
  };
  priorityFilter: Priority | 'all';
  onPriorityChange: (priority: Priority | 'all') => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  activeColumn,
  onSelectColumn,
  columnCounts,
  priorityFilter,
  onPriorityChange,
}) => {
  const progressTabs: { id: Status; title: string; count: number }[] = [
    { id: 'todo', title: 'К выполнению', count: columnCounts.todo },
    { id: 'in_progress', title: 'В работе', count: columnCounts.in_progress },
    { id: 'done', title: 'Готово', count: columnCounts.done },
  ];

  const priorities: { id: Priority | 'all'; label: string; dot?: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'urgent', label: 'Срочный', dot: 'bg-rose-500' },
    { id: 'high', label: 'Высокий', dot: 'bg-amber-500' },
    { id: 'medium', label: 'Средний', dot: 'bg-slate-400' },
    { id: 'low', label: 'Низкий', dot: 'bg-zinc-400' },
  ];

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-3 sm:left-1/2 sm:-translate-x-1/2 right-20 sm:right-auto z-40 max-w-4xl w-[calc(100%-5.5rem)] sm:w-auto">
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl bg-white/85 dark:bg-[#12141a]/85 backdrop-blur-xl border border-zinc-200/80 dark:border-white/[0.1] shadow-2xl shadow-black/10 transition-all duration-300">
        {/* Вкладки прогресса задачи с Фото 3 (перенесены вниз) */}
        <div className="flex items-center gap-1 bg-zinc-100/90 dark:bg-black/35 p-0.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] shrink-0">
          {progressTabs.map((tab) => {
            const isActive = activeColumn === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectColumn(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold scale-[1.02]'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <span>{tab.title}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-zinc-200 dark:bg-white/[0.12] text-zinc-900 dark:text-white'
                      : 'bg-zinc-200/70 dark:bg-black/40 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="hidden sm:block h-4 w-[1px] bg-zinc-200 dark:bg-white/[0.1] mx-0.5 shrink-0" />

        {/* Выбор приоритета задачи (БЕЗ кнопки сброс!) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {priorities.map((item) => {
            const isActive = priorityFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPriorityChange(isActive && item.id !== 'all' ? 'all' : item.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all duration-200 ${
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
