import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { api } from './services/api';
import { Task, Status, Priority, TaskStats } from './types';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { ListView } from './components/ListView';
import { FilterBar } from './components/FilterBar';
import { ProductivityBar } from './components/ProductivityBar';
import { TaskModal } from './components/TaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { FloatingAddButton } from './components/FloatingAddButton';
import { Toaster, toast } from 'sonner';
import confetti from 'canvas-confetti';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // View Mode: 'kanban' | 'list'
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>(() => {
    return (localStorage.getItem('view_mode') as 'kanban' | 'list') || 'kanban';
  });

  const handleViewModeChange = (mode: 'kanban' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('view_mode', mode);
  };

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('default');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [initialStatus, setInitialStatus] = useState<Status>('todo');

  // Detail Modal state
  const [taskToView, setTaskToView] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#006874', '#82d3e0', '#f59e0b', '#10b981', '#63597c'],
    });
  }, []);

  // Compute available tags from all current tasks
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((t) => {
      if (t.tags && Array.isArray(t.tags)) {
        t.tags.forEach((tag) => {
          if (tag.trim()) tagSet.add(tag.trim());
        });
      }
    });
    return Array.from(tagSet);
  }, [tasks]);

  const loadTasksAndStats = useCallback(async () => {
    if (!user) return;
    setLoadingTasks(true);
    try {
      const [tasksData, statsData] = await Promise.all([
        api.getTasks({
          search: debouncedSearch || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          priority: priorityFilter === 'all' ? undefined : priorityFilter,
          tag: selectedTag || undefined,
          sort_by: sortBy === 'default' ? undefined : sortBy,
        }),
        api.getStats().catch(() => null),
      ]);
      setTasks(tasksData);
      if (statsData) setStats(statsData);
    } catch (err: any) {
      toast.error(err.message || 'Ошибка загрузки задач');
    } finally {
      setLoadingTasks(false);
    }
  }, [user, debouncedSearch, statusFilter, priorityFilter, selectedTag, sortBy]);

  useEffect(() => {
    loadTasksAndStats();
  }, [loadTasksAndStats]);

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
    tags?: string[];
    is_pinned?: boolean;
    subtasks?: string[];
  }) => {
    if (taskToEdit) {
      const updated = await api.updateTask(taskToEdit.id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        deadline: data.deadline,
        tags: data.tags,
        is_pinned: data.is_pinned,
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
        tags: data.tags,
        is_pinned: data.is_pinned,
        subtasks: data.subtasks,
      });
      setTasks((prev) => [created, ...prev]);
      toast.success('Новая задача создана!');
    }
    api.getStats().then(setStats).catch(() => {});
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
      api.getStats().then(setStats).catch(() => {});
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
      api.getStats().then(setStats).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'Ошибка обновления статуса');
    }
  };

  const handleTogglePin = async (id: number) => {
    try {
      const updated = await api.togglePin(id);
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === id ? updated : t));
        return [...next].sort((a, b) => {
          if (Boolean(a.is_pinned) === Boolean(b.is_pinned)) return 0;
          return a.is_pinned ? -1 : 1;
        });
      });
      if (taskToView && taskToView.id === id) {
        setTaskToView(updated);
      }
      toast.info(updated.is_pinned ? 'Задача закреплена наверху' : 'Задача откреплена');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка закрепления задачи');
    }
  };

  const handleClearCompleted = async () => {
    try {
      const res = await api.clearCompleted();
      setTasks((prev) => prev.filter((t) => t.status !== 'done'));
      toast.success(`Удалено выполненных задач: ${res.deleted_count}`);
      api.getStats().then(setStats).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'Ошибка очистки выполненных задач');
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
      api.getStats().then(setStats).catch(() => {});
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
      api.getStats().then(setStats).catch(() => {});
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
      api.getStats().then(setStats).catch(() => {});
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

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSelectedTag(null);
    setSortBy('default');
  };

  const hasActiveFilters = Boolean(
    search || statusFilter !== 'all' || priorityFilter !== 'all' || selectedTag || sortBy !== 'default'
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-md-surface">
        <Loader2 className="w-8 h-8 text-md-primary animate-spin" />
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

  const columnCounts = useMemo(() => {
    if (stats && !debouncedSearch && !selectedTag && priorityFilter === 'all') {
      return {
        todo: stats.todo_tasks,
        in_progress: stats.in_progress_tasks,
        done: stats.done_tasks,
      };
    }
    return {
      todo: tasks.filter((t) => t.status === 'todo').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
    };
  }, [stats, debouncedSearch, selectedTag, priorityFilter, tasks]);

  return (
    <div className="min-h-screen flex flex-col bg-md-surface text-md-on-surface transition-colors duration-300">
      <Toaster theme={theme} position="top-right" richColors />

      {/* Material You Top App Bar */}
      <Navbar
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCreate={() => {
          setTaskToEdit(null);
          setInitialStatus('todo');
          setIsTaskModalOpen(true);
        }}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 relative">
        {/* Productivity Analytics Bar */}
        <ProductivityBar
          stats={stats}
          onClearCompleted={handleClearCompleted}
        />

        {/* Material 3 Filter & Search Controls */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
          availableTags={availableTags}
          sortBy={sortBy}
          onSortChange={setSortBy}
          columnCounts={columnCounts}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Task Views */}
        {loadingTasks ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-md-primary animate-spin" />
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            activeColumn={statusFilter}
            onViewTask={handleOpenView}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleStatusChange}
            onTogglePin={handleTogglePin}
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
            onViewTask={handleOpenView}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleStatusChange}
            onTogglePin={handleTogglePin}
            onToggleSubtask={handleToggleSubtask}
            onAddSubtask={handleAddSubtask}
            onDeleteSubtask={handleDeleteSubtask}
            onOpenCreate={() => {
              setTaskToEdit(null);
              setInitialStatus('todo');
              setIsTaskModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Material 3 Floating Action Button (Fixed Bottom-Right) */}
      <FloatingAddButton
        onClick={() => {
          setTaskToEdit(null);
          setInitialStatus('todo');
          setIsTaskModalOpen(true);
        }}
        extended={false}
      />

      {/* Task Detail Modal */}
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
        onTogglePin={handleTogglePin}
        onToggleSubtask={handleToggleSubtask}
        onAddSubtask={handleAddSubtask}
        onDeleteSubtask={handleDeleteSubtask}
      />

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        initialStatus={initialStatus}
        onSave={handleSaveTask}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
