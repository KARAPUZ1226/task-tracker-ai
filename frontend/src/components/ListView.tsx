import React, { useState } from 'react';
import { Task, Status, Priority } from '../types';
import { SubtaskChecklist } from './SubtaskChecklist';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertCircle,
  Pin,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

interface ListViewProps {
  tasks: Task[];
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: number) => void;
  onStatusChange: (id: number, status: Status) => void;
  onTogglePin?: (id: number) => void;
  onToggleSubtask?: (taskId: number, subtaskId: number, currentStatus: boolean) => void;
  onAddSubtask?: (taskId: number, title: string) => void;
  onDeleteSubtask?: (taskId: number, subtaskId: number) => void;
  onOpenCreate: () => void;
  onSeedDemoTasks?: () => void;
}

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  onViewTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onTogglePin,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onOpenCreate,
  onSeedDemoTasks,
}) => {
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const priorityConfig: Record<Priority, { label: string; dot: string; badge: string }> = {
    urgent: {
      label: 'Срочный',
      dot: 'bg-rose-500',
      badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    },
    high: {
      label: 'Высокий',
      dot: 'bg-amber-500',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    medium: {
      label: 'Средний',
      dot: 'bg-slate-400',
      badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    },
    low: {
      label: 'Низкий',
      dot: 'bg-zinc-400',
      badge: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
    },
  };

  const statusConfig: Record<Status, { label: string; icon: React.ReactNode; colorClass: string }> = {
    todo: {
      label: 'К выполнению',
      icon: <Circle className="w-3.5 h-3.5 text-zinc-400" />,
      colorClass: 'text-md-on-surface-variant bg-md-surface-container border-md-outline-variant/30',
    },
    in_progress: {
      label: 'В работе',
      icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
      colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    done: {
      label: 'Готово',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
      colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
  };

  if (tasks.length === 0) {
    return (
      <div className="rounded-3xl bg-md-surface-container-low border border-md-outline-variant/20 p-8 sm:p-12 text-center text-md-on-surface-variant">
        <p className="text-base font-semibold text-md-on-surface mb-2">Задачи не найдены</p>
        <p className="text-xs mb-5">Попробуйте изменить условия поиска или создайте новую задачу</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenCreate}
            className="px-5 py-2.5 rounded-full text-xs font-semibold bg-md-surface-container hover:bg-md-surface-container-high border border-md-outline-variant/30 text-md-on-surface transition-all active:scale-95"
          >
            + Создать задачу
          </button>
          {onSeedDemoTasks && (
            <button
              type="button"
              onClick={onSeedDemoTasks}
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-md-primary text-md-on-primary hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ Заполнить примерами</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 pb-24">
      {tasks.map((task) => {
        const p = priorityConfig[task.priority] || priorityConfig.medium;
        const s = statusConfig[task.status] || statusConfig.todo;

        let deadlineFormatted: string | null = null;
        let isOverdue = false;
        if (task.deadline) {
          const d = new Date(task.deadline);
          if (!isNaN(d.getTime())) {
            deadlineFormatted = d.toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });
            isOverdue = d.getTime() < Date.now() && task.status !== 'done';
          }
        }

        const completedSubs = task.subtasks?.filter((st) => st.is_completed).length || 0;
        const totalSubs = task.subtasks?.length || 0;
        const isExpanded = expandedTaskIds.has(task.id);

        return (
          <div
            key={task.id}
            className={`flex flex-col gap-3 p-3.5 sm:p-4 rounded-2xl bg-md-surface-container-low hover:bg-md-surface-container border ${
              task.is_pinned
                ? 'border-md-primary/50 shadow-xs'
                : 'border-md-outline-variant/25 hover:border-md-primary/40'
            } transition-all duration-200 group`}
          >
            {/* Main Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
              {/* Left: Quick complete toggle, Title, Tags, Subtasks */}
              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                {/* Checkbox circle to quickly mark done/todo */}
                <button
                  type="button"
                  onClick={() => onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')}
                  className={`mt-0.5 sm:mt-0 p-1 rounded-full transition-transform active:scale-90 shrink-0 ${
                    task.status === 'done'
                      ? 'text-emerald-500 hover:text-emerald-600'
                      : 'text-md-on-surface-variant/50 hover:text-md-primary'
                  }`}
                  title={task.status === 'done' ? 'Отметить как не выполненную' : 'Завершить задачу'}
                >
                  {task.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                {/* Pin indicator */}
                {onTogglePin && (
                  <button
                    type="button"
                    onClick={() => onTogglePin(task.id)}
                    className={`p-1 rounded-full transition-colors shrink-0 ${
                      task.is_pinned
                        ? 'text-md-primary bg-md-primary-container/40'
                        : 'text-md-on-surface-variant/40 hover:text-md-on-surface'
                    }`}
                    title={task.is_pinned ? 'Открепить' : 'Закрепить'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${task.is_pinned ? 'fill-current' : ''}`} />
                  </button>
                )}

                {/* Title & metadata */}
                <div
                  onClick={() => onViewTask(task)}
                  className="cursor-pointer min-w-0 flex-1 space-y-1"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h4
                      className={`font-semibold text-sm text-md-on-surface break-words ${
                        task.status === 'done' ? 'line-through opacity-60' : ''
                      }`}
                    >
                      {task.title}
                    </h4>

                    {/* Priority Chip */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${p.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                      <span>{p.label}</span>
                    </span>

                    {/* Tags */}
                    {task.tags &&
                      task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-md-surface-container-high text-md-on-surface-variant"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>

                  {/* Subtask count & deadline */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-md-on-surface-variant">
                    {totalSubs > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(task.id);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium hover:text-md-primary transition-colors"
                      >
                        <span>
                          Подзадачи: {completedSubs}/{totalSubs}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3 text-md-primary" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}
                    {deadlineFormatted && (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] ${
                          isOverdue ? 'text-rose-500 font-semibold' : ''
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        <span>{deadlineFormatted}</span>
                        {isOverdue && <AlertCircle className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Status Pill & Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {/* Status Switcher Dropdown */}
                <div className="relative">
                  <select
                    value={task.status}
                    onChange={(e) => onStatusChange(task.id, e.target.value as Status)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer outline-none transition-all ${s.colorClass}`}
                  >
                    <option value="todo" className="bg-md-surface text-md-on-surface">
                      К выполнению
                    </option>
                    <option value="in_progress" className="bg-md-surface text-md-on-surface">
                      В работе
                    </option>
                    <option value="done" className="bg-md-surface text-md-on-surface">
                      Готово
                    </option>
                  </select>
                </div>

                {/* Edit button */}
                <button
                  type="button"
                  onClick={() => onEditTask(task)}
                  className="p-1.5 rounded-full text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-container-high transition-colors"
                  title="Редактировать"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1.5 rounded-full text-rose-500 hover:bg-rose-500/10 transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Expandable Subtask Checklist */}
            {isExpanded && totalSubs > 0 && onToggleSubtask && onAddSubtask && onDeleteSubtask && (
              <div className="pt-2 border-t border-md-outline-variant/15 pl-8 sm:pl-10 animate-fade-in">
                <SubtaskChecklist
                  taskId={task.id}
                  subtasks={task.subtasks}
                  onToggle={onToggleSubtask}
                  onAdd={onAddSubtask}
                  onDelete={onDeleteSubtask}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
