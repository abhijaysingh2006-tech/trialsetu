'use client';

import { useState } from 'react';
import {
  TabletSmartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Trash2,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useCan, useT } from '@/lib/hooks';
import { PageHeader, Card, Badge, fmtDT } from '@/components/ui';

export default function CapturePage() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const participants = useStore((s) => s.participants);
  const syncQueue = useStore((s) => s.syncQueue);
  const enqueue = useStore((s) => s.enqueue);
  const syncNow = useStore((s) => s.syncNow);
  const simulateOffline = useStore((s) => s.simulateOffline);
  const setSimulateOffline = useStore((s) => s.setSimulateOffline);
  const canCapture = useCan('capture');

  const [formType, setFormType] = useState<'VS' | 'AE'>('VS');

  // Vital Signs Form State
  const [pid, setPid] = useState(participants[0]?.id ?? '');
  const [visit, setVisit] = useState('Baseline');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sbp, setSbp] = useState('120');
  const [dbp, setDbp] = useState('80');
  const [weight, setWeight] = useState('65');
  const [temp, setTemp] = useState('36.8');
  const [pulse, setPulse] = useState('74');

  // AE Quick Entry Form State
  const [aeTerm, setAeTerm] = useState('');
  const [aeSeverity, setAeSeverity] = useState('Mild');
  const [aeSerious, setAeSerious] = useState(false);
  const [aeOnset, setAeOnset] = useState(new Date().toISOString().slice(0, 10));

  // Edit Checks / Form Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState('');

  const isOffline = simulateOffline || (typeof navigator !== 'undefined' && !navigator.onLine);

  const validateVS = () => {
    const errs: Record<string, string> = {};
    const nSbp = Number(sbp);
    const nDbp = Number(dbp);
    const nWt = Number(weight);

    if (nSbp < 70 || nSbp > 240) {
      errs.sbp = 'Systolic BP out of plausible range [70 - 240 mmHg]';
    }
    if (nDbp < 40 || nDbp > 140) {
      errs.dbp = 'Diastolic BP out of plausible range [40 - 140 mmHg]';
    }
    if (nDbp >= nSbp) {
      errs.dbp = 'Diastolic BP must be strictly less than Systolic BP';
    }
    if (nWt < 25 || nWt > 200) {
      errs.weight = 'Weight out of plausible range [25 - 200 kg]. Check for lbs unit entry error!';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveVS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateVS()) return;

    enqueue(
      {
        kind: 'VS',
        participantId: pid,
        payload: {
          visit,
          date,
          sbp: Number(sbp),
          dbp: Number(dbp),
          weight: Number(weight),
          temp: Number(temp),
          pulse: Number(pulse),
        },
      },
      isOffline
    );

    setSuccessMsg(isOffline ? t('cap_queued') : t('cap_saved'));
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSaveAE = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aeTerm.trim()) {
      setErrors({ aeTerm: 'Verbatim adverse event description required' });
      return;
    }
    setErrors({});

    enqueue(
      {
        kind: 'AE',
        participantId: pid,
        payload: {
          term: aeTerm,
          severity: aeSeverity,
          serious: aeSerious,
          onset: aeOnset,
        },
      },
      isOffline
    );

    setAeTerm('');
    setSuccessMsg(isOffline ? t('cap_queued') : t('cap_saved'));
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="CDASH Electronic Data Capture"
        title={t('cap_title')}
        subtitle={t('cap_sub')}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSimulateOffline(!simulateOffline)}
              className={`btn text-xs ${
                simulateOffline
                  ? 'bg-slate-800 text-white hover:bg-slate-900'
                  : 'btn-ghost'
              }`}
            >
              {simulateOffline ? <WifiOff size={13} /> : <Wifi size={13} />}
              {simulateOffline ? 'Offline Mode Active' : t('cap_simOffline')}
            </button>
          </div>
        }
      />

      {/* Offline Status Alert */}
      {isOffline && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <WifiOff size={16} className="text-amber-700" />
            <span>
              Device operating in <b>Offline-First mode</b>. All captured CRFs are securely stored locally and queued for automatic sync.
            </span>
          </div>
          <span className="pill bg-amber-200 text-amber-900 font-bold">
            {syncQueue.length} records in sync queue
          </span>
        </div>
      )}

      {/* Main Grid: Form and Sync Queue */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Container */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title={
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-900">CRF Domain:</span>
                <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs bg-slate-50">
                  <button
                    onClick={() => {
                      setFormType('VS');
                      setErrors({});
                    }}
                    className={`rounded-md px-3 py-1 font-medium transition ${
                      formType === 'VS' ? 'bg-white shadow-sm text-brand-800' : 'text-slate-600'
                    }`}
                  >
                    {t('cap_vitals')} (VS)
                  </button>
                  <button
                    onClick={() => {
                      setFormType('AE');
                      setErrors({});
                    }}
                    className={`rounded-md px-3 py-1 font-medium transition ${
                      formType === 'AE' ? 'bg-white shadow-sm text-brand-800' : 'text-slate-600'
                    }`}
                  >
                    {t('cap_ae')} (AE)
                  </button>
                </div>
              </div>
            }
          >
            {successMsg && (
              <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={15} /> {successMsg}
              </div>
            )}

            {formType === 'VS' ? (
              <form onSubmit={handleSaveVS} className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label">{t('cap_participant')}</label>
                    <select
                      className="input text-xs"
                      value={pid}
                      onChange={(e) => setPid(e.target.value)}
                    >
                      {participants.slice(0, 50).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.id} ({p.studyId})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">{t('cap_visit')}</label>
                    <select
                      className="input text-xs"
                      value={visit}
                      onChange={(e) => setVisit(e.target.value)}
                    >
                      <option>Baseline</option>
                      <option>Week 4</option>
                      <option>Week 8</option>
                      <option>Week 12</option>
                      <option>Unscheduled</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">{t('cap_date')}</label>
                    <input
                      type="date"
                      className="input text-xs"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <div className="text-xs font-semibold text-slate-700 mb-2">
                    Clinical Observations (CDASH VSDTC)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="label">{t('cap_sbp')}</label>
                      <input
                        type="number"
                        className={`input text-xs ${errors.sbp ? 'border-red-500' : ''}`}
                        value={sbp}
                        onChange={(e) => setSbp(e.target.value)}
                        required
                      />
                      {errors.sbp && (
                        <span className="text-[10px] text-red-600 block mt-0.5">{errors.sbp}</span>
                      )}
                    </div>

                    <div>
                      <label className="label">{t('cap_dbp')}</label>
                      <input
                        type="number"
                        className={`input text-xs ${errors.dbp ? 'border-red-500' : ''}`}
                        value={dbp}
                        onChange={(e) => setDbp(e.target.value)}
                        required
                      />
                      {errors.dbp && (
                        <span className="text-[10px] text-red-600 block mt-0.5">{errors.dbp}</span>
                      )}
                    </div>

                    <div>
                      <label className="label">{t('cap_weight')}</label>
                      <input
                        type="number"
                        step="0.1"
                        className={`input text-xs ${errors.weight ? 'border-red-500' : ''}`}
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                      />
                      {errors.weight && (
                        <span className="text-[10px] text-red-600 block mt-0.5">
                          {errors.weight}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="label">{t('cap_pulse')}</label>
                      <input
                        type="number"
                        className="input text-xs"
                        value={pulse}
                        onChange={(e) => setPulse(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label">{t('cap_temp')}</label>
                      <input
                        type="number"
                        step="0.1"
                        className="input text-xs"
                        value={temp}
                        onChange={(e) => setTemp(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button type="submit" disabled={!canCapture} className="btn-primary">
                    <Save size={14} /> {t('cap_save')}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveAE} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">{t('cap_participant')}</label>
                    <select
                      className="input text-xs"
                      value={pid}
                      onChange={(e) => setPid(e.target.value)}
                    >
                      {participants.slice(0, 50).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.id} ({p.studyId})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">{t('cap_onset')}</label>
                    <input
                      type="date"
                      className="input text-xs"
                      value={aeOnset}
                      onChange={(e) => setAeOnset(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">{t('cap_aeTerm')}</label>
                  <input
                    className={`input text-xs ${errors.aeTerm ? 'border-red-500' : ''}`}
                    placeholder="Describe symptoms, verbatim as narrated by patient..."
                    value={aeTerm}
                    onChange={(e) => setAeTerm(e.target.value)}
                    required
                  />
                  {errors.aeTerm && (
                    <span className="text-[10px] text-red-600 block mt-0.5">{errors.aeTerm}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">{t('cap_aeSeverity')}</label>
                    <select
                      className="input text-xs"
                      value={aeSeverity}
                      onChange={(e) => setAeSeverity(e.target.value)}
                    >
                      <option value="Mild">{t('cap_mild')}</option>
                      <option value="Moderate">{t('cap_moderate')}</option>
                      <option value="Severe">{t('cap_severe')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">{t('cap_serious')}</label>
                    <select
                      className="input text-xs"
                      value={aeSerious ? 'yes' : 'no'}
                      onChange={(e) => setAeSerious(e.target.value === 'yes')}
                    >
                      <option value="no">{t('no')}</option>
                      <option value="yes">{t('yes')}</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button type="submit" disabled={!canCapture} className="btn-primary">
                    <Save size={14} /> {t('cap_save')}
                  </button>
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Sync Queue Column */}
        <div>
          <Card
            title={
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-1.5">
                  <RefreshCw size={14} className="text-brand-600" /> {t('cap_queue')}
                </span>
                <span className="pill bg-slate-100 text-slate-800 text-[10px] font-bold">
                  {syncQueue.length}
                </span>
              </div>
            }
            actions={
              syncQueue.length > 0 && (
                <button
                  onClick={() => syncNow()}
                  disabled={isOffline}
                  className="btn-primary text-xs py-1 px-2.5"
                >
                  <Send size={12} /> {t('cap_syncNow')}
                </button>
              )
            }
          >
            {syncQueue.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                All site records synced with cloud database.
              </div>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto">
                {syncQueue.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="mono font-semibold text-slate-800">
                        {item.kind} · {item.participantId}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.createdOffline ? 'Offline' : 'Queued'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate font-mono">
                      {JSON.stringify(item.payload)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Captured: {fmtDT(item.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
