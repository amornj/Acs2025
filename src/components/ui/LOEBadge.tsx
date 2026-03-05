'use client';

import { cn } from '@/lib/utils';

export type LOELevel = 'A' | 'B-R' | 'B-NR' | 'C-LD' | 'C-EO';

interface LOEBadgeProps {
  level: LOELevel;
  className?: string;
}

export function LOEBadge({ level, className }: LOEBadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700', className)}>
      LOE: {level}
    </span>
  );
}
