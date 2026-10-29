import React, { useState } from 'react';
import { Task, Status } from '../types';
import { TaskCard } from './TaskCard';
import { Circle, Clock, CheckCircle2, Plus } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: number) => void;
  onStatusChange: (id: number, status: Status) => void;
  onToggleSubtask: (taskId: number, subtaskId: number, currentStatus: boolean) => void;
  onAddSubtask: (taskId: number, title: string) => void;
  onDeleteSubtask: (taskId: number, subtaskId: number) => void;
  onOpenCreateWithStatus: (status: Status) => void;
  activeColumn?: Status;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  activeColumn = 'todo',
  onViewTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onOpenCreateWithStatus,
}) => {
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);

  const columns: { id: Status; title: string; icon: React.ReactNode; color: string; badge: string }[] = [
    {
      id: 'todo',
      title: 'К выполнению',
      icon: <Circle className="w-4 h-4 text-zinc-400" />,
      color: 'border-zinc-200 dark:border-zinc-800/80',
      badge: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300',
    },
    {
      id: 'in_progress',
      title: 'В работе',
      icon: <Clock className="w-4 h-4 text-amber-500 animate-spin-slow" />,
      color: 'border-amber-500/20',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'done',
      title: 'Готово',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      color: 'border-emerald-500/20',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
  ];

  const getTasksForColumn = (status: Status) => tasks.filter((t) => t.status === status);

  return (
    <div className="space-y-4">
      {/* Grid columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-40">
        {columns.map((col) => {
          const colTasks = getTasksForColumn(col.id);
          const isHiddenOnMobile = activeColumn !== col.id;
          const isDropActive = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              id={`column-${col.id}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverColumn !== col.id) setDragOverColumn(col.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverColumn(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverColumn(null);
                const rawId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('taskId');
                const droppedTaskId = Number(rawId);
                if (droppedTaskId) {
                  onStatusChange(droppedTaskId, col.id);
                }
              }}
              className={`flex flex-col rounded-2xl bg-zinc-50/50 dark:bg-[#0e1015] border p-4 min-h-[500px] min-w-0 transition-all duration-200 ${
                isDropActive
                  ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10 scale-[1.01]'
                  : col.color
              } ${isHiddenOnMobile ? 'hidden md:flex' : 'flex'}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200 dark:border-white/[0.06]">
                <div className="flex items-center gap-2 min-w-0">
                  {col.icon}
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 truncate">
                    {col.title}
                  </h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${col.badge}`}>
                    {colTasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenCreateWithStatus(col.id)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
                  title="Добавить в эту колонку"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Task list in column */}
              <div className="space-y-3 flex-1">
                {colTasks.length > 0 ? (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onView={onViewTask}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      onStatusChange={onStatusChange}
                      onToggleSubtask={onToggleSubtask}
                      onAddSubtask={onAddSubtask}
                      onDeleteSubtask={onDeleteSubtask}
                    />
                  ))
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-white/[0.08] text-center p-4">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Нет задач в этой колонке</p>
                    <button
                      type="button"
                      onClick={() => onOpenCreateWithStatus(col.id)}
                      className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3" /> Создать первую
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
