import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');

  // Helper to parse inline formatting like **bold**, *italic*, <u>underline</u> and `code`
  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|<u>.*?<\/u>|__.*?__|`.*?`|\*.*?\*|_.*?_)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return <strong key={idx} className="font-semibold text-zinc-900 dark:text-zinc-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('<u>') && part.endsWith('</u>') && part.length >= 7) {
        return (
          <span key={idx} className="underline decoration-emerald-500/70 underline-offset-2">
            {part.slice(3, -4)}
          </span>
        );
      }
      if (part.startsWith('__') && part.endsWith('__') && part.length >= 4) {
        return (
          <span key={idx} className="underline decoration-emerald-500/70 underline-offset-2">
            {part.slice(2, -2)}
          </span>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code key={idx} className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (
        ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) &&
        part.length >= 2
      ) {
        return <em key={idx} className="italic text-zinc-800 dark:text-zinc-200">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className={`space-y-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 ${className}`}>
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();

        if (!line) {
          return <div key={index} className="h-1.5" />;
        }

        // Headers
        if (line.startsWith('### ')) {
          return (
            <h4 key={index} className="font-bold text-sm text-zinc-900 dark:text-zinc-100 pt-2 pb-0.5 border-b border-zinc-200 dark:border-white/[0.06] tracking-tight">
              {renderInline(line.slice(4))}
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={index} className="font-bold text-base text-zinc-900 dark:text-zinc-100 pt-2.5 pb-1 border-b border-zinc-200 dark:border-white/[0.08] tracking-tight">
              {renderInline(line.slice(3))}
            </h3>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h2 key={index} className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50 pt-3 pb-1 border-b border-zinc-200 dark:border-white/[0.1] tracking-tight">
              {renderInline(line.slice(2))}
            </h2>
          );
        }

        // Checklist items: clean readable presentation without line-through!
        if (line.startsWith('- [x] ') || line.startsWith('* [x] ')) {
          return (
            <div key={index} className="flex items-start gap-2 pl-1 py-0.5 text-zinc-800 dark:text-zinc-200">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <span>{renderInline(line.slice(6))}</span>
            </div>
          );
        }
        if (line.startsWith('- [ ] ') || line.startsWith('* [ ] ')) {
          return (
            <div key={index} className="flex items-start gap-2 pl-1 py-0.5 text-zinc-700 dark:text-zinc-300">
              <Square className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 mt-0.5 shrink-0" />
              <span>{renderInline(line.slice(6))}</span>
            </div>
          );
        }

        // Unordered lists
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={index} className="flex items-start gap-2 pl-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-1.5 shrink-0" />
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }

        // Numbered lists
        const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
          return (
            <div key={index} className="flex items-start gap-2 pl-2 py-0.5">
              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                {numberedMatch[1]}.
              </span>
              <span>{renderInline(numberedMatch[2])}</span>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={index} className="py-0.5">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
};
