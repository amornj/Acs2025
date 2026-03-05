'use client';

import { useCallback, useMemo, useState } from 'react';
import { Heart, AlertTriangle, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useACSStore } from '@/store/acsStore';
import { SummaryBox } from '@/components/ui/SummaryBox';
import { CORBadge } from '@/components/ui/CORBadge';
import { LOEBadge } from '@/components/ui/LOEBadge';
import { cn } from '@/lib/utils';

const ABSOLUTE_CONTRAINDICATIONS = [
  'Prior intracranial hemorrhage (any time)',
  'Known intracranial neoplasm (primary or metastatic)',
  'Known cerebral vascular malformation (AVM)',
  'Active bleeding or bleeding diathesis (excluding menses)',
  'Suspected aortic dissection',
  'Severe uncontrolled hypertension (unresponsive to emergency therapy)',
  'Significant head/facial trauma within 3 months',
  'Ischemic stroke within 3 months',
  'For streptokinase: prior treatment within 6 months',
];

const RELATIVE_CONTRAINDICATIONS = [
  'Chronic, poorly controlled hypertension (>180/110)',
  'Current use of anticoagulants (higher INR = higher risk)',
  'Non-compressible vascular puncture',
  'Traumatic or prolonged CPR (>10 minutes)',
  'Major surgery within 3 weeks',
  'Recent internal bleeding (2-4 weeks)',
  'Pregnancy',
  'Active peptic ulcer disease',
  'Dementia or intracranial pathology not covered above',
  'Prior ischemic stroke >3 months ago',
];

