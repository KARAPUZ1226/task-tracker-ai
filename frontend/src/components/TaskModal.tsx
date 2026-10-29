import React, { useState, useEffect } from 'react';
import { Task, Priority, Status } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CustomDeadlinePicker } from './CustomDeadlinePicker';
import { MarkdownView } from './MarkdownView';
import { toast } from 'sonner';
import {
  X,
  Sparkles,
  ListTree,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Check,
  Calendar,
  Zap,
  Eye,
  Edit3,
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
  const [descTab, setDescTab] = useState<'edit' | 'preview'>('edit');

  // AI loading states
  const [loadingDecompose, setLoadingDecompose] = useState(false);
  const [loadingDescription, setLoadingDescription] = useState(false);
  const [loadingDeadline, setLoadingDeadline] = useState(false);
  const [loadingPrioritize, setLoadingPrioritize] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDescTab('edit');
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setDeadline(taskToEdit.deadline || '');
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
        const combined = Array.from(new Set([...subtasks, ...res.subtasks]));
        setSubtasks(combined);
        if (res.suggested_priority) {
          setPriority(res.suggested_priority);
        }
        toast.success(
          res.is_fallback
            ? `Сгенерировано ${res.subtasks.length} шагов по теме задачи`
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
        setDescTab('preview');
        toast.success('Описание задачи успешно сформировано');
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
        setDeadline(res.suggested_deadline);
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
        const mapRu: Record<Priority, string> = {
          urgent: 'Срочный',
          high: 'Высокий',
          medium: 'Средний',
          low: 'Низкий',
        };
        toast.success(`Рекомендованный приоритет: ${mapRu[res.suggested_priority]} (${res.reasoning})`);
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

  const priorities: { id: Priority; label: string; dot: string }[] = [
    { id: 'low', label: 'Низкий', dot: 'bg-zinc-400' },
    { id: 'medium', label: 'Средний', dot: 'bg-slate-400' },
    { id: 'high', label: 'Высокий', dot: 'bg-amber-500' },
    { id: 'urgent', label: 'Срочный', dot: 'bg-rose-500' },
  ];

  const statuses: { id: Status; label: string }[] = [
    { id: 'todo', label: 'К выполнению' },
    { id: 'in_progress', label: 'В работе' },
    { id: 'done', label: 'Готово' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#12141a] border border-zinc-200 dark:border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-[#161922]">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {taskToEdit ? 'Редактирование задачи' : 'Создание новой задачи'}
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* AI Helper Banner */}
          <div className="rounded-xl p-3 bg-zinc-100 dark:bg-[#161922] border border-zinc-200 dark:border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span>AI Инструменты</span>
              </div>
              <span className="text-[11px] text-zinc-500">Автозаполнение по названию</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={handleAIDecompose}
                disabled={loadingDecompose}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-all disabled:opacity-50"
              >
                {loadingDecompose ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ListTree className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span>Шаги</span>
              </button>

              <button
                type="button"
                onClick={handleAIGenerateDescription}
                disabled={loadingDescription}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-all disabled:opacity-50"
              >
                {loadingDescription ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Описание</span>
              </button>

              <button
                type="button"
                onClick={handleAISuggestDeadline}
                disabled={loadingDeadline}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-all disabled:opacity-50"
              >
                {loadingDeadline ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>Дедлайн</span>
              </button>

              <button
                type="button"
                onClick={handleAIPrioritize}
                disabled={loadingPrioritize}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-all disabled:opacity-50"
              >
                {loadingPrioritize ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>Приоритет</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Название задачи <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Что необходимо сделать..."
              className="w-full bg-zinc-100 dark:bg-[#18181c] border border-zinc-300 dark:border-white/[0.08] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
            />
          </div>

          {/* Segmented Buttons: Priority */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Приоритет задачи
            </label>
            <div className="grid grid-cols-4 gap-1.5 bg-zinc-100 dark:bg-[#18181c] p-1 rounded-xl border border-zinc-200 dark:border-white/[0.08]">
              {priorities.map((item) => {
                const isActive = priority === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPriority(item.id)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-300 dark:ring-white/[0.15]'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Segmented Buttons: Status */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Статус задачи
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-zinc-100 dark:bg-[#18181c] p-1 rounded-xl border border-zinc-200 dark:border-white/[0.08]">
              {statuses.map((item) => {
                const isActive = status === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStatus(item.id)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-300 dark:ring-white/[0.15]'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Deadline Picker */}
          <CustomDeadlinePicker value={deadline} onChange={setDeadline} />

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Описание задачи
              </label>
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#18181c] p-0.5 rounded-lg border border-zinc-200 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setDescTab('edit')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    descTab === 'edit'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-semibold'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Текст</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDescTab('preview')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    descTab === 'preview'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-semibold'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  <Eye className="w-3 h-3 text-emerald-500" />
                  <span>Предпросмотр</span>
                </button>
              </div>
            </div>

            {descTab === 'edit' ? (
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Контекст, детали или критерии выполнения (поддерживает ### заголовки, списки)..."
                className="w-full bg-zinc-100 dark:bg-[#18181c] border border-zinc-300 dark:border-white/[0.08] focus:border-emerald-500 rounded-xl p-3 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none leading-relaxed transition-all resize-none min-h-[110px]"
              />
            ) : (
              <div className="w-full bg-zinc-50 dark:bg-[#161922] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-3.5 min-h-[110px] overflow-y-auto">
                {description.trim() ? (
                  <MarkdownView content={description} />
                ) : (
                  <p className="text-xs text-zinc-400 italic">
                    Текст описания пока пуст. Введите текст во вкладке «Текст» или нажмите кнопку «Описание» в AI инструментах выше.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Subtasks (available in both create and edit modes) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Подзадачи чеклиста ({subtasks.length})
              </label>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Сгенерируйте через AI или добавьте вручную
              </span>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 mb-2 max-h-44 overflow-y-auto pr-1">
                {subtasks.map((st, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.06] text-xs text-zinc-800 dark:text-zinc-200"
                  >
                    <span className="flex-1 truncate">{i + 1}. {st}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(i)}
                      className="text-zinc-400 hover:text-rose-500 p-0.5 transition-colors"
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
                placeholder="Добавить шаг подзадачи..."
                className="flex-1 bg-zinc-100 dark:bg-[#18181c] border border-zinc-300 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3.5 py-2 rounded-xl bg-zinc-200 dark:bg-white/[0.08] hover:bg-zinc-300 dark:hover:bg-white/[0.14] text-xs text-zinc-800 dark:text-zinc-200 font-medium transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 active:scale-[0.98]"
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
