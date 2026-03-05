#!/usr/bin/env node
/**
 * Local NotebookLM API server
 * Runs on the iMac, proxies queries to the nlm CLI.
 * The Vercel-hosted frontend calls this via Tailscale VPN.
 *
 * Usage: node server/nlm-server.js
 * Listens on: http://0.0.0.0:3100
 */

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const app = express();
const PORT = 3100;
const NLM_PATH = '/Users/home/.local/bin/nlm';
const NOTEBOOK_ID = '49b5de32-8bf1-4046-bf3e-55fafae57616'; // ACS2025

app.use(cors({
  origin: [
    'https://acs2025.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    /^https:\/\/acs2025.*\.vercel\.app$/,
  ],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', notebook: NOTEBOOK_ID });
});

// Query NotebookLM
app.post('/api/notebooklm', async (req, res) => {
  try {
    const { question, conversationId } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log(`[NLM] Query: "${question.substring(0, 80)}..."`);

    // Escape single quotes
    const escapedQuestion = question.replace(/'/g, "'\\''");
    let cmd = `${NLM_PATH} notebook query ${NOTEBOOK_ID} '${escapedQuestion}'`;

    if (conversationId) {
      cmd += ` --conversation-id ${conversationId}`;
    }

    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 90000, // 90s timeout (NLM can be slow)
      env: {
        ...process.env,
        PATH: process.env.PATH + ':/Users/home/.local/bin',
        HOME: '/Users/home',
      },
    });

    if (stderr && !stdout) {
      console.error('[NLM] Error:', stderr);
      return res.status(500).json({ error: 'NotebookLM query failed' });
    }

    const result = JSON.parse(stdout);
    const answer = result.value?.answer || result.answer || 'No answer returned';
    const convId = result.value?.conversation_id || result.conversation_id || null;

    console.log(`[NLM] Answer: ${answer.substring(0, 100)}...`);

    res.json({ answer, conversationId: convId });
  } catch (error) {
    console.error('[NLM] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🧠 NotebookLM API server running on http://0.0.0.0:${PORT}`);
  console.log(`   Tailscale: http://100.117.54.7:${PORT}`);
  console.log(`   Local:     http://localhost:${PORT}`);
  console.log(`   Notebook:  ${NOTEBOOK_ID} (ACS2025)`);
});
