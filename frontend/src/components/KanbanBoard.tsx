import React, { useState } from 'react';
import { Task, Status } from '../types';
import { TaskCard } from './TaskCard';
import { Circle, Clock, CheckCircle2, Plus, Sparkles } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: number) => void;
  onStatusChange: (id: number, status: Status) => void;
  onTogglePin?: (id: number) => void;
  onToggleSubtask: (taskId: number, subtaskId: number, currentStatus: boolean) => void;
  onAddSubtask: (taskId: number, title: string) => void;
  onDeleteSubtask: (taskId: number, subtaskId: number) => void;
  onOpenCreateWithStatus: (status: Status) => void;
  activeColumn?: Status | 'all';
  hasActiveFilters?: boolean;
  onSeedDemoTasks?: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  activeColumn = 'all',
  hasActiveFilters = false,
  onSeedDemoTasks,
  onViewTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onTogglePin,
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
      color: 'border-md-outline-variant/30',
      badge: 'bg-md-surface-container-high text-md-on-surface',
    },
    {
      id: 'in_progress',
      title: 'В работе',
      icon: <Clock className="w-4 h-4 text-amber-500" />,
      color: 'border-amber-500/30',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'done',
      title: 'Готово',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      color: 'border-emerald-500/30',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
  ];

  const visibleColumns = activeColumn === 'all'
    ? columns
    : columns.filter((col) => col.id === activeColumn);

  const getTasksForColumn = (status: Status) => tasks.filter((t) => t.status === status);

  return (
    <>
      {tasks.length === 0 && !hasActiveFilters && onSeedDemoTasks && (
        <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-md-surface-container-low border border-md-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in shadow-xs">
          <div className="flex items-center gap-3.5 text-left">
            <div className="h-11 w-11 rounded-2xl bg-md-primary/10 flex items-center justify-center text-md-primary shrink-0 border border-md-primary/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-md-on-surface">Ваш список задач пока пуст</h3>
              <p className="text-xs text-md-on-surface-variant">Создайте свою первую задачу или загрузите демонстрационные примеры в 1 клик</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
            <button
              type="button"
              onClick={() => onOpenCreateWithStatus('todo')}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full text-xs font-semibold bg-md-surface-container hover:bg-md-surface-container-high border border-md-outline-variant/30 text-md-on-surface transition-all active:scale-95"
            >
              + Новая задача
            </button>
            <button
              type="button"
              onClick={onSeedDemoTasks}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full text-xs font-semibold bg-md-primary text-md-on-primary hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ Примеры задач</span>
            </button>
          </div>
        </div>
      )}

      <div
        className={`grid ${
          activeColumn === 'all' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 max-w-2xl mx-auto'
        } gap-6 items-start pb-24`}
      >
      {visibleColumns.map((col) => {
        const colTasks = getTasksForColumn(col.id);
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
            className={`flex flex-col rounded-3xl bg-md-surface-container-lowest border p-4 sm:p-5 min-h-[500px] min-w-0 transition-all duration-300 ${
              isDropActive
                ? 'border-md-primary bg-md-primary-container/20 shadow-md scale-[1.01]'
                : col.color
            } animate-fade-in`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-md-outline-variant/15">
              <div className="flex items-center gap-2.5 min-w-0">
                {col.icon}
                <h2 className="font-semibold text-sm sm:text-base text-md-on-surface tracking-tight truncate">
                  {col.title}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${col.badge}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Quick Add Button to Column */}
              <button
                type="button"
                onClick={() => onOpenCreateWithStatus(col.id)}
                className="p-1.5 rounded-full text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-container transition-colors"
                title={`Добавить задачу в «${col.title}»`}
                aria-label={`Добавить задачу в ${col.title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task Cards List */}
            <div className="space-y-3.5 flex-1 min-h-[100px]">
              {colTasks.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center border-2 border-dashed border-md-outline-variant/20 rounded-2xl text-center p-4 text-xs text-md-on-surface-variant/60">
                  <p>Нет задач в этой колонке</p>
                  <button
                    type="button"
                    onClick={() => onOpenCreateWithStatus(col.id)}
                    className="mt-2 text-xs font-medium text-md-primary hover:underline"
                  >
                    + Добавить задачу
                  </button>
                </div>
              ) : (
                colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onView={onViewTask}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onStatusChange={onStatusChange}
                    onTogglePin={onTogglePin}
                    onToggleSubtask={onToggleSubtask}
                    onAddSubtask={onAddSubtask}
                    onDeleteSubtask={onDeleteSubtask}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
};
