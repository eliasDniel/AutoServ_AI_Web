import { useMemo, useState } from 'react';
import type { ServiceOrder, Client, Vehicle, ServiceLine, DiagnosisCard } from '../store';
import { diagnosticar } from '../../utils/recepcion';

const priorityMeta: Record<string, { color: string; bg: string; border: string }> = {
  Alta:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)' },
  Media: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)' },
  Baja:  { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)' },
};

interface DiagnosisProps {
  orders: ServiceOrder[];
  clients: Client[];
  vehicles: Vehicle[];
  onUpdateOrder: (updated: ServiceOrder) => void;
  initialOs?: string;
}

function serviceKey(cardIdx: number, code: string) {
  return `${cardIdx}::${code}`;
}

export default function Diagnosis({ orders, clients, vehicles, onUpdateOrder, initialOs }: DiagnosisProps) {
  const activeOrders = orders.filter(o => o.status !== 'terminada');

  const primera = activeOrders.find(o => o.os === initialOs) ?? activeOrders[0];
  const [selectedOS, setSelectedOS] = useState<string>(primera?.os ?? '');
  const [symptoms, setSymptoms] = useState(primera?.diagnosis?.texto || primera?.clientObservations || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<DiagnosisCard[] | null>(primera?.diagnosis?.resultados ?? null);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addedToOS, setAddedToOS] = useState(false);
  const [error, setError] = useState('');

  const currentOrder = useMemo(() => orders.find(o => o.os === selectedOS), [orders, selectedOS]);
  const currentVehicle = useMemo(() => vehicles.find(v => v.id === currentOrder?.vehicleId), [vehicles, currentOrder]);
  const currentClient  = useMemo(() => clients.find(c => c.id === currentOrder?.clientId),   [clients, currentOrder]);
  const km = currentVehicle?.km ?? 0;

  const preventivos = useMemo(
    () => (results ?? []).filter(r => (r.tipo ?? 'correctivo') === 'preventivo'),
    [results],
  );
  const correctivos = useMemo(
    () => (results ?? []).filter(r => (r.tipo ?? 'correctivo') !== 'preventivo'),
    [results],
  );

  const handleSelectOS = (os: string) => {
    setSelectedOS(os);
    setSelected(new Set());
    setAddedToOS(false);
    setError('');
    const order = orders.find(o => o.os === os);
    if (order?.diagnosis) {
      setSymptoms(order.diagnosis.texto);
      setResults(order.diagnosis.resultados);
      return;
    }
    setResults(null);
    setSymptoms(order?.clientObservations || '');
  };

  const guardarDiagnostico = async (tarjetas: DiagnosisCard[], services?: ServiceLine[], notes?: string) => {
    if (!currentOrder) return;
    await Promise.resolve(onUpdateOrder({
      ...currentOrder,
      services: services ?? currentOrder.services,
      diagnosis: { texto: symptoms.trim(), resultados: tarjetas },
      diagnosisNotes: notes ?? currentOrder.diagnosisNotes,
    }));
  };

  const runDiagnosis = async () => {
    if (!symptoms.trim() || !currentOrder) return;
    setIsAnalyzing(true);
    setResults(null);
    setSelected(new Set());
    setAddedToOS(false);
    setError('');
    try {
      const respuesta = await diagnosticar(symptoms.trim(), km);
      const tarjetas = respuesta.resultados
        ?? [...(respuesta.preventivos ?? []), ...(respuesta.correctivos ?? [])];
      const notas = tarjetas
        .map((item) => `[${item.tipo ?? 'correctivo'} · ${item.category ?? item.estado}] ${item.description}`)
        .join('\n');
      setResults(tarjetas);
      setExpanded(0);
      await guardarDiagnostico(tarjetas, undefined, notas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo calcular el diagnóstico.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleService = (cardIdx: number, code: string) => {
    const key = serviceKey(cardIdx, code);
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleCardServices = (card: DiagnosisCard, cardIdx: number, on: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      for (const s of card.services ?? []) {
        if (!s.code) continue;
        const key = serviceKey(cardIdx, s.code);
        if (on) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  };

  const addSelectedToOrder = async () => {
    if (!currentOrder || !results || selected.size === 0) return;
    const existentes = new Set((currentOrder.services ?? []).map((linea) => linea.code));
    const nuevos: ServiceLine[] = [];
    results.forEach((card, cardIdx) => {
      (card.services ?? []).forEach((linea) => {
        if (!linea.code || !selected.has(serviceKey(cardIdx, linea.code))) return;
        if (existentes.has(linea.code)) return;
        existentes.add(linea.code);
        nuevos.push({
          code: linea.code,
          name: linea.name,
          time: linea.time,
          price: linea.price,
        });
      });
    });
    if (nuevos.length === 0) {
      setError('Los servicios seleccionados ya están en la orden.');
      return;
    }
    const notas = results
      .map((item) => `[${item.tipo ?? 'correctivo'} · ${item.category ?? item.estado}] ${item.description}`)
      .join('\n');
    try {
      await guardarDiagnostico(
        results,
        [...(currentOrder.services ?? []), ...nuevos],
        `Diagnóstico aprobado por el cliente — ${new Date().toLocaleString('es-EC')}\n\n${notas}`,
      );
      setAddedToOS(true);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar los servicios a la orden.');
    }
  };

  const renderCard = (result: DiagnosisCard, idx: number) => {
    const m = (result.priority && priorityMeta[result.priority]) || {
      color: 'var(--text-2)',
      bg: 'var(--surface-3)',
      border: 'var(--border)',
    };
    const servicios = result.services ?? [];
    const allSelected = servicios.length > 0 && servicios.every(s => selected.has(serviceKey(idx, s.code)));
    const confianza = result.confidence == null
      ? (result.tipo === 'preventivo' ? 'Km' : result.category ? 'Regla' : '—')
      : `${result.confidence}%`;

    return (
      <div key={idx} className="card overflow-hidden">
        <button
          className="w-full px-4 py-3 flex items-center gap-4 text-left transition-colors"
          style={{ background: expanded === idx ? 'var(--surface-2)' : 'var(--surface)' }}
          onClick={() => setExpanded(expanded === idx ? null : idx)}>
          <div className="w-12 text-center shrink-0">
            <div className={result.confidence == null ? 'text-sm font-bold' : 'text-xl font-bold'} style={{ fontFamily: 'DM Sans, sans-serif', color: m.color }}>
              {confianza}
            </div>
            <div className="text-[9px]" style={{ color: 'var(--text-3)' }}>
              {result.tipo === 'preventivo' ? 'preventivo' : 'confianza'}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>{result.category ?? result.estado ?? 'Sin categoría'}</span>
              {result.priority && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}>
                  Prioridad {result.priority}
                </span>
              )}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{result.description}</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round"
            style={{ transform: expanded === idx ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {expanded === idx && (
          <div className="px-4 py-4 space-y-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            {servicios.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="section-title mb-0">Servicios recomendados — el cliente decide</p>
                  <button
                    className="text-[10px] font-semibold"
                    style={{ color: 'var(--accent)' }}
                    onClick={() => toggleCardServices(result, idx, !allSelected)}>
                    {allSelected ? 'Quitar todos' : 'Marcar todos'}
                  </button>
                </div>
                <div className="space-y-1.5">
                  {servicios.map(s => {
                    const key = serviceKey(idx, s.code);
                    const checked = selected.has(key);
                    return (
                      <label
                        key={s.code}
                        className="flex items-center justify-between text-xs px-3 py-2 rounded cursor-pointer"
                        style={{
                          background: checked ? 'rgba(37,99,235,0.08)' : 'var(--surface)',
                          border: `1px solid ${checked ? 'rgba(37,99,235,0.35)' : 'var(--border)'}`,
                        }}>
                        <span className="flex items-center gap-2" style={{ color: 'var(--text-1)', fontWeight: 500 }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleService(idx, s.code)}
                          />
                          {s.name}
                        </span>
                        <span className="flex items-center gap-4" style={{ color: 'var(--text-2)' }}>
                          <span>{s.time}</span>
                          <span className="font-bold mono" style={{ color: 'var(--text-1)' }}>${s.price.toFixed(2)}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="section-title mb-2">Explicación</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{result.explanation}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--surface-2)' }}>
      <div className="p-5 space-y-4 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Diagnóstico Asistido por IA</h1>
            <p className="page-subtitle">Preventivos por km · Correctivos por síntomas · Aprobación del cliente</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
            <span className="text-xs font-semibold" style={{ color: '#22c55e' }}>Modelo activo</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Orden de Servicio</span>
            {currentOrder && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent)' }}>
                {currentOrder.status === 'recepcion' ? 'En Recepción' : currentOrder.status === 'en_taller' ? 'En Taller' : 'Terminada'}
              </span>
            )}
          </div>
          <div className="p-4 grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Nro. OS</label>
              <select className="form-select" value={selectedOS} onChange={e => handleSelectOS(e.target.value)}>
                <option value="">— Seleccionar orden —</option>
                {activeOrders.map(o => (
                  <option key={o.os} value={o.os}>{o.os}</option>
                ))}
              </select>
            </div>
            {currentClient && (
              <div>
                <label className="form-label">Cliente</label>
                <input className="form-input" value={currentClient.name} readOnly onChange={() => {}} />
              </div>
            )}
            {currentVehicle && (
              <div>
                <label className="form-label">Vehículo</label>
                <input
                  className="form-input mono"
                  value={`${currentVehicle.brand} ${currentVehicle.model} ${currentVehicle.year} · ${currentVehicle.plate}`}
                  readOnly
                  onChange={() => {}}
                />
              </div>
            )}
          </div>
          {currentVehicle && (
            <div className="px-4 pb-4 flex gap-3 flex-wrap">
              {[
                { l: 'Kilometraje', v: `${km.toLocaleString()} km` },
                { l: 'Motor', v: currentVehicle.engine },
                { l: 'Combustible', v: currentVehicle.fuel },
                { l: 'Transmisión', v: currentVehicle.transmission },
              ].filter(f => f.v).map(f => (
                <div key={f.l} className="text-xs px-3 py-1.5 rounded"
                  style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-3)' }}>{f.l}: </span>
                  <span className="font-semibold mono" style={{ color: 'var(--text-1)' }}>{f.v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Novedades del cliente / síntomas</span></div>
          <div className="p-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <textarea
                  className="form-input resize-none"
                  style={{ height: 100 }}
                  placeholder="Describe las novedades o síntomas que refiere el cliente..."
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                />
                <div className="flex gap-3 mt-2 items-center">
                  <button className="text-xs font-semibold" style={{ color: 'var(--accent)' }}
                    onClick={() => setSymptoms(currentOrder?.clientObservations || '')}>
                    Cargar desde recepción
                  </button>
                  <span style={{ color: 'var(--border-strong)' }}>|</span>
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                    Km ingreso: <strong>{km.toLocaleString()}</strong>
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  className="btn-primary px-5"
                  onClick={runDiagnosis}
                  disabled={isAnalyzing || !symptoms.trim() || !selectedOS}
                  style={{ opacity: isAnalyzing || !symptoms.trim() || !selectedOS ? 0.5 : 1 }}>
                  {isAnalyzing ? 'Analizando...' : 'Analizar con IA'}
                </button>
                <button className="btn-secondary text-xs"
                  onClick={() => { setSymptoms(''); setResults(null); setSelected(new Set()); setAddedToOS(false); }}>
                  Limpiar
                </button>
              </div>
            </div>
            {error && <p className="text-xs mt-3 font-semibold" style={{ color: '#ef4444' }}>{error}</p>}
          </div>
        </div>

        {results && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="section-title">Recomendaciones — </span>
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                  {preventivos.length} preventivos · {correctivos.length} correctivos · OS{' '}
                  <span className="mono font-semibold" style={{ color: 'var(--accent)' }}>{selectedOS}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                {addedToOS && (
                  <span className="text-xs font-semibold" style={{ color: '#22c55e' }}>✓ Agregados a la orden</span>
                )}
                <button
                  className="btn-primary text-xs"
                  disabled={selected.size === 0}
                  style={{ opacity: selected.size === 0 ? 0.5 : 1 }}
                  onClick={() => { void addSelectedToOrder(); }}>
                  + Agregar seleccionados ({selected.size})
                </button>
              </div>
            </div>

            {preventivos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
                  Mantenimientos preventivos (por kilometraje)
                </h3>
                {preventivos.map((card) => renderCard(card, results.indexOf(card)))}
              </div>
            )}

            {correctivos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
                  Servicios correctivos (por síntomas)
                </h3>
                {correctivos.map((card) => renderCard(card, results.indexOf(card)))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
