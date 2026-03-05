'use client';

import { useCallback, useMemo, useState } from 'react';
import { Stethoscope, AlertTriangle, Ambulance, Car, ChevronDown, ChevronUp } from 'lucide-react';
import { useACSStore, type ACSType } from '@/store/acsStore';
import { SummaryBox } from '@/components/ui/SummaryBox';
import { CORBadge } from '@/components/ui/CORBadge';
import { LOEBadge } from '@/components/ui/LOEBadge';
import { cn } from '@/lib/utils';

const RADIATION_OPTIONS = ['Left arm', 'Right arm', 'Jaw', 'Back', 'Epigastric', 'Shoulder'];
const ASSOCIATED_SYMPTOMS = ['Diaphoresis', 'Nausea/Vomiting', 'Dyspnea', 'Syncope', 'Palpitations', 'Fatigue'];

export default function EvaluationPage() {
  const { evaluation, updateEvaluation, markPageCompleted } = useACSStore();
  const { ecg, troponin, symptoms, acsType } = evaluation;

  const updateECG = useCallback((updates: Partial<typeof ecg>) => {
    updateEvaluation({ ecg: { ...ecg, ...updates } });
  }, [ecg, updateEvaluation]);

  const updateTroponin = useCallback((updates: Partial<typeof troponin>) => {
    const newTrop = { ...troponin, ...updates };
    // Auto-calculate delta
    if (newTrop.initialValue != null && newTrop.repeatValue != null) {
      newTrop.delta = Math.abs(newTrop.repeatValue - newTrop.initialValue);
    }
    // Auto-determine result with 0/1h algorithm
    if (newTrop.assayType?.startsWith('hs-ctn') && newTrop.initialValue != null) {
      newTrop.result = calculateTroponinResult(newTrop);
    }
    updateEvaluation({ troponin: newTrop });
  }, [troponin, updateEvaluation]);

  const updateSymptoms = useCallback((updates: Partial<typeof symptoms>) => {
    updateEvaluation({ symptoms: { ...symptoms, ...updates } });
  }, [symptoms, updateEvaluation]);

  const toggleRadiation = useCallback((item: string) => {
    const arr = symptoms.radiation.includes(item)
      ? symptoms.radiation.filter((r) => r !== item)
      : [...symptoms.radiation, item];
    updateSymptoms({ radiation: arr });
  }, [symptoms.radiation, updateSymptoms]);

  const toggleAssociated = useCallback((item: string) => {
    const arr = symptoms.associatedSymptoms.includes(item)
      ? symptoms.associatedSymptoms.filter((s) => s !== item)
      : [...symptoms.associatedSymptoms, item];
    updateSymptoms({ associatedSymptoms: arr });
  }, [symptoms.associatedSymptoms, updateSymptoms]);

  // Derive ACS classification
  const derivedACSType = useMemo((): ACSType => {
    const hasSTEMI = ecg.stElevation || ecg.posteriorChanges || ecg.deWinter || ecg.wellens || ecg.newLBBB;
    if (hasSTEMI) return 'stemi';
    if (troponin.result === 'rule-in') {
      return ecg.stDepression ? 'nstemi' : 'nstemi';
    }
    if (troponin.result === 'rule-out') {
      if (symptoms.chestPain && symptoms.chestPainType === 'typical') return 'ua';
      return 'ruled-out';
    }
    return null;
  }, [ecg, troponin.result, symptoms]);

  const setACSType = useCallback((type: ACSType) => {
    updateEvaluation({ acsType: type });
    if (type) markPageCompleted('evaluation');
  }, [updateEvaluation, markPageCompleted]);

  // Summary lines
  const summaryItems = useMemo(() => {
    const lines: string[] = [];
    const ecgFindings: string[] = [];
    if (ecg.stElevation) ecgFindings.push('ST-elevation');
    if (ecg.stDepression) ecgFindings.push('ST-depression');
    if (ecg.posteriorChanges) ecgFindings.push('posterior changes');
    if (ecg.nonDiagnostic) ecgFindings.push('non-diagnostic');
    if (ecg.deWinter) ecgFindings.push('de Winter pattern');
    if (ecg.wellens) ecgFindings.push('Wellens syndrome');
    if (ecg.newLBBB) ecgFindings.push('new LBBB');
    if (ecgFindings.length > 0) {
      lines.push(`ECG findings: ${ecgFindings.join(', ')}.`);
    }
    if (troponin.result) {
      const resultLabel = troponin.result === 'rule-in' ? 'POSITIVE (Rule-in)' :
        troponin.result === 'rule-out' ? 'NEGATIVE (Rule-out)' : 'INDETERMINATE (Observe zone)';
      lines.push(`Troponin result: ${resultLabel}${troponin.delta != null ? ` (delta: ${troponin.delta.toFixed(1)})` : ''}.`);
    }
    if (symptoms.chestPain) {
      lines.push(`Chest pain: ${symptoms.chestPainType || 'type not specified'}, onset: ${symptoms.onset || 'not specified'}.`);
    }
    const type = acsType || derivedACSType;
    if (type) {
      const typeLabels: Record<string, string> = {
        stemi: 'STEMI',
        nstemi: 'NSTEMI',
        ua: 'Unstable Angina',
        'ruled-out': 'ACS Ruled Out',
      };
      lines.push(`ACS Classification: ${typeLabels[type]}. Proceed to Risk Stratification.`);
    }
    return lines;
  }, [ecg, troponin, symptoms, acsType, derivedACSType]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#003366] p-2">
          <Stethoscope className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Initial Evaluation</h1>
          <p className="text-sm text-gray-500">ECG, troponin, and ACS classification</p>
        </div>
      </div>

      {/* Prehospital / Arrival Pathway */}
      <PrehospitalPathway />

      {/* ECG Classification */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ECG Classification</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            ['stElevation', 'ST-Elevation'],
            ['stDepression', 'ST-Depression / T-wave inversion'],
            ['nonDiagnostic', 'Non-diagnostic / Normal'],
            ['posteriorChanges', 'Posterior MI changes'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ecg[key]}
                onChange={(e) => updateECG({ [key]: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>

        <h3 className="text-sm font-semibold text-gray-700 mt-4 mb-2 flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          STEMI Equivalents
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            ['deWinter', 'de Winter pattern'],
            ['wellens', 'Wellens syndrome'],
            ['newLBBB', 'New LBBB'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ecg[key]}
                onChange={(e) => updateECG({ [key]: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Troponin Pathway */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Troponin Pathway</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assay Type</label>
            <select
              value={troponin.assayType || ''}
              onChange={(e) => updateTroponin({ assayType: (e.target.value || null) as typeof troponin.assayType })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select assay...</option>
              <option value="hs-ctn-0-1h">hs-cTn (0/1h algorithm)</option>
              <option value="hs-ctn-0-2h">hs-cTn (0/2h algorithm)</option>
              <option value="conventional">Conventional cTn (0/3-6h)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sex (for hs-cTn thresholds)</label>
            <select
              value={troponin.sex || ''}
              onChange={(e) => updateTroponin({ sex: (e.target.value || null) as typeof troponin.sex })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Value (ng/L)</label>
            <input
              type="number"
              value={troponin.initialValue ?? ''}
              onChange={(e) => updateTroponin({ initialValue: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="0h value"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repeat Value (ng/L)</label>
            <input
              type="number"
              value={troponin.repeatValue ?? ''}
              onChange={(e) => updateTroponin({ repeatValue: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="1h/2h/3-6h value"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Between (hours)</label>
            <input
              type="number"
              value={troponin.timeBetweenHours ?? ''}
              onChange={(e) => updateTroponin({ timeBetweenHours: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="hours"
            />
          </div>
        </div>

        {troponin.assayType?.startsWith('hs-ctn') && (
          <div className="rounded-md bg-blue-50 border border-blue-200 p-3 mb-4">
            <p className="text-xs font-medium text-blue-800 mb-1">Sex-Specific hs-cTn Thresholds (99th percentile URL):</p>
            <p className="text-xs text-blue-700">
              Male: 34 ng/L | Female: 16 ng/L (Abbott Architect hs-cTnI); Male: 22 ng/L | Female: 14 ng/L (Roche hs-cTnT)
            </p>
          </div>
        )}

        {/* Troponin Delta & Result */}
        {troponin.delta != null && (
          <div className="flex items-center gap-4 mb-2">
            <span className="text-sm text-gray-600">Delta: <strong>{troponin.delta.toFixed(1)} ng/L</strong></span>
          </div>
        )}
        {troponin.result && (
          <div className={cn(
            'rounded-md px-4 py-3 text-sm font-medium',
            troponin.result === 'rule-out' && 'bg-green-50 text-green-800 border border-green-200',
            troponin.result === 'rule-in' && 'bg-red-50 text-red-800 border border-red-200',
            troponin.result === 'observe' && 'bg-amber-50 text-amber-800 border border-amber-200',
          )}>
            {troponin.result === 'rule-out' && 'RULE-OUT: Troponin below threshold with no significant delta. MI unlikely (NPV >99.5%).'}
            {troponin.result === 'rule-in' && 'RULE-IN: Troponin elevated or significant delta. Acute MI likely. Proceed with invasive strategy.'}
            {troponin.result === 'observe' && 'OBSERVE ZONE: Indeterminate result. Recommend repeat troponin at 3 hours.'}
          </div>
        )}
      </section>

      {/* Symptom Assessment */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Symptom Assessment</h2>

        <label className="flex items-center gap-2 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={symptoms.chestPain}
            onChange={(e) => updateSymptoms({ chestPain: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Chest pain / discomfort present</span>
        </label>

        {symptoms.chestPain && (
          <div className="space-y-4 ml-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chest Pain Type</label>
              <div className="flex flex-wrap gap-2">
                {(['typical', 'atypical', 'non-cardiac'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => updateSymptoms({ chestPainType: type })}
                    className={cn(
                      'rounded-full px-3 py-1 text-sm border transition-colors',
                      symptoms.chestPainType === type
                        ? 'bg-blue-100 border-blue-400 text-blue-800'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Onset</label>
              <div className="flex flex-wrap gap-2">
                {(['acute', 'subacute', 'chronic'] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() => updateSymptoms({ onset: o })}
                    className={cn(
                      'rounded-full px-3 py-1 text-sm border transition-colors',
                      symptoms.onset === o
                        ? 'bg-blue-100 border-blue-400 text-blue-800'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {o.charAt(0).toUpperCase() + o.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Radiation</label>
              <div className="flex flex-wrap gap-2">
                {RADIATION_OPTIONS.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleRadiation(item)}
                    className={cn(
                      'rounded-full px-3 py-1 text-sm border transition-colors',
                      symptoms.radiation.includes(item)
                        ? 'bg-blue-100 border-blue-400 text-blue-800'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Associated Symptoms</label>
              <div className="flex flex-wrap gap-2">
                {ASSOCIATED_SYMPTOMS.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleAssociated(item)}
                    className={cn(
                      'rounded-full px-3 py-1 text-sm border transition-colors',
                      symptoms.associatedSymptoms.includes(item)
                        ? 'bg-blue-100 border-blue-400 text-blue-800'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ACS Classification Output */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ACS Classification</h2>
        {derivedACSType && !acsType && (
          <div className="rounded-md bg-blue-50 border border-blue-200 p-3 mb-4">
            <p className="text-sm text-blue-800">
              Based on your inputs, the suggested classification is{' '}
              <strong>
                {derivedACSType === 'stemi' ? 'STEMI' :
                 derivedACSType === 'nstemi' ? 'NSTEMI' :
                 derivedACSType === 'ua' ? 'Unstable Angina' : 'ACS Ruled Out'}
              </strong>
              . Confirm or override below.
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            ['stemi', 'STEMI', 'bg-red-500'],
            ['nstemi', 'NSTEMI', 'bg-orange-500'],
            ['ua', 'Unstable Angina', 'bg-amber-500'],
            ['ruled-out', 'ACS Ruled Out', 'bg-green-500'],
          ] as const).map(([type, label, color]) => (
            <button
              key={type}
              onClick={() => setACSType(type)}
              className={cn(
                'rounded-lg py-3 px-4 text-sm font-semibold transition-all border-2',
                (acsType || derivedACSType) === type
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
        title="Evaluation Summary"
        color="blue"
        items={summaryItems}
        placeholder="Complete ECG, troponin, and symptom assessment to generate a summary."
      />
    </div>
  );
}

function PrehospitalPathway() {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<'ems' | 'self' | null>(null);

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Prehospital & Arrival Pathway</h2>
          <p className="text-xs text-gray-500">EMS activation (911) vs self-transport decision tree</p>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-gray-600">How did the patient arrive?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setMode('ems')}
              className={cn(
                'rounded-lg border-2 p-4 text-left transition-all',
                mode === 'ems' ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:border-gray-400'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Ambulance className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">EMS / 911 Activation</span>
              </div>
              <p className="text-xs text-gray-600">Ambulance transport with prehospital care</p>
            </button>
            <button
              onClick={() => setMode('self')}
              className={cn(
                'rounded-lg border-2 p-4 text-left transition-all',
                mode === 'self' ? 'bg-amber-50 border-amber-400' : 'bg-white border-gray-200 hover:border-gray-400'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Car className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-semibold text-gray-900">Self-Transport / Walk-in</span>
              </div>
              <p className="text-xs text-gray-600">Patient drove, taxi, or walked in to ED</p>
            </button>
          </div>

          {/* EMS Pathway */}
          {mode === 'ems' && (
            <div className="space-y-3 border-l-4 border-blue-400 pl-4">
              <h3 className="text-sm font-bold text-blue-900">EMS / 911 Pathway (Recommended)</h3>
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-blue-900">1. Prehospital 12-lead ECG</span>
                  <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="B-NR" /></div>
                </div>
                <p className="text-xs text-blue-700">Acquire and transmit to receiving hospital. Reduces door-to-device time by 10-20 min.</p>
              </div>
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-blue-900">2. STEMI identified? Activate cath lab en route</span>
                  <div className="flex gap-1"><CORBadge level="1" /><LOEBadge level="B-NR" /></div>
                </div>
                <p className="text-xs text-blue-700">Prehospital cath lab activation for STEMI. EMS should bypass non-PCI hospitals when transfer time &le;120 min.</p>
              </div>
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                <span className="text-sm font-semibold text-blue-900">3. Prehospital treatment</span>
                <ul className="text-xs text-blue-700 mt-1 space-y-1 list-disc ml-4">
                  <li>Aspirin 162-325 mg (chewed) — <span className="font-medium">Class I</span></li>
                  <li>Nitroglycerin SL 0.4 mg q5min x3 (if SBP &ge;90, no RV infarct, no PDE5i)</li>
                  <li>Obtain IV access, continuous monitoring</li>
                  <li>Morphine only for refractory pain (Class 2b)</li>
                  <li>Do NOT delay transport for additional interventions</li>
                </ul>
              </div>
              <div className="rounded-md bg-green-50 border border-green-200 p-3">
                <span className="text-sm font-semibold text-green-900">4. Hospital destination</span>
                <ul className="text-xs text-green-700 mt-1 space-y-1 list-disc ml-4">
                  <li><strong>STEMI:</strong> Transport directly to PCI-capable center (Class I)</li>
                  <li><strong>STEMI + no PCI available &le;120 min:</strong> Nearest ED for fibrinolysis, then transfer</li>
                  <li><strong>Non-STEMI suspected ACS:</strong> Nearest appropriate ED</li>
                  <li><strong>Cardiac arrest / shock:</strong> Closest PCI-capable center with MCS capability</li>
                </ul>
              </div>
            </div>
          )}

          {/* Self-Transport Pathway */}
          {mode === 'self' && (
            <div className="space-y-3 border-l-4 border-amber-400 pl-4">
              <h3 className="text-sm font-bold text-amber-900">Self-Transport / Walk-in Pathway</h3>
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                <span className="text-sm font-semibold text-amber-900">1. Immediate triage (target &lt;10 min)</span>
                <ul className="text-xs text-amber-700 mt-1 space-y-1 list-disc ml-4">
                  <li>12-lead ECG within 10 minutes of ED arrival (Class I)</li>
                  <li>Vital signs, IV access, cardiac monitoring</li>
                  <li>Point-of-care troponin if available</li>
                </ul>
              </div>
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                <span className="text-sm font-semibold text-amber-900">2. If STEMI on ECG</span>
                <ul className="text-xs text-amber-700 mt-1 space-y-1 list-disc ml-4">
                  <li><strong>PCI-capable:</strong> Activate cath lab immediately. Goal: door-to-device &le;90 min</li>
                  <li><strong>Non-PCI-capable:</strong> Fibrinolysis within 30 min OR transfer for PCI if &le;120 min total</li>
                  <li>Aspirin 162-325 mg + P2Y12 loading (per reperfusion strategy)</li>
                </ul>
              </div>
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                <span className="text-sm font-semibold text-amber-900">3. If non-STEMI / undifferentiated chest pain</span>
                <ul className="text-xs text-amber-700 mt-1 space-y-1 list-disc ml-4">
                  <li>Serial troponins (0/1h or 0/2h hs-cTn algorithm)</li>
                  <li>Aspirin 162-325 mg while awaiting results</li>
                  <li>NTG for ongoing pain, morphine only if refractory</li>
                  <li>Risk stratify with HEART/TIMI/GRACE when results available</li>
                </ul>
              </div>
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-sm font-semibold text-red-900">Patient education</span>
                </div>
                <p className="text-xs text-red-700">
                  Advise patients to call 911 rather than self-transport for suspected ACS (Class I). EMS provides monitoring, early ECG, prehospital treatment, and direct cath lab transport. Self-transport delays care and risks unmonitored cardiac arrest.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function calculateTroponinResult(trop: {
  assayType: string | null;
  initialValue: number | null;
  repeatValue: number | null;
  sex: string | null;
  delta: number | null;
}): 'rule-out' | 'observe' | 'rule-in' | null {
  if (trop.initialValue == null) return null;

  // hs-cTn 0/1h algorithm thresholds (using hs-cTnI Abbott as reference)
  const ruleOutThreshold = trop.sex === 'female' ? 2 : 5;
  const ruleInThreshold = trop.sex === 'female' ? 16 : 34;
  const significantDelta = trop.assayType === 'hs-ctn-0-1h' ? 6 : 10;

  // Rule-out: very low initial AND no significant delta
  if (trop.initialValue < ruleOutThreshold) {
    if (trop.delta == null || trop.delta < 3) return 'rule-out';
    if (trop.delta >= significantDelta) return 'rule-in';
    return 'observe';
  }

  // Rule-in: high initial OR significant delta
  if (trop.initialValue >= ruleInThreshold) return 'rule-in';
  if (trop.delta != null && trop.delta >= significantDelta) return 'rule-in';

  // Observe zone
  if (trop.repeatValue != null) {
    if (trop.repeatValue >= ruleInThreshold) return 'rule-in';
  }

  return 'observe';
}
