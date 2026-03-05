'use client';

import { useCallback, useMemo } from 'react';
import { Pill, AlertTriangle } from 'lucide-react';
import { useACSStore } from '@/store/acsStore';
import { SummaryBox } from '@/components/ui/SummaryBox';
import { CORBadge } from '@/components/ui/CORBadge';
import { LOEBadge } from '@/components/ui/LOEBadge';
import { cn } from '@/lib/utils';

const P2Y12_DOSING = [
  { agent: 'Prasugrel', loading: '60 mg', maintenance: '10 mg daily (5 mg if <60 kg or age >=75)', notes: 'Contraindicated with prior stroke/TIA' },
  { agent: 'Ticagrelor', loading: '180 mg', maintenance: '90 mg BID (then 60 mg BID after 1 year)', notes: 'May cause dyspnea; avoid with strong CYP3A4 inhibitors' },
  { agent: 'Clopidogrel', loading: '300-600 mg', maintenance: '75 mg daily', notes: 'Preferred with OAC or fibrinolysis; CYP2C19 polymorphism affects efficacy' },
  { agent: 'Cangrelor', loading: '30 mcg/kg bolus', maintenance: '4 mcg/kg/min infusion during PCI', notes: 'IV P2Y12; transition to oral P2Y12 after PCI' },
];

const NONSTATIN_OPTIONS = [
  { agent: 'Ezetimibe', ldlReduction: '18-25%', trial: 'IMPROVE-IT' },
  { agent: 'Evolocumab (PCSK9i)', ldlReduction: '50-60%', trial: 'FOURIER' },
  { agent: 'Alirocumab (PCSK9i)', ldlReduction: '50-60%', trial: 'ODYSSEY OUTCOMES' },
  { agent: 'Inclisiran', ldlReduction: '50%', trial: 'ORION trials' },
  { agent: 'Bempedoic acid', ldlReduction: '15-25%', trial: 'CLEAR Outcomes' },
];

