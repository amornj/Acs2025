'use client';

import { useCallback, useMemo } from 'react';
import { Heart, AlertTriangle, ArrowRight } from 'lucide-react';
import { useACSStore } from '@/store/acsStore';
import { SummaryBox } from '@/components/ui/SummaryBox';
import { CORBadge } from '@/components/ui/CORBadge';
import { LOEBadge } from '@/components/ui/LOEBadge';
import { cn } from '@/lib/utils';

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
    // <12h
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
      if (shockPresent) lines.push('Cardiogenic shock present — emergency PCI indicated regardless of timing.');
      if (symptomOnsetHours != null) lines.push(`Symptom onset: ${symptomOnsetHours}h ago.`);
      if (pciCapable != null) lines.push(`PCI-capable hospital: ${pciCapable ? 'Yes' : 'No'}.`);
      if (stemiStrategy) lines.push(`Strategy: ${stemiStrategy}.`);
    } else if (acsType === 'nstemi' || acsType === 'ua') {
      lines.push(`ACS Type: ${acsType === 'nstemi' ? 'NSTEMI' : 'Unstable Angina'} pathway active.`);
      if (invasiveStrategy) {
        const labels: Record<string, string> = {
          immediate: 'Immediate invasive (<2h): refractory angina, hemodynamic/electrical instability, acute HF',
          early: 'Early invasive (<24h): GRACE >140, troponin changes, new ST changes',
          selective: 'Selective invasive: low-risk, negative troponin, no recurrent symptoms',
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

      {/* STEMI Pathway */}
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

      {/* NSTE-ACS Pathway */}
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
                <span className="text-sm font-semibold text-gray-900">Selective Invasive</span>
                <div className="flex gap-1"><CORBadge level="2a" /><LOEBadge level="B-R" /></div>
              </div>
              <p className="text-xs text-gray-600">Low-risk features, negative troponin, no recurrent symptoms, low TIMI/GRACE score</p>
            </button>
          </div>
        </section>
      )}

      {/* Cardiogenic Shock Algorithm */}
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

      {/* Multivessel Disease */}
      {acsType && (
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Multivessel Disease</h2>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={multivesselDisease} onChange={(e) => update({ multivesselDisease: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700">Multivessel coronary artery disease present</span>
          </label>

          {multivesselDisease && (
            <div className="space-y-3">
              {acsType === 'stemi' && !shockPresent && (
                <div className="rounded-md bg-green-50 border border-green-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-green-900">Complete Revascularization (COMPLETE Trial)</span>
                    <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
                  </div>
                  <p className="text-xs text-green-800">Same-sitting or staged non-culprit PCI recommended for stable STEMI patients.</p>
                </div>
              )}
              {shockPresent && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-red-900">NO Routine Multivessel PCI in Shock</span>
                    <div className="flex gap-1"><CORBadge level="3-harm" /><LOEBadge level="A" /></div>
                  </div>
                  <p className="text-xs text-red-800">Culprit-only PCI. Multivessel PCI at time of primary PCI is harmful.</p>
                </div>
              )}
            </div>
          )}
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
