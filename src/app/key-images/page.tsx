'use client';

import { useState } from 'react';
import { ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

const KEY_IMAGES = [
  {
    src: '/images/key-image-1.png',
    title: 'Figure 3: Initial Assessment Algorithm for Suspected ACS',
    description: 'Flowchart: History/PE → ECG within 10 min → cTn → STEMI (reperfusion) vs NSTE-ACS (serial ECG/cTn, CDP risk stratification into low/intermediate/high)',
  },
  {
    src: '/images/key-image-2.png',
    title: 'Figure 4: Initial P2Y12 Inhibitor Selection by Treatment Strategy',
    description: 'Aspirin + P2Y12 selection: PCI (ticagrelor/prasugrel), CABG (ticagrelor/clopidogrel), no invasive (ticagrelor), fibrinolysis (clopidogrel only)',
  },
  {
    src: '/images/key-image-3.png',
    title: 'Figure 5: Lipid-Lowering Therapy Management in ACS',
    description: 'Three pathways: not on statin → start high-intensity; on max statin → assess LDL-C thresholds; statin intolerant → nonstatin LDL-lowering. Reassess at 4-8 weeks.',
  },
  {
    src: '/images/key-image-4.png',
    title: 'Figure 6: STEMI Care System Pathway',
    description: 'EMS (911) vs self-transport, PCI-capable vs non-PCI centers, primary PCI (FMC-to-device ≤90-120 min) vs fibrinolysis (door-to-lysis ≤30 min)',
  },
  {
    src: '/images/key-image-5.png',
    title: 'Figure 8: Invasive Strategy Selection and Timing in NSTE-ACS',
    description: 'Risk-stratified: unstable/very high-risk (<2h), high-risk (<24h), intermediate-risk (<72h), lower-risk (routine or selective invasive)',
  },
  {
    src: '/images/key-image-6.png',
    title: 'Figure 11: DAPT Strategies in First 12 Months Post-ACS',
    description: 'Timeline: default DAPT ≥12mo, early aspirin discontinuation, P2Y12 monotherapy, potency de-escalation, high bleeding risk (1mo DAPT → monotherapy), OAC strategies',
  },
];

export default function KeyImagesPage() {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const openLightbox = (i: number) => setLightbox(i);
  const closeLightbox = () => setLightbox(null);
  const prev = () => setLightbox((v) => (v != null ? (v - 1 + KEY_IMAGES.length) % KEY_IMAGES.length : null));
  const next = () => setLightbox((v) => (v != null ? (v + 1) % KEY_IMAGES.length : null));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#003366] p-2">
          <ImageIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Key Images</h1>
          <p className="text-sm text-gray-500">Essential figures from the 2025 ACC/AHA ACS Guideline</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {KEY_IMAGES.map((img, i) => (
          <button
            key={i}
            onClick={() => openLightbox(i)}
            className="rounded-lg border bg-white shadow-sm overflow-hidden text-left hover:shadow-md transition-shadow"
          >
            <div className="relative w-full aspect-[4/3] bg-gray-100">
              <Image
                src={img.src}
                alt={img.title}
                fill
                className="object-contain p-2"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </div>
            <div className="p-3 border-t">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{img.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-2">{img.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-md bg-gray-50 border p-3">
        <p className="text-xs text-gray-500">
          Source: 2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management of Patients With Acute Coronary Syndromes (Circulation 2025;151:e771-e862). Tap any image to view full size.
        </p>
      </div>

      {/* Lightbox */}
      {lightbox != null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={closeLightbox}>
          <button onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 z-10">
            <X className="h-6 w-6" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 z-10">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 z-10">
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="max-w-[95vw] max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            <Image
              src={KEY_IMAGES[lightbox].src}
              alt={KEY_IMAGES[lightbox].title}
              width={1200}
              height={900}
              className="object-contain max-h-[80vh] w-auto mx-auto"
            />
            <div className="text-center mt-3">
              <p className="text-white text-sm font-semibold">{KEY_IMAGES[lightbox].title}</p>
              <p className="text-white/70 text-xs mt-1">{KEY_IMAGES[lightbox].description}</p>
              <p className="text-white/50 text-xs mt-1">{lightbox + 1} / {KEY_IMAGES.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
