# ACS2025 — Clinical Decision Support Web App

## Project Overview
Build a Next.js web app based on the **2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management of Patients With Acute Coronary Syndromes** (Circulation 2025;151:e771-e862).

The guideline PDF is at `ACS2025.pdf` and the full extracted text is at `guideline_full_text.txt`.

## Tech Stack
- Next.js 16 + TypeScript + App Router
- Tailwind CSS v4
- Zustand for state management (persist across page navigation)
- Lucide React for icons
- react-markdown for rendering
- Deploy to Vercel

## Architecture

### 6 Pages (sidebar navigation)

#### Page 1: Initial Evaluation (`/evaluation`)
- **ECG Classification**: Radio buttons for ST-elevation, ST-depression, non-diagnostic, posterior changes
- **STEMI Equivalents**: Checkbox for de Winter, Wellens, new LBBB
- **Troponin Pathway**:
  - Select assay type: hs-cTn (0/1h or 0/2h algorithm) vs conventional cTn (0/3-6h)
  - Input: initial value, repeat value, time between samples
  - Auto-calculate delta and determine: rule-out / observe / rule-in
  - Show sex-specific thresholds for hs-cTn
- **Symptom Assessment**: Chest pain characteristics, onset, radiation, associated symptoms
- **ACS Classification Output**: STEMI vs NSTEMI vs Unstable Angina vs ACS ruled out
- **Summary Box** at bottom (blue, like PE2026 StepSummaryBox pattern)

#### Page 2: Risk Stratification (`/risk`)
- **TIMI Risk Score for UA/NSTEMI**: 7 yes/no items, auto-score 0-7
  - Age >=65, >=3 CAD risk factors, known CAD (>=50% stenosis), ASA use in past 7d, >=2 angina events in 24h, ST deviation >=0.5mm, elevated cardiac markers
- **GRACE 2.0 Risk Score**: Age, HR, SBP, creatinine, Killip class, cardiac arrest, ST deviation, elevated troponin → in-hospital + 6-month mortality
- **Killip Classification**: I (no HF) / II (rales, S3) / III (pulmonary edema) / IV (cardiogenic shock)
- **SCAI Shock Stage**: A through E with definitions
- **Biomarkers panel**: Troponin trend (rising/falling/peaked), BNP/NT-proBNP, lactate
- **Risk Category Output**: Low / Intermediate / High / Very High
- **Summary Box** (amber)

#### Page 3: Reperfusion & Invasive Strategy (`/reperfusion`)
- **STEMI Pathway** (shown if ACS type = STEMI):
  - PCI-capable hospital? Yes/No
  - If yes: FMC-to-device goal <=90 min, direct to cath lab
  - If no: Can transfer for PCI in <=120 min? → Transfer vs fibrinolysis
  - Time from symptom onset: <12h / 12-24h / >24h → different recommendations
  - Fibrinolytic agent selection (alteplase, tenecteplase, reteplase)
  - Post-fibrinolysis: transfer for angio 2-24h
- **NSTE-ACS Pathway** (shown if ACS type = NSTEMI/UA):
  - Immediate invasive (<2h): refractory angina, hemodynamic/electrical instability, acute HF
  - Early invasive (<24h): GRACE >140, troponin rise/fall, new ST changes
  - Selective invasive: low-risk features, negative troponin, no recurrent symptoms
  - Decision tree visualization
- **Cardiogenic Shock Algorithm**:
  - Culprit-only PCI (Class I, CULPRIT-SHOCK)
  - MCS consideration: Impella (DanGer-SHOCK), IABP, VA-ECMO
  - SCAI stage-based recommendations
- **Multivessel Disease**:
  - STEMI: Complete revasc recommended (COMPLETE trial), same-sitting vs staged
  - NSTE-ACS: Mode based on complexity (PCI vs CABG)
  - Shock: NO routine multivessel PCI (Class III Harm)
- **Summary Box** (green)

