import React from 'react';
import { TaskStats } from '../types';
import { CheckCircle2, Clock, Circle, AlertCircle, Trash2, TrendingUp } from 'lucide-react';

interface ProductivityBarProps {
  stats: TaskStats | null;
  onClearCompleted?: () => void;
  loading?: boolean;
}

export const ProductivityBar: React.FC<ProductivityBarProps> = ({
  stats,
  onClearCompleted,
  loading = false,
}) => {
  if (!stats || stats.total_tasks === 0) return null;

  return (
    <section 
      aria-label="Статистика продуктивности"
      className="mb-5 p-3.5 sm:p-4 rounded-3xl bg-md-surface-container-low border border-md-outline-variant/30 shadow-xs transition-all duration-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Summary Metrics */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-medium text-md-on-surface-variant">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-md-surface-container border border-md-outline-variant/20">
            <span className="text-md-on-surface font-semibold">{stats.total_tasks}</span>
            <span>всего</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-md-surface-container border border-md-outline-variant/20">
            <Circle className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-md-on-surface font-semibold">{stats.todo_tasks}</span>
            <span className="hidden xs:inline">к выполнению</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-md-surface-container border border-md-outline-variant/20">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-md-on-surface font-semibold">{stats.in_progress_tasks}</span>
            <span className="hidden xs:inline">в работе</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-md-surface-container border border-md-outline-variant/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-md-on-surface font-semibold">{stats.done_tasks}</span>
            <span>готово ({Math.round(stats.completion_rate)}%)</span>
          </div>

          {stats.overdue_tasks > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 font-semibold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{stats.overdue_tasks} просрочено</span>
            </div>
          )}
        </div>

        {/* Right: Clear completed action */}
        {stats.done_tasks > 0 && onClearCompleted && (
          <button
            type="button"
            onClick={onClearCompleted}
            className="self-end sm:self-center flex items-center gap-1.5 text-xs text-md-on-surface-variant hover:text-rose-500 px-3 py-1 rounded-full hover:bg-rose-500/10 transition-colors"
            title="Удалить все выполненные задачи"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Очистить выполненные</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-3 w-full bg-md-surface-container h-2 rounded-full overflow-hidden">
        <div
          className="bg-md-primary h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, stats.completion_rate))}%` }}
        />
      </div>
    </section>
  );
};
