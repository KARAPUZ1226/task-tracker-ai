import React from 'react';
import { Task, Status, Priority } from '../types';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Circle,
  Edit2,
  Trash2,
  Flame,
  Zap,
} from 'lucide-react';

interface ListViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: number) => void;
  onStatusChange: (id: number, status: Status) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}) => {
  const priorityMap: Record<Priority, { label: string; badge: string; icon?: React.ReactNode }> = {
    urgent: { label: 'Срочный', badge: 'bg-red-500/10 text-red-400 border-red-500/20', icon: <Flame className="w-3 h-3" /> },
    high: { label: 'Высокий', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Zap className="w-3 h-3" /> },
    medium: { label: 'Средний', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    low: { label: 'Низкий', badge: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  };

  const statusMap: Record<Status, { label: string; icon: React.ReactNode; color: string }> = {
    todo: { label: 'To Do', icon: <Circle className="w-3.5 h-3.5 text-zinc-400" />, color: 'text-zinc-400' },
    in_progress: { label: 'В работе', icon: <Clock className="w-3.5 h-3.5 text-amber-400" />, color: 'text-amber-400' },
    done: { label: 'Готово', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />, color: 'text-emerald-400' },
  };

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl bg-[#0e0e11] border border-white/[0.08] p-12 text-center text-zinc-500 text-sm">
        Задачи не найдены. Создайте новую задачу или измените фильтры.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#0e0e11] border border-white/[0.08] overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#141418] border-b border-white/[0.06] text-zinc-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3 font-semibold">Статус</th>
              <th className="px-4 py-3 font-semibold">Название & Описание</th>
              <th className="px-4 py-3 font-semibold">Приоритет</th>
              <th className="px-4 py-3 font-semibold">Подзадачи</th>
              <th className="px-4 py-3 font-semibold">Дедлайн</th>
              <th className="px-4 py-3 font-semibold text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {tasks.map((task) => {
              const p = priorityMap[task.priority] || priorityMap.medium;
              const s = statusMap[task.status] || statusMap.todo;
              const completedSubtasks = task.subtasks.filter((st) => st.is_completed).length;

              let deadlineFormatted: string | null = null;
              let isOverdue = false;
              if (task.deadline) {
                const d = new Date(task.deadline);
                if (!isNaN(d.getTime())) {
                  deadlineFormatted = d.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                  });
                  isOverdue = d.getTime() < Date.now() && task.status !== 'done';
                }
              }

              return (
                <tr
                  key={task.id}
                  className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  onClick={() => onEditTask(task)}
                >
                  {/* Status dropdown */}
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value as Status)}
                      className="bg-[#18181c] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-zinc-300 outline-none focus:border-brand-500 cursor-pointer"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">В работе</option>
                      <option value="done">Готово</option>
                    </select>
                  </td>

                  {/* Title & Desc */}
                  <td className="px-4 py-3.5 max-w-md">
                    <div className="font-medium text-white group-hover:text-brand-400 transition-colors">
                      {task.title}
                    </div>
                    {task.description && (
                      <p className="text-zinc-500 text-[11px] truncate max-w-sm mt-0.5">
                        {task.description}
                      </p>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${p.badge}`}
                    >
                      {p.icon}
                      {p.label}
                    </span>
                  </td>

                  {/* Subtasks */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-zinc-400">
                    {task.subtasks.length > 0 ? (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{completedSubtasks}/{task.subtasks.length}</span>
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>

                  {/* Deadline */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {deadlineFormatted ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] ${
                          isOverdue ? 'text-red-400 font-medium' : 'text-zinc-400'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {deadlineFormatted}
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEditTask(task)}
                        className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-white/[0.06] transition-colors"
                        title="Редактировать"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
