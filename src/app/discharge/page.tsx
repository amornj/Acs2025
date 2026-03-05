'use client';

import { useCallback, useMemo } from 'react';
import { ClipboardCheck, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useACSStore, type ArcHbrMajor, type ArcHbrMinor } from '@/store/acsStore';
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
  const { daptPlan, lipidFollowupWeeks, rehabReferral, rehabType, icdIndicated, influenzaVaccine, dischargeChecklist, arcHbrMajor, arcHbrMinor } = discharge;
  const lvef = medications.otherMeds.lvef;

  const updateArcMajor = useCallback((u: Partial<ArcHbrMajor>) => {
    updateDischarge({ arcHbrMajor: { ...arcHbrMajor, ...u } });
  }, [arcHbrMajor, updateDischarge]);

  const updateArcMinor = useCallback((u: Partial<ArcHbrMinor>) => {
    updateDischarge({ arcHbrMinor: { ...arcHbrMinor, ...u } });
  }, [arcHbrMinor, updateDischarge]);

  const majorCount = useMemo(() => Object.values(arcHbrMajor).filter(Boolean).length, [arcHbrMajor]);
  const minorCount = useMemo(() => Object.values(arcHbrMinor).filter(Boolean).length, [arcHbrMinor]);
  const isArcHbr = majorCount >= 1 || minorCount >= 2;

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
    if (daptPlan.onOAC) return 'OAC patients: Triple therapy 1-4 weeks -> drop aspirin -> OAC + clopidogrel (Class I, LOE A)';
    if (daptPlan.highBleedingRisk || isArcHbr) return 'High bleeding risk (ARC-HBR+): Abbreviated DAPT 1-3 months -> P2Y12 monotherapy (Class 2b, LOE B-R)';
    return 'Standard: DAPT for 12 months (Class I, LOE A). Consider ticagrelor monotherapy after >=1 month (Class I, LOE A).';
  }, [daptPlan.onOAC, daptPlan.highBleedingRisk, isArcHbr]);

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

      {/* ARC-HBR Criteria */}
      <section className={cn(
        'rounded-lg border p-5 shadow-sm',
        isArcHbr ? 'border-red-300 bg-red-50' : 'bg-white'
      )}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">ARC-HBR Bleeding Risk Assessment</h2>
            <p className="text-xs text-gray-500">Academic Research Consortium - High Bleeding Risk criteria</p>
          </div>
          <div className={cn(
            'rounded-full px-3 py-1 text-sm font-bold',
            isArcHbr ? 'bg-red-600 text-white' : 'bg-green-100 text-green-800'
          )}>
            {isArcHbr ? (
              <span className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> HBR</span>
            ) : (
              <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Not HBR</span>
            )}
          </div>
        </div>

        <div className="rounded-md bg-gray-50 border p-3 mb-4">
          <p className="text-xs text-gray-600">
            <strong>Definition:</strong> ARC-HBR positive = <strong>&ge;1 major</strong> criterion OR <strong>&ge;2 minor</strong> criteria.
            {majorCount > 0 && <span className="text-red-700 font-medium"> Major: {majorCount}.</span>}
            {minorCount > 0 && <span className="text-amber-700 font-medium"> Minor: {minorCount}.</span>}
          </p>
        </div>

        {/* Major Criteria */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-1">
            Major Criteria <span className="text-xs font-normal text-red-600">(any single = HBR)</span>
          </h3>
          <div className="space-y-1.5">
            {([
              ['oac', 'Anticipated use of long-term OAC (warfarin or DOAC)'],
              ['severeCkd', 'Severe or end-stage CKD (eGFR <30 mL/min)'],
              ['hbBelow11', 'Hemoglobin <11 g/dL'],
              ['bleedingHosp6mo', 'Spontaneous bleeding requiring hospitalization or transfusion in past 6 months'],
              ['thrombocytopenia', 'Thrombocytopenia (platelet count <100,000/uL)'],
              ['bleedingDiathesis', 'Chronic bleeding diathesis'],
              ['cirrhosis', 'Liver cirrhosis with portal hypertension'],
              ['activeMalignancy', 'Active malignancy (excluding non-melanoma skin cancer) within 12 months'],
              ['priorSpontaneousIch', 'Prior spontaneous intracranial hemorrhage (any time)'],
              ['priorTraumaticIch12mo', 'Prior traumatic ICH within past 12 months'],
              ['brainAvm', 'Brain arteriovenous malformation (AVM)'],
              ['ischemicStroke6mo', 'Moderate or severe ischemic stroke within past 6 months'],
              ['nonDeferrableSurgery', 'Non-deferrable major surgery on DAPT'],
              ['recentMajorSurgery30d', 'Recent major surgery or major trauma within 30 days'],
            ] as [keyof ArcHbrMajor, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-red-50 cursor-pointer">
                <input type="checkbox" checked={arcHbrMajor[key]} onChange={(e) => updateArcMajor({ [key]: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                <span className={cn('text-sm', arcHbrMajor[key] ? 'text-red-800 font-medium' : 'text-gray-700')}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Minor Criteria */}
        <div>
          <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1">
            Minor Criteria <span className="text-xs font-normal text-amber-600">(&ge;2 = HBR)</span>
          </h3>
          <div className="space-y-1.5">
            {([
              ['age75', 'Age &ge;75 years'],
              ['moderateCkd', 'Moderate CKD (eGFR 30-59 mL/min)'],
              ['hb11to13', 'Hemoglobin 11-12.9 g/dL (men) or 11-11.9 g/dL (women)'],
              ['bleedingHosp12mo', 'Spontaneous bleeding requiring hospitalization or transfusion in past 12 months'],
              ['chronicNsaidSteroid', 'Chronic use of NSAIDs or corticosteroids'],
              ['anyIschemicStroke', 'Any ischemic stroke at any time'],
            ] as [keyof ArcHbrMinor, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-amber-50 cursor-pointer">
                <input type="checkbox" checked={arcHbrMinor[key]} onChange={(e) => updateArcMinor({ [key]: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                <span className={cn('text-sm', arcHbrMinor[key] ? 'text-amber-800 font-medium' : 'text-gray-700')} dangerouslySetInnerHTML={{ __html: label }} />
              </label>
            ))}
          </div>
        </div>

        {/* HBR Result + Recommendation */}
        {isArcHbr && (
          <div className="mt-4 rounded-md bg-red-100 border border-red-300 p-3">
            <p className="text-sm font-bold text-red-900 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> ARC-HBR Positive -- High Bleeding Risk
            </p>
            <p className="text-xs text-red-800 mt-1">
              Consider abbreviated DAPT (1-3 months) followed by P2Y12 monotherapy (Class 2b, LOE B-R).
              Avoid prasugrel in patients with prior stroke/TIA.
              Use PPI with DAPT. Carefully weigh ischemic vs bleeding risk.
            </p>
          </div>
        )}
      </section>

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
