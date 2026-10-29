import React, { useState } from 'react';
import { Task, Status, Priority } from '../types';
import { SubtaskChecklist } from './SubtaskChecklist';
import {
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, newStatus: Status) => void;
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
  const allSubtasksDone = totalSubtasks > 0 && completedSubtasks === totalSubtasks;

  return (
    <div
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(task.id));
        e.dataTransfer.setData('taskId', String(task.id));
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="group relative rounded-2xl bg-white dark:bg-[#13161c] border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.18] shadow-sm hover:shadow-xl dark:hover:shadow-black/50 transition-all duration-200 hover:-translate-y-1 active:scale-[0.99] p-4 space-y-3 cursor-grab active:cursor-grabbing animate-fade-in min-w-0"
    >
      {/* Top row: Priority & Card Menu */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${currentPriority.badge}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${currentPriority.dot}`} />
          <span>{currentPriority.label}</span>
        </span>

        {/* More actions dropdown button */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div
                className="absolute right-0 top-6 z-30 w-40 rounded-xl bg-white dark:bg-[#1c1f26] border border-zinc-200 dark:border-white/[0.1] shadow-xl py-1 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onView(task);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
                >
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Просмотр</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(task);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
                >
                  <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Редактировать</span>
                </button>
                <div className="my-1 border-t border-zinc-200 dark:border-white/[0.06]" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(task.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-500 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Удалить</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title & Description (Click opens Task Details view modal) */}
      <div onClick={() => onView(task)} className="cursor-pointer space-y-1">
        <h4
          className={`text-sm font-semibold tracking-tight transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 break-words ${
            task.status === 'done'
              ? 'line-through text-zinc-400 dark:text-zinc-500'
              : 'text-zinc-900 dark:text-zinc-100'
          }`}
        >
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed break-words">
            {task.description.replace(/###/g, '').replace(/[*#]/g, '').trim()}
          </p>
        )}
      </div>

      {/* Deadline Badge */}
      {deadlineText && (
        <div
          className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md ${
            isOverdue
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              : 'bg-zinc-100 dark:bg-white/[0.04] text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.06]'
          }`}
        >
          {isOverdue ? (
            <AlertCircle className="w-3 h-3 text-rose-500" />
          ) : (
            <Calendar className="w-3 h-3 text-zinc-400" />
          )}
          <span>{deadlineText}</span>
          {isOverdue && <span className="font-medium ml-0.5">(просрочено)</span>}
        </div>
      )}

      {/* Subtasks Accordion (if any) */}
      {totalSubtasks > 0 && (
        <div className="border-t border-zinc-100 dark:border-white/[0.06] pt-2 min-w-0 w-full">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
            >
              <span>Чеклист ({completedSubtasks}/{totalSubtasks})</span>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {expanded && (
            <SubtaskChecklist
              taskId={task.id}
              subtasks={task.subtasks}
              onToggle={onToggleSubtask}
              onAdd={onAddSubtask}
              onDelete={onDeleteSubtask}
              truncateText={true}
            />
          )}
        </div>
      )}

      {/* Bottom Row: Details link on left, Prominent Status Transition Button on RIGHT */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
        <button
          type="button"
          onClick={() => onView(task)}
          className="text-[11px] font-medium text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 shrink-0"
        >
          <Eye className="w-3 h-3" />
          <span>Подробнее</span>
        </button>

        {/* Заметные кнопки переноса статуса в правом нижнем углу карточки */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
          {task.status === 'todo' && (
            allSubtasksDone ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(task.id, 'done');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.97]"
                title="Все подзадачи выполнены — завершить задачу"
              >
                <span>В готово</span>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(task.id, 'in_progress');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.97]"
                title="Перевести задачу в работу"
              >
                <span>В работу</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )
          )}

          {task.status === 'in_progress' && (
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(task.id, 'todo');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-zinc-600 dark:text-zinc-300 text-xs font-medium transition-all active:scale-[0.97]"
                title="Вернуть задачу назад к выполнению"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>К выполнению</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(task.id, 'done');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.97]"
                title="Завершить задачу"
              >
                <span>Готово</span>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          )}

          {task.status === 'done' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, 'in_progress');
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-zinc-600 dark:text-zinc-300 text-xs font-medium transition-all"
              title="Вернуть в работу"
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