#### Page 4: Medications (`/medications`)
- **Antiplatelet Therapy**:
  - Aspirin: loading 162-325mg → maintenance 81mg
  - P2Y12 selection matrix:
    - STEMI + PCI → prasugrel or ticagrelor (Class I)
    - NSTE-ACS + PCI → prasugrel or ticagrelor (Class I)
    - NSTE-ACS + no invasive → ticagrelor (Class I)
    - Fibrinolysis → clopidogrel only (Class I)
    - Prior stroke/TIA → NO prasugrel (Class III Harm)
    - On OAC → clopidogrel preferred
  - Dosing table with loading and maintenance doses
  - Cangrelor (IV P2Y12) option for PCI
  - GPI: only for bailout (large thrombus, no-reflow) — NOT routine
- **Anticoagulation**:
  - NSTE-ACS upstream: UFH (Class I) or enoxaparin/fondaparinux if no early invasive
  - PCI: UFH (Class I) or bivalirudin
  - STEMI PCI: bivalirudin alternative to UFH (reduces mortality+bleeding)
  - Fibrinolysis: enoxaparin or UFH
  - Dosing calculator with weight-based dosing
- **Lipid Therapy**:
  - High-intensity statin (Class I, 1A)
  - LDL-C >=70 → add nonstatin (Class I): ezetimibe, PCSK9i, inclisiran, bempedoic acid
  - LDL-C 55-69 → add nonstatin (Class 2a)
  - Table of nonstatin options with LDL-C lowering % and ACS-specific trial data
- **Other Medications**:
  - Beta-blocker: early <24h (Class I) — contraindications list
  - ACEi/ARB: if LVEF <=40% (Class I)
  - MRA (eplerenone): if LVEF <=40% + HF/DM (Class I)
  - SGLT2i: not proven post-MI but okay to continue
  - Colchicine 0.5mg daily: Class 2b
  - PPI with DAPT if high GI bleeding risk (Class I)
- **Summary Box** (purple)

#### Page 5: Discharge & Follow-up (`/discharge`)
- **DAPT Duration Calculator**:
  - Default: 12 months (Class I)
  - Ticagrelor mono after >=1 month (Class I, bleeding reduction)
  - De-escalation (ticagrelor/prasugrel → clopidogrel) at 1 month (Class 2b)
  - Abbreviated DAPT (1 month) if high bleeding risk (Class 2b)
  - OAC patients: drop aspirin 1-4 weeks, keep clopidogrel + OAC (Class I)
  - Show Figure 11 pathway
- **Lipid Follow-up**: Fasting lipid panel 4-8 weeks post-discharge
- **Cardiac Rehab**: Referral checklist, center-based vs home-based options
- **ICD Timing**: >=40 days post-MI, >=90 days post-revasc if LVEF <=40%
- **Immunization**: Annual influenza vaccine (Class I, 1A)
- **Discharge Checklist**: All meds, education components (Table 20), follow-up schedule
- **Summary Box** (teal)

#### Page 6: Ask ACS2025 (`/ask`)
- Text search across the full guideline content
- Pre-indexed: all sections, all recommendation tables with COR/LOE
- Input: free-text clinical question
- Output: matching guideline sections with:
  - Section title and number
  - Full recommendation text
  - COR badge (color-coded): Class I (green), 2a (yellow), 2b (orange), 3 (red)
  - LOE badge: A, B-R, B-NR, C-LD, C-EO
  - Page reference
- Question and answer history persists via Zustand store (survives page switches)
- Example queries shown as chips: "prasugrel stroke", "fibrinolysis timing", "DAPT bleeding"

### State Management (Zustand with persist)
```typescript
interface ACSStore {
  // Page 1
  evaluation: {
    ecg: ECGFindings;
    troponin: TroponinData;
    symptoms: SymptomData;
    acsType: 'stemi' | 'nstemi' | 'ua' | 'ruled-out' | null;
  };
  // Page 2
  risk: {
    timi: TIMIScore;
    grace: GRACEScore;
    killip: 1 | 2 | 3 | 4;
    scai: 'A' | 'B' | 'C' | 'D' | 'E' | null;
    biomarkers: BiomarkerData;
    riskCategory: 'low' | 'intermediate' | 'high' | 'very-high' | null;
  };
  // Page 3
  reperfusion: {
    pciCapable: boolean;
    symptomOnsetHours: number;
    strategy: string;
    shockPresent: boolean;
    multivesselDisease: boolean;
  };
  // Page 4
  medications: {
    antiplatelet: AntiplateletPlan;
    anticoagulation: AnticoagPlan;
    lipid: LipidPlan;
    otherMeds: OtherMedsPlan;
  };
  // Page 5
  discharge: {
    daptPlan: DAPTPlan;
    lipidFollowup: LipidFollowup;
    rehabReferral: boolean;
    dischargeChecklist: string[];
  };
  // Page 6 - persists across page switches
  askHistory: Array<{ question: string; answer: string; timestamp: number }>;

  // Actions
  updateEvaluation: (data: Partial<EvaluationData>) => void;
  updateRisk: (data: Partial<RiskData>) => void;
  // ... etc
}
```