export default function MedicationsPage() {
  const { evaluation, medications, updateMedications, markPageCompleted } = useACSStore();
  const { antiplatelet, anticoagulation, lipid, otherMeds } = medications;
  const acsType = evaluation.acsType;

  const updateAntiplatelet = useCallback((u: Partial<typeof antiplatelet>) => {
    updateMedications({ antiplatelet: { ...antiplatelet, ...u } });
  }, [antiplatelet, updateMedications]);

  const updateAnticoag = useCallback((u: Partial<typeof anticoagulation>) => {
    updateMedications({ anticoagulation: { ...anticoagulation, ...u } });
  }, [anticoagulation, updateMedications]);

  const updateLipid = useCallback((u: Partial<typeof lipid>) => {
    updateMedications({ lipid: { ...lipid, ...u } });
  }, [lipid, updateMedications]);

  const updateOther = useCallback((u: Partial<typeof otherMeds>) => {
    updateMedications({ otherMeds: { ...otherMeds, ...u } });
  }, [otherMeds, updateMedications]);

  // P2Y12 recommendation
  const p2y12Recommendation = useMemo(() => {
    if (antiplatelet.priorStrokeTIA) return { agent: 'ticagrelor or clopidogrel', note: 'Prasugrel contraindicated with prior stroke/TIA (Class III Harm)' };
    if (antiplatelet.onOAC) return { agent: 'clopidogrel', note: 'Clopidogrel preferred with OAC to minimize bleeding (Class I)' };
    if (acsType === 'stemi') return { agent: 'prasugrel or ticagrelor', note: 'STEMI + PCI: Prasugrel or ticagrelor recommended (Class I, LOE A)' };
    if (acsType === 'nstemi') return { agent: 'prasugrel or ticagrelor', note: 'NSTE-ACS + PCI: Prasugrel or ticagrelor recommended (Class I, LOE A)' };
    if (acsType === 'ua') return { agent: 'ticagrelor', note: 'UA without invasive: Ticagrelor recommended (Class I, LOE B-R)' };
    return null;
  }, [acsType, antiplatelet.priorStrokeTIA, antiplatelet.onOAC]);

  // Anticoag dose calculator
  const anticoagDose = useMemo(() => {
    if (!anticoagulation.agent || !anticoagulation.weightKg) return '';
    const w = anticoagulation.weightKg;
    switch (anticoagulation.agent) {
      case 'ufh': return `UFH: 60 U/kg bolus (max 4000 U) = ${Math.min(Math.round(w * 60), 4000)} U bolus, then 12 U/kg/h (max 1000 U/h) = ${Math.min(Math.round(w * 12), 1000)} U/h`;
      case 'enoxaparin': return `Enoxaparin: 1 mg/kg SC q12h = ${Math.round(w)} mg q12h (or 0.75 mg/kg if age >=75)`;
      case 'fondaparinux': return 'Fondaparinux: 2.5 mg SC daily';
      case 'bivalirudin': return `Bivalirudin: 0.75 mg/kg bolus = ${(w * 0.75).toFixed(1)} mg, then 1.75 mg/kg/h = ${(w * 1.75).toFixed(1)} mg/h`;
      default: return '';
    }
  }, [anticoagulation.agent, anticoagulation.weightKg]);

  const confirmMeds = useCallback(() => {
    markPageCompleted('medications');
  }, [markPageCompleted]);

  const summaryItems = useMemo(() => {
    const lines: string[] = [];
    if (antiplatelet.aspirin) lines.push(`Aspirin: ${antiplatelet.aspirinDose || '162-325 mg loading, then 81 mg daily'}.`);
    if (antiplatelet.p2y12Agent) lines.push(`P2Y12 inhibitor: ${antiplatelet.p2y12Agent}. ${antiplatelet.p2y12Reason}`);
    if (antiplatelet.gpiUsed) lines.push('GPI used (bailout).');
    if (anticoagulation.agent) lines.push(`Anticoagulation: ${anticoagulation.agent.toUpperCase()}. ${anticoagDose}`);
    if (lipid.highIntensityStatin) lines.push(`High-intensity statin: ${lipid.statinAgent || 'selected'}.`);
    if (lipid.addNonstatin) lines.push(`Nonstatin: ${lipid.nonstatinAgent || 'selected'} (LDL-C baseline: ${lipid.ldlcBaseline || 'N/A'} mg/dL).`);
    if (otherMeds.betaBlocker) lines.push('Beta-blocker: initiated within 24h.');
    if (otherMeds.aceInhibitor || otherMeds.arb) lines.push(`${otherMeds.aceInhibitor ? 'ACE inhibitor' : 'ARB'}: for LVEF <=40%.`);
    if (otherMeds.mra) lines.push('MRA (eplerenone): for LVEF <=40% + HF/DM.');
    if (otherMeds.colchicine) lines.push('Colchicine 0.5 mg daily (Class 2b).');
    if (otherMeds.ppiWithDAPT) lines.push('PPI with DAPT for GI bleeding risk.');
    return lines;
  }, [antiplatelet, anticoagulation, anticoagDose, lipid, otherMeds]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#003366] p-2">
          <Pill className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medications</h1>
          <p className="text-sm text-gray-500">Antiplatelet, anticoagulation, lipid, and other therapies</p>
        </div>
      </div>

      {/* Acute Pain & Supportive Care */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acute Pain & Supportive Care</h2>
        <div className="space-y-3">
          {/* Oxygen */}
          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-900">Supplemental Oxygen (SpO2 &lt;90%)</span>
              <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="C-LD" /></div>
            </div>
            <p className="text-xs text-gray-600">Administer O2 to maintain SpO2 &ge;90%. Titrate to target.</p>
          </div>
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-red-900 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Routine Oxygen (SpO2 &ge;90%)
              </span>
              <div className="flex gap-1"><CORBadge level="3-no-benefit" /><LOEBadge level="B-R" /></div>
            </div>
            <p className="text-xs text-red-700">Routine O2 in normoxemic patients is NOT beneficial (DETO2X-AMI trial).</p>
          </div>

          {/* Nitroglycerin */}
          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-900">Nitroglycerin</span>
              <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="C-EO" /></div>
            </div>
            <p className="text-xs text-gray-600">
              SL 0.4 mg q5min x3 for ongoing ischemic pain<br />
              IV NTG for persistent pain, hypertension, or heart failure<br />
              <span className="text-red-600 font-medium">
                Contraindicated: SBP &lt;90, RV infarction, PDE5i within 24h (sildenafil/vardenafil) or 48h (tadalafil)
              </span>
            </p>
          </div>

          {/* Morphine */}
          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-900">Morphine</span>
              <div className="flex gap-1"><CORBadge level="2b" /><LOEBadge level="B-NR" /></div>
            </div>
            <p className="text-xs text-gray-600">
              IV morphine 2-4 mg for refractory pain despite NTG<br />
              <span className="text-amber-700 font-medium">Caution: Delays P2Y12 inhibitor absorption (gastroparesis effect). Associated with worse outcomes in some observational studies (CRUSADE). Use judiciously.</span>
            </p>
          </div>

          {/* Acetaminophen */}
          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-900">Acetaminophen</span>
              <div className="flex gap-1"><CORBadge level="2b" /><LOEBadge level="C-EO" /></div>
            </div>
            <p className="text-xs text-gray-600">Consider as first-line for mild chest pain or as adjunct to reduce opioid use</p>
          </div>

          {/* NSAIDs */}
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-red-900 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Non-aspirin NSAIDs
              </span>
              <div className="flex gap-1"><CORBadge level="3-harm" /><LOEBadge level="B-NR" /></div>
            </div>
            <p className="text-xs text-red-700">
              Discontinue all non-aspirin NSAIDs (ibuprofen, naproxen, celecoxib) at time of ACS diagnosis.<br />
              Increase MACE risk, interfere with antiplatelet therapy, and promote fluid retention.
            </p>
          </div>
        </div>
      </section>

      {/* Antiplatelet Therapy */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Antiplatelet Therapy</h2>

        <div className="space-y-3 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={antiplatelet.aspirin} onChange={(e) => updateAntiplatelet({ aspirin: e.target.checked, aspirinDose: e.target.checked ? 'Loading 162-325 mg, then 81 mg daily' : '' })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700">Aspirin (162-325 mg loading → 81 mg daily)</span>
            <CORBadge level="1" /><LOEBadge level="A" />
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={antiplatelet.priorStrokeTIA} onChange={(e) => updateAntiplatelet({ priorStrokeTIA: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-red-600" />
            <span className="text-sm text-gray-700">Prior stroke/TIA (contraindication to prasugrel)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={antiplatelet.onOAC} onChange={(e) => updateAntiplatelet({ onOAC: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700">On oral anticoagulation (OAC)</span>
          </label>
        </div>

        {p2y12Recommendation && (
          <div className="rounded-md bg-blue-50 border border-blue-200 p-3 mb-4">
            <p className="text-sm text-blue-800"><strong>Recommended P2Y12:</strong> {p2y12Recommendation.agent}</p>
            <p className="text-xs text-blue-700 mt-0.5">{p2y12Recommendation.note}</p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">P2Y12 Inhibitor Selection</label>
          <select value={antiplatelet.p2y12Agent || ''} onChange={(e) => updateAntiplatelet({ p2y12Agent: (e.target.value || null) as typeof antiplatelet.p2y12Agent, p2y12Reason: p2y12Recommendation?.note || '' })}
            className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">Select P2Y12 inhibitor...</option>
            <option value="prasugrel" disabled={antiplatelet.priorStrokeTIA}>Prasugrel{antiplatelet.priorStrokeTIA ? ' (CONTRAINDICATED)' : ''}</option>
            <option value="ticagrelor">Ticagrelor</option>
            <option value="clopidogrel">Clopidogrel</option>
            <option value="cangrelor">Cangrelor (IV, PCI only)</option>
          </select>
        </div>

        {/* Dosing Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-3 py-2 text-left font-medium text-gray-700">Agent</th>
                <th className="border px-3 py-2 text-left font-medium text-gray-700">Loading</th>
                <th className="border px-3 py-2 text-left font-medium text-gray-700">Maintenance</th>
                <th className="border px-3 py-2 text-left font-medium text-gray-700">Notes</th>
              </tr>
            </thead>
            <tbody>
              {P2Y12_DOSING.map((d) => (
                <tr key={d.agent} className={cn(antiplatelet.p2y12Agent === d.agent.toLowerCase().split(' ')[0] && 'bg-blue-50')}>
                  <td className="border px-3 py-2 font-medium">{d.agent}</td>
                  <td className="border px-3 py-2">{d.loading}</td>
                  <td className="border px-3 py-2">{d.maintenance}</td>
                  <td className="border px-3 py-2 text-xs text-gray-600">{d.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input type="checkbox" checked={antiplatelet.gpiUsed} onChange={(e) => updateAntiplatelet({ gpiUsed: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600" />
          <span className="text-sm text-gray-700">GPI used (bailout only: large thrombus, no-reflow)</span>
          <CORBadge level="2a" />
        </label>
      </section>

      {/* Anticoagulation */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Anticoagulation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
            <select value={anticoagulation.agent || ''} onChange={(e) => updateAnticoag({ agent: (e.target.value || null) as typeof anticoagulation.agent })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select...</option>
              <option value="ufh">UFH (Class I)</option>
              <option value="enoxaparin">Enoxaparin</option>
              <option value="fondaparinux">Fondaparinux</option>
              <option value="bivalirudin">Bivalirudin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input type="number" value={anticoagulation.weightKg ?? ''} onChange={(e) => updateAnticoag({ weightKg: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Weight in kg" />
          </div>
        </div>
        {anticoagDose && (
          <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
            <p className="text-sm text-blue-800 font-medium">Dosing Calculator</p>
            <p className="text-sm text-blue-700 mt-1">{anticoagDose}</p>
          </div>
        )}
      </section>

      {/* Lipid-Lowering Therapy */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Lipid-Lowering Therapy</h2>

        {/* Patient statin status selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Patient statin status</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {([
              ['naive', 'Not on statin', 'Start high-intensity statin'],
              ['max-tolerated', 'On maximally tolerated statin', 'Assess LDL-C, add nonstatin if needed'],
              ['intolerant', 'Statin intolerant', 'Nonstatin-based regimen'],
            ] as const).map(([key, label, desc]) => (
              <button key={key} onClick={() => updateLipid({ statinStatus: key })}
                className={cn('rounded-lg border-2 p-3 text-left transition-all',
                  lipid.statinStatus === key ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:border-gray-400')}>
                <span className="text-sm font-semibold text-gray-900 block">{label}</span>
                <span className="text-xs text-gray-500">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Baseline LDL-C (common to all) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Baseline / Current LDL-C (mg/dL)</label>
            <input type="number" value={lipid.ldlcBaseline ?? ''} onChange={(e) => updateLipid({ ldlcBaseline: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="LDL-C" />
          </div>
        </div>

        {/* ---- PATH A: Statin-naive ---- */}
        {lipid.statinStatus === 'naive' && (
          <div className="space-y-3 border-l-4 border-blue-400 pl-4">
            <h3 className="text-sm font-bold text-blue-900">Not on Statin -- Initiate High-Intensity Statin</h3>
            <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-blue-900">High-intensity statin for ALL ACS patients</span>
                <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
              </div>
              <p className="text-xs text-blue-700">Start before or at discharge, regardless of baseline LDL-C</p>
            </div>
            <div>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input type="checkbox" checked={lipid.highIntensityStatin} onChange={(e) => updateLipid({ highIntensityStatin: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                <span className="text-sm text-gray-700">High-intensity statin initiated</span>
              </label>
              {lipid.highIntensityStatin && (
                <select value={lipid.statinAgent} onChange={(e) => updateLipid({ statinAgent: e.target.value })}
                  className="ml-6 rounded-md border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Select statin...</option>
                  <option value="Atorvastatin 80 mg">Atorvastatin 80 mg</option>
                  <option value="Atorvastatin 40 mg">Atorvastatin 40 mg</option>
                  <option value="Rosuvastatin 40 mg">Rosuvastatin 40 mg</option>
                  <option value="Rosuvastatin 20 mg">Rosuvastatin 20 mg</option>
                </select>
              )}
            </div>
            <div className="rounded-md bg-gray-50 border p-3">
              <p className="text-xs text-gray-600">
                <strong>Follow-up:</strong> Recheck fasting LDL-C at 4-8 weeks.<br />
                If LDL-C &ge;55 mg/dL: add <strong>ezetimibe</strong> (Class I, LOE A -- IMPROVE-IT)<br />
                If still &ge;55 on statin + ezetimibe: add <strong>PCSK9i</strong> (Class I, LOE A -- FOURIER/ODYSSEY)
              </p>
            </div>
          </div>
        )}

        {/* ---- PATH B: Maximally tolerated statin ---- */}
        {lipid.statinStatus === 'max-tolerated' && (
          <div className="space-y-3 border-l-4 border-amber-400 pl-4">
            <h3 className="text-sm font-bold text-amber-900">Already on Maximally Tolerated Statin</h3>
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800">Confirm patient is on truly maximal tolerated dose. If not at high-intensity, attempt uptitration first.</p>
            </div>

            {lipid.ldlcBaseline != null && lipid.ldlcBaseline >= 55 && (
              <div className="space-y-2">
                <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-amber-900">LDL-C &ge;55: Add nonstatin therapy</span>
                    <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-gray-700">
                    <strong>Step 1:</strong> Add <strong>ezetimibe 10 mg</strong> (Class I, LOE A -- IMPROVE-IT)<br />
                    <strong>Step 2:</strong> If LDL-C still &ge;55: add <strong>PCSK9i</strong> (evolocumab or alirocumab) (Class I, LOE A)<br />
                    <strong>Step 3:</strong> If LDL-C still &ge;70 despite statin + ezetimibe + PCSK9i: consider <strong>inclisiran</strong> (Class 2a) or <strong>bempedoic acid</strong> (Class 2b)
                  </p>
                </div>
              </div>
            )}

            {lipid.ldlcBaseline != null && lipid.ldlcBaseline < 55 && (
              <div className="rounded-md bg-green-50 border border-green-200 p-3">
                <p className="text-sm text-green-800">LDL-C &lt;55 mg/dL -- at goal. Continue current regimen.</p>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={lipid.addNonstatin} onChange={(e) => updateLipid({ addNonstatin: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Nonstatin agent added</span>
            </label>
            {lipid.addNonstatin && (
              <select value={lipid.nonstatinAgent} onChange={(e) => updateLipid({ nonstatinAgent: e.target.value })}
                className="ml-6 rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="">Select nonstatin...</option>
                {NONSTATIN_OPTIONS.map((n) => (
                  <option key={n.agent} value={n.agent}>{n.agent} ({n.ldlReduction} reduction, {n.trial})</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* ---- PATH C: Statin intolerant ---- */}
        {lipid.statinStatus === 'intolerant' && (
          <div className="space-y-3 border-l-4 border-red-400 pl-4">
            <h3 className="text-sm font-bold text-red-900">Statin Intolerant</h3>
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-xs text-red-800">
                <strong>Confirm true intolerance:</strong> Rechallenge with a different statin (e.g., rosuvastatin if atorvastatin intolerant), lower dose, or intermittent dosing (e.g., rosuvastatin 5-10 mg every other day). True statin intolerance is uncommon (&lt;5%).
              </p>
            </div>

            <div className="space-y-2">
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">Ezetimibe 10 mg daily</span>
                  <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
                </div>
                <p className="text-xs text-gray-600">First-line nonstatin. Well tolerated, ~18-25% LDL-C reduction.</p>
              </div>
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">PCSK9 inhibitor (evolocumab/alirocumab)</span>
                  <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
                </div>
                <p className="text-xs text-gray-600">50-60% LDL-C reduction. Works independently of statin. SC injection q2w or monthly.</p>
              </div>
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">Inclisiran</span>
                  <div className="flex gap-1"><CORBadge level="2a" /><LOEBadge level="B-R" /></div>
                </div>
                <p className="text-xs text-gray-600">siRNA targeting PCSK9 mRNA. ~50% LDL reduction. SC q6 months after initial doses.</p>
              </div>
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">Bempedoic acid 180 mg daily</span>
                  <div className="flex gap-1"><CORBadge level="2a" /><LOEBadge level="B-R" /></div>
                </div>
                <p className="text-xs text-gray-600">ACL inhibitor. 15-25% LDL reduction. CLEAR Outcomes trial showed 13% MACE reduction in statin-intolerant patients. Does NOT cause myalgia (acts upstream of muscle).</p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={lipid.addNonstatin} onChange={(e) => updateLipid({ addNonstatin: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Nonstatin agent selected</span>
            </label>
            {lipid.addNonstatin && (
              <select value={lipid.nonstatinAgent} onChange={(e) => updateLipid({ nonstatinAgent: e.target.value })}
                className="ml-6 rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="">Select agent...</option>
                {NONSTATIN_OPTIONS.map((n) => (
                  <option key={n.agent} value={n.agent}>{n.agent} ({n.ldlReduction} reduction, {n.trial})</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Nonstatin reference table (always visible) */}
        {lipid.statinStatus && (
          <div className="overflow-x-auto mt-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Nonstatin Reference</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-3 py-2 text-left font-medium text-gray-700">Agent</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-700">LDL Reduction</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-700">ACS Trial</th>
                </tr>
              </thead>
              <tbody>
                {NONSTATIN_OPTIONS.map((n) => (
                  <tr key={n.agent} className={cn(lipid.nonstatinAgent === n.agent && 'bg-blue-50')}>
                    <td className="border px-3 py-2 font-medium">{n.agent}</td>
                    <td className="border px-3 py-2">{n.ldlReduction}</td>
                    <td className="border px-3 py-2">{n.trial}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Other */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Other Medications</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={otherMeds.betaBlocker}
                onChange={(e) => updateOther({ betaBlocker: e.target.checked })}
                disabled={otherMeds.betaBlockerContraindicated}
                className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Beta-blocker (within 24h)</span>
            </label>
            <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
          </div>
          <label className="flex items-center gap-2 ml-6 cursor-pointer">
            <input type="checkbox" checked={otherMeds.betaBlockerContraindicated}
              onChange={(e) => updateOther({ betaBlockerContraindicated: e.target.checked, betaBlocker: e.target.checked ? false : otherMeds.betaBlocker })}
              className="h-4 w-4 rounded border-gray-300 text-red-600" />
            <span className="text-xs text-gray-500">Contraindicated (HF, cardiogenic shock, heart block, bronchospasm)</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LVEF (%)</label>
            <input type="number" value={otherMeds.lvef ?? ''} onChange={(e) => updateOther({ lvef: e.target.value ? Number(e.target.value) : null })}
              className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="LVEF %" />
          </div>

          {otherMeds.lvef != null && otherMeds.lvef <= 40 && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
              <p className="text-sm font-medium text-amber-800">LVEF &le;40% — The following are indicated:</p>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={otherMeds.aceInhibitor} onChange={(e) => updateOther({ aceInhibitor: e.target.checked, arb: e.target.checked ? false : otherMeds.arb })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                    <span className="text-sm">ACE inhibitor</span>
                  </label>
                  <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={otherMeds.arb} onChange={(e) => updateOther({ arb: e.target.checked, aceInhibitor: e.target.checked ? false : otherMeds.aceInhibitor })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                    <span className="text-sm">ARB (if ACEi intolerant)</span>
                  </label>
                  <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={otherMeds.mra} onChange={(e) => updateOther({ mra: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                    <span className="text-sm">MRA/Eplerenone (LVEF &le;40% + HF/DM)</span>
                  </label>
                  <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={otherMeds.sglt2i} onChange={(e) => updateOther({ sglt2i: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">SGLT2i (continue if already taking)</span>
            </label>
            <div className="flex gap-1"><CORBadge level="2b" /><LOEBadge level="C-LD" /></div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={otherMeds.colchicine} onChange={(e) => updateOther({ colchicine: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Colchicine 0.5 mg daily</span>
            </label>
            <div className="flex gap-1"><CORBadge level="2b" /><LOEBadge level="A" /></div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={otherMeds.ppiWithDAPT} onChange={(e) => updateOther({ ppiWithDAPT: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">PPI with DAPT (high GI bleeding risk)</span>
            </label>
            <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
          </div>
        </div>
      </section>

      {/* Anemia Management & Transfusion */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Anemia Management & Transfusion in ACS</h2>

        <div className="space-y-3">
          <div className="rounded-md bg-orange-50 border border-orange-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-orange-900">Management of Anemia in ACS</span>
              <div className="flex gap-1"><CORBadge level="2b" /><LOEBadge level="B-R" /></div>
            </div>
            <p className="text-sm text-gray-900">
              In patients with ACS and acute or chronic anemia, blood transfusion to achieve a hemoglobin level <strong>&ge;10 g/dL</strong> may be reasonable to reduce cardiovascular events.
            </p>
          </div>

          <div className="rounded-md bg-gray-50 border p-3">
            <span className="text-sm font-semibold text-gray-900">Supporting Text (MINT Trial)</span>
            <p className="text-xs text-gray-700 mt-1">
              Although the MINT trial did not demonstrate a statistically significant reduction in its primary endpoint, the results suggest that a <strong>liberal blood transfusion strategy targeting a hemoglobin level around 10 g/dL</strong> may provide short-term clinical benefit over a restrictive transfusion strategy targeting a hemoglobin level above 7 g/dL or 8 g/dL in patients with AMI and anemia.
            </p>
          </div>
        </div>
      </section>

      <button onClick={confirmMeds} className="w-full rounded-lg bg-[#003366] py-3 text-white font-semibold hover:bg-[#004488] transition-colors">
        Confirm Medications & Continue
      </button>

      <SummaryBox
        title="Medications Summary"
        color="purple"
        items={summaryItems}
        placeholder="Select antiplatelet, anticoagulation, and other therapies to generate a summary."
      />
    </div>
  );
}
