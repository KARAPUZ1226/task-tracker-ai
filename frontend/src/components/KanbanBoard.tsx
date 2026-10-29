import React, { useState } from 'react';
import { Task, Status } from '../types';
import { TaskCard } from './TaskCard';
import { Circle, Clock, CheckCircle2, Plus } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: number) => void;
  onStatusChange: (id: number, status: Status) => void;
  onToggleSubtask: (taskId: number, subtaskId: number, currentStatus: boolean) => void;
  onAddSubtask: (taskId: number, title: string) => void;
  onDeleteSubtask: (taskId: number, subtaskId: number) => void;
  onOpenCreateWithStatus: (status: Status) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onOpenCreateWithStatus,
}) => {
  // Mobile column active tab
  const [activeMobileColumn, setActiveMobileColumn] = useState<Status>('todo');
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);

  const columns: { id: Status; title: string; icon: React.ReactNode; color: string; badge: string }[] = [
    {
      id: 'todo',
      title: 'К выполнению (To Do)',
      icon: <Circle className="w-4 h-4 text-zinc-400" />,
      color: 'border-zinc-500/20',
      badge: 'bg-zinc-500/10 text-zinc-300',
    },
    {
      id: 'in_progress',
      title: 'В процессе (In Progress)',
      icon: <Clock className="w-4 h-4 text-amber-400 animate-spin-slow" />,
      color: 'border-amber-500/20',
      badge: 'bg-amber-500/10 text-amber-400',
    },
    {
      id: 'done',
      title: 'Завершено (Done)',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      color: 'border-emerald-500/20',
      badge: 'bg-emerald-500/10 text-emerald-400',
    },
  ];

  const getTasksForColumn = (status: Status) => tasks.filter((t) => t.status === status);

  return (
    <div className="space-y-4">
      {/* Mobile Column Tabs */}
      <div className="flex md:hidden bg-[#121215] p-1 rounded-xl border border-white/[0.08]">
        {columns.map((col) => {
          const count = getTasksForColumn(col.id).length;
          return (
            <button
              key={col.id}
              onClick={() => setActiveMobileColumn(col.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeMobileColumn === col.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>{col.id === 'todo' ? 'To Do' : col.id === 'in_progress' ? 'В работе' : 'Готово'}</span>
              <span className="px-1.5 py-0.2 bg-black/30 rounded-full text-[10px]">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map((col) => {
          const colTasks = getTasksForColumn(col.id);
          const isHiddenOnMobile = activeMobileColumn !== col.id;
          const isDropActive = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverColumn !== col.id) setDragOverColumn(col.id);
              }}
              onDragLeave={(e) => {
                // Only unset if leaving the column container
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
              className={`flex flex-col rounded-2xl bg-[#0e0e11] border p-4 min-h-[500px] transition-all duration-200 ${
                isDropActive ? 'border-brand-500 bg-brand-950/10 shadow-lg shadow-brand-500/10 scale-[1.01]' : col.color
              } ${isHiddenOnMobile ? 'hidden md:flex' : 'flex'}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  {col.icon}
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                    {col.title}
                  </h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => onOpenCreateWithStatus(col.id)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
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
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      onStatusChange={onStatusChange}
                      onToggleSubtask={onToggleSubtask}
                      onAddSubtask={onAddSubtask}
                      onDeleteSubtask={onDeleteSubtask}
                    />
                  ))
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.06] text-center p-4">
                    <p className="text-xs text-zinc-500">Нет задач в этой колонке</p>
                    <button
                      onClick={() => onOpenCreateWithStatus(col.id)}
                      className="mt-2 text-[11px] text-brand-400 hover:underline flex items-center gap-1"
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
