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
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: Status) => void;
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
      badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    },
    medium: {
      label: 'Средний',
      dot: 'bg-slate-400',
      badge: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20',
    },
    low: {
      label: 'Низкий',
      dot: 'bg-zinc-400',
      badge: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20',
    },
  };

  const statusConfig: Record<Status, { label: string; badge: string }> = {
    todo: {
      label: 'К выполнению',
      badge: 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-white/[0.08]',
    },
    in_progress: {
      label: 'В работе',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    done: {
      label: 'Готово',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
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

  const completedSubs = task.subtasks?.filter((s) => s.is_completed).length || 0;
  const totalSubs = task.subtasks?.length || 0;
  const allSubtasksDone = totalSubs > 0 && completedSubs === totalSubs;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#12141a] border border-zinc-200 dark:border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-[#161922]">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${p.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
              <span>{p.label}</span>
            </span>
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${s.badge}`}>
              {s.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-200 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Изменить</span>
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-snug">
              {task.title}
            </h2>
            {deadlineFormatted && (
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                {isOverdue ? (
                  <span className="flex items-center gap-1 text-rose-500 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Дедлайн: {deadlineFormatted} (просрочено)</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Дедлайн: {deadlineFormatted}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Description with rich Markdown View */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#161922] border border-zinc-200 dark:border-white/[0.06] space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Описание
            </div>
            {task.description ? (
              <MarkdownView content={task.description} />
            ) : (
              <p className="text-xs text-zinc-400 italic">Описание не указано</p>
            )}
          </div>

          {/* Subtasks Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Подзадачи чеклиста ({task.subtasks?.length || 0})
              </h3>
            </div>
            <SubtaskChecklist
              taskId={task.id}
              subtasks={task.subtasks || []}
              onToggle={onToggleSubtask}
              onAdd={onAddSubtask}
              onDelete={onDeleteSubtask}
              truncateText={false}
            />
          </div>
        </div>

        {/* Footer with status mover and delete */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-[#161922]">
          <button
            onClick={() => {
              if (confirm('Удалить эту задачу?')) {
                onDelete(task.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Удалить задачу</span>
          </button>

          {/* Status action */}
          <div className="flex items-center gap-2">
            {task.status === 'todo' && (
              allSubtasksDone ? (
                <button
                  onClick={() => {
                    onStatusChange(task.id, 'done');
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
                  title="Все подзадачи выполнены — завершить задачу"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>В готово</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onStatusChange(task.id, 'in_progress');
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium shadow-md shadow-amber-500/20 transition-all active:scale-[0.98]"
                >
                  <span>Перевести в работу</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )
            )}

            {task.status === 'in_progress' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onStatusChange(task.id, 'todo');
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-zinc-700 dark:text-zinc-200 text-xs font-medium transition-all"
                  title="Вернуть задачу к выполнению"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>К выполнению</span>
                </button>
                <button
                  onClick={() => {
                    onStatusChange(task.id, 'done');
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Завершить задачу</span>
                </button>
              </div>
            )}

            {task.status === 'done' && (
              <button
                onClick={() => {
                  onStatusChange(task.id, 'in_progress');
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-200 dark:bg-white/[0.08] hover:bg-zinc-300 dark:hover:bg-white/[0.14] text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Вернуть в работу</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
