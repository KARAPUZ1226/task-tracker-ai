import React from 'react';
import { Priority, Status } from '../types';
import { Search, X, LayoutGrid, ListFilter, Kanban, CheckCircle2 } from 'lucide-react';

interface FilterBarProps {
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

export const FilterBar: React.FC<FilterBarProps> = ({
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
  const percentCompleted = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по названию или описанию..."
            className="w-full bg-[#121215] border border-white/[0.08] focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 transition-all outline-none"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Toggle & Completion Progress */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          {totalCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 bg-white/[0.02] border border-white/[0.06] px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{completedCount}/{totalCount} выполнено ({percentCompleted}%)</span>
            </div>
          )}

          <div className="flex items-center bg-[#121215] p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => onViewModeChange('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Канбан</span>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Список</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.04]">
        <div className="flex items-center gap-1 text-[11px] text-zinc-500 mr-1">
          <ListFilter className="w-3.5 h-3.5" />
          <span>Фильтры:</span>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-[#121215] p-0.5 rounded-lg border border-white/[0.06]">
          {(['all', 'todo', 'in_progress', 'done'] as const).map((st) => (
            <button
              key={st}
              onClick={() => onStatusChange(st)}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-all ${
                statusFilter === st
                  ? 'bg-white/[0.1] text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {st === 'all' && 'Все статусы'}
              {st === 'todo' && 'To Do'}
              {st === 'in_progress' && 'В работе'}
              {st === 'done' && 'Готово'}
            </button>
          ))}
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-1 bg-[#121215] p-0.5 rounded-lg border border-white/[0.06]">
          {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((pr) => (
            <button
              key={pr}
              onClick={() => onPriorityChange(pr)}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-all ${
                priorityFilter === pr
                  ? 'bg-white/[0.1] text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {pr === 'all' && 'Все приоритеты'}
              {pr === 'urgent' && '🔥 Срочный'}
              {pr === 'high' && '⚡ Высокий'}
              {pr === 'medium' && 'Средний'}
              {pr === 'low' && 'Низкий'}
            </button>
          ))}
        </div>

        {(statusFilter !== 'all' || priorityFilter !== 'all' || search) && (
          <button
            onClick={() => {
              onStatusChange('all');
              onPriorityChange('all');
              onSearchChange('');
            }}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 underline ml-auto"
          >
            Сбросить фильтры
          </button>
        )}
      </div>
    </div>
  );
};
