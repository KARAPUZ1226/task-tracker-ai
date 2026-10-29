import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Key, Check, Info, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { apiKey, setApiKey } = useAuth();
  const [keyInput, setKeyInput] = useState(apiKey);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(keyInput.trim());
    toast.success(keyInput.trim() ? 'AI API ключ сохранен локально' : 'Ключ сброшен (используется встроенный умный генератор)');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#121215] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Настройки AI</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              OpenAI / Groq / OpenRouter API Key (опционально)
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-[#18181c] border border-white/[0.08] focus:border-brand-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-all font-mono"
            />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2 text-xs text-zinc-400 leading-relaxed">
            <div className="flex items-center gap-1.5 font-medium text-zinc-300">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Умный режим без внешнего ключа:</span>
            </div>
            <p>
              Если поле оставить пустым, сервис автоматически использует встроенный семантический генератор декомпозиции, шаблонов описания и расчета сроков по отраслевым стандартам.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.04]"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Сохранить</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
