import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { Task, Status, Priority } from './types';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { KanbanBoard } from './components/KanbanBoard';
import { ListView } from './components/ListView';
import { TaskModal } from './components/TaskModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { Toaster, toast } from 'sonner';
import confetti from 'canvas-confetti';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [initialStatus, setInitialStatus] = useState<Status>('todo');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'],
    });
  }, []);

  const loadTasks = useCallback(async () => {
    if (!user) return;
    setLoadingTasks(true);
    try {
      const data = await api.getTasks({
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
      });
      setTasks(data);
    } catch (err: any) {
      toast.error(err.message || 'Ошибка загрузки задач');
    } finally {
      setLoadingTasks(false);
    }
  }, [user, search, statusFilter, priorityFilter]);

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
  }, [isTaskModalOpen, isSettingsOpen, user]);

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
      toast.success('Задача удалена');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка удаления задачи');
    }
  };

  const handleStatusChange = async (id: number, newStatus: Status) => {
    try {
      const updated = await api.updateTask(id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (newStatus === 'done') {
        fireConfetti();
        toast.success('🎉 Задача выполнена!');
      } else {
        toast.info(
          newStatus === 'in_progress' ? 'Задача переведена в работу' : 'Задача возвращена в To Do'
        );
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
          return { ...task, subtasks: updatedSubs };
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
        prev.map((task) =>
          task.id === taskId ? { ...task, subtasks: [...task.subtasks, newSub] } : task
        )
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
        prev.map((task) =>
          task.id === taskId
            ? { ...task, subtasks: task.subtasks.filter((s) => s.id !== subtaskId) }
            : task
        )
      );
      toast.success('Подзадача удалена');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка удаления подзадачи');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster theme="dark" position="bottom-right" richColors />
        <AuthModal />
      </>
    );
  }

  const completedCount = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-[#f4f4f5]">
      <Toaster theme="dark" position="bottom-right" richColors />

      {/* Navigation */}
      <Navbar
        onOpenNewTask={() => {
          setTaskToEdit(null);
          setInitialStatus('todo');
          setIsTaskModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalCount={tasks.length}
          completedCount={completedCount}
        />

        {loadingTasks ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
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
        ) : (
          <ListView
            tasks={tasks}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>

      {/* Task Modal (Create / Edit) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        initialStatus={initialStatus}
        onSave={handleSaveTask}
      />

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
