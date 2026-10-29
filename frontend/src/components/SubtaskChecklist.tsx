import React, { useState } from 'react';
import { Subtask } from '../types';
import { Check, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface SubtaskChecklistProps {
  taskId: number;
  subtasks: Subtask[];
  onToggle: (taskId: number, subtaskId: number, currentStatus: boolean) => void;
  onAdd: (taskId: number, title: string) => void;
  onDelete: (taskId: number, subtaskId: number) => void;
}

export const SubtaskChecklist: React.FC<SubtaskChecklistProps> = ({
  taskId,
  subtasks,
  onToggle,
  onAdd,
  onDelete,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const completedCount = subtasks.filter((s) => s.is_completed).length;
  const totalCount = subtasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onAdd(taskId, newTitle.trim());
      setNewTitle('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-2.5 pt-1">
      {/* Progress Bar Header */}
      {totalCount > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Подзадачи ({completedCount}/{totalCount})
            </span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-200 dark:bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                progressPercent === 100 ? 'bg-emerald-500' : 'bg-emerald-600 dark:bg-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-1">
        {subtasks.map((st) => (
          <div
            key={st.id}
            className="group flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors min-w-0"
          >
            <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none overflow-hidden">
              <button
                type="button"
                onClick={() => onToggle(taskId, st.id, st.is_completed)}
                className={`w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all ${
                  st.is_completed
                    ? 'bg-emerald-600 text-white border border-emerald-500'
                    : 'border border-zinc-400 dark:border-zinc-600 hover:border-zinc-600 dark:hover:border-zinc-400 bg-transparent'
                }`}
              >
                {st.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
              <span
                title={st.title}
                className={`text-xs leading-snug transition-all truncate min-w-0 flex-1 block ${
                  st.is_completed
                    ? 'line-through text-zinc-400 dark:text-zinc-500'
                    : 'text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white'
                }`}
              >
                {st.title}
              </span>
            </label>
            <button
              type="button"
              onClick={() => onDelete(taskId, st.id)}
              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 p-1 rounded transition-all shrink-0"
              title="Удалить подзадачу"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new subtask */}
      {isAdding ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1 min-w-0">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Название шага..."
            autoFocus
            className="flex-1 min-w-0 bg-zinc-100 dark:bg-[#0e1015] border border-zinc-300 dark:border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shrink-0"
          >
            Добавить
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setNewTitle('');
            }}
            className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-white shrink-0"
          >
            Отмена
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium py-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Добавить пункт</span>
        </button>
      )}
    </div>
  );
};
