'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ACSType = 'stemi' | 'nstemi' | 'ua' | 'ruled-out' | null;
export type KillipClass = 1 | 2 | 3 | 4 | null;
export type SCAIStage = 'A' | 'B' | 'C' | 'D' | 'E' | null;
export type RiskCategory = 'low' | 'intermediate' | 'high' | 'very-high' | null;
export type TroponinResult = 'rule-out' | 'observe' | 'rule-in' | null;

export interface ECGFindings {
  stElevation: boolean;
  stDepression: boolean;
  nonDiagnostic: boolean;
  posteriorChanges: boolean;
  deWinter: boolean;
  wellens: boolean;
  newLBBB: boolean;
}

export interface TroponinData {
  assayType: 'hs-ctn-0-1h' | 'hs-ctn-0-2h' | 'conventional' | null;
  initialValue: number | null;
  repeatValue: number | null;
  timeBetweenHours: number | null;
  sex: 'male' | 'female' | null;
  delta: number | null;
  result: TroponinResult;
}

export interface SymptomData {
  chestPain: boolean;
  chestPainType: 'typical' | 'atypical' | 'non-cardiac' | null;
  onset: 'acute' | 'subacute' | 'chronic' | null;
  radiation: string[];
  associatedSymptoms: string[];
}

export interface TIMIScore {
  age65: boolean;
  cadRiskFactors3: boolean;
  knownCAD: boolean;
  aspirinUse7d: boolean;
  severeAngina24h: boolean;
  stDeviation: boolean;
  elevatedMarkers: boolean;
  total: number;
}

export interface GRACEInputs {
  age: number | null;
  heartRate: number | null;
  systolicBP: number | null;
  creatinine: number | null;
  killipClass: 1 | 2 | 3 | 4;
  cardiacArrest: boolean;
  stDeviation: boolean;
  elevatedTroponin: boolean;
}

export interface GRACEScore {
  inputs: GRACEInputs;
  total: number;
  inHospitalMortality: string;
  sixMonthMortality: string;
}

export interface BiomarkerData {
  troponinTrend: 'rising' | 'falling' | 'peaked' | 'normal' | null;
  bnpElevated: boolean;
  lactateElevated: boolean;
}

export interface AntiplateletPlan {
  aspirin: boolean;
  aspirinDose: string;
  p2y12Agent: 'prasugrel' | 'ticagrelor' | 'clopidogrel' | 'cangrelor' | null;
  p2y12Reason: string;
  gpiUsed: boolean;
  onOAC: boolean;
  priorStrokeTIA: boolean;
}

export interface AnticoagPlan {
  agent: 'ufh' | 'enoxaparin' | 'fondaparinux' | 'bivalirudin' | null;
  indication: string;
  weightKg: number | null;
  dose: string;
}

export interface LipidPlan {
  highIntensityStatin: boolean;
  statinAgent: string;
  ldlcBaseline: number | null;
  addNonstatin: boolean;
  nonstatinAgent: string;
}

export interface OtherMedsPlan {
  betaBlocker: boolean;
  betaBlockerContraindicated: boolean;
  aceInhibitor: boolean;
  arb: boolean;
  lvef: number | null;
  mra: boolean;
  sglt2i: boolean;
  colchicine: boolean;
  ppiWithDAPT: boolean;
}

export interface DAPTPlan {
  duration: number;
  strategy: 'standard-12mo' | 'ticagrelor-mono' | 'de-escalation' | 'abbreviated' | 'oac-triple' | null;
  highBleedingRisk: boolean;
  onOAC: boolean;
}

export interface AskHistoryItem {
  question: string;
  answer: string;
  timestamp: number;
}

export interface EvaluationData {
  ecg: ECGFindings;
  troponin: TroponinData;
  symptoms: SymptomData;
  acsType: ACSType;
}

export interface RiskData {
  timi: TIMIScore;
  grace: GRACEScore;
  killip: KillipClass;
  scai: SCAIStage;
  biomarkers: BiomarkerData;
  riskCategory: RiskCategory;
}

export interface ReperfusionData {
  pciCapable: boolean | null;
  symptomOnsetHours: number | null;
  transferTimeMins: number | null;
  strategy: string;
  shockPresent: boolean;
  multivesselDisease: boolean;
  fibrinolyticAgent: string | null;
  invasiveStrategy: 'immediate' | 'early' | 'selective' | null;
}

export interface MedicationsData {
  antiplatelet: AntiplateletPlan;
  anticoagulation: AnticoagPlan;
  lipid: LipidPlan;
  otherMeds: OtherMedsPlan;
}

export interface DischargeData {
  daptPlan: DAPTPlan;
  lipidFollowupWeeks: number;
  rehabReferral: boolean;
  rehabType: 'center' | 'home' | null;
  icdIndicated: boolean;
  influenzaVaccine: boolean;
  dischargeChecklist: string[];
}

interface ACSState {
  evaluation: EvaluationData;
  risk: RiskData;
  reperfusion: ReperfusionData;
  medications: MedicationsData;
  discharge: DischargeData;
  askHistory: AskHistoryItem[];
  nlmHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>;
  completedPages: string[];

