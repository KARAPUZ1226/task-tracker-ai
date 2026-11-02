import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  GripVertical,
  Pin,
  Tag,
  Edit2,
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
    tags?: string[];
    is_pinned?: boolean;
    subtasks?: string[];
  }) => Promise<void>;
}

const PRESET_TAGS = ['Работа', 'Учеба', 'Дом', 'IT', 'Финансы', 'Здоровье', 'Личное'];

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
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [descTab, setDescTab] = useState<'edit' | 'preview'>('edit');

  // AI loading and dropdown
  const [loadingSmartAssist, setLoadingSmartAssist] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Subtask drag & inline edit state
  const [editingSubtaskIdx, setEditingSubtaskIdx] = useState<number | null>(null);
  const [editingSubtaskValue, setEditingSubtaskValue] = useState<string>('');
  const [draggedSubtaskIdx, setDraggedSubtaskIdx] = useState<number | null>(null);
  const [dragOverSubtaskIdx, setDragOverSubtaskIdx] = useState<number | null>(null);

  useEffect(() => {
    setDescTab('edit');
    setAiMenuOpen(false);
    setEditingSubtaskIdx(null);
    setDraggedSubtaskIdx(null);
    setDragOverSubtaskIdx(null);

    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setDeadline(taskToEdit.deadline || '');
      setTags(taskToEdit.tags || []);
      setIsPinned(taskToEdit.is_pinned || false);
      setSubtasks(taskToEdit.subtasks?.map((s) => s.title) || []);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus(initialStatus);
      setDeadline('');
      setTags([]);
      setIsPinned(false);
      setSubtasks([]);
    }
  }, [taskToEdit, initialStatus, isOpen]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to save, Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape' && !aiMenuOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, description, priority, status, deadline, tags, isPinned, subtasks, aiMenuOpen]);

  if (!isOpen) return null;

  // Unified Smart AI Assist (fills description + checklist + deadline + priority + tags in one tap!)
  const handleSmartAssist = async () => {
    if (!title.trim()) {
      toast.error('Введите название задачи для анализа AI');
      return;
    }
    setLoadingSmartAssist(true);
    try {
      const res = await api.aiSmartAssist(title.trim(), description.trim() || undefined, apiKey || undefined);
      if (res.description) {
        setDescription(res.description);
        setDescTab('preview');
      }
      if (res.subtasks && res.subtasks.length > 0) {
        setSubtasks(res.subtasks);
      }
      if (res.suggested_priority) {
        setPriority(res.suggested_priority);
      }
      if (res.suggested_deadline) {
        setDeadline(res.suggested_deadline);
      }
      if (res.suggested_tags && res.suggested_tags.length > 0) {
        const merged = Array.from(new Set([...tags, ...res.suggested_tags]));
        setTags(merged);
      }
      toast.success(res.is_fallback ? 'AI-ассистент заполнил задачу!' : 'AI успешно проанализировал задачу!');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка AI-ассистента');
    } finally {
      setLoadingSmartAssist(false);
      setAiMenuOpen(false);
    }
  };

  // Granular individual AI actions
  const handleOnlyDescription = async () => {
    if (!title.trim()) {
      toast.error('Введите название задачи');
      return;
    }
    setLoadingSmartAssist(true);
    try {
      const res = await api.aiGenerateDescription(title.trim(), description.trim() || undefined, apiKey || undefined);
      setDescription(res.description);
      setDescTab('preview');
      toast.success('Описание сгенерировано');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка генерации описания');
    } finally {
      setLoadingSmartAssist(false);
      setAiMenuOpen(false);
    }
  };

  const handleOnlyDecompose = async () => {
    if (!title.trim()) {
      toast.error('Введите название задачи');
      return;
    }
    setLoadingSmartAssist(true);
    try {
      const res = await api.aiDecompose(title.trim(), description.trim() || undefined, apiKey || undefined);
      if (res.subtasks && res.subtasks.length > 0) {
        setSubtasks((prev) => Array.from(new Set([...prev, ...res.subtasks])));
        toast.success(`Добавлено ${res.subtasks.length} шагов`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Ошибка декомпозиции');
    } finally {
      setLoadingSmartAssist(false);
      setAiMenuOpen(false);
    }
  };

  const handleOnlyDeadline = async () => {
    if (!title.trim()) {
      toast.error('Введите название задачи');
      return;
    }
    setLoadingSmartAssist(true);
    try {
      const res = await api.aiSuggestDeadline(title.trim(), description.trim() || undefined, priority, apiKey || undefined);
      setDeadline(res.suggested_deadline);
      toast.success(`Срок: ${res.estimated_days} дн. (${res.reasoning})`);
    } catch (err: any) {
      toast.error(err.message || 'Ошибка оценки дедлайна');
    } finally {
      setLoadingSmartAssist(false);
      setAiMenuOpen(false);
    }
  };

  // Subtask management
  const handleAddSubtask = () => {
    const clean = newSubtaskInput.trim();
    if (clean && !subtasks.includes(clean)) {
      setSubtasks([...subtasks, clean]);
      setNewSubtaskInput('');
    }
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  const handleStartEditSubtask = (idx: number) => {
    setEditingSubtaskIdx(idx);
    setEditingSubtaskValue(subtasks[idx]);
  };

  const handleSaveSubtaskEdit = (idx: number) => {
    const clean = editingSubtaskValue.trim();
    if (clean) {
      const updated = [...subtasks];
      updated[idx] = clean;
      setSubtasks(updated);
    }
    setEditingSubtaskIdx(null);
  };

  // Tag management
  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const raw = customTagInput.trim();
    if (!raw) return;
    const parts = raw.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
    if (parts.length > 0) {
      const merged = Array.from(new Set([...tags, ...parts]));
      setTags(merged);
      setCustomTagInput('');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Название задачи не может быть пустым');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        deadline: deadline || null,
        tags,
        is_pinned: isPinned,
        subtasks,
      });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Ошибка сохранения задачи');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl my-auto rounded-[28px] bg-md-surface-container-low border border-md-outline-variant/30 shadow-2xl p-5 sm:p-7 space-y-5 animate-pop-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-md-on-surface tracking-tight">
              {taskToEdit ? 'Редактирование задачи' : 'Новая задача'}
            </h2>
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`p-1.5 rounded-full transition-colors ${
                isPinned
                  ? 'text-md-primary bg-md-primary-container/40'
                  : 'text-md-on-surface-variant/40 hover:text-md-on-surface'
              }`}
              title={isPinned ? 'Открепить задачу' : 'Закрепить наверху списка'}
            >
              <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-container transition-colors"
            title="Закрыть (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title Input */}
        <div>
          <label className="block text-xs font-semibold text-md-on-surface-variant mb-1.5">
            Название задачи <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Подготовить отчет по налогам..."
            className="w-full bg-md-surface-container rounded-2xl border border-md-outline-variant/30 px-4 py-3 text-sm font-medium text-md-on-surface placeholder:text-md-on-surface-variant/50 outline-none focus:ring-2 focus:ring-md-primary/40 focus:border-md-primary transition-all"
            autoFocus
          />
        </div>

        {/* Material 3 AI Smart Assistant Bar (Zero button slop!) */}
        <div className="rounded-2xl bg-md-primary-container/25 border border-md-primary/20 p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-md-primary-container flex items-center justify-center shrink-0 text-md-on-primary-container shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-md-on-surface">Умный AI-ассистент</div>
              <p className="text-[11px] text-md-on-surface-variant line-clamp-1">
                Автоматически заполнит описание, шаги, срок и приоритет
              </p>
            </div>
          </div>

          {/* Unified AI Action Button & Dropdown */}
          <div className="relative flex items-center gap-1 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleSmartAssist}
              disabled={loadingSmartAssist}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-md-primary text-md-on-primary hover:shadow-md active:scale-95 disabled:opacity-50 transition-all"
            >
              {loadingSmartAssist ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>Умное заполнение</span>
            </button>

            {/* Dropdown toggle for individual AI actions */}
            <button
              type="button"
              onClick={() => setAiMenuOpen(!aiMenuOpen)}
              className="p-2 rounded-full text-md-on-surface-variant hover:bg-md-surface-container active:scale-95 transition-colors"
              title="Дополнительные опции AI"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {aiMenuOpen && (
              <div className="absolute right-0 top-10 z-30 w-56 rounded-2xl bg-md-surface-container border border-md-outline-variant/30 shadow-xl p-1.5 space-y-0.5 animate-pop-in">
                <button
                  type="button"
                  onClick={handleOnlyDescription}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-md-on-surface hover:bg-md-surface-container-high transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-md-primary" />
                  <span>Только описание</span>
                </button>
                <button
                  type="button"
                  onClick={handleOnlyDecompose}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-md-on-surface hover:bg-md-surface-container-high transition-colors"
                >
                  <ListTree className="w-3.5 h-3.5 text-md-primary" />
                  <span>Только подзадачи</span>
                </button>
                <button
                  type="button"
                  onClick={handleOnlyDeadline}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-md-on-surface hover:bg-md-surface-container-high transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-md-primary" />
                  <span>Оценить срок</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Priority & Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Priority Segmented Button */}
          <div>
            <label className="block text-xs font-semibold text-md-on-surface-variant mb-1.5">
              Приоритет
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-md-surface-container border border-md-outline-variant/20">
              {priorities.map((item) => {
                const isActive = priority === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPriority(item.id)}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                      isActive
                        ? 'bg-md-surface text-md-on-surface shadow-xs'
                        : 'text-md-on-surface-variant hover:text-md-on-surface'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-md-on-surface-variant mb-1.5">
              Статус
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-md-surface-container border border-md-outline-variant/20">
              {(
                [
                  { id: 'todo', label: 'К выполнению' },
                  { id: 'in_progress', label: 'В работе' },
                  { id: 'done', label: 'Готово' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id)}
                  className={`py-1.5 rounded-full text-[11px] font-semibold transition-all text-center ${
                    status === s.id
                      ? 'bg-md-surface text-md-on-surface shadow-xs'
                      : 'text-md-on-surface-variant hover:text-md-on-surface'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tags Selector */}
        <div>
          <label className="block text-xs font-semibold text-md-on-surface-variant mb-1.5 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Теги и категории
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    active
                      ? 'bg-md-secondary-container text-md-on-secondary-container font-semibold ring-1 ring-md-secondary/30'
                      : 'bg-md-surface-container text-md-on-surface-variant hover:bg-md-surface-container-high'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}

            {/* Custom tag input */}
            <div className="inline-flex items-center gap-1 bg-md-surface-container rounded-full px-2.5 py-1 text-xs border border-md-outline-variant/30">
              <span className="text-md-on-surface-variant">#</span>
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                placeholder="Свой тег..."
                className="w-20 bg-transparent text-xs text-md-on-surface outline-none"
              />
              {customTagInput && (
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="text-md-primary font-bold hover:scale-110"
                >
                  +
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Deadline Picker */}
        <div>
          <label className="block text-xs font-semibold text-md-on-surface-variant mb-1.5">
            Срок выполнения (дедлайн)
          </label>
          <CustomDeadlinePicker value={deadline} onChange={setDeadline} />
        </div>

        {/* Description Tabs (Markdown) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-md-on-surface-variant">
              Описание задачи
            </label>
            <div className="flex items-center bg-md-surface-container rounded-full p-0.5 border border-md-outline-variant/20">
              <button
                type="button"
                onClick={() => setDescTab('edit')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  descTab === 'edit'
                    ? 'bg-md-surface text-md-on-surface shadow-xs font-semibold'
                    : 'text-md-on-surface-variant'
                }`}
              >
                Текст
              </button>
              <button
                type="button"
                onClick={() => setDescTab('preview')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  descTab === 'preview'
                    ? 'bg-md-surface text-md-on-surface shadow-xs font-semibold'
                    : 'text-md-on-surface-variant'
                }`}
              >
                Предпросмотр
              </button>
            </div>
          </div>

          {descTab === 'edit' ? (
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробности, требования, ссылки..."
              className="w-full bg-md-surface-container rounded-2xl border border-md-outline-variant/30 p-3.5 text-xs text-md-on-surface placeholder:text-md-on-surface-variant/50 outline-none focus:ring-2 focus:ring-md-primary/40 focus:border-md-primary resize-none transition-all"
            />
          ) : (
            <div className="p-3.5 rounded-2xl bg-md-surface-container border border-md-outline-variant/30 min-h-[96px] max-h-56 overflow-y-auto">
              {description ? (
                <MarkdownView content={description} />
              ) : (
                <span className="text-xs text-md-on-surface-variant/50 italic">
                  Описание пока пустое
                </span>
              )}
            </div>
          )}
        </div>

        {/* Subtasks Checklist */}
        <div>
          <label className="block text-xs font-semibold text-md-on-surface-variant mb-1.5">
            Чеклист подзадач ({subtasks.length})
          </label>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {subtasks.map((st, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={() => setDraggedSubtaskIdx(idx)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverSubtaskIdx !== idx) setDragOverSubtaskIdx(idx);
                }}
                onDragLeave={() => setDragOverSubtaskIdx(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedSubtaskIdx === null || draggedSubtaskIdx === idx) return;
                  const updated = [...subtasks];
                  const [removed] = updated.splice(draggedSubtaskIdx, 1);
                  updated.splice(idx, 0, removed);
                  setSubtasks(updated);
                  setDraggedSubtaskIdx(null);
                  setDragOverSubtaskIdx(null);
                }}
                className={`flex items-center gap-2 p-2 rounded-xl bg-md-surface-container border ${
                  dragOverSubtaskIdx === idx
                    ? 'border-md-primary bg-md-primary-container/20'
                    : 'border-md-outline-variant/20'
                } text-xs text-md-on-surface group cursor-grab active:cursor-grabbing transition-all`}
              >
                <GripVertical className="w-3.5 h-3.5 text-md-on-surface-variant/40 shrink-0" />
                {editingSubtaskIdx === idx ? (
                  <input
                    type="text"
                    value={editingSubtaskValue}
                    onChange={(e) => setEditingSubtaskValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveSubtaskEdit(idx);
                      } else if (e.key === 'Escape') {
                        setEditingSubtaskIdx(null);
                      }
                    }}
                    onBlur={() => handleSaveSubtaskEdit(idx)}
                    autoFocus
                    className="flex-1 bg-md-surface border border-md-primary rounded-lg px-2 py-0.5 text-xs text-md-on-surface outline-none"
                  />
                ) : (
                  <span
                    onDoubleClick={() => handleStartEditSubtask(idx)}
                    className="flex-1 truncate cursor-pointer select-none"
                    title="Двойной клик для редактирования"
                  >
                    {st}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleStartEditSubtask(idx)}
                  className="p-1 rounded-full text-md-on-surface-variant/60 hover:text-md-on-surface opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Переименовать шаг"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveSubtask(idx)}
                  className="p-1 rounded-full text-md-on-surface-variant/60 hover:text-rose-500 opacity-60 hover:opacity-100 transition-opacity"
                  title="Удалить подзадачу"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Quick add subtask row */}
          <div className="flex items-center gap-2 mt-2">
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
              placeholder="Добавить шаг чеклиста..."
              className="flex-1 bg-md-surface-container rounded-xl border border-md-outline-variant/30 px-3 py-2 text-xs text-md-on-surface placeholder:text-md-on-surface-variant/50 outline-none focus:border-md-primary"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              disabled={!newSubtaskInput.trim()}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-md-primary-container text-md-on-primary-container hover:shadow-xs disabled:opacity-40 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-md-outline-variant/15">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-semibold text-md-on-surface-variant hover:bg-md-surface-container transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold bg-md-primary text-md-on-primary hover:shadow-md active:scale-95 disabled:opacity-50 transition-all"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{taskToEdit ? 'Сохранить изменения' : 'Создать задачу'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
