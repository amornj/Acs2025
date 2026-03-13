'use client';

import { useState, useCallback } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { CORBadge } from '@/components/ui/CORBadge';
import { LOEBadge } from '@/components/ui/LOEBadge';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  4Ts Score for HIT                                                  */
/* ------------------------------------------------------------------ */

const FOUR_TS_CATEGORIES = [
  {
    name: 'Thrombocytopenia',
    options: [
      { label: '>50% fall or nadir 20-100 × 10⁹/L', score: 2 },
      { label: '30-50% fall or nadir 10-19 × 10⁹/L', score: 1 },
      { label: '<30% fall or nadir <10 × 10⁹/L', score: 0 },
    ],
  },
  {
    name: 'Timing of platelet fall',
    options: [
      { label: 'Day 5-10 or ≤1 day if heparin within past 30 days', score: 2 },
      { label: 'Day >10 or timing unclear; or ≤1 day if heparin 30-100 days ago', score: 1 },
      { label: 'Platelet fall ≤4 days without recent heparin', score: 0 },
    ],
  },
  {
    name: 'Thrombosis or other sequelae',
    options: [
      { label: 'Confirmed new thrombosis, skin necrosis, or acute systemic reaction', score: 2 },
      { label: 'Progressive or recurrent thrombosis, erythematous skin lesions, or suspected thrombosis', score: 1 },
      { label: 'None', score: 0 },
    ],
  },
  {
    name: 'Other causes of thrombocytopenia',
    options: [
      { label: 'No other apparent cause', score: 2 },
      { label: 'Possible other cause', score: 1 },
      { label: 'Definite other cause present', score: 0 },
    ],
  },
];

function get4TsRisk(score: number) {
  if (score <= 3) return { level: 'Low', color: 'text-green-700 bg-green-50 border-green-200', ppa: '≤5%', action: 'HIT unlikely — may continue heparin. Consider other causes.' };
  if (score <= 5) return { level: 'Intermediate', color: 'text-yellow-700 bg-yellow-50 border-yellow-200', ppa: '~14%', action: 'Send HIT antibody assay (immunoassay ± SRA). Stop heparin and start non-heparin anticoagulant while awaiting results.' };
  return { level: 'High', color: 'text-red-700 bg-red-50 border-red-200', ppa: '~64%', action: 'HIT highly likely. Stop ALL heparin immediately. Start bivalirudin or argatroban. Send confirmatory testing.' };
}

/* ------------------------------------------------------------------ */
/*  Alternative anticoagulants for HIT                                 */
/* ------------------------------------------------------------------ */

