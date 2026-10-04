'use client';

import { useState } from 'react';
import { KeyRound, Leaf, ShieldCheck, Smartphone } from 'lucide-react';
import { useStore } from '@/lib/store';
import { ROLES } from '@/lib/rbac';
import type { RoleId } from '@/lib/types';

/** Mock of the Keycloak OIDC Authorization-Code + PKCE flow with TOTP MFA. */
export function Login() {
  const users = useStore((s) => s.users);
  const login = useStore((s) => s.login);
  const [role, setRole] = useState<RoleId>('leadership');
  const [step, setStep] = useState<1 | 2>(1);
  const [pw, setPw] = useState('demo');
  const [otp, setOtp] = useState('');
  const [err, setErr] = useState('');
  const user = users.find((u) => u.role === role)!;

  return (
    <div className="motif flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">
        <div className="relative flex flex-col justify-between bg-brand-950 p-8 text-brand-50">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-haldi-400 to-haldi-600"><Leaf /></div>
              <div><div className="text-xl font-semibold">TrialSetu</div><div className="text-xs text-brand-300">ट्रायल-सेतु · AIIA · NPvCC</div></div>
            </div>
            <p className="mt-8 text-lg leading-snug">A live, role-based, auditable bridge between Ayurveda trial sites, ethics committees, pharmacovigilance and regulators.</p>
            <ul className="mt-6 space-y-2 text-sm text-brand-200">
              <li>• NDCT Rules 2019 statutory clocks with escalation</li>
              <li>• Batch-to-AE traceability for ASU formulations</li>
              <li>• NAMASTE / ICD-11 TM2 → MedDRA coding bridge</li>
              <li>• Hash-chained ALCOA+ audit, DPDP consent ledger</li>
            </ul>
          </div>
          <p className="mt-8 text-[11px] text-brand-400">SIH 2026 · PS SIH26046 prototype · synthetic data only</p>
        </div>

        <div className="p-8">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><KeyRound size={14} /> Sign in with AIIA SSO</div>
          <div className="mb-5 text-[11px] text-slate-400">Keycloak realm <code>trialsetu</code> · OIDC (PKCE) · MFA enforced — mocked in this demo</div>

          {step === 1 ? (
            <form onSubmit={(e) => { e.preventDefault(); if (pw !== 'demo') { setErr('Invalid credentials (hint: demo)'); return; } setErr(''); setStep(2); }} className="space-y-4">
              <div>
                <div className="label">Demo persona (role claim)</div>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(ROLES) as RoleId[]).map((r) => (
                    <button type="button" key={r} onClick={() => setRole(r)} className={`rounded-lg border p-2.5 text-left text-xs transition ${role === r ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-slate-200 hover:border-brand-300'}`}>
                      <div className="font-semibold text-slate-800">{ROLES[r].label}</div>
                      <div className="text-slate-500">{users.find((u) => u.role === r)?.name}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="label">Username</label><input className="input" value={user.id.toLowerCase()} readOnly /></div>
              <div><label className="label">Password</label><input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
              {err && <div className="text-xs text-red-600">{err}</div>}
              <button className="btn-primary w-full py-2">Continue</button>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (!/^\d{6}$/.test(otp)) { setErr('Enter the 6-digit code'); return; } login(role); }} className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-800"><Smartphone size={18} /> Enter the TOTP code from your authenticator app for <b>{user.name}</b>.</div>
              <input autoFocus className="input text-center font-mono text-xl tracking-[0.5em]" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="••••••" />
              <button type="button" className="text-xs text-brand-700 underline" onClick={() => setOtp('246810')}>Demo: autofill code</button>
              {err && <div className="text-xs text-red-600">{err}</div>}
              <button className="btn-primary w-full py-2"><ShieldCheck size={16} /> Verify & sign in</button>
              <button type="button" className="w-full text-xs text-slate-500" onClick={() => setStep(1)}>← Back</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
