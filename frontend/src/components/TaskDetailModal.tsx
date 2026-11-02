import React from 'react';
import { Task, Status, Priority } from '../types';
import { MarkdownView } from './MarkdownView';
import { SubtaskChecklist } from './SubtaskChecklist';
import {
  X,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Pin,
  Clock,
  Check,
  Tag,
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: Status) => void;
  onTogglePin?: (id: number) => void;
  onToggleSubtask: (taskId: number, subtaskId: number, currentStatus: boolean) => void;
  onAddSubtask: (taskId: number, title: string) => void;
  onDeleteSubtask: (taskId: number, subtaskId: number) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onTogglePin,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}) => {
  if (!isOpen || !task) return null;

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

  const statusConfig: Record<Status, { label: string; badge: string; icon: React.ReactNode }> = {
    todo: {
      label: 'К выполнению',
      badge: 'bg-md-surface-container text-md-on-surface-variant border-md-outline-variant/30',
      icon: <Clock className="w-3.5 h-3.5 text-zinc-400" />,
    },
    in_progress: {
      label: 'В работе',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
    },
    done: {
      label: 'Готово',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
    },
  };

  const p = priorityConfig[task.priority] || priorityConfig.medium;
  const s = statusConfig[task.status] || statusConfig.todo;

  let deadlineFormatted: string | null = null;
  let isOverdue = false;
  if (task.deadline) {
    const d = new Date(task.deadline);
    if (!isNaN(d.getTime())) {
      deadlineFormatted = d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      isOverdue = d.getTime() < Date.now() && task.status !== 'done';
    }
  }

  const completedSubs = task.subtasks?.filter((st) => st.is_completed).length || 0;
  const totalSubs = task.subtasks?.length || 0;
  const subtaskProgress = totalSubs > 0 ? (completedSubs / totalSubs) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl my-auto rounded-[28px] bg-md-surface-container-low border border-md-outline-variant/30 shadow-2xl p-5 sm:p-7 space-y-5 animate-pop-in">
        {/* Top Badges & Close Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${s.badge}`}
            >
              {s.icon}
              <span>{s.label}</span>
            </span>

            {/* Priority Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${p.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
              <span>{p.label}</span>
            </span>

            {/* Pinned pill */}
            {task.is_pinned && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-md-primary-container text-md-on-primary-container">
                <Pin className="w-3 h-3 fill-current" />
                <span>Закреплено</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onTogglePin && (
              <button
                type="button"
                onClick={() => onTogglePin(task.id)}
                className="p-1.5 rounded-full text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-container transition-colors"
                title={task.is_pinned ? 'Открепить' : 'Закрепить'}
              >
                <Pin className={`w-4 h-4 ${task.is_pinned ? 'fill-current text-md-primary' : ''}`} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-container transition-colors"
              title="Закрыть (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-md-on-surface leading-snug break-words">
          {task.title}
        </h2>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-md-surface-container-high text-md-on-surface-variant flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}

        {/* Deadline & Date info */}
        {deadlineFormatted && (
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium ${
                isOverdue
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 font-semibold'
                  : 'bg-md-surface-container text-md-on-surface-variant border border-md-outline-variant/20'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Срок: {deadlineFormatted}</span>
              {isOverdue && <AlertCircle className="w-3.5 h-3.5 ml-1 text-rose-500" />}
            </span>
          </div>
        )}

        {/* Description Section with Markdown */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-md-on-surface-variant tracking-wider uppercase">
            Описание
          </h3>
          <div className="p-4 rounded-2xl bg-md-surface-container border border-md-outline-variant/20 text-xs text-md-on-surface min-h-[70px] max-h-72 overflow-y-auto">
            {task.description ? (
              <MarkdownView content={task.description} />
            ) : (
              <span className="text-md-on-surface-variant/50 italic">Нет описания</span>
            )}
          </div>
        </div>

        {/* Subtasks Section with Interactive Checklist */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-bold text-md-on-surface-variant tracking-wider uppercase">
              Подзадачи ({completedSubs}/{totalSubs})
            </h3>
            {totalSubs > 0 && (
              <span className="font-semibold text-md-primary">{Math.round(subtaskProgress)}%</span>
            )}
          </div>

          {totalSubs > 0 && (
            <div className="w-full bg-md-surface-container h-2 rounded-full overflow-hidden">
              <div
                className="bg-md-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${subtaskProgress}%` }}
              />
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-md-surface-container border border-md-outline-variant/20">
            <SubtaskChecklist
              taskId={task.id}
              subtasks={task.subtasks}
              onToggle={onToggleSubtask}
              onAdd={onAddSubtask}
              onDelete={onDeleteSubtask}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-md-outline-variant/15">
          {/* Delete Action */}
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Удалить задачу</span>
          </button>

          {/* Status Switcher & Edit */}
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            {/* 1-Tap Status Switcher */}
            <div className="flex items-center bg-md-surface-container rounded-full p-1 border border-md-outline-variant/30">
              {(
                [
                  { id: 'todo', label: 'К выполнению' },
                  { id: 'in_progress', label: 'В работе' },
                  { id: 'done', label: 'Готово' },
                ] as const
              ).map((st) => {
                const isActive = task.status === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onStatusChange(task.id, st.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? st.id === 'done'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : st.id === 'in_progress'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-md-surface text-md-on-surface shadow-xs'
                        : 'text-md-on-surface-variant hover:text-md-on-surface'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onEdit(task)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-md-surface-container hover:bg-md-surface-container-high text-md-on-surface border border-md-outline-variant/30 transition-all active:scale-95"
            >
              <Edit2 className="w-3.5 h-3.5 text-md-primary" />
              <span>Редактировать</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
