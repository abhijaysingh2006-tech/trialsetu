'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, X, PlayCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { RoleId } from '@/lib/types';

interface Step { title: string; text: string; role: RoleId; href: (saeId: string) => string; target?: string }

const STEPS: Step[] = [
  { title: 'Leadership portfolio', role: 'leadership', href: () => '/', target: 'tour-kpis', text: 'Real-time, read-only view of 12 synthetic AIIA trials. KPI targets (100% SAEs on clock, zero unaudited changes, FHIR/SDTM pass, role-scoped access logged) are computed live from the data — not hard-coded.' },
  { title: 'Drill into a study', role: 'leadership', href: () => '/studies/T10', target: 'tour-study', text: 'Kaishore Guggulu in Knee OA (Sandhigata Vata): phase, CTRI number, EC approval dates, enrolment vs target per site, and its open statutory clocks.' },
  { title: 'SAE nearing its 24-hour clock', role: 'pv', href: (id) => `/safety?focus=${id}`, target: 'tour-sae', text: 'Switched to the PV Officer. This SAE is red with a live countdown to the NDCT 2019 24-hour reporting deadline; the escalation ladder shows who is notified next (Investigator → PV → PI → Leadership).' },
  { title: 'Trace to formulation batch', role: 'pv', href: () => '/batches/B-KSG-2606', target: 'tour-batch', text: 'Every AE links back to its ASU formulation batch. Batch KSG/26/06 shows a hepatic AE cluster — the disproportionality (PRR/χ²) signal fires with an explain-why line. The PV officer can quarantine the batch (audited).' },
  { title: 'NAMASTE → MedDRA coding', role: 'pv', href: (id) => `/coding?ae=${id}`, target: 'tour-coding', text: "The investigator recorded 'Kamala (Pittaja)'. The terminology bridge proposes MedDRA PTs with confidence and rationale; the coder accepts, edits or rejects — human-in-the-loop, logged." },
  { title: 'Audit-trail verification', role: 'leadership', href: () => '/audit', target: 'tour-audit', text: 'Every change, view and signature is a SHA-256 hash-chained, append-only entry. Click “Verify chain”, then try “Simulate tampering” to see the break detected at the exact entry.' },
  { title: 'Export the CTRI packet', role: 'investigator', href: () => '/interop?tab=packets&study=T10', target: 'tour-packet', text: 'As the PI, generate the CTRI update packet for T10 — hashed, e-signable and downloadable as HTML/JSON. SDTM/ADaM/Define-XML and FHIR R4 bundles are on the neighbouring tabs.' },
];

export function DemoTour() {
  const step = useStore((s) => s.tourStep);
  const setTour = useStore((s) => s.setTour);
  const setRole = useStore((s) => s.setRole);
  const aes = useStore((s) => s.aes);
  const router = useRouter();
  const pathname = usePathname();
  const sae = aes.find((a) => a.serious && a.batchId === 'B-KSG-2606' && !a.reportedAt) ?? aes.find((a) => a.serious && !a.reportedAt) ?? aes.find((a) => a.serious);

  useEffect(() => {
    if (step === null) return;
    const s = STEPS[step];
    setRole(s.role);
    router.push(s.href(sae?.id ?? ''));
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step === null) return;
    const id = STEPS[step].target;
    if (!id) return;
    let el: HTMLElement | null = null;
    const t = setTimeout(() => {
      el = document.getElementById(id);
      if (el) { el.classList.add('tour-target'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }, 450);
    return () => { clearTimeout(t); el?.classList.remove('tour-target'); };
  }, [step, pathname]);

  if (step === null) return null;
  const s = STEPS[step];
  return (
    <div className="fixed bottom-4 right-4 z-40 w-[380px] max-w-[calc(100vw-2rem)] rounded-xl border border-haldi-400/50 bg-white shadow-2xl">
      <div className="flex items-center justify-between rounded-t-xl bg-gradient-to-r from-brand-700 to-brand-600 px-4 py-2 text-white">
        <div className="flex items-center gap-2 text-sm font-medium"><PlayCircle size={16} /> Demo · step {step + 1}/{STEPS.length}</div>
        <button onClick={() => setTour(null)} aria-label="Close tour"><X size={16} /></button>
      </div>
      <div className="p-4">
        <div className="mb-1 font-semibold text-brand-900">{s.title}</div>
        <p className="text-sm leading-relaxed text-slate-600">{s.text}</p>
        <div className="mt-2 text-[11px] text-slate-400">Acting as: <b>{s.role}</b></div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1">{STEPS.map((_, i) => <span key={i} className={`h-1.5 w-5 rounded-full ${i <= step ? 'bg-haldi-500' : 'bg-slate-200'}`} />)}</div>
          <div className="flex gap-2">
            <button disabled={step === 0} onClick={() => setTour(step - 1)} className="btn-ghost px-2"><ChevronLeft size={14} /></button>
            {step < STEPS.length - 1
              ? <button onClick={() => setTour(step + 1)} className="btn-primary">Next <ChevronRight size={14} /></button>
              : <button onClick={() => setTour(null)} className="btn-primary">Finish</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
