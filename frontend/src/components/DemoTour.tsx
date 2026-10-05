'use client';

import { useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, X, PlayCircle, Compass } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { RoleId } from '@/lib/types';

export interface Step {
  title: string;
  text: string;
  role: RoleId;
  href: (saeId: string) => string;
  target?: string;
}

export const STEPS: Step[] = [
  {
    title: '1. Leadership Portfolio',
    role: 'leadership',
    href: () => '/',
    target: 'tour-kpis',
    text: 'Real-time, read-only view of 12 synthetic AIIA trials. Live KPI scorecard (100% SAEs on clocks, zero unaudited changes, FHIR/SDTM pass, role-scoped access) calculated live from the data.',
  },
  {
    title: '2. Drill into a Study',
    role: 'leadership',
    href: () => '/studies/T10',
    target: 'tour-study',
    text: 'Kaishore Guggulu in Knee OA (Sandhigata Vata): phase, CTRI number, EC approval dates, enrolment vs target per site, and open statutory countdown clocks.',
  },
  {
    title: '3. SAE Nearing 24h Clock',
    role: 'pv',
    href: (id) => `/safety?focus=${id}`,
    target: 'tour-sae',
    text: 'Switched to Pharmacovigilance Officer. This SAE is in red with live countdown to the NDCT 2019 24-hour statutory reporting deadline. The 4-tier escalation ladder notifies Investigator → PV → PI → Leadership.',
  },
  {
    title: '4. Trace to Formulation Batch',
    role: 'pv',
    href: () => '/batches/B-KSG-2606',
    target: 'tour-batch',
    text: 'Every AE links back to its ASU formulation batch. Batch KSG/26/06 shows a hepatic cluster with disproportionality signal (PRR ≥ 2.0, χ² ≥ 4.0). The PV officer can quarantine the batch with an audited reason.',
  },
  {
    title: '5. NAMASTE → MedDRA Coding',
    role: 'pv',
    href: (id) => `/coding?ae=${id}`,
    target: 'tour-coding',
    text: "The investigator entered 'Kamala (Pittaja)'. The terminology bridge proposes MedDRA PTs with confidence and rationale; the coder accepts, edits or rejects (human-in-the-loop, audited).",
  },
  {
    title: '6. Cryptographic Audit Verification',
    role: 'leadership',
    href: () => '/audit',
    target: 'tour-audit',
    text: 'Every change, route view and 21 CFR Part 11 e-signature is a SHA-256 hash-chained, append-only entry. Click “Verify chain” or “Simulate tampering” to see broken tamper detection.',
  },
  {
    title: '7. Export CTRI & FHIR Packets',
    role: 'investigator',
    href: () => '/interop?tab=packets&study=T10',
    target: 'tour-packet',
    text: 'As PI, generate the CTRI update packet for T10 — hashed, e-signable and downloadable as HTML/JSON. SDTM/ADaM/Define-XML and HAPI FHIR R4 bundles are available in the adjacent tabs.',
  },
];

export function DemoTour() {
  const step = useStore((s) => s.tourStep);
  const setTour = useStore((s) => s.setTour);
  const setRole = useStore((s) => s.setRole);
  const router = useRouter();
  const pathname = usePathname();

  const getSaeId = useCallback(() => {
    const aes = useStore.getState().aes;
    const sae =
      aes.find((a) => a.serious && a.batchId === 'B-KSG-2606') ??
      aes.find((a) => a.serious && !a.reportedAt) ??
      aes.find((a) => a.serious) ??
      aes[0];
    return sae?.id ?? 'AE-0001';
  }, []);

  const goToStep = useCallback(
    (newStep: number | null) => {
      if (newStep === null) {
        setTour(null);
        document.querySelectorAll('.tour-target').forEach((e) => e.classList.remove('tour-target'));
        return;
      }
      const clamped = Math.max(0, Math.min(newStep, STEPS.length - 1));
      const s = STEPS[clamped];
      const saeId = getSaeId();
      const targetHref = s.href(saeId);

      setRole(s.role);
      setTour(clamped);
      router.push(targetHref);
    },
    [getSaeId, router, setRole, setTour]
  );

  // Sync route and role when step changes
  useEffect(() => {
    if (step === null) return;
    const s = STEPS[step];
    if (useStore.getState().role !== s.role) {
      setRole(s.role);
    }
  }, [step, setRole]);

  // Robust element highlighter with retry polling
  useEffect(() => {
    if (step === null) return;
    const targetId = STEPS[step].target;
    if (!targetId) return;

    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      const el = document.getElementById(targetId);
      if (el) {
        clearInterval(timer);
        document.querySelectorAll('.tour-target').forEach((e) => e.classList.remove('tour-target'));
        el.classList.add('tour-target');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (attempts >= 30) {
        clearInterval(timer);
      }
    }, 100);

    return () => {
      clearInterval(timer);
      const el = document.getElementById(targetId);
      el?.classList.remove('tour-target');
    };
  }, [step, pathname]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (step < STEPS.length - 1) goToStep(step + 1);
        else goToStep(null);
      } else if (e.key === 'ArrowLeft') {
        if (step > 0) goToStep(step - 1);
      } else if (e.key === 'Escape') {
        goToStep(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, goToStep]);

  if (step === null) return null;
  const s = STEPS[step];

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[420px] max-w-[calc(100vw-2.5rem)] rounded-2xl border-2 border-haldi-400 bg-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-xl bg-gradient-to-r from-brand-800 to-brand-700 px-4 py-3 text-white shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
          <PlayCircle size={18} className="text-haldi-400 animate-pulse" />
          <span>Demo Tour · Step {step + 1} of {STEPS.length}</span>
        </div>
        <button
          onClick={() => goToStep(null)}
          className="rounded-lg p-1 text-brand-200 transition hover:bg-white/10 hover:text-white"
          aria-label="Close tour"
          title="Close tour (Esc)"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-base text-brand-950">{s.title}</h3>
          <span className="pill bg-brand-50 text-brand-800 ring-brand-200 font-mono text-[10px]">
            {s.role.toUpperCase()}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-600 font-normal">{s.text}</p>

        {/* Step dots (Direct jump) */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex gap-1.5" title="Click any dot to jump to that step">
            {STEPS.map((st, i) => (
              <button
                key={i}
                onClick={() => goToStep(i)}
                className={`h-2 rounded-full transition-all ${
                  i === step
                    ? 'w-6 bg-haldi-500 shadow-sm'
                    : i < step
                    ? 'w-2 bg-brand-600 hover:bg-brand-700'
                    : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
                title={`Step ${i + 1}: ${st.title}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={step === 0}
              onClick={() => goToStep(step - 1)}
              className="btn-ghost text-xs px-2.5 py-1 disabled:opacity-30"
              title="Previous step (Left Arrow)"
            >
              <ChevronLeft size={14} /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => goToStep(step + 1)}
                className="btn-primary text-xs px-3.5 py-1 shadow-sm"
                title="Next step (Right Arrow or Enter)"
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={() => goToStep(null)}
                className="btn-primary text-xs px-3.5 py-1 bg-emerald-700 hover:bg-emerald-800 border-emerald-800"
              >
                Finish Tour ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

