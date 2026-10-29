import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { api } from './services/api';
import { Task, Status, Priority } from './types';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskModal } from './components/TaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { BottomToolbar } from './components/BottomToolbar';
import { FloatingAddButton } from './components/FloatingAddButton';
import { Toaster, toast } from 'sonner';
import confetti from 'canvas-confetti';
import { Loader2, Search, X } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Filters state
  const [search, setSearch] = useState('');
  const [activeColumn, setActiveColumn] = useState<Status>('todo');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [initialStatus, setInitialStatus] = useState<Status>('todo');

  // View task details state (Задача 4)
  const [taskToView, setTaskToView] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'],
    });
  }, []);

  const loadTasks = useCallback(async () => {
    if (!user) return;
    setLoadingTasks(true);
    try {
      const data = await api.getTasks({
        search: search || undefined,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
      });
      setTasks(data);
    } catch (err: any) {
      toast.error(err.message || 'Ошибка загрузки задач');
    } finally {
      setLoadingTasks(false);
    }
  }, [user, search, priorityFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Keyboard shortcut: Press "n" to open new task modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'n' &&
        !['input', 'textarea', 'select'].includes((e.target as HTMLElement).tagName.toLowerCase()) &&
        !isTaskModalOpen &&
        !isDetailOpen &&
        !isSettingsOpen &&
        user
      ) {
        e.preventDefault();
        setTaskToEdit(null);
        setInitialStatus('todo');
        setIsTaskModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTaskModalOpen, isDetailOpen, isSettingsOpen, user]);

  // Handlers
  const handleSaveTask = async (data: {
    title: string;
    description?: string | null;
    priority: Priority;
    status?: Status;
    deadline?: string | null;
    subtasks?: string[];
  }) => {
    if (taskToEdit) {
      const updated = await api.updateTask(taskToEdit.id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        deadline: data.deadline,
        subtasks: data.subtasks,
      });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (taskToView && taskToView.id === updated.id) {
        setTaskToView(updated);
      }
      toast.success('Задача обновлена');
      if (data.status === 'done' && taskToEdit.status !== 'done') {
        fireConfetti();
      }
    } else {
      const created = await api.createTask({
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        deadline: data.deadline || undefined,
        subtasks: data.subtasks,
      });
      setTasks((prev) => [created, ...prev]);
      toast.success('Новая задача создана!');
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (taskToView && taskToView.id === id) {
        setIsDetailOpen(false);
        setTaskToView(null);
      }
      toast.success('Задача удалена');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка удаления задачи');
    }
  };

  const handleStatusChange = async (id: number, newStatus: Status) => {
    try {
      const updated = await api.updateTask(id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (taskToView && taskToView.id === id) {
        setTaskToView(updated);
      }
      if (newStatus === 'done') {
        fireConfetti();
        toast.success('🎉 Задача выполнена!');
      } else if (newStatus === 'in_progress') {
        toast.info('Задача переведена в работу');
      } else {
        toast.info('Задача возвращена к выполнению');
      }
    } catch (err: any) {
      toast.error(err.message || 'Ошибка обновления статуса');
    }
  };

  const handleToggleSubtask = async (taskId: number, subtaskId: number, currentStatus: boolean) => {
    try {
      const updatedSub = await api.updateSubtask(taskId, subtaskId, {
        is_completed: !currentStatus,
      });
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task;
          const updatedSubs = task.subtasks.map((st) => (st.id === subtaskId ? updatedSub : st));
          const allDone = updatedSubs.length > 0 && updatedSubs.every((s) => s.is_completed);
          if (allDone && !currentStatus) {
            fireConfetti();
            toast.success('🎉 Все подзадачи завершены!');
          }
          const updatedTask = { ...task, subtasks: updatedSubs };
          if (taskToView && taskToView.id === taskId) {
            setTaskToView(updatedTask);
          }
          return updatedTask;
        })
      );
    } catch (err: any) {
      toast.error(err.message || 'Ошибка изменения статуса подзадачи');
    }
  };

  const handleAddSubtask = async (taskId: number, title: string) => {
    try {
      const newSub = await api.createSubtask(taskId, title);
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task;
          const updatedTask = { ...task, subtasks: [...task.subtasks, newSub] };
          if (taskToView && taskToView.id === taskId) {
            setTaskToView(updatedTask);
          }
          return updatedTask;
        })
      );
      toast.success('Подзадача добавлена');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка добавления подзадачи');
    }
  };

  const handleDeleteSubtask = async (taskId: number, subtaskId: number) => {
    try {
      await api.deleteSubtask(taskId, subtaskId);
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task;
          const updatedTask = {
            ...task,
            subtasks: task.subtasks.filter((s) => s.id !== subtaskId),
          };
          if (taskToView && taskToView.id === taskId) {
            setTaskToView(updatedTask);
          }
          return updatedTask;
        })
      );
      toast.success('Подзадача удалена');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка удаления подзадачи');
    }
  };

  const handleOpenView = (task: Task) => {
    setTaskToView(task);
    setIsDetailOpen(true);
  };

  const handleOpenEditFromView = (task: Task) => {
    setIsDetailOpen(false);
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#090a0f]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster theme={theme} position="bottom-right" richColors />
        <AuthModal />
      </>
    );
  }

  const completedCount = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#090a0f] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <Toaster theme={theme} position="top-right" richColors />

      {/* Navigation with Minimalist Logo, Theme Switcher & 3-stripe Menu */}
      <Navbar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 relative">
        {/* Плавающий аккуратный островок поиска вверху экрана (под шапкой по центру) */}
        <div className="flex justify-center mb-6">
          <div className="relative flex items-center bg-white/80 dark:bg-[#12141a]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/[0.1] rounded-2xl shadow-lg shadow-zinc-900/5 px-4 py-2 w-full max-w-md focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500 transition-all duration-200">
            <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 mr-2.5 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск задач..."
              className="w-full bg-transparent text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded-md transition-colors"
                title="Очистить поиск"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {loadingTasks ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            activeColumn={activeColumn}
            onViewTask={handleOpenView}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleStatusChange}
            onToggleSubtask={handleToggleSubtask}
            onAddSubtask={handleAddSubtask}
            onDeleteSubtask={handleDeleteSubtask}
            onOpenCreateWithStatus={(colStatus) => {
              setTaskToEdit(null);
              setInitialStatus(colStatus);
              setIsTaskModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Нижняя плавающая панель (вкладки прогресса задачи с Фото 3 + приоритеты) */}
      <BottomToolbar
        activeColumn={activeColumn}
        onSelectColumn={setActiveColumn}
        columnCounts={{
          todo: tasks.filter((t) => t.status === 'todo').length,
          in_progress: tasks.filter((t) => t.status === 'in_progress').length,
          done: tasks.filter((t) => t.status === 'done').length,
        }}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
      />

      {/* Фото 1: Крупный плавающий FAB плюсик в правом нижнем углу */}
      <FloatingAddButton
        onClick={() => {
          setTaskToEdit(null);
          setInitialStatus('todo');
          setIsTaskModalOpen(true);
        }}
      />

      {/* Задача 4: Модальное окно просмотра деталей задачи */}
      <TaskDetailModal
        task={taskToView}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setTaskToView(null);
        }}
        onEdit={handleOpenEditFromView}
        onDelete={handleDeleteTask}
        onStatusChange={handleStatusChange}
        onToggleSubtask={handleToggleSubtask}
        onAddSubtask={handleAddSubtask}
        onDeleteSubtask={handleDeleteSubtask}
      />

      {/* Модальное окно создания и редактирования задачи */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        initialStatus={initialStatus}
        onSave={handleSaveTask}
      />

      {/* Настройки AI ключа */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
