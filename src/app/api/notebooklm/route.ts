import { NextRequest, NextResponse } from 'next/server';

const NLM_PROXY_URL = process.env.NLM_PROXY_URL || 'http://localhost:3847';
const NLM_PROXY_KEY = process.env.NLM_PROXY_KEY || '';
const NOTEBOOK_ID = '49b5de32-8bf1-4046-bf3e-55fafae57616'; // ACS2025

const MODE_PREFIXES: Record<string, string> = {
  brief: 'Answer as a numbered list. Each item starts with a bold key phrase. Maximum 4-5 items. Example format:\n1. **Key phrase** rest of the point.\n2. **Key phrase** rest of the point.\n\n',
  explanatory: 'Answer as a numbered list. Each item must start with a bold key phrase summarizing that point. Example format:\n1. **Key phrase** rest of the explanation.\n2. **Key phrase** rest of the explanation.\nUse this numbered+bold format for all points.\n\n',
};

export async function POST(req: NextRequest) {
  try {
    const { question, conversationId, mode } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const prefix = MODE_PREFIXES[mode as string] ?? '';
    const fullQuestion = prefix + question;

    const response = await fetch(`${NLM_PROXY_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(NLM_PROXY_KEY && { 'x-api-key': NLM_PROXY_KEY }),
      },
      body: JSON.stringify({
        question: fullQuestion,
        notebook_id: NOTEBOOK_ID,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('nlm-proxy error:', response.status, text);
      return NextResponse.json(
        { error: 'Failed to query NotebookLM' },
        { status: 502 },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      answer: data.answer ?? '',
      conversationId: data.conversation_id ?? null,
    });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