const HIT_ANTICOAGULANTS = [
  {
    agent: 'Bivalirudin',
    class: 'Direct thrombin inhibitor',
    route: 'IV',
    dosing: '0.75 mg/kg bolus → 1.75 mg/kg/h infusion (PCI); 0.15-0.2 mg/kg/h for non-PCI',
    monitoring: 'ACT during PCI; aPTT 1.5-2.5× baseline for non-PCI dosing',
    renalAdj: 'Reduce infusion rate if CrCl <30 mL/min; avoid in dialysis or use reduced dose',
    advantages: 'Preferred for PCI in HIT. Short half-life (~25 min). Predictable pharmacokinetics.',
    trial: 'HORIZONS-AMI, HEAT-PPCI',
  },
  {
    agent: 'Argatroban',
    class: 'Direct thrombin inhibitor',
    route: 'IV',
    dosing: '2 mcg/kg/min (reduce to 0.5-1 mcg/kg/min if hepatic impairment)',
    monitoring: 'aPTT q2h, target 1.5-3× baseline (max 100 sec)',
    renalAdj: 'No renal adjustment needed',
    advantages: 'Preferred with hepatic dysfunction is absent. Hepatically cleared — good for renal failure.',
    trial: 'ARG-911, ARG-915',
  },
  {
    agent: 'Fondaparinux',
    class: 'Factor Xa inhibitor',
    route: 'SC',
    dosing: '2.5 mg SC daily (NSTE-ACS); 5-10 mg daily (DVT/PE treatment doses)',
    monitoring: 'No routine monitoring; anti-Xa levels if needed',
    renalAdj: 'Contraindicated if CrCl <30 mL/min',
    advantages: 'Does not cross-react with HIT antibodies. Can be used for non-PCI ACS management.',
    trial: 'OASIS-5 (NSTE-ACS)',
  },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function SpecialScenariosPage() {
  const [scores, setScores] = useState<(number | null)[]>([null, null, null, null]);
  const [showCalculator, setShowCalculator] = useState(true);
  const [showAlternatives, setShowAlternatives] = useState(true);
  const [showPCI, setShowPCI] = useState(true);

  const updateScore = useCallback((catIndex: number, value: number) => {
    setScores(prev => {
      const next = [...prev];
      next[catIndex] = value;
      return next;
    });
  }, []);

  const totalScore = scores.every(s => s !== null) ? scores.reduce((a, b) => a! + b!, 0)! : null;
  const risk = totalScore !== null ? get4TsRisk(totalScore) : null;
  const answeredCount = scores.filter(s => s !== null).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <ShieldAlert className="h-7 w-7 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Special Scenarios</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Complex clinical situations requiring modified management in ACS
        </p>
      </div>

      {/* HIT Section */}
      <div className="space-y-6">
        <div className="border-l-4 border-red-500 pl-4">
          <h2 className="text-xl font-bold text-gray-900">
            Heparin-Induced Thrombocytopenia (HIT)
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Immune-mediated prothrombotic disorder triggered by heparin exposure
          </p>
        </div>

        {/* What is HIT */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">What Is HIT & Why It Matters in ACS</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              HIT is an antibody-mediated reaction where IgG antibodies bind to <strong>platelet factor 4 (PF4)–heparin complexes</strong>,
              activating platelets and the coagulation cascade. Despite causing thrombocyto<em>penia</em>, HIT is paradoxically a
              <strong> prothrombotic</strong> state — the major risk is thrombosis, not bleeding.
            </p>
            <p>
              In ACS/PCI patients, HIT creates a critical management dilemma: these patients need anticoagulation for their acute coronary
              syndrome, but continuing heparin (UFH or LMWH) can trigger catastrophic thrombosis including stent thrombosis, limb ischemia,
              PE, stroke, and death.
            </p>
            <div className="flex items-start gap-2 bg-red-50 rounded-lg p-3 border border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-red-800 text-sm">
                <strong>Mortality risk:</strong> Untreated HIT carries 20-30% risk of thrombosis and 5-10% mortality.
                Early recognition and heparin cessation with alternative anticoagulation is life-saving.
              </p>
            </div>
          </div>
        </div>

        {/* When to suspect HIT */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">When to Suspect HIT</h3>
          <ul className="text-sm text-gray-700 space-y-1.5 list-disc list-inside">
            <li><strong>Platelet drop ≥50%</strong> from baseline (even if nadir is &quot;normal&quot; — e.g., 300K → 140K)</li>
            <li><strong>Timing:</strong> Typically day 5-10 after heparin initiation; can be within 24h if prior heparin exposure in last 30 days</li>
            <li><strong>New thrombosis</strong> while on heparin (arterial or venous)</li>
            <li><strong>Skin necrosis</strong> at heparin injection sites</li>
            <li><strong>Acute systemic reaction</strong> after IV heparin bolus (fever, rigors, hypotension, dyspnea)</li>
            <li><strong>Heparin resistance:</strong> Failure to achieve therapeutic aPTT despite escalating UFH doses</li>
          </ul>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <p className="text-sm text-blue-800">
              <strong>Key pearl:</strong> In post-cardiac surgery patients, the platelet count typically nadirs at day 1-3 and
              recovers by day 5. If platelet count falls again (or fails to recover) after day 4, suspect HIT.
            </p>
          </div>
        </div>

        {/* 4Ts Score Calculator */}
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="flex items-center justify-between w-full p-5 text-left"
          >
            <div>
              <h3 className="font-semibold text-gray-900">4Ts Score Calculator</h3>
              <p className="text-sm text-gray-500 mt-0.5">Pre-test probability for HIT — guides further workup</p>
            </div>
            <div className="flex items-center gap-2">
              {totalScore !== null && (
                <span className={cn('text-sm font-bold px-2.5 py-1 rounded-full border', risk!.color)}>
                  {totalScore}/8 — {risk!.level}
                </span>
              )}
              {showCalculator ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </div>
          </button>

          {showCalculator && (
            <div className="border-t border-gray-100 p-5 space-y-5">
              {FOUR_TS_CATEGORIES.map((cat, ci) => (
                <div key={cat.name} className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-800">
                    {ci + 1}. {cat.name}
                  </h4>
                  <div className="space-y-1.5">
                    {cat.options.map((opt) => (
                      <label
                        key={opt.label}
                        className={cn(
                          'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors text-sm',
                          scores[ci] === opt.score
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        )}
                      >
                        <input
                          type="radio"
                          name={`4ts-${ci}`}
                          checked={scores[ci] === opt.score}
                          onChange={() => updateScore(ci, opt.score)}
                          className="mt-0.5"
                        />
                        <span className="flex-1">{opt.label}</span>
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                          {opt.score} pt{opt.score !== 1 ? 's' : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Progress */}
              {answeredCount < 4 && (
                <p className="text-xs text-gray-500">{answeredCount}/4 categories answered</p>
              )}

              {/* Result */}
              {risk && (
                <div className={cn('rounded-lg border p-4 space-y-2', risk.color)}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{totalScore}/8</span>
                    <span className="font-semibold">— {risk.level} probability</span>
                    <span className="text-sm">(PPA {risk.ppa})</span>
                  </div>
                  <p className="text-sm">{risk.action}</p>
                </div>
              )}

              <button
                onClick={() => setScores([null, null, null, null])}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Reset 4Ts calculator
              </button>
            </div>
          )}
        </div>

        {/* Immediate Management */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Immediate Management Steps</h3>
          <ol className="text-sm text-gray-700 space-y-3 list-decimal list-inside">
            <li>
              <strong>Stop ALL heparin immediately</strong> — UFH infusions, LMWH (enoxaparin), heparin flushes, heparin-coated catheters
            </li>
            <li>
              <strong>Start a non-heparin anticoagulant</strong> at therapeutic doses (not prophylactic) —
              even without overt thrombosis, due to high thrombotic risk
              <div className="mt-1 ml-5">
                <CORBadge level="1" /> <LOEBadge level="C-LD" />
              </div>
            </li>
            <li>
              <strong>Send confirmatory testing:</strong>
              <ul className="list-disc list-inside ml-5 mt-1 space-y-1">
                <li>HIT immunoassay (PF4/heparin ELISA) — high sensitivity, moderate specificity</li>
                <li>If immunoassay positive → serotonin release assay (SRA) — gold standard confirmation</li>
              </ul>
            </li>
            <li>
              <strong>Do NOT transfuse platelets</strong> unless life-threatening hemorrhage — platelet transfusion
              may worsen thrombosis (&quot;fuel to the fire&quot;)
            </li>
            <li>
              <strong>Do NOT start warfarin</strong> until platelet count recovers to ≥150 × 10⁹/L — risk of
              warfarin-induced venous limb gangrene and skin necrosis in acute HIT
            </li>
            <li>
              <strong>Image for thrombosis</strong> — bilateral lower-extremity duplex ultrasound even if asymptomatic
              (~50% of HIT patients have subclinical DVT)
            </li>
          </ol>
        </div>

        {/* Alternative Anticoagulants */}
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="flex items-center justify-between w-full p-5 text-left"
          >
            <div>
              <h3 className="font-semibold text-gray-900">Anticoagulation Alternatives in HIT</h3>
              <p className="text-sm text-gray-500 mt-0.5">Non-heparin anticoagulants for ACS/PCI</p>
            </div>
            {showAlternatives ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>

          {showAlternatives && (
            <div className="border-t border-gray-100 p-5 space-y-4">
              {HIT_ANTICOAGULANTS.map((drug) => (
                <div key={drug.agent} className={cn(
                  'rounded-lg border p-4 space-y-2',
                  drug.agent === 'Bivalirudin' ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'
                )}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-gray-900">{drug.agent}</h4>
                    <span className="text-xs bg-gray-200 text-gray-700 rounded px-2 py-0.5">{drug.class}</span>
                    <span className="text-xs bg-gray-200 text-gray-700 rounded px-2 py-0.5">{drug.route}</span>
                    {drug.agent === 'Bivalirudin' && (
                      <span className="text-xs bg-blue-600 text-white rounded px-2 py-0.5 font-semibold">Preferred for PCI</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><strong>Dosing:</strong> {drug.dosing}</div>
                    <div><strong>Monitoring:</strong> {drug.monitoring}</div>
                    <div><strong>Renal adjustment:</strong> {drug.renalAdj}</div>
                    <div><strong>Key advantage:</strong> {drug.advantages}</div>
                  </div>
                  <p className="text-xs text-gray-500">Key trials: {drug.trial}</p>
                </div>
              ))}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>LMWH is NOT a safe alternative</strong> — enoxaparin and other LMWHs have &gt;90% cross-reactivity
                  with HIT antibodies and must be avoided.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* PCI-specific considerations */}
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <button
            onClick={() => setShowPCI(!showPCI)}
            className="flex items-center justify-between w-full p-5 text-left"
          >
            <div>
              <h3 className="font-semibold text-gray-900">PCI & ACS-Specific Considerations</h3>
              <p className="text-sm text-gray-500 mt-0.5">Managing HIT during coronary intervention</p>
            </div>
            {showPCI ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>

          {showPCI && (
            <div className="border-t border-gray-100 p-5 space-y-4">
              {/* Acute HIT + PCI needed */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 text-sm">Acute/Subacute HIT — PCI Required</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <strong>Bivalirudin is the preferred anticoagulant for PCI in HIT</strong>
                      <div className="mt-1"><CORBadge level="2a" /> <LOEBadge level="B-NR" /></div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <span>Bolus 0.75 mg/kg IV, then 1.75 mg/kg/h infusion throughout PCI</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <span>Monitor ACT every 5 min after bolus; target ACT 300-350 seconds</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <span>Can reduce to 0.25 mg/kg/h post-PCI or discontinue if uncomplicated</span>
                  </div>
                </div>
              </div>

              {/* Remote HIT history */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 text-sm">Remote HIT History (antibodies negative) — PCI Required</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>
                    If HIT antibodies are negative (by immunoassay), <strong>brief intraoperative heparin</strong> may
                    be acceptable for PCI with bivalirudin as the preferred alternative.
                  </p>
                  <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-amber-800 text-sm">
                      Re-check HIT antibodies before any heparin re-exposure. If positive, heparin must be avoided entirely.
                      When in doubt, use bivalirudin.
                    </p>
                  </div>
                </div>
              </div>

              {/* CABG in HIT */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 text-sm">CABG in HIT Patients</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>
                    CABG with cardiopulmonary bypass (CPB) in acute HIT is high-risk. Options:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Delay surgery</strong> until HIT antibodies are negative (if clinically feasible)</li>
                    <li><strong>Bivalirudin</strong> during CPB (0.5 mg/kg bolus + 50 mg added to circuit, infusion 1.75 mg/kg/h)</li>
                    <li><strong>Brief heparin + tirofiban</strong> anticoagulation during CPB (if antibodies cleared)</li>
                  </ul>
                </div>
              </div>

              {/* Stent thrombosis risk */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800 text-sm">Stent Thrombosis Prevention</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>
                    HIT patients undergoing PCI are at increased risk of stent thrombosis. Ensure:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Adequate anticoagulation throughout the procedure (ACT-guided bivalirudin)</li>
                    <li>Dual antiplatelet therapy (aspirin + P2Y12 inhibitor) as per standard ACS guidelines</li>
                    <li>Avoid GPI (eptifibatide, tirofiban) in combination with bivalirudin unless bailout</li>
                    <li>Consider prolonged bivalirudin infusion post-PCI if high thrombus burden</li>
                  </ul>
                </div>
              </div>

              {/* Transition to oral anticoag */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-green-900 text-sm">Transition to Oral Anticoagulation (if indicated)</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <p>Once platelets recover ≥150 × 10⁹/L:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>DOACs</strong> (rivaroxaban, apixaban) can be used for post-HIT anticoagulation</li>
                    <li><strong>Warfarin</strong> — start only after platelet recovery; overlap with parenteral anticoagulant for ≥5 days and INR ≥2 for 24h</li>
                    <li>Continue anticoagulation for at least 4 weeks (isolated HIT) or 3 months (HIT with thrombosis)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Reference Card */}
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-5 space-y-3">
          <h3 className="font-bold text-red-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            HIT Quick Reference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="font-semibold text-red-900">STOP immediately:</p>
              <ul className="text-red-800 space-y-0.5 list-disc list-inside">
                <li>UFH infusions and boluses</li>
                <li>LMWH (enoxaparin, dalteparin)</li>
                <li>Heparin flushes and locks</li>
                <li>Heparin-coated catheters</li>
              </ul>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-red-900">DO NOT:</p>
              <ul className="text-red-800 space-y-0.5 list-disc list-inside">
                <li>Transfuse platelets (worsens thrombosis)</li>
                <li>Start warfarin before platelet recovery</li>
                <li>Use LMWH as substitute (&gt;90% cross-reactivity)</li>
                <li>Wait for confirmatory tests to act</li>
              </ul>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-green-800">START:</p>
              <ul className="text-green-700 space-y-0.5 list-disc list-inside">
                <li>Bivalirudin (preferred for PCI)</li>
                <li>Argatroban (alternative; hepatic clearance)</li>
                <li>Fondaparinux (non-PCI ACS, CrCl &gt;30)</li>
              </ul>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-blue-800">SEND:</p>
              <ul className="text-blue-700 space-y-0.5 list-disc list-inside">
                <li>PF4/heparin immunoassay (ELISA)</li>
                <li>SRA if immunoassay positive</li>
                <li>Bilateral LE duplex US</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
