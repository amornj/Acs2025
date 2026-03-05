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

## Pages (9 total)

| Page | Route | Description |
|------|-------|-------------|
| **Home** | `/` | Dashboard with overview |
| **Evaluation** | `/evaluation` | Prehospital pathway (EMS/self-transport), symptom assessment, ECG, hs-troponin 0/1h algorithm, ACS classification |
| **Risk** | `/risk` | TIMI STEMI (0-14) or TIMI UA/NSTEMI (0-7), GRACE 2.0, Killip class, SCAI shock stage, biomarkers |
| **Reperfusion** | `/reperfusion` | STEMI pathway, fibrinolytic contraindication checklist, fibrinolysis downstream recs, NSTE-ACS invasive strategy, PCI unsuccessful, CABG pathway, cardiogenic shock, multivessel CAD (STEMI + NSTEMI), mechanical complications |
| **Medications** | `/medications` | Acute pain & supportive care (O2, NTG, morphine, NSAIDs), antiplatelet (P2Y12), anticoag with dose calculator, lipid therapy (3 pathways: statin-naive/max-tolerated/intolerant), other meds (BB, ACEi/ARB, MRA, SGLT2i, colchicine, PPI), anemia management |
| **Discharge** | `/discharge` | ARC-HBR criteria (14 major + 6 minor), DAPT duration strategies, lipid follow-up, cardiac rehab, ICD timing, immunization, discharge checklist |
| **Key Images** | `/key-images` | 6 essential guideline figures with lightbox viewer (Figs 3,4,5,6,8,11) |
| **Ask ACS2025** | `/ask` | Full-text keyword search across guideline with COR/LOE badges |
| **Ask NotebookLM** | `/notebooklm` | Chat with Google NotebookLM — Brief/Explanatory modes, read aloud, persistent history |

## Architecture

### Frontend (Vercel)
All pages are static except `/api/notebooklm` (server-side API route). The app is fully client-side — Zustand store persists to localStorage.

### NotebookLM Integration
The "Ask NotebookLM" page uses a **shared NLM proxy server** (same as PE2026 project):

1. Vercel API route (`/api/notebooklm`) calls the NLM proxy server-side
2. NLM proxy runs on iMac port 3847 (`/Users/home/projects/cto-coach/nlm-proxy/server.js`)
3. Exposed via **Tailscale Funnel** at `https://homes-imac.tail459031.ts.net`
4. Vercel env vars: `NLM_PROXY_URL` + `NLM_PROXY_KEY`
5. No VPN needed on client side — works from any device

**NotebookLM Notebook:** `49b5de32-8bf1-4046-bf3e-55fafae57616` (ACS2025, 1 source: the guideline PDF)

### Known Issues & Decisions

1. **NLM auth can expire** — re-authenticate: `nlm login` (Chrome, amornj@gmail.com)
2. **NLM queries are slow** — 10-30s per query is normal (90s timeout in proxy)
3. **Zustand migration** — New store fields (arcHbrMajor, arcHbrMinor, timiStemi, statinStatus) have fallback defaults for older persisted state. If a page crashes, user can "Reset All Data" from sidebar.

## Data Files
- `ACS2025.pdf` — Original guideline PDF (8.1 MB)
- `guideline_full_text.txt` — Full extracted text (551K chars, for Ask ACS2025 search)
- `src/data/guidelines.ts` — Structured guideline data for search index
- `public/images/key-image-*.png` — 6 guideline figures (Figs 3,4,5,6,8,11)

## Key Components
- `src/store/acsStore.ts` — Zustand store (evaluation, risk, reperfusion, medications, discharge, chat histories, ARC-HBR)
- `src/components/ui/CORBadge.tsx` — Class of Recommendation badges (I=green, 2a=yellow, 2b=orange, 3=red)
- `src/components/ui/LOEBadge.tsx` — Level of Evidence badges (gray pills)
- `src/components/ui/SummaryBox.tsx` — Clinical summary boxes at bottom of each step
- `src/components/layout/Sidebar.tsx` — Navigation with progress indicators + Reset All Data
- `src/app/api/notebooklm/route.ts` — Server-side API route calling NLM proxy

## Development
```bash
npm install
npm run dev          # Frontend on localhost:3000
```

## Deployment
```bash
npx vercel --prod --yes --name acs2025
```

## Store Types (key interfaces)
- `EvaluationData` — ECG findings, troponin pathway, symptoms, ACS type
- `RiskData` — TIMI (UA/NSTEMI), TIMI STEMI, GRACE 2.0, Killip, SCAI, biomarkers
- `ReperfusionData` — PCI capability, timing, strategy, shock, MVD, fibrinolytic agent, invasive strategy
- `MedicationsData` — Antiplatelet, anticoag, lipid (with statinStatus: naive/max-tolerated/intolerant), other meds
- `DischargeData` — DAPT plan, ARC-HBR (14 major + 6 minor criteria), rehab, ICD, checklist
