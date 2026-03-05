'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Stethoscope,
  BarChart3,
  Heart,
  Pill,
  ClipboardCheck,
  MessageCircleQuestion,
  BookOpen,
  Menu,
  X,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useACSStore } from '@/store/acsStore';

const NAV_ITEMS = [
  { href: '/evaluation',  label: 'Initial Evaluation',  icon: Stethoscope,            page: 'evaluation' },
  { href: '/risk',         label: 'Risk Stratification', icon: BarChart3,              page: 'risk' },
  { href: '/reperfusion',  label: 'Reperfusion Strategy',icon: Heart,                  page: 'reperfusion' },
  { href: '/medications',  label: 'Medications',         icon: Pill,                   page: 'medications' },
  { href: '/discharge',    label: 'Discharge & Follow-up', icon: ClipboardCheck,       page: 'discharge' },
  { href: '/ask',          label: 'Ask ACS2025',         icon: MessageCircleQuestion,  page: 'ask' },
  { href: '/notebooklm',   label: 'Ask NotebookLM',      icon: BookOpen,               page: 'notebooklm' },
];

export function Sidebar() {
  const pathname = usePathname();
  const completedPages = useACSStore((s) => s.completedPages);
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-3 left-3 z-50 rounded-lg bg-[#003366] p-2 text-white lg:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 flex h-full w-64 flex-col bg-[#003366] text-white transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="px-4 py-5 border-b border-white/10">
          <h1 className="text-lg font-bold tracking-tight">ACS 2025</h1>
          <p className="text-xs text-blue-200 mt-0.5">Clinical Decision Support</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const completed = completedPages.includes(item.page);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                  active
                    ? 'bg-white/15 font-semibold'
                    : 'hover:bg-white/10'
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {completed && (
                  <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-3">
          <p className="text-[10px] text-blue-300 leading-tight">
            Based on 2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for ACS
            (Circulation 2025;151:e771-e862)
          </p>
        </div>
      </aside>
    </>
  );
}
