import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const NOTEBOOK_ID = '49b5de32-8bf1-4046-bf3e-55fafae57616';
const NLM_PATH = '/Users/home/.local/bin/nlm';

export async function POST(req: NextRequest) {
  try {
    const { question, conversationId } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Build command - escape single quotes in question
    const escapedQuestion = question.replace(/'/g, "'\\''");
    let cmd = `${NLM_PATH} notebook query ${NOTEBOOK_ID} '${escapedQuestion}'`;

    // If we have a conversation ID, pass it to maintain context
    if (conversationId) {
      cmd += ` --conversation-id ${conversationId}`;
    }

    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 60000, // 60s timeout
      env: { ...process.env, PATH: process.env.PATH + ':/Users/home/.local/bin' },
    });

    if (stderr && !stdout) {
      console.error('NLM error:', stderr);
      return NextResponse.json({ error: 'NotebookLM query failed' }, { status: 500 });
    }

    const result = JSON.parse(stdout);

    return NextResponse.json({
      answer: result.value?.answer || result.answer || 'No answer returned',
      conversationId: result.value?.conversation_id || result.conversation_id || null,
    });
  } catch (error: unknown) {
    console.error('NotebookLM API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
