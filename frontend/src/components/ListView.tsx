import React from 'react';
import { Task, Status, Priority } from '../types';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Circle,
  Edit2,
  Trash2,
  Eye,
  ArrowRight,
  Check,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

interface ListViewProps {
  tasks: Task[];
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: number) => void;
  onStatusChange: (id: number, status: Status) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  onViewTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}) => {
  const priorityMap: Record<Priority, { label: string; dot: string; badge: string }> = {
    urgent: { label: 'Срочный', dot: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
    high: { label: 'Высокий', dot: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
    medium: { label: 'Средний', dot: 'bg-slate-400', badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
    low: { label: 'Низкий', dot: 'bg-zinc-400', badge: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20' },
  };

  const statusMap: Record<Status, { label: string; icon: React.ReactNode; badge: string }> = {
    todo: {
      label: 'К выполнению',
      icon: <Circle className="w-3.5 h-3.5 text-zinc-400" />,
      badge: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-white/[0.08]',
    },
    in_progress: {
      label: 'В работе',
      icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    done: {
      label: 'Готово',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
  };

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#0e1015] border border-zinc-200 dark:border-white/[0.08] p-12 text-center text-zinc-400 dark:text-zinc-500 text-xs shadow-sm pb-24">
        Задачи не найдены. Создайте новую задачу или измените фильтры.
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24">
      {tasks.map((task) => {
        const p = priorityMap[task.priority] || priorityMap.medium;
        const s = statusMap[task.status] || statusMap.todo;
        const completedSubtasks = task.subtasks?.filter((st) => st.is_completed).length || 0;
        const totalSubtasks = task.subtasks?.length || 0;

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

        return (
          <div
            key={task.id}
            onClick={() => onViewTask(task)}
            className="group rounded-2xl bg-white dark:bg-[#13161c] border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.18] p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3"
          >
            {/* Top row: Status, Priority and Actions */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${s.badge}`}>
                  {s.icon}
                  <span>{s.label}</span>
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${p.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                  <span>{p.label}</span>
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onEditTask(task)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                  title="Редактировать"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Task Title & Description */}
            <div>
              <h3
                className={`text-sm sm:text-base font-semibold tracking-tight transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400 ${
                  task.status === 'done'
                    ? 'line-through text-zinc-400 dark:text-zinc-500'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {task.title}
              </h3>
              {task.description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                  {task.description.replace(/###/g, '').replace(/[*#]/g, '').trim()}
                </p>
              )}
            </div>

            {/* Bottom Row: Subtasks progress, Deadline & Prominent Status Mover on Right */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-white/[0.06] flex-wrap">
              <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                {totalSubtasks > 0 && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{completedSubtasks}/{totalSubtasks} шагов</span>
                  </span>
                )}

                {deadlineFormatted && (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md ${
                      isOverdue
                        ? 'bg-rose-500/10 text-rose-500 font-medium'
                        : 'bg-zinc-100 dark:bg-white/[0.04] text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {isOverdue ? <AlertCircle className="w-3 h-3 text-rose-500" /> : <Calendar className="w-3 h-3" />}
                    <span>{deadlineFormatted}</span>
                    {isOverdue && <span className="ml-0.5">(просрочено)</span>}
                  </span>
                )}
              </div>

              {/* Задача 2: Заметная кнопка переноса статуса в правом нижнем углу карточки */}
              <div onClick={(e) => e.stopPropagation()}>
                {task.status === 'todo' && (
                  <button
                    type="button"
                    onClick={() => onStatusChange(task.id, 'in_progress')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.97]"
                  >
                    <span>В работу</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {task.status === 'in_progress' && (
                  <button
                    type="button"
                    onClick={() => onStatusChange(task.id, 'done')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.97]"
                  >
                    <span>Готово</span>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}

                {task.status === 'done' && (
                  <button
                    type="button"
                    onClick={() => onStatusChange(task.id, 'in_progress')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-zinc-600 dark:text-zinc-300 text-xs font-medium transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Вернуть</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
