import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, X, Check } from 'lucide-react';

interface CustomDeadlinePickerProps {
  value: string; // ISO string or empty string
  onChange: (value: string) => void;
}

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];
const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const CustomDeadlinePicker: React.FC<CustomDeadlinePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial value or default to current date
  const parseDate = (val: string): Date => {
    if (!val) return new Date();
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const initialDate = parseDate(value);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(value ? initialDate.getDate() : null);
  const [selectedHours, setSelectedHours] = useState(value ? initialDate.getHours() : 18);
  const [selectedMinutes, setSelectedMinutes] = useState(value ? initialDate.getMinutes() : 0);

  // Manual text input
  const formatForInput = (val: string): string => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const [textInput, setTextInput] = useState(() => formatForInput(value));
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setTextInput(formatForInput(value));
    }
    if (value) {
      const d = parseDate(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setSelectedDay(d.getDate());
      setSelectedHours(d.getHours());
      setSelectedMinutes(d.getMinutes());
    } else {
      setSelectedDay(null);
    }
  }, [value]);

  // Close calendar popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday = 0

  const handleApplyDate = (day: number, hours = selectedHours, minutes = selectedMinutes) => {
    const newDate = new Date(viewYear, viewMonth, day, hours, minutes);
    const iso = newDate.toISOString();
    onChange(iso);
    setSelectedDay(day);
    setIsOpen(false);
  };

  // Manual typing handler
  const handleTextInputChange = (raw: string) => {
    setTextInput(raw);
    if (!raw.trim()) {
      onChange('');
      setSelectedDay(null);
      return;
    }
    // Try parse DD.MM.YYYY HH:MM or DD.MM.YYYY
    const match = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      const hours = match[4] !== undefined ? parseInt(match[4], 10) : selectedHours;
      const minutes = match[5] !== undefined ? parseInt(match[5], 10) : selectedMinutes;
      const d = new Date(year, month, day, hours, minutes);
      if (!isNaN(d.getTime()) && day >= 1 && day <= 31 && month >= 0 && month <= 11) {
        onChange(d.toISOString());
        setSelectedDay(day);
      }
    }
  };

  // Quick presets
  const applyPreset = (type: 'today' | 'tomorrow' | '3days' | 'week' | 'clear') => {
    if (type === 'clear') {
      onChange('');
      setTextInput('');
      setSelectedDay(null);
      return;
    }
    const d = new Date();
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);

    if (type === 'today') {
      d.setHours(18);
    } else if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      d.setHours(12);
    } else if (type === '3days') {
      d.setDate(d.getDate() + 3);
      d.setHours(18);
    } else if (type === 'week') {
      d.setDate(d.getDate() + 7);
      d.setHours(18);
    }

    onChange(d.toISOString());
  };

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Дедлайн задачи
      </label>

      {/* Main input trigger */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={textInput}
            onChange={(e) => handleTextInputChange(e.target.value)}
            onFocus={() => {
              isFocusedRef.current = true;
              setIsOpen(true);
            }}
            onBlur={() => {
              isFocusedRef.current = false;
              setTextInput(formatForInput(value));
            }}
            placeholder="ДД.ММ.ГГГГ ЧЧ:ММ (или выберите в окне)"
            className="w-full bg-zinc-100 dark:bg-[#18181c] border border-zinc-300 dark:border-white/[0.08] focus:border-emerald-500 rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
          />
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
          {value && (
            <button
              type="button"
              onClick={() => applyPreset('clear')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              title="Очистить дату"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 rounded-xl bg-zinc-200 dark:bg-white/[0.06] hover:bg-zinc-300 dark:hover:bg-white/[0.1] text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
        >
          Календарь
        </button>
      </div>

      {/* Quick presets pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={() => applyPreset('today')}
          className="px-2.5 py-1 rounded-lg text-[11px] bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-white/[0.06] transition-all"
        >
          Сегодня 18:00
        </button>
        <button
          type="button"
          onClick={() => applyPreset('tomorrow')}
          className="px-2.5 py-1 rounded-lg text-[11px] bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-white/[0.06] transition-all"
        >
          Завтра 12:00
        </button>
        <button
          type="button"
          onClick={() => applyPreset('3days')}
          className="px-2.5 py-1 rounded-lg text-[11px] bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-white/[0.06] transition-all"
        >
          Через 3 дня
        </button>
        <button
          type="button"
          onClick={() => applyPreset('week')}
          className="px-2.5 py-1 rounded-lg text-[11px] bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-white/[0.06] transition-all"
        >
          Через неделю
        </button>
        {value && (
          <button
            type="button"
            onClick={() => applyPreset('clear')}
            className="px-2 py-1 rounded-lg text-[11px] text-rose-500 hover:bg-rose-500/10 transition-colors ml-auto"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Popover Calendar Modal/Window */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.12] shadow-2xl p-4 space-y-3 animate-fade-in">
          {/* Header with Month / Year & Nav */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-zinc-400">
            {DAY_NAMES.map((d) => (
              <span key={d} className="py-0.5">{d}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Blank leading days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = selectedDay === day;
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === viewMonth &&
                new Date().getFullYear() === viewYear;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleApplyDate(day)}
                  className={`h-7 w-7 mx-auto rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20'
                      : isToday
                      ? 'border border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Custom Time Selector (No browser native selects) */}
          <div className="pt-2.5 border-t border-zinc-200 dark:border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300">
              <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-500" /> Время:
              </span>
              <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#121215] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-1">
                {/* Hours stepper */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedHours((h) => (h === 0 ? 23 : h - 1))}
                    className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-mono font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    {String(selectedHours).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedHours((h) => (h === 23 ? 0 : h + 1))}
                    className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-xs font-bold"
                  >
                    +
                  </button>
                </div>

                <span className="text-zinc-400 font-bold">:</span>

                {/* Minutes stepper */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedMinutes((m) => (m === 0 ? 45 : (m - 15 + 60) % 60))}
                    className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-mono font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    {String(selectedMinutes).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedMinutes((m) => (m === 45 ? 0 : (m + 15) % 60))}
                    className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Quick time chips */}
            <div className="flex items-center justify-between gap-1 pt-0.5">
              {[
                { h: 10, m: 0, label: '10:00' },
                { h: 14, m: 0, label: '14:00' },
                { h: 18, m: 0, label: '18:00' },
                { h: 21, m: 0, label: '21:00' },
              ].map((time) => {
                const isActive = selectedHours === time.h && selectedMinutes === time.m;
                return (
                  <button
                    key={time.label}
                    type="button"
                    onClick={() => {
                      setSelectedHours(time.h);
                      setSelectedMinutes(time.m);
                    }}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-mono transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    {time.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              Закрыть
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedDay) {
                  handleApplyDate(selectedDay);
                } else {
                  handleApplyDate(new Date().getDate());
                }
              }}
              className="flex items-center gap-1 text-[11px] font-medium px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
            >
              <Check className="w-3 h-3" /> Применить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