export default function ReperfusionPage() {
  const { evaluation, reperfusion, updateReperfusion, markPageCompleted } = useACSStore();
  const acsType = evaluation.acsType;
  const {
    pciCapable, symptomOnsetHours, transferTimeMins, strategy,
    shockPresent, multivesselDisease, fibrinolyticAgent, invasiveStrategy,
  } = reperfusion;

  const update = useCallback((updates: Partial<typeof reperfusion>) => {
    updateReperfusion(updates);
  }, [updateReperfusion]);

  // STEMI pathway derivation
  const stemiStrategy = useMemo(() => {
    if (acsType !== 'stemi') return null;
    if (shockPresent) return 'Emergency PCI regardless of timing (Class I)';
    if (symptomOnsetHours == null) return null;
    if (symptomOnsetHours > 24) return 'No routine PCI for stable, occluded artery >24h (Class III)';
    if (symptomOnsetHours >= 12) return 'PCI reasonable for ongoing ischemia (Class 2a)';
    if (pciCapable === true) return 'Primary PCI at this facility. Goal: FMC-to-device <=90 min (Class I)';
    if (pciCapable === false) {
      if (transferTimeMins != null && transferTimeMins <= 120) {
        return 'Transfer for primary PCI. Goal: FMC-to-device <=120 min (Class I)';
      }
      return 'Fibrinolysis within 30 min, then transfer for angiography 2-24h (Class I)';
    }
    return null;
  }, [acsType, shockPresent, symptomOnsetHours, pciCapable, transferTimeMins]);

  const confirmStrategy = useCallback(() => {
    const s = stemiStrategy || (invasiveStrategy ? `NSTE-ACS: ${invasiveStrategy} invasive strategy` : '');
    update({ strategy: s });
    markPageCompleted('reperfusion');
  }, [stemiStrategy, invasiveStrategy, update, markPageCompleted]);

  const summaryItems = useMemo(() => {
    const lines: string[] = [];
    if (acsType === 'stemi') {
      lines.push('ACS Type: STEMI pathway active.');
      if (shockPresent) lines.push('Cardiogenic shock present -- emergency PCI indicated regardless of timing.');
      if (symptomOnsetHours != null) lines.push(`Symptom onset: ${symptomOnsetHours}h ago.`);
      if (pciCapable != null) lines.push(`PCI-capable hospital: ${pciCapable ? 'Yes' : 'No'}.`);
      if (stemiStrategy) lines.push(`Strategy: ${stemiStrategy}.`);
    } else if (acsType === 'nstemi' || acsType === 'ua') {
      lines.push(`ACS Type: ${acsType === 'nstemi' ? 'NSTEMI' : 'Unstable Angina'} pathway active.`);
      if (invasiveStrategy) {
        const labels: Record<string, string> = {
          immediate: 'Immediate invasive (<2h): refractory angina, hemodynamic/electrical instability, acute HF',
          early: 'Early invasive (<24h): GRACE >140, troponin changes, new ST changes',
          selective: 'Selective/routine invasive: low-risk features, CAG before discharge recommended',
        };
        lines.push(`Strategy: ${labels[invasiveStrategy]}.`);
      }
    }
    if (multivesselDisease) {
      if (shockPresent) {
        lines.push('Multivessel disease + shock: Culprit-only PCI recommended (Class I). NO routine multivessel PCI (Class III Harm).');
      } else if (acsType === 'stemi') {
        lines.push('Multivessel disease: Complete revascularization recommended (COMPLETE trial), same-sitting or staged.');
      }
    }
    if (fibrinolyticAgent) lines.push(`Fibrinolytic agent: ${fibrinolyticAgent}.`);
    if (strategy) lines.push('Strategy confirmed. Proceed to Medications.');
    return lines;
  }, [acsType, shockPresent, symptomOnsetHours, pciCapable, stemiStrategy, invasiveStrategy, multivesselDisease, fibrinolyticAgent, strategy]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#003366] p-2">
          <Heart className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reperfusion & Invasive Strategy</h1>
          <p className="text-sm text-gray-500">STEMI pathway, NSTE-ACS strategy, cardiogenic shock</p>
        </div>
      </div>

      {!acsType && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-800">Please complete the Initial Evaluation first to determine ACS type.</p>
        </div>
      )}

      {/* ========== SECTION 1: STEMI Reperfusion Pathway ========== */}
      {acsType === 'stemi' && (
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            STEMI Reperfusion Pathway
            <CORBadge level="1" />
          </h2>

          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={shockPresent} onChange={(e) => update({ shockPresent: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-red-600" />
            <span className="text-sm text-gray-700 font-medium">Cardiogenic shock present</span>
          </label>

          {shockPresent && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 mb-4 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Emergency PCI indicated regardless of timing</p>
                <div className="flex gap-2 mt-1"><CORBadge level="1" /><LOEBadge level="B-R" /></div>
              </div>
            </div>
          )}

          {!shockPresent && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time from symptom onset (hours)</label>
                  <input type="number" value={symptomOnsetHours ?? ''} onChange={(e) => update({ symptomOnsetHours: e.target.value ? Number(e.target.value) : null })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Hours" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PCI-capable hospital?</label>
                  <div className="flex gap-2">
                    <button onClick={() => update({ pciCapable: true })}
                      className={cn('rounded-md px-4 py-2 text-sm border', pciCapable === true ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-white border-gray-300')}>
                      Yes
                    </button>
                    <button onClick={() => update({ pciCapable: false })}
                      className={cn('rounded-md px-4 py-2 text-sm border', pciCapable === false ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-white border-gray-300')}>
                      No
                    </button>
                  </div>
                </div>
              </div>

              {pciCapable === false && symptomOnsetHours != null && symptomOnsetHours < 12 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated transfer time for PCI (minutes)</label>
                  <input type="number" value={transferTimeMins ?? ''} onChange={(e) => update({ transferTimeMins: e.target.value ? Number(e.target.value) : null })}
                    className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Minutes" />
                </div>
              )}
            </>
          )}

          {stemiStrategy && (
            <div className={cn(
              'rounded-md px-4 py-3 border mt-2',
              stemiStrategy.includes('Class III') ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
            )}>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" /> {stemiStrategy}
              </p>
            </div>
          )}

          {/* Fibrinolytic selection */}
          {stemiStrategy?.includes('Fibrinolysis') && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fibrinolytic Agent</label>
              <select value={fibrinolyticAgent || ''} onChange={(e) => update({ fibrinolyticAgent: e.target.value || null })}
                className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="">Select agent...</option>
                <option value="Tenecteplase">Tenecteplase (preferred, single bolus)</option>
                <option value="Alteplase">Alteplase (accelerated infusion)</option>
                <option value="Reteplase">Reteplase (double bolus)</option>
              </select>
              <div className="mt-2 flex gap-2"><CORBadge level="1" /><LOEBadge level="B-R" /></div>
            </div>
          )}
        </section>
      )}

      {/* ========== SECTION 1b: Fibrinolytic Contraindications ========== */}
      {acsType === 'stemi' && stemiStrategy?.includes('Fibrinolysis') && (
        <FibrinolyticContraindications />
      )}

      {/* ========== SECTION 1c: Fibrinolysis Downstream Recommendations ========== */}
      {acsType === 'stemi' && stemiStrategy?.includes('Fibrinolysis') && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fibrinolysis Pathway -- Downstream Recommendations</h2>
          <div className="space-y-3">
            <div className="rounded-md bg-white border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">Aspirin</span>
                <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
              </div>
              <p className="text-xs text-gray-600">Loading 162-325 mg (chewed), then 81 mg daily</p>
            </div>
            <div className="rounded-md bg-white border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">Clopidogrel ONLY (no prasugrel/ticagrelor)</span>
                <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
              </div>
              <p className="text-xs text-gray-600">
                Age &le;75: 300 mg loading, then 75 mg daily<br />
                Age &gt;75: 75 mg daily (NO loading dose)
              </p>
            </div>
            <div className="rounded-md bg-white border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">Anticoagulation: Enoxaparin preferred</span>
                <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
              </div>
              <p className="text-xs text-gray-600">
                Age &le;75: 30 mg IV bolus, then 1 mg/kg SC q12h<br />
                Age &gt;75: No bolus, 0.75 mg/kg SC q12h<br />
                CrCl &lt;30: 1 mg/kg SC q24h<br />
                Alternative: UFH 60 U/kg bolus (max 4000 U), 12 U/kg/h (max 1000 U/h)
              </p>
            </div>
            <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-blue-900">Transfer for angiography 2-24h post-lysis</span>
                <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
              </div>
              <p className="text-xs text-blue-700">Routine early angiography recommended even if fibrinolysis appears successful</p>
            </div>
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-red-900">Failed lysis? Rescue PCI</span>
                <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="B-R" /></div>
              </div>
              <p className="text-xs text-red-700">
                If &lt;50% ST-resolution at 60-90 min post-lysis -- immediate rescue PCI<br />
                Also indicated for hemodynamic instability or worsening ischemia
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ========== SECTION 2: NSTE-ACS Invasive Strategy ========== */}
      {(acsType === 'nstemi' || acsType === 'ua') && (
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">NSTE-ACS Invasive Strategy</h2>
          <div className="space-y-3">
            <button onClick={() => update({ invasiveStrategy: 'immediate' })}
              className={cn('w-full rounded-lg border-2 p-4 text-left transition-all',
                invasiveStrategy === 'immediate' ? 'bg-red-50 border-red-400' : 'bg-white border-gray-200 hover:border-gray-400')}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">Immediate Invasive (&lt;2 hours)</span>
                <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="B-NR" /></div>
              </div>
              <p className="text-xs text-gray-600">Refractory angina, hemodynamic instability, electrical instability (recurrent VT/VF), acute heart failure</p>
            </button>

            <button onClick={() => update({ invasiveStrategy: 'early' })}
              className={cn('w-full rounded-lg border-2 p-4 text-left transition-all',
                invasiveStrategy === 'early' ? 'bg-amber-50 border-amber-400' : 'bg-white border-gray-200 hover:border-gray-400')}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">Early Invasive (&lt;24 hours)</span>
                <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
              </div>
              <p className="text-xs text-gray-600">GRACE &gt;140, troponin rise/fall consistent with MI, new ST-segment changes</p>
            </button>

            <button onClick={() => update({ invasiveStrategy: 'selective' })}
              className={cn('w-full rounded-lg border-2 p-4 text-left transition-all',
                invasiveStrategy === 'selective' ? 'bg-green-50 border-green-400' : 'bg-white border-gray-200 hover:border-gray-400')}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">Low Risk: Routine Invasive or Selective Invasive</span>
                <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
              </div>
              <p className="text-xs text-gray-600">Low-risk features, negative or low-level troponin, no recurrent symptoms, low TIMI/GRACE. Both routine invasive and ischemia-guided strategies are reasonable.</p>
            </button>

            {invasiveStrategy === 'selective' && (
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3 ml-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-blue-900">CAG before hospital discharge</span>
                  <div className="flex gap-1"><CORBadge level="2a" /><LOEBadge level="B-R" /></div>
                </div>
                <p className="text-xs text-blue-700">Even with initial selective/ischemia-guided approach, coronary angiography before hospital discharge is reasonable to define anatomy and guide further management.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========== SECTION 3: PCI Unsuccessful / Complications ========== */}
      {acsType && (
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">If PCI Unsuccessful / Complications</h2>
          <div className="space-y-3">
            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">Emergency CABG consideration</span>
                <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="B-NR" /></div>
              </div>
              <p className="text-xs text-gray-600">For failed PCI with ongoing ischemia, dissection, or threatened vessel closure</p>
            </div>
            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">No-reflow: GPI may be reasonable</span>
                <div className="flex gap-1"><CORBadge level="2b" /><LOEBadge level="C-LD" /></div>
              </div>
              <p className="text-xs text-gray-600">Intracoronary GPI (abciximab, eptifibatide) for no-reflow phenomenon</p>
            </div>
            <div className="rounded-md border p-3">
              <span className="text-sm font-semibold text-gray-900">Continue DAPT</span>
              <p className="text-xs text-gray-600 mt-1">Maintain aspirin + P2Y12 inhibitor. If stent deployed before complication, stent thrombosis prevention is critical.</p>
            </div>
            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">MCS for hemodynamic compromise</span>
                <div className="flex gap-1"><CORBadge level="2a" /><LOEBadge level="B-R" /></div>
              </div>
              <p className="text-xs text-gray-600">Impella or IABP if hemodynamic compromise post-failed PCI pending CABG</p>
            </div>
          </div>
        </section>
      )}

      {/* ========== SECTION 4: CABG Pathway ========== */}
      {acsType && (
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">If Proceeding to CABG</h2>
          <div className="space-y-3">
            <div className="rounded-md border p-3">
              <span className="text-sm font-semibold text-gray-900">Continue Aspirin</span>
              <div className="flex gap-1 mt-1"><CORBadge level="1" /><LOEBadge level="B-NR" /></div>
              <p className="text-xs text-gray-600 mt-1">Aspirin should NOT be withheld before CABG</p>
            </div>
            <div className="rounded-md border p-3">
              <span className="text-sm font-semibold text-gray-900">Discontinue P2Y12 Inhibitor Before Surgery</span>
              <div className="flex gap-1 mt-1"><CORBadge level="1" /><LOEBadge level="B-NR" /></div>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-2 py-1.5 text-left font-medium">Agent</th>
                      <th className="border px-2 py-1.5 text-left font-medium">Stop Before CABG</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border px-2 py-1.5">Clopidogrel</td><td className="border px-2 py-1.5">&ge;5 days</td></tr>
                    <tr><td className="border px-2 py-1.5">Ticagrelor</td><td className="border px-2 py-1.5">&ge;3 days</td></tr>
                    <tr><td className="border px-2 py-1.5">Prasugrel</td><td className="border px-2 py-1.5">&ge;7 days</td></tr>
                    <tr><td className="border px-2 py-1.5">Cangrelor</td><td className="border px-2 py-1.5">&ge;1 hour (short half-life)</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-md border p-3">
              <span className="text-sm font-semibold text-gray-900">Anticoagulation</span>
              <p className="text-xs text-gray-600 mt-1">
                UFH: discontinue 4-6h before surgery (or titrate ACT)<br />
                GPI: discontinue &ge;4h before CABG (eptifibatide/tirofiban)
              </p>
            </div>
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800">
                <strong>Timing:</strong> Emergency CABG if anatomy not suitable for PCI. If clinically stable, delay CABG to allow P2Y12 washout per table above.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ========== SECTION 5: Cardiogenic Shock ========== */}
      {acsType && (
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cardiogenic Shock Management</h2>

          {!shockPresent && acsType === 'stemi' && (
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input type="checkbox" checked={shockPresent} onChange={(e) => update({ shockPresent: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-red-600" />
              <span className="text-sm text-gray-700">Cardiogenic shock present</span>
            </label>
          )}

          <div className="space-y-3">
            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">Culprit-only PCI (CULPRIT-SHOCK)</span>
                <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
              </div>
              <p className="text-xs text-gray-600">PCI of culprit lesion only. Routine multivessel PCI is Class III Harm.</p>
            </div>
            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">Impella (DanGer-SHOCK)</span>
                <div className="flex gap-1"><CORBadge level="2a" /><LOEBadge level="B-R" /></div>
              </div>
              <p className="text-xs text-gray-600">Impella CP/5.0/5.5 for hemodynamic support.</p>
            </div>
            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">IABP</span>
                <div className="flex gap-1"><CORBadge level="3-no-benefit" /><LOEBadge level="A" /></div>
              </div>
              <p className="text-xs text-gray-600">Routine IABP use is NOT recommended in cardiogenic shock.</p>
            </div>
          </div>
        </section>
      )}

      {/* ========== SECTION 6: Multivessel CAD ========== */}
      {acsType && (
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Multivessel Coronary Artery Disease</h2>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={multivesselDisease} onChange={(e) => update({ multivesselDisease: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700">Multivessel coronary artery disease present</span>
          </label>

          {multivesselDisease && (
            <div className="space-y-3">
              {acsType === 'stemi' && !shockPresent && (
                <>
                  <div className="rounded-md bg-green-50 border border-green-200 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-green-900">Complete Revascularization (COMPLETE Trial)</span>
                      <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
                    </div>
                    <p className="text-xs text-green-800">PCI of non-culprit significant lesions recommended, either same-sitting or staged (before discharge or within 45 days).</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">Physiology/imaging guidance for non-culprit lesions</span>
                      <div className="flex gap-1"><CORBadge level="2a" /><LOEBadge level="B-R" /></div>
                    </div>
                    <p className="text-xs text-gray-600">FFR, iwFR, or IVUS/OCT to guide non-culprit PCI decision.</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">CABG for complex MVD</span>
                      <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="B-NR" /></div>
                    </div>
                    <p className="text-xs text-gray-600">Heart Team discussion for left main, complex 3-vessel disease, or high SYNTAX score (&gt;33).</p>
                  </div>
                </>
              )}

              {(acsType === 'nstemi' || acsType === 'ua') && (
                <>
                  <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-blue-900">Culprit lesion PCI first</span>
                      <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
                    </div>
                    <p className="text-xs text-blue-700">Identify and treat the culprit lesion. Complete revascularization can be considered same-sitting or staged.</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">Complete revascularization in NSTE-ACS</span>
                      <div className="flex gap-1"><CORBadge level="2a" /><LOEBadge level="B-R" /></div>
                    </div>
                    <p className="text-xs text-gray-600">Reasonable to treat non-culprit lesions based on physiology/imaging guidance (FFR/iwFR).</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">Heart Team for complex MVD</span>
                      <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="C-EO" /></div>
                    </div>
                    <p className="text-xs text-gray-600">Left main, 3-vessel disease, DM + MVD, or high SYNTAX: discuss CABG vs PCI.</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">IVUS/OCT for PCI guidance</span>
                      <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
                    </div>
                    <p className="text-xs text-gray-600">Intravascular imaging recommended to optimize stent sizing and apposition (ILUMIEN IV, RENOVATE-COMPLEX-PCI).</p>
                  </div>
                </>
              )}

              {shockPresent && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-red-900">NO Routine Multivessel PCI in Shock</span>
                    <div className="flex gap-1"><CORBadge level="3-harm" /><LOEBadge level="A" /></div>
                  </div>
                  <p className="text-xs text-red-800">Culprit-only PCI (CULPRIT-SHOCK). Staged non-culprit PCI may be considered after stabilization.</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ========== SECTION 7: Mechanical Complications ========== */}
      {acsType && (
        <section className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Mechanical Complications of MI</h2>
          <p className="text-xs text-gray-500 mb-4">Typically occur 1-7 days post-MI. High mortality without surgical intervention.</p>

          <div className="space-y-3">
            <div className="rounded-md border border-red-200 p-3">
              <span className="text-sm font-semibold text-red-900 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Left Ventricular Free Wall Rupture
              </span>
              <p className="text-xs text-gray-700 mt-1">
                <strong>Presentation:</strong> Sudden hemodynamic collapse, PEA/cardiac tamponade, 1-5 days post-MI<br />
                <strong>Diagnosis:</strong> Emergent echo -- pericardial effusion with tamponade<br />
                <strong>Management:</strong> Pericardiocentesis for stabilization, then emergent surgical repair (Class I). Mortality &gt;90% without surgery.
              </p>
            </div>

            <div className="rounded-md border border-red-200 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-red-900 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Ventricular Septal Rupture (VSR)
                </span>
                <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="B-NR" /></div>
              </div>
              <p className="text-xs text-gray-700 mt-1">
                <strong>Presentation:</strong> New harsh holosystolic murmur + thrill, 1-7 days post-MI<br />
                <strong>Diagnosis:</strong> Echo with color Doppler; PA catheter O2 step-up at RV<br />
                <strong>Management:</strong> Emergent surgical repair. MCS (Impella/IABP) as bridge.
              </p>
            </div>

            <div className="rounded-md border border-red-200 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-red-900 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Papillary Muscle Rupture (Acute MR)
                </span>
                <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="B-NR" /></div>
              </div>
              <p className="text-xs text-gray-700 mt-1">
                <strong>Presentation:</strong> Severe MR, flash pulmonary edema, cardiogenic shock, 2-7 days post-MI<br />
                <strong>Management:</strong> Emergent MV repair/replacement (Class I). IABP/Impella as bridge. Surgical mortality 20-40%.
              </p>
            </div>

            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">Right Ventricular Infarction</span>
                <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="B-NR" /></div>
              </div>
              <p className="text-xs text-gray-700 mt-1">
                <strong>Presentation:</strong> Hypotension, elevated JVP, clear lungs with inferior STEMI. V4R ST-elevation<br />
                <strong>Management:</strong> Volume loading, avoid nitrates/diuretics. Reperfuse RCA. Inotropes if volume-unresponsive.
              </p>
            </div>

            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">LV Aneurysm / LV Thrombus</span>
                <div className="flex gap-1"><CORBadge level="2a" /><LOEBadge level="C-LD" /></div>
              </div>
              <p className="text-xs text-gray-700 mt-1">
                Screen with echo (anterior/apical MI, LVEF &le;40%). Anticoagulate 3-6 months if thrombus found. Repeat imaging before stopping.
              </p>
            </div>

            <div className="rounded-md border p-3">
              <span className="text-sm font-semibold text-gray-900">Post-MI Pericarditis / Dressler Syndrome</span>
              <p className="text-xs text-gray-700 mt-1">
                <strong>Early (1-3 days):</strong> Aspirin 650 mg q6-8h + colchicine 0.5 mg BID. Avoid NSAIDs.<br />
                <strong>Dressler (2-10 weeks):</strong> Aspirin + colchicine. Corticosteroids only if refractory.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Confirm button */}
      {(stemiStrategy || invasiveStrategy) && (
        <button
          onClick={confirmStrategy}
          className="w-full rounded-lg bg-[#003366] py-3 text-white font-semibold hover:bg-[#004488] transition-colors"
        >
          Confirm Strategy & Continue
        </button>
      )}

      <SummaryBox
        title="Reperfusion Strategy Summary"
        color="green"
        items={summaryItems}
        placeholder="Select ACS type and complete reperfusion pathway to generate a summary."
      />
    </div>
  );
}

/* ========== Fibrinolytic Contraindication Checklist Component ========== */
function FibrinolyticContraindications() {
  const [absoluteChecked, setAbsoluteChecked] = useState<boolean[]>(new Array(ABSOLUTE_CONTRAINDICATIONS.length).fill(false));
  const [relativeChecked, setRelativeChecked] = useState<boolean[]>(new Array(RELATIVE_CONTRAINDICATIONS.length).fill(false));
  const [expanded, setExpanded] = useState(true);

  const absoluteCount = absoluteChecked.filter(Boolean).length;
  const relativeCount = relativeChecked.filter(Boolean).length;
  const hasAbsolute = absoluteCount > 0;

  const toggleAbsolute = (i: number) => {
    const next = [...absoluteChecked];
    next[i] = !next[i];
    setAbsoluteChecked(next);
  };

  const toggleRelative = (i: number) => {
    const next = [...relativeChecked];
    next[i] = !next[i];
    setRelativeChecked(next);
  };

  return (
    <section className={cn(
      'rounded-lg border p-5 shadow-sm',
      hasAbsolute ? 'border-red-300 bg-red-50' : 'border-amber-200 bg-white'
    )}>
      <button onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full text-left">
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn('h-5 w-5', hasAbsolute ? 'text-red-600' : 'text-amber-500')} />
          <h2 className="text-lg font-semibold text-gray-900">Fibrinolytic Contraindication Checklist</h2>
        </div>
        <div className="flex items-center gap-2">
          {hasAbsolute && (
            <span className="rounded-full bg-red-600 text-white text-xs px-2 py-0.5 font-bold">
              ABSOLUTE: {absoluteCount}
            </span>
          )}
          {relativeCount > 0 && (
            <span className="rounded-full bg-amber-500 text-white text-xs px-2 py-0.5 font-bold">
              RELATIVE: {relativeCount}
            </span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {hasAbsolute && (
        <div className="mt-3 rounded-md bg-red-100 border border-red-300 p-3">
          <p className="text-sm font-bold text-red-800">
            ABSOLUTE CONTRAINDICATION PRESENT -- Fibrinolysis is CONTRAINDICATED. Consider transfer for primary PCI.
          </p>
        </div>
      )}

      {expanded && (
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-red-800 mb-2">Absolute Contraindications (any = DO NOT give fibrinolytics)</h3>
            <div className="space-y-1.5">
              {ABSOLUTE_CONTRAINDICATIONS.map((item, i) => (
                <label key={i} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-red-50 cursor-pointer">
                  <input type="checkbox" checked={absoluteChecked[i]} onChange={() => toggleAbsolute(i)}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                  <span className={cn('text-sm', absoluteChecked[i] ? 'text-red-800 font-medium' : 'text-gray-700')}>{item}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-800 mb-2">Relative Contraindications (weigh risk vs benefit)</h3>
            <div className="space-y-1.5">
              {RELATIVE_CONTRAINDICATIONS.map((item, i) => (
                <label key={i} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-amber-50 cursor-pointer">
                  <input type="checkbox" checked={relativeChecked[i]} onChange={() => toggleRelative(i)}
                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                  <span className={cn('text-sm', relativeChecked[i] ? 'text-amber-800 font-medium' : 'text-gray-700')}>{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