### UI Design
- **Sidebar navigation** (left) with 6 page links + progress indicators
- **Color scheme**: Dark blue (#003366) headers, white cards, color-coded COR badges
- **COR Badges**:
  - Class I: Green (#22C55E) "RECOMMENDED"
  - Class 2a: Yellow (#EAB308) "REASONABLE"
  - Class 2b: Orange (#F97316) "MAY BE REASONABLE"
  - Class III Benefit: Red (#EF4444) "NO BENEFIT"
  - Class III Harm: Red (#EF4444) "HARM"
- **LOE Badges**: Small gray pills showing A, B-R, B-NR, C-LD, C-EO
- **Summary Boxes**: Same pattern as PE2026 StepSummaryBox — colored border, icon, bullet list of clinical interpretation
- **Mobile responsive**: Sidebar collapses to hamburger menu

### Key Clinical Algorithms to Implement

1. **hs-Troponin 0/1h Algorithm**:
   - Very low at 0h AND no delta at 1h → Rule out (NPV >99.5%)
   - High at 0h OR significant rise at 1h → Rule in
   - Otherwise → Observe zone (repeat at 3h)

2. **TIMI Risk Score** (simple additive, 0-7):
   | Criterion | Points |
   |-----------|--------|
   | Age >=65 | 1 |
   | >=3 CAD risk factors | 1 |
   | Known CAD (stenosis >=50%) | 1 |
   | ASA use in past 7 days | 1 |
   | Severe angina (>=2 episodes in 24h) | 1 |
   | ST deviation >=0.5mm | 1 |
   | Elevated cardiac markers | 1 |
   Score 0-2: Low risk, 3-4: Intermediate, 5-7: High risk

3. **GRACE Risk Score**: Use lookup tables or simplified calculation
   - Variables: Age, HR, SBP, Creatinine, Killip, cardiac arrest, ST deviation, elevated troponin
   - Output: In-hospital mortality %, 6-month mortality %

4. **STEMI Reperfusion Decision Tree**:
   - Symptom onset <12h + PCI-capable → PPCI (goal <=90 min)
   - Symptom onset <12h + non-PCI + transfer <=120 min → Transfer for PCI
   - Symptom onset <12h + non-PCI + transfer >120 min → Fibrinolysis → transfer → angio 2-24h
   - 12-24h → PCI reasonable (Class 2a)
   - >24h + stable + occluded → NO PCI (Class III)
   - Shock → Emergency PCI regardless of timing

5. **DAPT Strategy Decision Tree**:
   - Not high bleeding risk → DAPT 12 months (Class I)
   - Tolerated ticagrelor >=1mo → ticagrelor mono (Class I)
   - High bleeding risk → abbreviated DAPT 1-3 months (Class 2b)
   - On OAC → triple 1-4 weeks → OAC + clopidogrel (Class I)
   - De-escalation at 1mo (Class 2b)

### Reference Implementation
Look at PE2026 project at `/Users/home/projects/PE2026/` for patterns:
- `src/components/assessment/StepSummaryBox.tsx` — summary box pattern
- `src/store/assessmentStore.ts` — Zustand store pattern
- `src/app/assessment/*/page.tsx` — page layout pattern
- `src/components/ui/` — reusable UI components

### Data Files
- `guideline_full_text.txt` — full extracted text from PDF (551K chars)
- `ACS2025.pdf` — original guideline PDF

### Deployment
- Initialize git repo
- Set up for Vercel deployment
- The app should work entirely client-side (no server/API dependencies)
