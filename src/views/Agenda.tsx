import { Fragment, useState } from 'react';
import type { Appointment, AppointmentStatus, ServiceOrder } from '../store';
import { mechanics } from '../store';

interface AgendaProps {
  appointments: Appointment[];
  syncing?: boolean;
  onSync?: () => void;
  onUpdateAppointment: (apt: Appointment) => void;
  onAddAppointment: (apt: Appointment) => void;
  onConvertToOS: (apt: Appointment) => void;
}

const TIME_SLOTS = Array.from({ length: 22 }, (_, i) => {
  const h = 8 + Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

const SERVICES = [
  'Cambio de aceite y filtro', 'Revisión sistema A/C', 'Diagnóstico computarizado',
  'Cambio de pastillas de freno', 'Alineación y balanceo', 'Cambio de llantas',
  'Revisión general', 'Mantenimiento preventivo', 'Reparación de frenos',
  'Sistema eléctrico', 'Otro',
];

const blankForm = {
  clientName: '', clientPhone: '', plate: '', service: '', date: '', time: '08:00', mechanic: '', notes: '',
};

const statusMeta: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  pendiente:  { label: 'Pendiente',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  confirmada: { label: 'Confirmada', color: '#22c55e', bg: 'rgba(34,197,94,0.12)'   },
  cancelada:  { label: 'Cancelada',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
};

const HOUR_START = 8;
const HOUR_END   = 19;
const HOURS      = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

function weekStart(ref: Date) {
  const d = new Date(ref);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtDisplay(d: Date) {
  return d.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function Agenda({ appointments, syncing, onSync, onUpdateAppointment, onAddAppointment, onConvertToOS }: AgendaProps) {
  const [weekRef, setWeekRef] = useState(new Date());
  const [selectedMechanic, setSelectedMechanic] = useState<string>('all');
  const [view, setView] = useState<'week' | 'mechanic'>('week');
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState('');

  const setF = (k: keyof typeof blankForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submitNew = () => {
    if (!form.clientName || !form.clientPhone || !form.plate || !form.service || !form.date || !form.mechanic) {
      setFormError('Completa todos los campos obligatorios.');
      return;
    }
    const newApt: Appointment = {
      id: `APT-${String(Date.now()).slice(-5)}`,
      clientName: form.clientName, clientPhone: form.clientPhone,
      plate: form.plate.toUpperCase(), service: form.service,
      date: form.date, time: form.time, mechanic: form.mechanic,
      notes: form.notes, status: 'pendiente',
    };
    onAddAppointment(newApt);
    setForm(blankForm);
    setFormError('');
    setShowNewForm(false);
    // Navegar a la semana de la nueva cita
    setWeekRef(new Date(form.date + 'T12:00:00'));
  };

  const ws = weekStart(weekRef);
  const days = Array.from({ length: 6 }, (_, i) => addDays(ws, i)); // Mon–Sat
  const todayStr = fmtDate(new Date());

  const filtered = appointments.filter(a =>
    selectedMechanic === 'all' || a.mechanic === selectedMechanic
  );

  const aptsForDay = (dateStr: string) =>
    filtered.filter(a => a.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));

  const aptsForMechAndDay = (mechId: string, dateStr: string) =>
    appointments.filter(a => a.mechanic === mechId && a.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));

  const weekDates = days.map(fmtDate);
  const weekApts  = filtered.filter(a => weekDates.includes(a.date));

  const confirm = (apt: Appointment) => onUpdateAppointment({ ...apt, status: 'confirmada' });
  const cancel  = (apt: Appointment) => onUpdateAppointment({ ...apt, status: 'cancelada'  });

  const totalByStatus = (s: AppointmentStatus) => weekApts.filter(a => a.status === s).length;

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--surface-2)' }}>
      <div className="p-5 space-y-4">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="page-title">Agenda de Citas</h1>
            <p className="page-subtitle">Gestiona reservas recibidas desde la landing page del taller</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {(['week', 'mechanic'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className="px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{ background: view === v ? 'var(--accent)' : 'var(--surface)', color: view === v ? '#fff' : 'var(--text-2)' }}>
                  {v === 'week' ? '📅 Semana' : '👨‍🔧 Por Mecánico'}
                </button>
              ))}
            </div>
            {onSync && (
              <button
                className="btn-secondary text-xs flex items-center gap-1.5"
                onClick={onSync}
                disabled={syncing}
                title="Sincronizar citas recibidas por WhatsApp"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                  style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }}>
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                {syncing ? 'Sincronizando…' : 'Sincronizar WhatsApp'}
              </button>
            )}
            <button className="btn-primary text-xs flex items-center gap-1.5" onClick={() => { setShowNewForm(true); setFormError(''); }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nueva Cita
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Esta semana',  value: weekApts.length,               color: 'var(--text-1)' },
            { label: 'Pendientes',   value: totalByStatus('pendiente'),     color: '#f59e0b'       },
            { label: 'Confirmadas',  value: totalByStatus('confirmada'),    color: '#22c55e'       },
            { label: 'Canceladas',   value: totalByStatus('cancelada'),     color: '#ef4444'       },
          ].map(s => (
            <div key={s.label} className="card px-4 py-3 text-center">
              <div className="text-2xl font-black" style={{ color: s.color, fontFamily: 'DM Sans, sans-serif' }}>{s.value}</div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Week navigator */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <button onClick={() => setWeekRef(addDays(weekRef, -7))}
                className="btn-secondary text-xs px-2 py-1">← Anterior</button>
              <button onClick={() => setWeekRef(new Date())}
                className="btn-secondary text-xs px-2 py-1">Hoy</button>
              <button onClick={() => setWeekRef(addDays(weekRef, 7))}
                className="btn-secondary text-xs px-2 py-1">Siguiente →</button>
              <span className="text-xs font-semibold ml-2" style={{ color: 'var(--text-1)' }}>
                {fmtDisplay(ws)} — {fmtDisplay(days[5])}
              </span>
            </div>
            {view === 'week' && (
              <select className="form-select text-xs" style={{ width: 180 }}
                value={selectedMechanic} onChange={e => setSelectedMechanic(e.target.value)}>
                <option value="all">Todos los mecánicos</option>
                {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
          </div>

          {/* WEEK VIEW */}
          {view === 'week' && (
            <div className="overflow-x-auto">
              <div style={{ display: 'grid', gridTemplateColumns: `60px repeat(6, minmax(140px, 1fr))`, minWidth: 900 }}>
                {/* Header row */}
                <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }} />
                {days.map(d => {
                  const ds = fmtDate(d);
                  const isToday = ds === todayStr;
                  return (
                    <div key={ds} className="px-2 py-2 text-center"
                      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
                      <div className="text-[10px] font-bold uppercase" style={{ color: isToday ? 'var(--accent)' : 'var(--text-3)' }}>
                        {d.toLocaleDateString('es-EC', { weekday: 'short' })}
                      </div>
                      <div className={`text-sm font-black w-7 h-7 flex items-center justify-center mx-auto rounded-full ${isToday ? 'text-white' : ''}`}
                        style={{ background: isToday ? 'var(--accent)' : 'transparent', color: isToday ? '#fff' : 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}>
                        {d.getDate()}
                      </div>
                    </div>
                  );
                })}

                {/* Time slots */}
                {HOURS.map(h => (
                  <Fragment key={h}>
                    <div className="text-right pr-2 text-[10px] font-mono"
                      style={{ paddingTop: 8, color: 'var(--text-3)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                      {h}:00
                    </div>
                    {days.map(d => {
                      const ds = fmtDate(d);
                      const slotApts = aptsForDay(ds).filter(a => parseInt(a.time.split(':')[0]) === h);
                      return (
                        <div key={ds}
                          style={{ borderLeft: '1px solid var(--border)', borderBottom: '1px solid var(--border)', minHeight: 52, padding: '4px 6px', background: ds === todayStr ? 'rgba(37,99,235,0.03)' : 'transparent' }}>
                          {slotApts.map(apt => <AppointmentChip key={apt.id} apt={apt} onClick={() => setDetail(apt)} />)}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          )}

          {/* MECHANIC VIEW */}
          {view === 'mechanic' && (
            <div className="overflow-x-auto">
              <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${mechanics.length}, minmax(160px, 1fr))`, minWidth: 720 }}>
                {/* Header */}
                <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }} />
                {mechanics.map(m => (
                  <div key={m.id} className="px-3 py-2 text-center"
                    style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black text-white mx-auto mb-1"
                      style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)' }}>{m.avatar}</div>
                    <div className="text-[11px] font-bold" style={{ color: 'var(--text-1)' }}>{m.name}</div>
                    <div className="text-[9px]" style={{ color: 'var(--text-3)' }}>{m.specialty}</div>
                  </div>
                ))}

                {/* Days × mechanics */}
                {days.map(d => {
                  const ds = fmtDate(d);
                  const isToday = ds === todayStr;
                  return (
                    <Fragment key={ds}>
                      <div className="px-2 py-3 text-[10px] font-bold text-center"
                        style={{ borderBottom: '1px solid var(--border)', color: isToday ? 'var(--accent)' : 'var(--text-2)', background: isToday ? 'rgba(37,99,235,0.05)' : 'var(--surface)' }}>
                        {d.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric' })}
                      </div>
                      {mechanics.map(m => {
                        const apts = aptsForMechAndDay(m.id, ds);
                        return (
                          <div key={`${m.id}-${ds}`}
                            style={{ borderLeft: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '6px 8px', minHeight: 64, background: isToday ? 'rgba(37,99,235,0.03)' : 'transparent' }}>
                            {apts.length === 0
                              ? <div className="text-[10px] text-center mt-2" style={{ color: 'var(--text-3)' }}>—</div>
                              : apts.map(apt => <AppointmentChip key={apt.id} apt={apt} onClick={() => setDetail(apt)} />)
                            }
                          </div>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pending list */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Citas pendientes de confirmación</h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
              {appointments.filter(a => a.status === 'pendiente').length} pendientes
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {appointments.filter(a => a.status === 'pendiente').length === 0 ? (
              <p className="px-4 py-6 text-center text-xs" style={{ color: 'var(--text-3)' }}>
                No hay citas pendientes de confirmación ✓
              </p>
            ) : appointments.filter(a => a.status === 'pendiente').map(apt => {
              const mech = mechanics.find(m => m.id === apt.mechanic);
              return (
                <div key={apt.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{apt.clientName}</span>
                      <span className="mono text-[11px] px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}>{apt.plate}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: statusMeta[apt.status].bg, color: statusMeta[apt.status].color }}>
                        {statusMeta[apt.status].label}
                      </span>
                    </div>
                    <div className="text-xs mt-0.5 flex flex-wrap gap-3" style={{ color: 'var(--text-2)' }}>
                      <span>🛠 {apt.service}</span>
                      <span>📅 {apt.date} · {apt.time}</span>
                      <span>👨‍🔧 {mech?.name ?? apt.mechanic}</span>
                      {apt.notes && <span>📝 {apt.notes}</span>}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>📱 {apt.clientPhone}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="btn-success text-xs" onClick={() => confirm(apt)}>✓ Confirmar</button>
                    <button className="btn-danger text-xs" onClick={() => cancel(apt)}>✕ Cancelar</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* NUEVA CITA MODAL */}
      {showNewForm && (
        <div className="modal-overlay" onClick={() => setShowNewForm(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}>
                Registrar Nueva Cita
              </h3>
              <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>Recibida por WhatsApp</span>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Nombre del cliente *</label>
                  <input className="form-input" placeholder="Jenny Vasquez" value={form.clientName} onChange={e => setF('clientName', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Teléfono *</label>
                  <input className="form-input" placeholder="0990122403" value={form.clientPhone} onChange={e => setF('clientPhone', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Placa *</label>
                  <input className="form-input mono" placeholder="GRY-7093" value={form.plate} onChange={e => setF('plate', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Mecánico *</label>
                  <select className="form-select" value={form.mechanic} onChange={e => setF('mechanic', e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Servicio *</label>
                <select className="form-select" value={form.service} onChange={e => setF('service', e.target.value)}>
                  <option value="">Seleccionar servicio...</option>
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Fecha *</label>
                  <input type="date" className="form-input" value={form.date} onChange={e => setF('date', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Hora *</label>
                  <select className="form-select" value={form.time} onChange={e => setF('time', e.target.value)}>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Notas adicionales</label>
                <textarea className="form-input" rows={2} placeholder="Problema reportado por el cliente..." value={form.notes} onChange={e => setF('notes', e.target.value)} />
              </div>
              {formError && <p className="text-xs font-semibold" style={{ color: '#ef4444' }}>{formError}</p>}
            </div>
            <div className="px-5 py-3 flex justify-end gap-2" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <button className="btn-secondary text-xs" onClick={() => setShowNewForm(false)}>Cancelar</button>
              <button className="btn-primary text-xs" onClick={submitNew}>Guardar Cita</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}>
                  Detalle de Cita
                </h3>
                <span className="mono text-[11px]" style={{ color: 'var(--text-3)' }}>{detail.id}</span>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-bold"
                style={{ background: statusMeta[detail.status].bg, color: statusMeta[detail.status].color }}>
                {statusMeta[detail.status].label}
              </span>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm">
              {[
                { l: 'Cliente',    v: detail.clientName  },
                { l: 'Teléfono',   v: detail.clientPhone },
                { l: 'Placa',      v: detail.plate, mono: true },
                { l: 'Servicio',   v: detail.service     },
                { l: 'Fecha/Hora', v: `${detail.date} · ${detail.time}` },
                { l: 'Mecánico',   v: mechanics.find(m => m.id === detail.mechanic)?.name ?? detail.mechanic },
              ].map(f => (
                <div key={f.l} className="flex gap-3">
                  <span className="w-24 shrink-0 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>{f.l}</span>
                  <span className={f.mono ? 'mono font-bold' : 'font-medium'} style={{ color: 'var(--text-1)' }}>{f.v}</span>
                </div>
              ))}
              {detail.notes && (
                <div className="flex gap-3">
                  <span className="w-24 shrink-0 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Notas</span>
                  <span style={{ color: 'var(--text-2)' }}>{detail.notes}</span>
                </div>
              )}
            </div>
            <div className="px-5 py-3 flex flex-wrap justify-end gap-2" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <button className="btn-secondary text-xs" onClick={() => setDetail(null)}>Cerrar</button>
              {detail.status === 'pendiente' && (
                <>
                  <button className="btn-danger text-xs" onClick={() => { cancel(detail); setDetail(null); }}>Cancelar cita</button>
                  <button className="btn-success text-xs" onClick={() => { confirm(detail); setDetail({ ...detail, status: 'confirmada' }); }}>✓ Confirmar</button>
                </>
              )}
              {detail.status === 'confirmada' && (
                <button className="btn-primary text-xs" onClick={() => { onConvertToOS(detail); setDetail(null); }}>
                  + Convertir en Orden de Servicio
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentChip({ apt, onClick }: { apt: Appointment; onClick: () => void }) {
  const m = statusMeta[apt.status];
  return (
    <button onClick={onClick}
      className="w-full text-left px-2 py-1 rounded text-[10px] font-semibold mb-1 truncate transition-opacity hover:opacity-80"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}33` }}>
      {apt.time} · {apt.clientName}
      <div className="font-normal truncate" style={{ color: m.color, opacity: 0.8 }}>{apt.service}</div>
    </button>
  );
}
