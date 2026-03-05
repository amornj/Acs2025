'use client';

import { ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

type SummaryColor = 'blue' | 'amber' | 'green' | 'purple' | 'teal';

const COLOR_MAP: Record<SummaryColor, { border: string; bg: string; icon: string }> = {
  blue:   { border: 'border-blue-300',   bg: 'bg-blue-50',   icon: 'text-blue-600' },
  amber:  { border: 'border-amber-300',  bg: 'bg-amber-50',  icon: 'text-amber-600' },
  green:  { border: 'border-green-300',  bg: 'bg-green-50',  icon: 'text-green-600' },
  purple: { border: 'border-purple-300', bg: 'bg-purple-50', icon: 'text-purple-600' },
  teal:   { border: 'border-teal-300',   bg: 'bg-teal-50',   icon: 'text-teal-600' },
};

interface SummaryBoxProps {
  title: string;
  color: SummaryColor;
  items: string[];
  placeholder?: string;
}

export function SummaryBox({ title, color, items, placeholder }: SummaryBoxProps) {
  const style = COLOR_MAP[color];
  const isEmpty = items.length === 0;

  return (
    <div className={cn('rounded-lg border-2 p-4 mt-6', style.border, style.bg)}>
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className={cn('h-5 w-5', style.icon)} />
        <h3 className={cn('text-sm font-bold uppercase tracking-wide', style.icon)}>
          {title}
        </h3>
      </div>
      {isEmpty ? (
        <p className="text-sm text-gray-500 italic">
          {placeholder || 'Complete the fields above to generate a summary.'}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((line, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-800">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
