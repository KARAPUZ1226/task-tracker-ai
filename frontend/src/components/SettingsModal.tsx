import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Key, Check, Sparkles } from 'lucide-react';
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
    toast.success(
      keyInput.trim()
        ? 'AI API ключ сохранен'
        : 'Ключ сброшен (активирован встроенный семантический генератор)'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-md-surface-container-low border border-md-outline-variant/30 rounded-[28px] shadow-2xl p-6 space-y-5 animate-pop-in">
        <div className="flex items-center justify-between pb-3 border-b border-md-outline-variant/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-md-primary-container text-md-on-primary-container flex items-center justify-center shadow-xs">
              <Key className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-md-on-surface">Настройки AI-интеграции</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-md-on-surface-variant mb-1.5">
              Google Gemini или OpenAI API Key (опционально)
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIza... или sk-..."
              className="w-full bg-md-surface-container rounded-2xl border border-md-outline-variant/30 px-4 py-3 text-xs text-md-on-surface placeholder:text-md-on-surface-variant/50 outline-none focus:ring-2 focus:ring-md-primary/40 focus:border-md-primary transition-all font-mono"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-md-surface-container border border-md-outline-variant/20 space-y-2 text-xs text-md-on-surface-variant leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-md-on-surface">
              <Sparkles className="w-4 h-4 text-md-primary" />
              <span>Умный режим без внешнего ключа</span>
            </div>
            <p>
              Если поле оставить пустым, система использует встроенные семантические эвристики и шаблоны
              для декомпозиции, оценки сроков, описания и тегов без задержек и лимитов.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-md-outline-variant/15">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-md-on-surface-variant hover:bg-md-surface-container rounded-full transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold rounded-full bg-md-primary text-md-on-primary hover:shadow-md active:scale-95 transition-all"
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
