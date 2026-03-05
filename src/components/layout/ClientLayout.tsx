'use client';

import { Sidebar } from './Sidebar';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-6 pt-14 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
