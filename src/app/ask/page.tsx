'use client';

import { useState, useCallback } from 'react';
import { MessageCircleQuestion, Search, X, Clock } from 'lucide-react';
import { useACSStore } from '@/store/acsStore';
import { searchGuidelines, type GuidelineRecommendation } from '@/data/guidelines';
import { CORBadge } from '@/components/ui/CORBadge';
import { LOEBadge } from '@/components/ui/LOEBadge';
import { cn } from '@/lib/utils';

const EXAMPLE_QUERIES = [
  'prasugrel stroke',
  'fibrinolysis timing',
  'DAPT bleeding',
  'cardiogenic shock PCI',
  'troponin algorithm',
  'statin LDL nonstatin',
  'beta-blocker contraindications',
  'IABP vs Impella',
  'ticagrelor monotherapy',
  'complete revascularization',
];

export default function AskPage() {
  const { askHistory, addAskHistory, clearAskHistory } = useACSStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GuidelineRecommendation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback((searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    const matches = searchGuidelines(q);
    setResults(matches);
    setHasSearched(true);

    const answerText = matches.length > 0
      ? `Found ${matches.length} matching recommendation${matches.length !== 1 ? 's' : ''}: ${matches.slice(0, 3).map((m) => m.title).join(', ')}${matches.length > 3 ? '...' : ''}`
      : 'No matching recommendations found. Try different search terms.';

    addAskHistory({
      question: q,
      answer: answerText,
      timestamp: Date.now(),
    });

    if (searchQuery) setQuery(searchQuery);
  }, [query, addAskHistory]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#003366] p-2">
          <MessageCircleQuestion className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ask ACS2025</h1>
          <p className="text-sm text-gray-500">Search guideline recommendations by clinical question</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-24 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Search guideline recommendations..."
        />
        <button
          onClick={() => handleSearch()}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-[#003366] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#004488]"
        >
          Search
        </button>
      </div>

      {/* Example queries */}
      {!hasSearched && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Example queries:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((eq) => (
              <button
                key={eq}
                onClick={() => handleSearch(eq)}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {eq}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search results */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
            </p>
            <button onClick={() => { setResults([]); setHasSearched(false); setQuery(''); }}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <X className="h-3 w-3" /> Clear
            </button>
          </div>

          {results.length === 0 ? (
            <div className="rounded-lg border bg-white p-8 text-center">
              <p className="text-gray-500">No matching recommendations found.</p>
              <p className="text-sm text-gray-400 mt-1">Try different search terms or browse the example queries above.</p>
            </div>
          ) : (
            results.map((rec) => (
              <div key={rec.id} className="rounded-lg border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      Section {rec.sectionNumber}: {rec.section} &middot; Page {rec.page}
                    </p>
                    <h3 className="text-sm font-semibold text-gray-900">{rec.title}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <CORBadge level={rec.cor} />
                    <LOEBadge level={rec.loe} />
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{rec.text}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {rec.keywords.slice(0, 6).map((kw) => (
                    <span key={kw} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{kw}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Search history */}
      {askHistory.length > 0 && (
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Search History
            </h2>
            <button onClick={clearAskHistory} className="text-xs text-gray-500 hover:text-red-600">
              Clear history
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {askHistory.map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                <button
                  onClick={() => handleSearch(item.question)}
                  className="text-sm text-blue-700 hover:underline font-medium shrink-0"
                >
                  {item.question}
                </button>
                <p className="text-xs text-gray-500 flex-1 truncate">{item.answer}</p>
                <span className="text-[10px] text-gray-400 shrink-0">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
