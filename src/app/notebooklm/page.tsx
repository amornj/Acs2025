'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, BookOpen, Trash2, Volume2, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useACSStore } from '@/store/acsStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

type ChatMode = 'explanatory' | 'brief';

export default function NotebookLMPage() {
  const { nlmHistory, addNlmMessage, clearNlmHistory } = useACSStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [mode, setMode] = useState<ChatMode>('explanatory');
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [nlmHistory]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeakingIndex(null);
  }, []);

  function handleSpeak(text: string, index: number) {
    if (speakingIndex === index) {
      stopSpeaking();
      return;
    }
    window.speechSynthesis.cancel();
    // Strip markdown formatting for cleaner speech
    const stripped = text
      .replace(/[#*_`~>\-|]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, '. ');
    const utterance = new SpeechSynthesisUtterance(stripped);
    utterance.rate = 1;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');

    // Add user message
    addNlmMessage({ role: 'user', content: question, timestamp: Date.now() });

    setLoading(true);
    try {
      const res = await fetch(`/api/notebooklm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, conversationId, mode }),
      });

      const data = await res.json();

      if (res.ok) {
        addNlmMessage({
          role: 'assistant',
          content: data.answer,
          timestamp: Date.now(),
        });
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
      } else {
        addNlmMessage({
          role: 'assistant',
          content: `⚠️ Error: ${data.error || 'Failed to get response from NotebookLM'}`,
          timestamp: Date.now(),
        });
      }
    } catch {
      addNlmMessage({
        role: 'assistant',
        content: '⚠️ Network error. Please try again.',
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleExampleClick = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const exampleQuestions = [
    'What is the recommended reperfusion strategy for STEMI?',
    'When should fibrinolysis be used instead of PCI?',
    'What are the DAPT de-escalation strategies?',
    'How should cardiogenic shock be managed in ACS?',
    'What is the role of IVUS/OCT in ACS PCI?',
    'When is prasugrel contraindicated?',
    'What are the lipid management recommendations post-ACS?',
    'What does the DanGer-SHOCK trial show about Impella?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ask NotebookLM</h1>
              <p className="text-sm text-gray-500">
                Powered by Google NotebookLM — 2025 ACC/AHA ACS Guideline
              </p>
            </div>
          </div>
          {nlmHistory.length > 0 && (
            <button
              onClick={() => {
                clearNlmHistory();
                setConversationId(null);
                stopSpeaking();
              }}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
        <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-xs text-orange-700">
            💡 Cited answers from the guideline. Follow-up questions maintain context. Use 🔊 to read answers aloud.
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
        {nlmHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <BookOpen className="h-16 w-16 text-orange-200 mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Ask anything about the 2025 ACS Guideline
            </h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md">
              Get evidence-based answers with citations. Try one of these:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl w-full">
              {exampleQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(q)}
                  className="text-left p-3 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          nlmHistory.map((msg: Message, i: number) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-orange-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <>
                    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {/* Read aloud button */}
                    <button
                      onClick={() => handleSpeak(msg.content, i)}
                      className="mt-2 flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-orange-600"
                      aria-label={speakingIndex === i ? 'Stop reading' : 'Read aloud'}
                    >
                      {speakingIndex === i ? (
                        <><Square className="h-3 w-3" /> Stop</>
                      ) : (
                        <><Volume2 className="h-3 w-3" /> Read aloud</>
                      )}
                    </button>
                  </>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Bot className="h-4 w-4 text-orange-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching the ACS2025 guideline...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 pt-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the 2025 ACS Guideline..."
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>

        {/* Mode toggle */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Mode:</span>
            <button
              type="button"
              onClick={() => setMode('brief')}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                mode === 'brief'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Brief
            </button>
            <button
              type="button"
              onClick={() => setMode('explanatory')}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                mode === 'explanatory'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Explanatory
            </button>
          </div>
          <p className="text-xs text-gray-400">
            {mode === 'brief' ? 'Concise numbered points' : 'Detailed explanations'}
          </p>
        </div>
      </div>
    </div>
  );
}
