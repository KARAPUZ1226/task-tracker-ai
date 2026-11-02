import React, { useState } from 'react';
import { Task, Status, Priority } from '../types';
import { SubtaskChecklist } from './SubtaskChecklist';
import {
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  Check,
  RotateCcw,
  Pin,
  PinOff,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, newStatus: Status) => void;
  onTogglePin?: (id: number) => void;
  onToggleSubtask: (taskId: number, subtaskId: number, currentStatus: boolean) => void;
  onAddSubtask: (taskId: number, title: string) => void;
  onDeleteSubtask: (taskId: number, subtaskId: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onTogglePin,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const currentPriority = priorityConfig[task.priority] || priorityConfig.medium;

  // Deadline formatting & overdue check
  let deadlineText: string | null = null;
  let isOverdue = false;
  if (task.deadline) {
    const d = new Date(task.deadline);
    if (!isNaN(d.getTime())) {
      deadlineText = d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      isOverdue = d.getTime() < Date.now() && task.status !== 'done';
    }
  }

  const completedSubtasks = task.subtasks?.filter((s) => s.is_completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(task.id));
        e.dataTransfer.setData('taskId', String(task.id));
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`group relative rounded-2xl bg-md-surface-container-low hover:bg-md-surface-container border ${
        task.is_pinned
          ? 'border-md-primary/50 shadow-sm'
          : 'border-md-outline-variant/30 hover:border-md-primary/40'
      } shadow-xs hover:shadow-md transition-all duration-300 p-4 space-y-3 cursor-grab active:cursor-grabbing min-w-0 animate-fade-in`}
    >
      {/* Top row: Priority Chip, Tags, Pin & Card Menu */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {/* Priority chip */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${currentPriority.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${currentPriority.dot}`} />
            <span>{currentPriority.label}</span>
          </span>

          {/* Tags */}
          {task.tags &&
            task.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-md-surface-container-high text-md-on-surface-variant"
              >
                #{tag}
              </span>
            ))}
        </div>

        {/* Pin & Menu */}
        <div className="flex items-center gap-1">
          {onTogglePin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(task.id);
              }}
              className={`p-1 rounded-full transition-colors ${
                task.is_pinned
                  ? 'text-md-primary bg-md-primary-container/40'
                  : 'text-md-on-surface-variant/50 hover:text-md-on-surface hover:bg-md-surface-container-high'
              }`}
              title={task.is_pinned ? 'Открепить задачу' : 'Закрепить задачу наверху'}
            >
              <Pin className={`w-3.5 h-3.5 ${task.is_pinned ? 'fill-current' : ''}`} />
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen)}
              }
              className="p-1 rounded-full text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-container-high transition-colors"
              title="Действия с задачей"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-7 z-20 w-40 rounded-2xl bg-md-surface-container border border-md-outline-variant/30 shadow-xl p-1.5 space-y-0.5 animate-pop-in"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(task);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-md-on-surface hover:bg-md-surface-container-high transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-md-primary" />
                  <span>Редактировать</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(task.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Удалить</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title & Description Clickable to View */}
      <div
        onClick={() => onView(task)}
        className="cursor-pointer space-y-1.5 group-hover:opacity-95"
      >
        <h3
          className={`font-semibold text-sm text-md-on-surface leading-snug break-words ${
            task.status === 'done' ? 'line-through opacity-70' : ''
          }`}
        >
          {task.title}
        </h3>

        {task.description && (
          <p className="text-xs text-md-on-surface-variant line-clamp-2 break-words">
            {task.description.replace(/###/g, '').replace(/[-*#]/g, '').trim()}
          </p>
        )}
      </div>

      {/* Subtasks Progress Bar & Toggle */}
      {totalSubtasks > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-md-on-surface-variant">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 hover:text-md-on-surface font-medium"
            >
              <span>Подзадачи: {completedSubtasks}/{totalSubtasks}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <span className="font-semibold">{Math.round(subtaskProgress)}%</span>
          </div>

          <div className="w-full bg-md-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-md-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>

          {expanded && (
            <div className="pt-2">
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
      )}

      {/* Card Footer: Deadline and One-Tap Status Transition Pill */}
      <div className="flex items-center justify-between pt-2 border-t border-md-outline-variant/15 text-xs">
        {/* Deadline */}
        <div>
          {deadlineText ? (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                isOverdue
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  : 'bg-md-surface-container-high text-md-on-surface-variant'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{deadlineText}</span>
              {isOverdue && <AlertCircle className="w-3 h-3 ml-0.5" />}
            </span>
          ) : (
            <span className="text-[11px] text-md-on-surface-variant/50">Без срока</span>
          )}
        </div>

        {/* Quick One-Tap Status Action (No button slop!) */}
        <div>
          {task.status === 'todo' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, 'in_progress');
              }}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all active:scale-95"
              title="Перевести в работу"
            >
              <span>В работу</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {task.status === 'in_progress' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, 'done');
              }}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-all active:scale-95"
              title="Завершить задачу"
            >
              <Check className="w-3 h-3" />
              <span>Готово</span>
            </button>
          )}

          {task.status === 'done' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, 'todo');
              }}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-md-surface-container-high text-md-on-surface-variant hover:text-md-on-surface transition-all active:scale-95"
              title="Вернуть задачу к выполнению"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Вернуть</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
