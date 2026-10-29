import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLogo } from './Navbar';
import { Sparkles, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export const AuthModal: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Заполните все поля');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      toast.error(err.message || 'Ошибка аутентификации');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@tasktracker.ai');
    setPassword('demo123456');
    setLoading(true);
    try {
      try {
        await login('demo@tasktracker.ai', 'demo123456');
      } catch {
        await register('demo@tasktracker.ai', 'demo123456');
      }
    } catch (err: any) {
      toast.error(err.message || 'Ошибка демо-входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-white dark:bg-[#12141a] border border-zinc-200 dark:border-white/[0.1] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-[#1a1d26] border border-zinc-200 dark:border-white/[0.1] items-center justify-center shadow-lg shadow-emerald-500/10 mb-1">
            <AppLogo className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {isRegister ? 'Регистрация' : 'Вход в TaskTracker AI'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {isRegister
              ? 'Создайте аккаунт для синхронизации ваших задач'
              : 'Войдите, чтобы получить доступ к своим проектам и AI-инструментам'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-100 dark:bg-[#18181c] p-1 rounded-xl border border-zinc-200 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              !isRegister
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              isRegister
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Email адрес</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-zinc-100 dark:bg-[#18181c] border border-zinc-300 dark:border-white/[0.08] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Пароль</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              className="w-full bg-zinc-100 dark:bg-[#18181c] border border-zinc-300 dark:border-white/[0.08] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 active:scale-[0.99]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Зарегистрироваться' : 'Войти'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="pt-2 border-t border-zinc-200 dark:border-white/[0.06] text-center space-y-3">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-700 dark:text-zinc-300 transition-all font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Войти в 1 клик (Демо-аккаунт)</span>
          </button>

          <p className="text-[11px] text-zinc-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>JWT шифрование + защищенная база данных</span>
          </p>
        </div>
      </div>
    </div>
  );
};
