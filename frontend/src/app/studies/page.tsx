'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { FlaskConical, Search, Filter, ExternalLink, Calendar, Users, Building, ShieldCheck } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useClocks, useT } from '@/lib/hooks';
import { PageHeader, Card, StudyStatusBadge, ClockPill, Progress, fmtDate } from '@/components/ui';
import type { StudyStatus } from '@/lib/types';

export default function StudiesPage() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const studies = useStore((s) => s.studies);
  const participants = useStore((s) => s.participants);
  const formulations = useStore((s) => s.formulations);
  const { clocks } = useClocks(5000);

  const [query, setQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return studies.filter((s) => {
      const q = query.toLowerCase();
      const matchQ =
        !q ||
        s.code.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.titleHi.includes(q) ||
        s.ayurvedaCondition.toLowerCase().includes(q) ||
        s.condition.toLowerCase().includes(q) ||
        s.ctriNo.toLowerCase().includes(q);
      const matchPhase = phaseFilter === 'all' || s.phase === phaseFilter;
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchQ && matchPhase && matchStatus;
    });
  }, [studies, query, phaseFilter, statusFilter]);

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="Registry & Portfolio"
        title={t('nav_studies')}
        subtitle="12 synthetic multi-centre Ayurveda clinical trials across AIIA New Delhi, Goa campus, and partner institutions."
      />

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="flex flex-1 items-center gap-2 min-w-[240px]">
          <Search size={16} className="text-slate-400" />
          <input
            className="w-full text-sm outline-none placeholder:text-slate-400"
            placeholder="Search by code, title, CTRI number, dosha or biomedical condition..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-slate-500 font-medium">
            <Filter size={13} /> Filters:
          </span>
          <select
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 outline-none font-medium text-slate-700"
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
          >
            <option value="all">All Phases</option>
            <option value="Phase II">Phase II</option>
            <option value="Phase II/III">Phase II/III</option>
            <option value="Phase III">Phase III</option>
            <option value="Phase IV">Phase IV</option>
          </select>
          <select
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 outline-none font-medium text-slate-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Recruiting">Recruiting</option>
            <option value="Active, not recruiting">Active, not recruiting</option>
            <option value="Completed">Completed</option>
            <option value="EC approval pending">EC approval pending</option>
            <option value="Suspended">Suspended</option>
          </select>
          {(query || phaseFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setQuery('');
                setPhaseFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs text-brand-700 hover:underline px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Studies Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((study) => {
          const enrolled = participants.filter((p) => p.studyId === study.id).length;
          const formulation = formulations.find((f) => f.id === study.formulationId);
          const studyClocks = clocks.filter((c) => c.studyId === study.id);
          const criticalClocks = studyClocks.filter((c) => c.status === 'red' || c.status === 'overdue');

          return (
            <div
              key={study.id}
              className="card flex flex-col justify-between p-4 transition-all hover:border-brand-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="mono font-semibold text-brand-800 bg-brand-50 px-2 py-0.5 rounded text-xs">
                      {study.code}
                    </span>
                    <span className="ml-2 text-xs text-slate-500 font-mono">{study.phase}</span>
                  </div>
                  <StudyStatusBadge status={study.status} />
                </div>

                <Link
                  href={`/studies/${study.id}`}
                  className="mt-2.5 block text-base font-semibold leading-snug text-slate-900 hover:text-brand-700 hover:underline"
                >
                  {lang === 'hi' ? study.titleHi : study.title}
                </Link>

                <div className="mt-2 flex flex-wrap gap-1 text-xs">
                  <span className="rounded bg-haldi-50 px-2 py-0.5 text-haldi-800 font-medium border border-haldi-100">
                    {study.ayurvedaCondition}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
                    {study.condition}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                  <span className="font-medium text-slate-700">{formulation?.name}:</span> {formulation?.ingredients}
                </p>

                {/* Progress */}
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Enrolment</span>
                    <span className="font-semibold tabular-nums">
                      {enrolled} / {study.target} ({Math.round((enrolled / study.target) * 100)}%)
                    </span>
                  </div>
                  <Progress value={enrolled} max={study.target} />
                </div>

                {/* Metadata tags */}
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building size={13} className="shrink-0 text-slate-400" />
                    <span>{study.sites.length} sites</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar size={13} className="shrink-0 text-slate-400" />
                    <span>EC exp: {fmtDate(study.ecExpiryDate)}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="mono text-slate-400">{study.ctriNo}</span>
                    {criticalClocks.length > 0 && (
                      <span className="pill bg-red-50 text-red-700 ring-red-200">
                        {criticalClocks.length} critical clock
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">PI: {study.piName.split(' ').slice(-1)[0]}</span>
                <Link
                  href={`/studies/${study.id}`}
                  className="btn-primary text-xs py-1 px-2.5"
                >
                  Drill down →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
