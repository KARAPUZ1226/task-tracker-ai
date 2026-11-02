import React from 'react';
import { Priority, Status } from '../types';
import { Search, X, Circle, Clock, CheckCircle2, ArrowUpDown, Tag, SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: Status | 'all';
  onStatusChange: (status: Status | 'all') => void;
  priorityFilter: Priority | 'all';
  onPriorityChange: (priority: Priority | 'all') => void;
  selectedTag: string | null;
  onTagChange: (tag: string | null) => void;
  availableTags: string[];
  sortBy: string;
  onSortChange: (sort: string) => void;
  columnCounts: { todo: number; in_progress: number; done: number };
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  selectedTag,
  onTagChange,
  availableTags,
  sortBy,
  onSortChange,
  columnCounts,
  onResetFilters,
  hasActiveFilters,
}) => {
  const statusTabs: { id: Status | 'all'; label: string; count?: number; icon?: React.ReactNode }[] = [
    { id: 'all', label: 'Все', count: columnCounts.todo + columnCounts.in_progress + columnCounts.done },
    {
      id: 'todo',
      label: 'К выполнению',
      count: columnCounts.todo,
      icon: <Circle className="w-3.5 h-3.5 text-zinc-400" />,
    },
    {
      id: 'in_progress',
      label: 'В работе',
      count: columnCounts.in_progress,
      icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
    },
    {
      id: 'done',
      label: 'Готово',
      count: columnCounts.done,
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
    },
  ];

  const priorities: { id: Priority | 'all'; label: string; dot?: string }[] = [
    { id: 'all', label: 'Все приоритеты' },
    { id: 'urgent', label: 'Срочный', dot: 'bg-rose-500' },
    { id: 'high', label: 'Высокий', dot: 'bg-amber-500' },
    { id: 'medium', label: 'Средний', dot: 'bg-slate-400' },
    { id: 'low', label: 'Низкий', dot: 'bg-zinc-400' },
  ];

  return (
    <div className="space-y-3 mb-6">
      {/* Top Search Bar & Sort Dropdown */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        {/* M3 Search Bar */}
        <div className="relative flex-1 flex items-center bg-md-surface-container-low hover:bg-md-surface-container rounded-full border border-md-outline-variant/30 px-4 py-2.5 shadow-xs transition-all focus-within:ring-2 focus-within:ring-md-primary/40 focus-within:border-md-primary">
          <Search className="w-4 h-4 text-md-on-surface-variant mr-2.5 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по задачам, описанию или тегам..."
            className="w-full bg-transparent text-sm text-md-on-surface placeholder:text-md-on-surface-variant/70 outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-md-on-surface-variant hover:text-md-on-surface p-1 rounded-full transition-transform active:scale-90"
              title="Очистить поиск"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center bg-md-surface-container-low rounded-full border border-md-outline-variant/30 px-3 py-2 text-xs font-medium text-md-on-surface-variant">
            <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-md-primary shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-xs text-md-on-surface font-semibold outline-none cursor-pointer pr-1"
            >
              <option value="default" className="bg-md-surface-container text-md-on-surface">По созданию</option>
              <option value="deadline" className="bg-md-surface-container text-md-on-surface">По дедлайну</option>
              <option value="priority" className="bg-md-surface-container text-md-on-surface">По приоритету</option>
              <option value="created_asc" className="bg-md-surface-container text-md-on-surface">Старые первые</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-3 py-2 rounded-full text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-colors flex items-center gap-1"
              title="Сбросить все фильтры"
            >
              <X className="w-3.5 h-3.5" />
              <span>Сбросить</span>
            </button>
          )}
        </div>
      </div>

      {/* Material 3 Filter Chips Row */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {/* Status Chips */}
        <div className="flex items-center gap-1.5 shrink-0">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onStatusChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-md-primary-container text-md-on-primary-container font-semibold shadow-xs ring-1 ring-md-primary/20'
                    : 'bg-md-surface-container-low hover:bg-md-surface-container text-md-on-surface-variant border border-md-outline-variant/30'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-md-primary text-md-on-primary'
                        : 'bg-md-surface-container-high text-md-on-surface-variant'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="h-5 w-px bg-md-outline-variant/30 shrink-0" />

        {/* Priority Filter Chips */}
        <div className="flex items-center gap-1.5 shrink-0">
          {priorities.map((item) => {
            const isActive = priorityFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPriorityChange(isActive && item.id !== 'all' ? 'all' : item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-md-primary-container text-md-on-primary-container font-semibold shadow-xs ring-1 ring-md-primary/20'
                    : 'bg-md-surface-container-low hover:bg-md-surface-container text-md-on-surface-variant border border-md-outline-variant/30'
                }`}
              >
                {item.dot && <span className={`w-2 h-2 rounded-full ${item.dot}`} />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tag Filter Chips if available */}
        {availableTags.length > 0 && (
          <>
            <div className="h-5 w-px bg-md-outline-variant/30 shrink-0" />
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-md-on-surface-variant/70 flex items-center gap-1 pl-1">
                <Tag className="w-3 h-3" /> Теги:
              </span>
              {availableTags.map((tag) => {
                const isActive = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onTagChange(isActive ? null : tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 ${
                      isActive
                        ? 'bg-md-secondary-container text-md-on-secondary-container font-semibold shadow-xs ring-1 ring-md-secondary/30'
                        : 'bg-md-surface-container-low hover:bg-md-surface-container text-md-on-surface-variant border border-md-outline-variant/30'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
