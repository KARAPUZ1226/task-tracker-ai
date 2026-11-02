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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-md-surface-container-low border border-md-outline-variant/30 rounded-[28px] shadow-2xl p-6 sm:p-8 space-y-6 animate-pop-in">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-md-surface-container border border-md-outline-variant/30 items-center justify-center shadow-xs mb-1">
            <AppLogo className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-md-on-surface">
            {isRegister ? 'Регистрация' : 'Вход в TaskTracker AI'}
          </h2>
          <p className="text-xs text-md-on-surface-variant">
            {isRegister
              ? 'Создайте аккаунт для синхронизации ваших задач'
              : 'Войдите для доступа к своим задачам и AI-ассистенту'}
          </p>
        </div>

        {/* Tabs: M3 Segmented Button */}
        <div className="flex bg-md-surface-container p-1 rounded-full border border-md-outline-variant/20">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
              !isRegister
                ? 'bg-md-surface text-md-on-surface shadow-xs font-bold'
                : 'text-md-on-surface-variant hover:text-md-on-surface'
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
              isRegister
                ? 'bg-md-surface text-md-on-surface shadow-xs font-bold'
                : 'text-md-on-surface-variant hover:text-md-on-surface'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-md-on-surface-variant mb-1.5">
              Email адрес
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-md-surface-container rounded-2xl border border-md-outline-variant/30 px-4 py-3 text-xs text-md-on-surface placeholder:text-md-on-surface-variant/50 outline-none focus:ring-2 focus:ring-md-primary/40 focus:border-md-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-md-on-surface-variant mb-1.5">
              Пароль
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              className="w-full bg-md-surface-container rounded-2xl border border-md-outline-variant/30 px-4 py-3 text-xs text-md-on-surface placeholder:text-md-on-surface-variant/50 outline-none focus:ring-2 focus:ring-md-primary/40 focus:border-md-primary transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-md-primary text-md-on-primary text-xs font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Зарегистрироваться' : 'Войти'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="pt-2 border-t border-md-outline-variant/15 text-center space-y-3">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-md-surface-container hover:bg-md-surface-container-high border border-md-outline-variant/30 text-xs text-md-on-surface transition-all font-semibold active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-md-primary" />
            <span>Войти в 1 клик (Демо-аккаунт)</span>
          </button>

          <p className="text-[11px] text-md-on-surface-variant flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>JWT шифрование + защищенная база данных</span>
          </p>
        </div>
      </div>
    </div>
  );
};
