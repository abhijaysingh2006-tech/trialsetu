'use client';

import { useState } from 'react';
import {
  SlidersHorizontal,
  Clock,
  ShieldCheck,
  RotateCcw,
  Check,
  Edit2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useCan, useT } from '@/lib/hooks';
import { DEFAULT_RULES, type ClockRule, type EscalationStep } from '@/lib/rules';
import { PageHeader, Card, Badge, Modal } from '@/components/ui';

export default function RulesPage() {
  const t = useT();
  const rules = useStore((s) => s.rules);
  const updateRule = useStore((s) => s.updateRule);
  const resetRules = useStore((s) => s.resetRules);
  const canEdit = useCan('rules:edit');

  const [editingRule, setEditingRule] = useState<ClockRule | null>(null);
  const [duration, setDuration] = useState(24);
  const [amber, setAmber] = useState(8);
  const [red, setRed] = useState(2);
  const [enabled, setEnabled] = useState(true);
  const [justification, setJustification] = useState('');

  const openEdit = (r: ClockRule) => {
    setEditingRule(r);
    setDuration(r.durationHours);
    setAmber(r.amberWithinHours);
    setRed(r.redWithinHours);
    setEnabled(r.enabled);
    setJustification('');
  };

  const handleSave = () => {
    if (!editingRule || justification.length < 5) return;
    updateRule(
      {
        ...editingRule,
        durationHours: duration,
        amberWithinHours: amber,
        redWithinHours: red,
        enabled,
      },
      justification
    );
    setEditingRule(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Statutory Configuration"
        title="Statutory-Clock & Rule Engine"
        subtitle="Configurable regulatory reporting rules and escalation thresholds under New Drugs and Clinical Trials (NDCT) Rules 2019 and AIIA Institutional Standard Operating Procedures (SOPs)."
        actions={
          <button
            onClick={() => {
              if (confirm('Reset all rules to statutory NDCT 2019 defaults?')) {
                resetRules();
              }
            }}
            disabled={!canEdit}
            className="btn-ghost text-xs"
          >
            <RotateCcw size={13} /> Reset to NDCT 2019 Defaults
          </button>
        }
      />

      {/* Rules Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {rules.map((rule) => (
          <div key={rule.id} className="card p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="mono font-bold text-sm text-brand-900">{rule.id}</span>
                    <Badge tone={rule.enabled ? 'green' : 'slate'}>
                      {rule.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                    <Badge tone="violet">{rule.appliesTo}</Badge>
                  </div>
                  <h3 className="mt-1 font-semibold text-sm text-slate-900">{rule.name}</h3>
                </div>

                {canEdit ? (
                  <button
                    onClick={() => openEdit(rule)}
                    className="btn-ghost text-xs py-1 px-2 text-slate-600 hover:text-brand-700"
                  >
                    <Edit2 size={12} /> Configure
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400">Locked (PV role required)</span>
                )}
              </div>

              <p className="mt-2 text-xs text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                <span className="font-semibold text-slate-700 block">Legal & Regulatory Basis:</span>
                {rule.legalBasis}
              </p>

              {/* Thresholds Display */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded bg-slate-50 p-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Statutory Window
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {rule.durationHours >= 24 ? `${Math.round(rule.durationHours / 24)}d` : `${rule.durationHours}h`}
                  </span>
                </div>
                <div className="rounded bg-amber-50 p-2 border border-amber-100">
                  <span className="text-amber-700 block text-[10px] uppercase font-semibold">
                    Amber Warning
                  </span>
                  <span className="font-bold text-amber-800 text-sm">
                    ≤ {rule.amberWithinHours >= 24 ? `${Math.round(rule.amberWithinHours / 24)}d` : `${rule.amberWithinHours}h`}
                  </span>
                </div>
                <div className="rounded bg-red-50 p-2 border border-red-100">
                  <span className="text-red-700 block text-[10px] uppercase font-semibold">
                    Critical Red
                  </span>
                  <span className="font-bold text-red-800 text-sm">
                    ≤ {rule.redWithinHours >= 24 ? `${Math.round(rule.redWithinHours / 24)}d` : `${rule.redWithinHours}h`}
                  </span>
                </div>
              </div>

              {/* Escalation Ladder */}
              <div className="mt-4">
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Escalation Ladder:
                </span>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {rule.escalation.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 font-medium">
                        {step.label}{' '}
                        <span className="text-slate-400 font-normal">
                          ({Math.round(step.atPctElapsed * 100)}%)
                        </span>
                      </span>
                      {idx < rule.escalation.length - 1 && (
                        <ArrowRight size={11} className="text-slate-300" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Start: {rule.startEvent}</span>
              <span>Stop: {rule.stopEvent}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Rule Modal */}
      {editingRule && (
        <Modal
          open={Boolean(editingRule)}
          onClose={() => setEditingRule(null)}
          title={`Configure Rule: ${editingRule.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="font-semibold text-slate-900">{editingRule.name}</div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Total Duration (Hours)</label>
                <input
                  type="number"
                  className="input text-xs"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="label">Amber Alert (Hours remaining)</label>
                <input
                  type="number"
                  className="input text-xs"
                  value={amber}
                  onChange={(e) => setAmber(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="label">Red Critical (Hours remaining)</label>
                <input
                  type="number"
                  className="input text-xs"
                  value={red}
                  onChange={(e) => setRed(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 font-medium text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>Enable this statutory clock rule</span>
              </label>
            </div>

            <div>
              <label className="label">
                Regulatory Justification for Rule Modification (Recorded in Audit Chain)
              </label>
              <textarea
                rows={3}
                className="input text-xs"
                placeholder="e.g. Institutional SOP updated by Academic Council to mandate 4-hour pre-deadline amber notifications for all Phase III multi-site ASU studies."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setEditingRule(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={justification.trim().length < 5}
                onClick={handleSave}
                className="btn-primary"
              >
                Save & Update Audit Ledger
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
