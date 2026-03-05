'use client';

import { useCallback, useMemo } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useACSStore } from '@/store/acsStore';
import { SummaryBox } from '@/components/ui/SummaryBox';
import { CORBadge } from '@/components/ui/CORBadge';
import { LOEBadge } from '@/components/ui/LOEBadge';
import { cn } from '@/lib/utils';

const DISCHARGE_CHECKLIST_ITEMS = [
  'Aspirin prescribed',
  'P2Y12 inhibitor prescribed with duration specified',
  'High-intensity statin prescribed',
  'Beta-blocker prescribed (if no contraindication)',
  'ACEi/ARB prescribed (if LVEF <=40%)',
  'Smoking cessation counseling provided',
  'Cardiac rehabilitation referral made',
  'Follow-up appointment scheduled (1-2 weeks)',
  'Fasting lipid panel ordered for 4-8 weeks',
  'Activity/exercise guidance provided',
  'Dietary counseling provided',
  'Blood pressure management plan',
  'Diabetes management plan (if applicable)',
  'Emergency symptom recognition education',
  'Influenza vaccination given/planned',
];

export default function DischargePage() {
  const { discharge, medications, updateDischarge, markPageCompleted } = useACSStore();
  const { daptPlan, lipidFollowupWeeks, rehabReferral, rehabType, icdIndicated, influenzaVaccine, dischargeChecklist } = discharge;
  const lvef = medications.otherMeds.lvef;

  const updateDAPT = useCallback((u: Partial<typeof daptPlan>) => {
    updateDischarge({ daptPlan: { ...daptPlan, ...u } });
  }, [daptPlan, updateDischarge]);

  const toggleChecklist = useCallback((item: string) => {
    const arr = dischargeChecklist.includes(item)
      ? dischargeChecklist.filter((c) => c !== item)
      : [...dischargeChecklist, item];
    updateDischarge({ dischargeChecklist: arr });
  }, [dischargeChecklist, updateDischarge]);

  const confirmDischarge = useCallback(() => {
    markPageCompleted('discharge');
  }, [markPageCompleted]);

  // DAPT strategy recommendation
  const daptRecommendation = useMemo(() => {
    if (daptPlan.onOAC) return 'OAC patients: Triple therapy 1-4 weeks → drop aspirin → OAC + clopidogrel (Class I, LOE A)';
    if (daptPlan.highBleedingRisk) return 'High bleeding risk: Abbreviated DAPT 1-3 months → P2Y12 monotherapy (Class 2b, LOE B-R)';
    return 'Standard: DAPT for 12 months (Class I, LOE A). Consider ticagrelor monotherapy after >=1 month (Class I, LOE A).';
  }, [daptPlan.onOAC, daptPlan.highBleedingRisk]);

  const summaryItems = useMemo(() => {
    const lines: string[] = [];
    if (daptPlan.strategy) {
      const strategyLabels: Record<string, string> = {
        'standard-12mo': 'Standard DAPT 12 months',
        'ticagrelor-mono': 'Ticagrelor monotherapy after &ge;1 month DAPT',
        'de-escalation': 'De-escalation to clopidogrel at 1 month',
        'abbreviated': 'Abbreviated DAPT 1-3 months (high bleeding risk)',
        'oac-triple': 'OAC + triple therapy 1-4 weeks → OAC + clopidogrel',
      };
      lines.push(`DAPT Strategy: ${strategyLabels[daptPlan.strategy]}.`);
    }
    lines.push(`Lipid follow-up: Fasting lipid panel at ${lipidFollowupWeeks} weeks post-discharge.`);
    if (rehabReferral) lines.push(`Cardiac rehab: Referral made (${rehabType === 'center' ? 'center-based' : rehabType === 'home' ? 'home-based' : 'type TBD'}).`);
    if (icdIndicated) lines.push('ICD: Indicated (>=40 days post-MI, >=90 days post-revasc, LVEF <=40%).');
    if (influenzaVaccine) lines.push('Influenza vaccination: Given/planned (Class I, LOE A).');
    lines.push(`Discharge checklist: ${dischargeChecklist.length}/${DISCHARGE_CHECKLIST_ITEMS.length} items completed.`);
    return lines;
  }, [daptPlan, lipidFollowupWeeks, rehabReferral, rehabType, icdIndicated, influenzaVaccine, dischargeChecklist]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#003366] p-2">
          <ClipboardCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discharge & Follow-up</h1>
          <p className="text-sm text-gray-500">DAPT duration, lipid targets, rehab, ICD timing</p>
        </div>
      </div>

      {/* DAPT Duration Calculator */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">DAPT Duration Strategy</h2>

        <div className="space-y-3 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={daptPlan.highBleedingRisk} onChange={(e) => updateDAPT({ highBleedingRisk: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-red-600" />
            <span className="text-sm text-gray-700">High bleeding risk</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={daptPlan.onOAC} onChange={(e) => updateDAPT({ onOAC: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700">On oral anticoagulation (OAC)</span>
          </label>
        </div>

        <div className="rounded-md bg-blue-50 border border-blue-200 p-3 mb-4">
          <p className="text-sm text-blue-800">{daptRecommendation}</p>
        </div>

        <div className="space-y-3">
          <button onClick={() => updateDAPT({ strategy: 'standard-12mo', duration: 12 })}
            className={cn('w-full rounded-lg border-2 p-3 text-left transition-all',
              daptPlan.strategy === 'standard-12mo' ? 'bg-green-50 border-green-400' : 'bg-white border-gray-200 hover:border-gray-400')}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">Standard DAPT — 12 months</span>
              <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
            </div>
          </button>

          <button onClick={() => updateDAPT({ strategy: 'ticagrelor-mono', duration: 1 })}
            className={cn('w-full rounded-lg border-2 p-3 text-left transition-all',
              daptPlan.strategy === 'ticagrelor-mono' ? 'bg-green-50 border-green-400' : 'bg-white border-gray-200 hover:border-gray-400')}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">Ticagrelor monotherapy after &ge;1 month DAPT</span>
              <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
            </div>
            <p className="text-xs text-gray-600">Discontinue aspirin, continue ticagrelor. Reduces bleeding without increasing ischemic events.</p>
          </button>

          <button onClick={() => updateDAPT({ strategy: 'de-escalation', duration: 1 })}
            className={cn('w-full rounded-lg border-2 p-3 text-left transition-all',
              daptPlan.strategy === 'de-escalation' ? 'bg-amber-50 border-amber-400' : 'bg-white border-gray-200 hover:border-gray-400')}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">De-escalation at 1 month (ticagrelor/prasugrel → clopidogrel)</span>
              <div className="flex gap-1"><CORBadge level="2b" /><LOEBadge level="B-R" /></div>
            </div>
          </button>

          <button onClick={() => updateDAPT({ strategy: 'abbreviated', duration: 3 })}
            className={cn('w-full rounded-lg border-2 p-3 text-left transition-all',
              daptPlan.strategy === 'abbreviated' ? 'bg-amber-50 border-amber-400' : 'bg-white border-gray-200 hover:border-gray-400')}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">Abbreviated DAPT (1-3 months) — High bleeding risk</span>
              <div className="flex gap-1"><CORBadge level="2b" /><LOEBadge level="B-R" /></div>
            </div>
          </button>

          <button onClick={() => updateDAPT({ strategy: 'oac-triple', duration: 1 })}
            className={cn('w-full rounded-lg border-2 p-3 text-left transition-all',
              daptPlan.strategy === 'oac-triple' ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:border-gray-400')}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">OAC: Triple 1-4 weeks → OAC + clopidogrel</span>
              <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
            </div>
            <p className="text-xs text-gray-600">Drop aspirin within 1-4 weeks after PCI. Continue OAC + clopidogrel.</p>
          </button>
        </div>
      </section>

      {/* Lipid Follow-up */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Lipid Follow-up</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Fasting lipid panel at</span>
          <select value={lipidFollowupWeeks} onChange={(e) => updateDischarge({ lipidFollowupWeeks: Number(e.target.value) })}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm">
            <option value={4}>4 weeks</option>
            <option value={6}>6 weeks</option>
            <option value={8}>8 weeks</option>
          </select>
          <span className="text-sm text-gray-700">post-discharge</span>
          <CORBadge level="1" /><LOEBadge level="B-NR" />
        </div>
      </section>

      {/* Cardiac Rehab */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cardiac Rehabilitation</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={rehabReferral} onChange={(e) => updateDischarge({ rehabReferral: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Cardiac rehab referral made</span>
            </label>
            <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
          </div>
          {rehabReferral && (
            <div className="flex gap-2 ml-6">
              <button onClick={() => updateDischarge({ rehabType: 'center' })}
                className={cn('rounded-md px-4 py-2 text-sm border', rehabType === 'center' ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300')}>
                Center-based
              </button>
              <button onClick={() => updateDischarge({ rehabType: 'home' })}
                className={cn('rounded-md px-4 py-2 text-sm border', rehabType === 'home' ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300')}>
                Home-based
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ICD Timing */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ICD Timing</h2>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={icdIndicated} onChange={(e) => updateDischarge({ icdIndicated: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700">ICD indicated</span>
          </label>
          <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
        </div>
        <p className="text-xs text-gray-500 mt-2 ml-6">
          Criteria: &ge;40 days post-MI, &ge;90 days post-revascularization, LVEF &le;40% despite optimal medical therapy.
          {lvef != null && lvef <= 40 && <span className="text-amber-600 font-medium"> Current LVEF: {lvef}% — meets LVEF criterion.</span>}
        </p>
      </section>

      {/* Immunization */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Immunization</h2>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={influenzaVaccine} onChange={(e) => updateDischarge({ influenzaVaccine: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700">Annual influenza vaccination</span>
          </label>
          <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="A" /></div>
        </div>
      </section>

      {/* Discharge Checklist */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Discharge Checklist</h2>
          <span className="text-sm text-gray-500">{dischargeChecklist.length}/{DISCHARGE_CHECKLIST_ITEMS.length}</span>
        </div>
        <div className="space-y-2">
          {DISCHARGE_CHECKLIST_ITEMS.map((item) => (
            <label key={item} className="flex items-center gap-2 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={dischargeChecklist.includes(item)}
                onChange={() => toggleChecklist(item)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className={cn('text-sm', dischargeChecklist.includes(item) ? 'text-gray-500 line-through' : 'text-gray-700')}>
                {item}
              </span>
            </label>
          ))}
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${(dischargeChecklist.length / DISCHARGE_CHECKLIST_ITEMS.length) * 100}%` }}
          />
        </div>
      </section>

      <button onClick={confirmDischarge} className="w-full rounded-lg bg-[#003366] py-3 text-white font-semibold hover:bg-[#004488] transition-colors">
        Confirm Discharge Plan
      </button>

      <SummaryBox
        title="Discharge & Follow-up Summary"
        color="teal"
        items={summaryItems}
        placeholder="Complete DAPT strategy and discharge checklist to generate a summary."
      />
    </div>
  );
}
