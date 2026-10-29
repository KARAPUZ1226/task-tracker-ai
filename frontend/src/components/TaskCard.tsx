import React, { useState } from 'react';
import { Task, Status, Priority } from '../types';
import { SubtaskChecklist } from './SubtaskChecklist';
import {
  Calendar,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Flame,
  Zap,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, newStatus: Status) => void;
  onToggleSubtask: (taskId: number, subtaskId: number, currentStatus: boolean) => void;
  onAddSubtask: (taskId: number, title: string) => void;
  onDeleteSubtask: (taskId: number, subtaskId: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const priorityConfig: Record<Priority, { label: string; badgeClass: string; icon?: React.ReactNode }> = {
    urgent: {
      label: 'Срочный',
      badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
      icon: <Flame className="w-3 h-3 text-red-400" />,
    },
    high: {
      label: 'Высокий',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: <Zap className="w-3 h-3 text-amber-400" />,
    },
    medium: {
      label: 'Средний',
      badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    },
    low: {
      label: 'Низкий',
      badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
    },
  };

  const currentPriority = priorityConfig[task.priority] || priorityConfig.medium;

  // Deadline formatting & check
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

  return (
    <div
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(task.id));
        e.dataTransfer.setData('taskId', String(task.id));
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="group relative rounded-xl bg-[#121215] border border-white/[0.08] hover:border-white/[0.18] shadow-sm hover:shadow-lg hover:shadow-black/40 transition-all duration-200 p-4 space-y-3 cursor-grab active:cursor-grabbing"
    >
      {/* Top row: Priority & Actions */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${currentPriority.badgeClass}`}
        >
          {currentPriority.icon}
          <span>{currentPriority.label}</span>
        </span>

        {/* Quick status selector & dropdown */}
        <div className="flex items-center gap-1">
          {task.status === 'in_progress' && (
            <button
              onClick={() => onStatusChange(task.id, 'todo')}
              className="p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-white/[0.05]"
              title="Переместить в To Do"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {task.status === 'todo' && (
            <button
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-white/[0.04] hover:bg-brand-600 hover:text-white transition-all"
              title="Начать выполнение"
            >
              <span>В работу</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {task.status === 'in_progress' && (
            <button
              onClick={() => onStatusChange(task.id, 'done')}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-white/[0.04] hover:bg-emerald-600 hover:text-white transition-all"
              title="Завершить задачу"
            >
              <span>Готово</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {task.status === 'done' && (
            <button
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className="p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-white/[0.05]"
              title="Вернуть в работу"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* More menu button */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 text-zinc-500 hover:text-white rounded hover:bg-white/[0.06] transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-6 z-20 w-44 rounded-xl bg-[#1c1c21] border border-white/[0.1] shadow-xl py-1 text-xs">
                  <div className="px-3 py-1 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider border-b border-white/[0.06]">
                    Статус
                  </div>
                  {task.status !== 'todo' && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onStatusChange(task.id, 'todo');
                      }}
                      className="w-full text-left px-3 py-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                    >
                      → В To Do
                    </button>
                  )}
                  {task.status !== 'in_progress' && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onStatusChange(task.id, 'in_progress');
                      }}
                      className="w-full text-left px-3 py-1.5 text-amber-400 hover:bg-white/[0.06]"
                    >
                      → В работу
                    </button>
                  )}
                  {task.status !== 'done' && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onStatusChange(task.id, 'done');
                      }}
                      className="w-full text-left px-3 py-1.5 text-emerald-400 hover:bg-white/[0.06]"
                    >
                      → В готово
                    </button>
                  )}
                  <div className="my-1 border-t border-white/[0.06]" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(task);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Редактировать</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(task.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Title & Description */}
      <div>
        <h4
          onClick={() => onEdit(task)}
          className={`text-sm font-semibold tracking-tight cursor-pointer hover:text-brand-400 transition-colors ${
            task.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-100'
          }`}
        >
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-zinc-400 mt-1 line-clamp-3 leading-relaxed whitespace-pre-line">
            {task.description}
          </p>
        )}
      </div>

      {/* Deadline badge */}
      {deadlineText && (
        <div
          className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md ${
            isOverdue
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : 'bg-white/[0.04] text-zinc-400 border border-white/[0.06]'
          }`}
        >
          {isOverdue ? <AlertCircle className="w-3 h-3 text-red-400" /> : <Calendar className="w-3 h-3 text-zinc-400" />}
          <span>{deadlineText}</span>
          {isOverdue && <span className="font-medium ml-0.5">(просрочено)</span>}
        </div>
      )}

      {/* Subtasks Accordion */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="border-t border-white/[0.06] pt-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
            >
              <span>Чеклист ({task.subtasks.filter((s) => s.is_completed).length}/{task.subtasks.length})</span>
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
            />
          )}
        </div>
      )}

      {/* Empty Subtasks prompt if 0 subtasks */}
      {(!task.subtasks || task.subtasks.length === 0) && (
        <div className="pt-1">
          <button
            onClick={() => onEdit(task)}
            className="text-[11px] text-zinc-500 hover:text-brand-400 transition-colors flex items-center gap-1"
          >
            <span>+ Добавить подзадачи (AI декомпозиция)</span>
          </button>
        </div>
      )}
    </div>
  );
};
