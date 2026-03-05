# ACS2025 — Clinical Decision Support Web App

## What Is This?
A Next.js web app based on the **2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management of Patients With Acute Coronary Syndromes** (Circulation 2025;151:e771-e862). It helps clinicians evaluate, risk-stratify, and manage ACS patients using guideline-based algorithms.

## Tech Stack
- **Frontend:** Next.js 16, TypeScript, Tailwind CSS v4, App Router
- **State:** Zustand with persist middleware (survives page switches + browser refresh)
- **Icons:** Lucide React
- **Markdown:** react-markdown (for NotebookLM answers)
- **Deployment:** Vercel (https://acs2025.vercel.app)
- **Repo:** https://github.com/amornj/Acs2025.git

## Pages (7 total)

| Page | Route | Description |
|------|-------|-------------|
| **Home** | `/` | Dashboard with overview |
| **Evaluation** | `/evaluation` | ECG, hs-troponin 0/1h algorithm, ACS classification (STEMI/NSTEMI/UA) |
| **Risk** | `/risk` | TIMI score, GRACE score, Killip class, SCAI shock stage |
| **Reperfusion** | `/reperfusion` | STEMI/NSTE-ACS pathways, fibrinolysis, timing targets, cardiogenic shock |
| **Medications** | `/medications` | Antiplatelet (P2Y12 selection), anticoag, lipids, beta-blockers, RAAS |
| **Discharge** | `/discharge` | DAPT duration, lipid targets, cardiac rehab, ICD timing, immunization |
| **Ask ACS2025** | `/ask` | Full-text keyword search across guideline with COR/LOE badges |
| **Ask NotebookLM** | `/notebooklm` | Chat with Google NotebookLM (AI-powered Q&A from the guideline) |

## Architecture

### Frontend (Vercel)
All pages are static except `/api/notebooklm` (legacy, not used in production). The app is fully client-side — Zustand store persists to localStorage.

### NotebookLM Server (Local, iMac)
The "Ask NotebookLM" page requires a **local API server** running on the iMac. This is because NotebookLM is accessed via the `nlm` CLI which only runs locally.

**How it works:**
1. `node server/nlm-server.js` runs on iMac (port 3100, binds 0.0.0.0)
2. Frontend auto-discovers the server by trying endpoints in order:
   - `http://localhost:3100` (local dev)
   - `http://100.117.54.7:3100` (Tailscale VPN)
   - `http://192.168.1.36:3100` (LAN)
3. Connection status shown in UI (green/yellow/red badge)
4. CORS configured to allow `acs2025.vercel.app`

**To start the server:**
```bash
cd /Users/home/projects/ACS2025
node server/nlm-server.js
# Or keep it running:
nohup node server/nlm-server.js > /tmp/nlm-server.log 2>&1 &
```

**NotebookLM Notebook:** `49b5de32-8bf1-4046-bf3e-55fafae57616` (ACS2025, 1 source: the guideline PDF)

### Known Issues & Decisions

1. **NotebookLM only works when the local server is running** — the `nlm` CLI cannot run on Vercel serverless functions. This was the initial bug: the Vercel API route tried to exec `/Users/home/.local/bin/nlm` which doesn't exist in the cloud.

2. **NLM auth can expire** — if `nlm` stops working, re-authenticate: `nlm login` (opens Chrome for Google auth on amornj@gmail.com)

3. **NLM queries are slow** — 10-30 seconds per query is normal. The 90-second timeout in the server accounts for this.

4. **Tailscale required for mobile access** — iPhone must be on Tailscale VPN to reach the iMac's NLM server. The app shows a "Disconnected" badge if the server is unreachable.

5. **CORS** — The server allows requests from `acs2025.vercel.app`, `localhost:3000`, and `localhost:3001`. If the Vercel URL changes, update `server/nlm-server.js`.

## Data Files
- `ACS2025.pdf` — Original guideline PDF (8.1 MB)
- `guideline_full_text.txt` — Full extracted text (551K chars, used for Ask ACS2025 search)
- `src/data/guidelines.ts` — Structured guideline data for search index

## Key Components
- `src/store/acsStore.ts` — Zustand store (all clinical data + chat history)
- `src/components/ui/CORBadge.tsx` — Class of Recommendation badges (I=green, 2a=yellow, 2b=orange, 3=red)
- `src/components/ui/LOEBadge.tsx` — Level of Evidence badges
- `src/components/ui/SummaryBox.tsx` — Clinical summary boxes at bottom of each step
- `src/components/layout/Sidebar.tsx` — Navigation with progress indicators
- `server/nlm-server.js` — Local NotebookLM API server

## Development
```bash
npm install
npm run dev          # Frontend on localhost:3000
node server/nlm-server.js  # NLM API on localhost:3100
```

## Deployment
```bash
npx vercel --prod --yes --name acs2025
```
