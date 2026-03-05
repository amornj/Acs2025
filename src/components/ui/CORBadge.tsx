'use client';

import { cn } from '@/lib/utils';

export type CORLevel = '1' | '2a' | '2b' | '3-no-benefit' | '3-harm';

const COR_CONFIG: Record<CORLevel, { bg: string; text: string; label: string }> = {
  '1':             { bg: 'bg-green-500',  text: 'text-white', label: 'Class I: RECOMMENDED' },
  '2a':            { bg: 'bg-yellow-400', text: 'text-gray-900', label: 'Class 2a: REASONABLE' },
  '2b':            { bg: 'bg-orange-500', text: 'text-white', label: 'Class 2b: MAY BE REASONABLE' },
  '3-no-benefit':  { bg: 'bg-red-500',    text: 'text-white', label: 'Class III: NO BENEFIT' },
  '3-harm':        { bg: 'bg-red-600',    text: 'text-white', label: 'Class III: HARM' },
};

interface CORBadgeProps {
  level: CORLevel;
  className?: string;
}

export function CORBadge({ level, className }: CORBadgeProps) {
  const config = COR_CONFIG[level];
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold', config.bg, config.text, className)}>
      {config.label}
    </span>
  );
}