  updateEvaluation: (data: Partial<EvaluationData>) => void;
  updateRisk: (data: Partial<RiskData>) => void;
  updateReperfusion: (data: Partial<ReperfusionData>) => void;
  updateMedications: (data: Partial<MedicationsData>) => void;
  updateDischarge: (data: Partial<DischargeData>) => void;
  addAskHistory: (item: AskHistoryItem) => void;
  clearAskHistory: () => void;
  addNlmMessage: (msg: { role: 'user' | 'assistant'; content: string; timestamp: number }) => void;
  clearNlmHistory: () => void;
  markPageCompleted: (page: string) => void;
  resetAll: () => void;
}

const initialEvaluation: EvaluationData = {
  ecg: {
    stElevation: false,
    stDepression: false,
    nonDiagnostic: false,
    posteriorChanges: false,
    deWinter: false,
    wellens: false,
    newLBBB: false,
  },
  troponin: {
    assayType: null,
    initialValue: null,
    repeatValue: null,
    timeBetweenHours: null,
    sex: null,
    delta: null,
    result: null,
  },
  symptoms: {
    chestPain: false,
    chestPainType: null,
    onset: null,
    radiation: [],
    associatedSymptoms: [],
  },
  acsType: null,
};

const initialTIMI: TIMIScore = {
  age65: false,
  cadRiskFactors3: false,
  knownCAD: false,
  aspirinUse7d: false,
  severeAngina24h: false,
  stDeviation: false,
  elevatedMarkers: false,
  total: 0,
};

const initialGRACE: GRACEScore = {
  inputs: {
    age: null,
    heartRate: null,
    systolicBP: null,
    creatinine: null,
    killipClass: 1,
    cardiacArrest: false,
    stDeviation: false,
    elevatedTroponin: false,
  },
  total: 0,
  inHospitalMortality: '',
  sixMonthMortality: '',
};

const initialRisk: RiskData = {
  timi: initialTIMI,
  grace: initialGRACE,
  killip: null,
  scai: null,
  biomarkers: {
    troponinTrend: null,
    bnpElevated: false,
    lactateElevated: false,
  },
  riskCategory: null,
};

const initialReperfusion: ReperfusionData = {
  pciCapable: null,
  symptomOnsetHours: null,
  transferTimeMins: null,
  strategy: '',
  shockPresent: false,
  multivesselDisease: false,
  fibrinolyticAgent: null,
  invasiveStrategy: null,
};

const initialMedications: MedicationsData = {
  antiplatelet: {
    aspirin: false,
    aspirinDose: '',
    p2y12Agent: null,
    p2y12Reason: '',
    gpiUsed: false,
    onOAC: false,
    priorStrokeTIA: false,
  },
  anticoagulation: {
    agent: null,
    indication: '',
    weightKg: null,
    dose: '',
  },
  lipid: {
    highIntensityStatin: false,
    statinAgent: '',
    ldlcBaseline: null,
    addNonstatin: false,
    nonstatinAgent: '',
  },
  otherMeds: {
    betaBlocker: false,
    betaBlockerContraindicated: false,
    aceInhibitor: false,
    arb: false,
    lvef: null,
    mra: false,
    sglt2i: false,
    colchicine: false,
    ppiWithDAPT: false,
  },
};

const initialDischarge: DischargeData = {
  daptPlan: {
    duration: 12,
    strategy: null,
    highBleedingRisk: false,
    onOAC: false,
  },
  lipidFollowupWeeks: 6,
  rehabReferral: false,
  rehabType: null,
  icdIndicated: false,
  influenzaVaccine: false,
  dischargeChecklist: [],
};

export const useACSStore = create<ACSState>()(
  persist(
    (set) => ({
      evaluation: initialEvaluation,
      risk: initialRisk,
      reperfusion: initialReperfusion,
      medications: initialMedications,
      discharge: initialDischarge,
      askHistory: [],
      nlmHistory: [],
      completedPages: [],

      updateEvaluation: (data) =>
        set((s) => ({ evaluation: { ...s.evaluation, ...data } })),
      updateRisk: (data) =>
        set((s) => ({ risk: { ...s.risk, ...data } })),
      updateReperfusion: (data) =>
        set((s) => ({ reperfusion: { ...s.reperfusion, ...data } })),
      updateMedications: (data) =>
        set((s) => ({ medications: { ...s.medications, ...data } })),
      updateDischarge: (data) =>
        set((s) => ({ discharge: { ...s.discharge, ...data } })),
      addAskHistory: (item) =>
        set((s) => ({ askHistory: [item, ...s.askHistory] })),
      clearAskHistory: () => set({ askHistory: [] }),
      addNlmMessage: (msg) =>
        set((s) => ({ nlmHistory: [...s.nlmHistory, msg] })),
      clearNlmHistory: () => set({ nlmHistory: [] }),
      markPageCompleted: (page) =>
        set((s) => ({
          completedPages: s.completedPages.includes(page)
            ? s.completedPages
            : [...s.completedPages, page],
        })),
      resetAll: () =>
        set({
          evaluation: initialEvaluation,
          risk: initialRisk,
          reperfusion: initialReperfusion,
          medications: initialMedications,
          discharge: initialDischarge,
          askHistory: [],
          nlmHistory: [],
          completedPages: [],
        }),
    }),
    {
      name: 'acs2025-store',
    }
  )
);
