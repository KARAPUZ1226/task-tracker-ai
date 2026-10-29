import React, { useState, useEffect } from 'react';
import { Task, Priority, Status } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  X,
  Sparkles,
  ListTree,
  Calendar,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  initialStatus?: Status;
  onSave: (taskData: {
    title: string;
    description?: string | null;
    priority: Priority;
    status?: Status;
    deadline?: string | null;
    subtasks?: string[];
  }) => Promise<void>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  initialStatus = 'todo',
  onSave,
}) => {
  const { apiKey } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<Status>(initialStatus);
  const [deadline, setDeadline] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  // AI loading states
  const [loadingDecompose, setLoadingDecompose] = useState(false);
  const [loadingDescription, setLoadingDescription] = useState(false);
  const [loadingDeadline, setLoadingDeadline] = useState(false);
  const [loadingPrioritize, setLoadingPrioritize] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      if (taskToEdit.deadline) {
        // Convert to YYYY-MM-DDTHH:mm
        const d = new Date(taskToEdit.deadline);
        if (!isNaN(d.getTime())) {
          const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setDeadline(localIso);
        }
      } else {
        setDeadline('');
      }
      setSubtasks(taskToEdit.subtasks?.map((s) => s.title) || []);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus(initialStatus);
      setDeadline('');
      setSubtasks([]);
    }
  }, [taskToEdit, initialStatus, isOpen]);

  if (!isOpen) return null;

  // AI Handler: Decompose into subtasks
  const handleAIDecompose = async () => {
    if (!title.trim()) {
      toast.error('Введите название задачи для декомпозиции');
      return;
    }
    setLoadingDecompose(true);
    try {
      const res = await api.aiDecompose(title, description, apiKey);
      if (res.subtasks && res.subtasks.length > 0) {
        // Merge or replace subtasks
        const combined = Array.from(new Set([...subtasks, ...res.subtasks]));
        setSubtasks(combined);
        if (res.suggested_priority) {
          setPriority(res.suggested_priority);
        }
        toast.success(
          res.is_fallback
            ? `Сгенерировано ${res.subtasks.length} шагов (умный алгоритм)`
            : `AI разбил задачу на ${res.subtasks.length} подзадач!`
        );
      }
    } catch (err: any) {
      toast.error(err.message || 'Ошибка декомпозиции');
    } finally {
      setLoadingDecompose(false);
    }
  };

  // AI Handler: Generate Description
  const handleAIGenerateDescription = async () => {
    if (!title.trim()) {
      toast.error('Введите название задачи для генерации описания');
      return;
    }
    setLoadingDescription(true);
    try {
      const res = await api.aiGenerateDescription(title, description, apiKey);
      if (res.description) {
        setDescription(res.description);
        toast.success(
          res.is_fallback
            ? 'Описание сформировано по отраслевому шаблону'
            : 'AI успешно сгенерировал подробное описание задачи!'
        );
      }
    } catch (err: any) {
      toast.error(err.message || 'Ошибка генерации описания');
    } finally {
      setLoadingDescription(false);
    }
  };

  // AI Handler: Suggest Deadline
  const handleAISuggestDeadline = async () => {
    if (!title.trim()) {
      toast.error('Введите название задачи для расчета срока');
      return;
    }
    setLoadingDeadline(true);
    try {
      const res = await api.aiSuggestDeadline(title, description, priority, apiKey);
      if (res.suggested_deadline) {
        const d = new Date(res.suggested_deadline);
        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setDeadline(localIso);
        toast.info(`Рекомендованный срок: ${res.estimated_days} дн. (${res.reasoning})`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Ошибка предложения дедлайна');
    } finally {
      setLoadingDeadline(false);
    }
  };

  // AI Handler: Suggest Priority
  const handleAIPrioritize = async () => {
    if (!title.trim()) {
      toast.error('Введите название задачи для оценки приоритета');
      return;
    }
    setLoadingPrioritize(true);
    try {
      const res = await api.aiPrioritize(title, description, apiKey);
      if (res.suggested_priority) {
        setPriority(res.suggested_priority);
        toast.success(
          res.is_fallback
            ? `Рекомендованный приоритет: ${res.suggested_priority.toUpperCase()}`
            : `AI определил приоритет: ${res.suggested_priority.toUpperCase()} (${res.reasoning})`
        );
      }
    } catch (err: any) {
      toast.error(err.message || 'Ошибка анализа приоритета');
    } finally {
      setLoadingPrioritize(false);
    }
  };

  const handleAddSubtask = () => {
    if (newSubtaskInput.trim()) {
      setSubtasks([...subtasks, newSubtaskInput.trim()]);
      setNewSubtaskInput('');
    }
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Название задачи обязательно');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() ? description.trim() : (taskToEdit ? null : undefined),
        priority,
        status,
        deadline: deadline ? new Date(deadline).toISOString() : (taskToEdit ? null : undefined),
        subtasks: subtasks,
      });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-[#121215] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#16161b]">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">
              {taskToEdit ? 'Редактирование задачи' : 'Создание новой задачи'}
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Enhanced
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* AI Helper Banner */}
          <div className="rounded-xl p-3 bg-gradient-to-r from-brand-950/40 via-indigo-950/20 to-purple-950/20 border border-brand-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-300">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>AI Ассистент задачи</span>
              </div>
              <span className="text-[10px] text-zinc-400">Нажмите кнопку для автогенерации</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={handleAIDecompose}
                disabled={loadingDecompose}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/30 text-brand-300 text-xs font-medium transition-all disabled:opacity-50"
              >
                {loadingDecompose ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ListTree className="w-3.5 h-3.5 text-brand-400" />
                )}
                <span>Декомпозировать</span>
              </button>

              <button
                type="button"
                onClick={handleAIGenerateDescription}
                disabled={loadingDescription}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-all disabled:opacity-50"
              >
                {loadingDescription ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>Описание</span>
              </button>

              <button
                type="button"
                onClick={handleAISuggestDeadline}
                disabled={loadingDeadline}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-medium transition-all disabled:opacity-50"
              >
                {loadingDeadline ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                )}
                <span>Срок дедлайна</span>
              </button>

              <button
                type="button"
                onClick={handleAIPrioritize}
                disabled={loadingPrioritize}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-medium transition-all disabled:opacity-50"
              >
                {loadingPrioritize ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Приоритет</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Название задачи <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Разработать модуль авторизации с JWT"
              className="w-full bg-[#18181c] border border-white/[0.08] focus:border-brand-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all"
            />
          </div>

          {/* Priority & Deadline & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Приоритет</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-[#18181c] border border-white/[0.08] focus:border-brand-500 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none cursor-pointer"
              >
                <option value="low">Низкий (Low)</option>
                <option value="medium">Средний (Medium)</option>
                <option value="high">⚡ Высокий (High)</option>
                <option value="urgent">🔥 Срочный (Urgent)</option>
              </select>
            </div>

            {/* Status (if editing) */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Статус</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full bg-[#18181c] border border-white/[0.08] focus:border-brand-500 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none cursor-pointer"
              >
                <option value="todo">To Do (К выполнению)</option>
                <option value="in_progress">In Progress (В работе)</option>
                <option value="done">Done (Завершено)</option>
              </select>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Дедлайн</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[#18181c] border border-white/[0.08] focus:border-brand-500 rounded-xl px-3 py-1.5 text-xs text-zinc-200 outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-300">Описание задачи</label>
              <span className="text-[11px] text-zinc-500">Поддерживает Markdown</span>
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробное описание, контекст или критерии приемки..."
              className="w-full bg-[#18181c] border border-white/[0.08] focus:border-brand-500 rounded-xl p-3 text-xs text-white placeholder-zinc-500 outline-none leading-relaxed transition-all resize-y"
            />
          </div>

          {/* Subtasks (available in both create and edit modes) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-300">
                Подзадачи чеклиста ({subtasks.length})
              </label>
              <span className="text-[11px] text-zinc-500">Автозаполнение по кнопке AI Декомпозировать</span>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 mb-2 max-h-44 overflow-y-auto pr-1">
                {subtasks.map((st, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#18181c] border border-white/[0.06] text-xs text-zinc-300"
                  >
                    <span className="flex-1 truncate">{i + 1}. {st}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(i)}
                      className="text-zinc-500 hover:text-red-400 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Добавить пункт подзадачи вручную..."
                className="flex-1 bg-[#18181c] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs text-zinc-200 font-medium transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.04] transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-xs font-medium rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{taskToEdit ? 'Сохранить изменения' : 'Создать задачу'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
