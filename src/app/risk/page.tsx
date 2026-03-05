'use client';

import { useCallback, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { useACSStore, type KillipClass, type SCAIStage, type RiskCategory } from '@/store/acsStore';
import { SummaryBox } from '@/components/ui/SummaryBox';
import { cn } from '@/lib/utils';

const KILLIP_DESCRIPTIONS: Record<number, string> = {
  1: 'Class I — No heart failure',
  2: 'Class II — Rales, S3, JVD',
  3: 'Class III — Pulmonary edema',
  4: 'Class IV — Cardiogenic shock',
};

const SCAI_DESCRIPTIONS: Record<string, string> = {
  A: 'Stage A — At risk: Not currently in shock but at risk',
  B: 'Stage B — Beginning: Relative hypotension or tachycardia without hypoperfusion',
  C: 'Stage C — Classic: Hypoperfusion requiring intervention (inotropes/vasopressors, MCS)',
  D: 'Stage D — Deteriorating: Worsening despite initial interventions',
  E: 'Stage E — Extremis: Cardiac arrest, refractory collapse, requiring CPR/ECMO',
};

export default function RiskPage() {
  const { risk, updateRisk, markPageCompleted } = useACSStore();
  const { timi, grace, killip, scai, biomarkers, riskCategory } = risk;

  // TIMI Score handlers
  const toggleTIMI = useCallback((key: keyof typeof timi) => {
    if (key === 'total') return;
    const newTimi = { ...timi, [key]: !timi[key as keyof Omit<typeof timi, 'total'>] };
    newTimi.total = [
      newTimi.age65, newTimi.cadRiskFactors3, newTimi.knownCAD,
      newTimi.aspirinUse7d, newTimi.severeAngina24h, newTimi.stDeviation, newTimi.elevatedMarkers,
    ].filter(Boolean).length;
    updateRisk({ timi: newTimi });
  }, [timi, updateRisk]);

  // GRACE Score handlers
  const updateGRACEInput = useCallback((key: string, value: number | boolean | null) => {
    const newInputs = { ...grace.inputs, [key]: value };
    const newGrace = calculateGRACE(newInputs);
    updateRisk({ grace: newGrace });
  }, [grace.inputs, updateRisk]);

  // Killip
  const setKillip = useCallback((k: KillipClass) => {
    updateRisk({ killip: k });
  }, [updateRisk]);

  // SCAI
  const setSCAI = useCallback((s: SCAIStage) => {
    updateRisk({ scai: s });
  }, [updateRisk]);

  // Biomarkers
  const updateBiomarkers = useCallback((updates: Partial<typeof biomarkers>) => {
    updateRisk({ biomarkers: { ...biomarkers, ...updates } });
  }, [biomarkers, updateRisk]);

  // Risk Category
  const derivedRiskCategory = useMemo((): RiskCategory => {
    if (scai && ['C', 'D', 'E'].includes(scai)) return 'very-high';
    if (killip === 4) return 'very-high';
    if (timi.total >= 5 || grace.total > 140) return 'high';
    if (timi.total >= 3 || grace.total > 108) return 'intermediate';
    if (timi.total <= 2 && grace.total <= 108) return 'low';
    return null;
  }, [timi.total, grace.total, killip, scai]);

  const setRiskCategory = useCallback((cat: RiskCategory) => {
    updateRisk({ riskCategory: cat });
    if (cat) markPageCompleted('risk');
  }, [updateRisk, markPageCompleted]);

  // Summary
  const summaryItems = useMemo(() => {
    const lines: string[] = [];
    if (timi.total > 0) {
      const timiRisk = timi.total <= 2 ? 'Low' : timi.total <= 4 ? 'Intermediate' : 'High';
      lines.push(`TIMI Risk Score: ${timi.total}/7 (${timiRisk} risk).`);
    }
    if (grace.total > 0) {
      lines.push(`GRACE 2.0 Score: ${grace.total}. In-hospital mortality: ${grace.inHospitalMortality}. 6-month mortality: ${grace.sixMonthMortality}.`);
    }
    if (killip) lines.push(`Killip Classification: ${KILLIP_DESCRIPTIONS[killip]}.`);
    if (scai) lines.push(`SCAI Shock Stage: ${scai}.`);
    if (biomarkers.troponinTrend) lines.push(`Troponin trend: ${biomarkers.troponinTrend}.`);
    if (biomarkers.bnpElevated) lines.push('BNP/NT-proBNP: Elevated.');
    if (biomarkers.lactateElevated) lines.push('Lactate: Elevated.');
    const cat = riskCategory || derivedRiskCategory;
    if (cat) {
      const catLabels: Record<string, string> = { low: 'Low', intermediate: 'Intermediate', high: 'High', 'very-high': 'Very High' };
      lines.push(`Overall Risk Category: ${catLabels[cat]}. Proceed to Reperfusion Strategy.`);
    }
    return lines;
  }, [timi, grace, killip, scai, biomarkers, riskCategory, derivedRiskCategory]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#003366] p-2">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Stratification</h1>
          <p className="text-sm text-gray-500">TIMI, GRACE, Killip, SCAI shock staging</p>
        </div>
      </div>

      {/* TIMI Risk Score */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">TIMI Risk Score for UA/NSTEMI</h2>
          <span className={cn(
            'rounded-full px-3 py-1 text-sm font-bold',
            timi.total <= 2 ? 'bg-green-100 text-green-800' :
            timi.total <= 4 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
          )}>
            Score: {timi.total}/7
          </span>
        </div>
        <div className="space-y-2">
          {([
            ['age65', 'Age >= 65 years'],
            ['cadRiskFactors3', '>= 3 CAD risk factors (HTN, DM, dyslipidemia, smoking, family history)'],
            ['knownCAD', 'Known CAD (stenosis >= 50%)'],
            ['aspirinUse7d', 'Aspirin use in past 7 days'],
            ['severeAngina24h', '>= 2 angina events in past 24 hours'],
            ['stDeviation', 'ST deviation >= 0.5mm on ECG'],
            ['elevatedMarkers', 'Elevated cardiac markers'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={timi[key] as boolean}
                onChange={() => toggleTIMI(key)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 rounded-md bg-gray-50 p-3">
          <p className="text-xs text-gray-600">
            <strong>Interpretation:</strong> 0-2: Low risk (5-8% event rate) | 3-4: Intermediate risk (13-20%) | 5-7: High risk (26-41%)
          </p>
        </div>
      </section>

      {/* GRACE Risk Score */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">GRACE 2.0 Risk Score</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
            <input type="number" value={grace.inputs.age ?? ''} onChange={(e) => updateGRACEInput('age', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Age" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate (bpm)</label>
            <input type="number" value={grace.inputs.heartRate ?? ''} onChange={(e) => updateGRACEInput('heartRate', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Heart rate" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Systolic BP (mmHg)</label>
            <input type="number" value={grace.inputs.systolicBP ?? ''} onChange={(e) => updateGRACEInput('systolicBP', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Systolic BP" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Creatinine (mg/dL)</label>
            <input type="number" step="0.1" value={grace.inputs.creatinine ?? ''} onChange={(e) => updateGRACEInput('creatinine', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Creatinine" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Killip Class</label>
            <select value={grace.inputs.killipClass} onChange={(e) => updateGRACEInput('killipClass', Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value={1}>Class I</option>
              <option value={2}>Class II</option>
              <option value={3}>Class III</option>
              <option value={4}>Class IV</option>
            </select>
          </div>
          <div className="space-y-2 pt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={grace.inputs.cardiacArrest} onChange={(e) => updateGRACEInput('cardiacArrest', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Cardiac arrest at admission</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={grace.inputs.stDeviation} onChange={(e) => updateGRACEInput('stDeviation', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">ST-segment deviation</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={grace.inputs.elevatedTroponin} onChange={(e) => updateGRACEInput('elevatedTroponin', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Elevated troponin</span>
            </label>
          </div>
        </div>
        {grace.total > 0 && (
          <div className={cn(
            'mt-4 rounded-md px-4 py-3 text-sm border',
            grace.total <= 108 ? 'bg-green-50 border-green-200 text-green-800' :
            grace.total <= 140 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800'
          )}>
            <p><strong>GRACE Score: {grace.total}</strong></p>
            <p>In-hospital mortality: {grace.inHospitalMortality} | 6-month mortality: {grace.sixMonthMortality}</p>
          </div>
        )}
      </section>

      {/* Killip Classification */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Killip Classification</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([1, 2, 3, 4] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKillip(k)}
              className={cn(
                'rounded-lg py-3 px-4 text-left text-sm border-2 transition-all',
                killip === k
                  ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
              )}
            >
              {KILLIP_DESCRIPTIONS[k]}
            </button>
          ))}
        </div>
      </section>

      {/* SCAI Shock Stage */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">SCAI Shock Stage</h2>
        <div className="space-y-2">
          {(['A', 'B', 'C', 'D', 'E'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSCAI(s)}
              className={cn(
                'w-full rounded-lg py-3 px-4 text-left text-sm border-2 transition-all',
                scai === s
                  ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
              )}
            >
              {SCAI_DESCRIPTIONS[s]}
            </button>
          ))}
        </div>
      </section>

      {/* Biomarkers */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Biomarkers Panel</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Troponin Trend</label>
            <select
              value={biomarkers.troponinTrend || ''}
              onChange={(e) => updateBiomarkers({ troponinTrend: (e.target.value || null) as typeof biomarkers.troponinTrend })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select...</option>
              <option value="rising">Rising</option>
              <option value="falling">Falling</option>
              <option value="peaked">Peaked</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          <div className="space-y-2 pt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={biomarkers.bnpElevated} onChange={(e) => updateBiomarkers({ bnpElevated: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">BNP/NT-proBNP elevated</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={biomarkers.lactateElevated} onChange={(e) => updateBiomarkers({ lactateElevated: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Lactate elevated</span>
            </label>
          </div>
        </div>
      </section>

      {/* Risk Category Output */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Category</h2>
        {derivedRiskCategory && !riskCategory && (
          <div className="rounded-md bg-blue-50 border border-blue-200 p-3 mb-4">
            <p className="text-sm text-blue-800">
              Suggested risk category: <strong>{derivedRiskCategory === 'very-high' ? 'Very High' : derivedRiskCategory.charAt(0).toUpperCase() + derivedRiskCategory.slice(1)}</strong>. Confirm below.
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            ['low', 'Low', 'bg-green-500'],
            ['intermediate', 'Intermediate', 'bg-amber-500'],
            ['high', 'High', 'bg-orange-500'],
            ['very-high', 'Very High', 'bg-red-500'],
          ] as const).map(([cat, label, color]) => (
            <button
              key={cat}
              onClick={() => setRiskCategory(cat)}
              className={cn(
                'rounded-lg py-3 px-4 text-sm font-semibold transition-all border-2',
                (riskCategory || derivedRiskCategory) === cat
                  ? `${color} text-white border-transparent shadow-md`
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <SummaryBox
        title="Risk Stratification Summary"
        color="amber"
        items={summaryItems}
        placeholder="Complete TIMI, GRACE, and other assessments to generate a summary."
      />
    </div>
  );
}

function calculateGRACE(inputs: {
  age: number | null;
  heartRate: number | null;
  systolicBP: number | null;
  creatinine: number | null;
  killipClass: number;
  cardiacArrest: boolean;
  stDeviation: boolean;
  elevatedTroponin: boolean;
}) {
  const { age, heartRate, systolicBP, creatinine, killipClass, cardiacArrest, stDeviation, elevatedTroponin } = inputs;

  if (age == null || heartRate == null || systolicBP == null || creatinine == null) {
    return {
      inputs: inputs as typeof inputs & { killipClass: 1 | 2 | 3 | 4 },
      total: 0,
      inHospitalMortality: '',
      sixMonthMortality: '',
    };
  }

  // Simplified GRACE score calculation using point assignment
  let score = 0;

  // Age points
  if (age < 30) score += 0;
  else if (age < 40) score += 8;
  else if (age < 50) score += 25;
  else if (age < 60) score += 41;
  else if (age < 70) score += 58;
  else if (age < 80) score += 75;
  else if (age < 90) score += 91;
  else score += 100;

  // Heart rate points
  if (heartRate < 50) score += 0;
  else if (heartRate < 70) score += 3;
  else if (heartRate < 90) score += 9;
  else if (heartRate < 110) score += 15;
  else if (heartRate < 150) score += 24;
  else if (heartRate < 200) score += 38;
  else score += 46;

  // Systolic BP points (inverse)
  if (systolicBP < 80) score += 58;
  else if (systolicBP < 100) score += 53;
  else if (systolicBP < 120) score += 43;
  else if (systolicBP < 140) score += 34;
  else if (systolicBP < 160) score += 24;
  else if (systolicBP < 200) score += 10;
  else score += 0;

  // Creatinine points
  if (creatinine < 0.4) score += 1;
  else if (creatinine < 0.8) score += 4;
  else if (creatinine < 1.2) score += 7;
  else if (creatinine < 1.6) score += 10;
  else if (creatinine < 2.0) score += 13;
  else if (creatinine < 4.0) score += 21;
  else score += 28;

  // Killip class points
  const killipPoints = [0, 0, 20, 39, 59];
  score += killipPoints[killipClass] || 0;

  // Binary variables
  if (cardiacArrest) score += 39;
  if (stDeviation) score += 28;
  if (elevatedTroponin) score += 14;

  // Mortality estimation
  let inHospitalMortality = '';
  let sixMonthMortality = '';

  if (score <= 108) {
    inHospitalMortality = '<1%';
    sixMonthMortality = '<3%';
  } else if (score <= 140) {
    inHospitalMortality = '1-3%';
    sixMonthMortality = '3-8%';
  } else if (score <= 170) {
    inHospitalMortality = '3-10%';
    sixMonthMortality = '8-15%';
  } else {
    inHospitalMortality = '>10%';
    sixMonthMortality = '>15%';
  }

  return {
    inputs: inputs as typeof inputs & { killipClass: 1 | 2 | 3 | 4 },
    total: score,
    inHospitalMortality,
    sixMonthMortality,
  };
}
