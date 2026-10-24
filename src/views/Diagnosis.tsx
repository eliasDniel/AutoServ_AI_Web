import { useState, useMemo } from 'react';
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
}

export default function Diagnosis({ orders, clients, vehicles, onUpdateOrder }: DiagnosisProps) {
  const activeOrders = orders.filter(o => o.status !== 'terminada');

  const primera = activeOrders[0];
  const [selectedOS, setSelectedOS] = useState<string>(primera?.os ?? '');
  const [symptoms, setSymptoms] = useState(primera?.diagnosis?.texto || primera?.clientObservations || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<DiagnosisCard[] | null>(primera?.diagnosis?.resultados ?? null);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [addedToOS, setAddedToOS] = useState(false);
  const [error, setError] = useState('');

  const currentOrder = useMemo(() => orders.find(o => o.os === selectedOS), [orders, selectedOS]);
  const currentVehicle = useMemo(() => vehicles.find(v => v.id === currentOrder?.vehicleId), [vehicles, currentOrder]);
  const currentClient  = useMemo(() => clients.find(c => c.id === currentOrder?.clientId),   [clients, currentOrder]);

  const handleSelectOS = (os: string) => {
    setSelectedOS(os);
    setAdded(new Set());
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
    setAdded(new Set());
    setAddedToOS(false);
    setError('');
    try {
      const respuesta = await diagnosticar(symptoms.trim());
      const tarjetas = respuesta.resultados ?? [];
      const notas = tarjetas
        .map((item) => `[${item.category ?? item.estado}] ${item.description}`)
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

  const serviciosNuevos = (order: ServiceOrder, lines: DiagnosisCard['services']): ServiceLine[] => {
    const existentes = new Set((order.services ?? []).map((linea) => linea.code));
    return lines
      .filter((linea) => linea.code && !existentes.has(linea.code))
      .map((linea) => ({
        code: linea.code,
        name: linea.name,
        time: linea.time,
        price: linea.price,
      }));
  };

  const addResultToOrder = async (result: DiagnosisCard, idx: number) => {
    if (!currentOrder || !results) return;
    const confianza = result.confidence == null ? 'regla' : `${result.confidence}%`;
    const diagText = `[Diagnóstico — ${result.category}]\n${result.description}\nConfianza: ${confianza}\n${result.explanation}`;
    try {
      await guardarDiagnostico(
        results,
        [...(currentOrder.services ?? []), ...serviciosNuevos(currentOrder, result.services)],
        (currentOrder.diagnosisNotes ? currentOrder.diagnosisNotes + '\n\n' : '') + diagText,
      );
      setAdded(prev => new Set([...prev, idx]));
      setAddedToOS(true);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar el servicio a la orden.');
    }
  };

  const addAllToOrder = async () => {
    if (!currentOrder || !results) return;
    const vistos = new Set((currentOrder.services ?? []).map((linea) => linea.code));
    const nuevos: ServiceLine[] = [];
    results.forEach((item) => {
      item.services.forEach((linea) => {
        if (!linea.code || vistos.has(linea.code)) return;
        vistos.add(linea.code);
        nuevos.push({ code: linea.code, name: linea.name, time: linea.time, price: linea.price });
      });
    });
    const allNotes = results
      .map((item) => `[${item.category ?? item.estado}] ${item.description}`)
      .join('\n');
    try {
      await guardarDiagnostico(
        results,
        [...(currentOrder.services ?? []), ...nuevos],
        `Diagnóstico — ${new Date().toLocaleString('es-EC')}\n\n${allNotes}`,
      );
      setAdded(new Set(results.map((_, i) => i)));
      setAddedToOS(true);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar los servicios a la orden.');
    }
  };

  const demoText = 'Ruidos en suspensión delantera derecha al pasar por baches. El aire acondicionado no enfría bien. Testigo de presión de llantas encendido.';

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--surface-2)' }}>
      <div className="p-5 space-y-4 w-full">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Diagnóstico Asistido por IA</h1>
            <p className="page-subtitle">Random Forest · 42.175 quejas · 6 categorías y climatización por regla</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
            <span className="text-xs font-semibold" style={{ color: '#22c55e' }}>Modelo activo</span>
          </div>
        </div>

        {/* OS Selector */}
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
              <select
                className="form-select"
                value={selectedOS}
                onChange={e => handleSelectOS(e.target.value)}
              >
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
                { l: 'Motor', v: currentVehicle.engine },
                { l: 'Combustible', v: currentVehicle.fuel },
                { l: 'Transmisión', v: currentVehicle.transmission },
                { l: 'Kilometraje', v: `${(currentVehicle.km ?? 0).toLocaleString()} km` },
                { l: 'VIN', v: currentVehicle.vin },
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

        {/* Symptoms input */}
        <div className="card">
          <div className="card-header"><span className="card-title">Síntomas del Cliente / Motivo de Visita</span></div>
          <div className="p-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <textarea
                  className="form-input resize-none"
                  style={{ height: 100 }}
                  placeholder="Describe los síntomas del vehículo tal como los refiere el cliente..."
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                />
                <div className="flex gap-3 mt-2 items-center">
                  <button className="text-xs font-semibold" style={{ color: 'var(--accent)' }}
                    onClick={() => setSymptoms(currentOrder?.clientObservations || demoText)}>
                    Cargar desde OS
                  </button>
                  <span style={{ color: 'var(--border-strong)' }}>|</span>
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>{symptoms.length} caracteres</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  className="btn-primary px-5"
                  onClick={runDiagnosis}
                  disabled={isAnalyzing || !symptoms.trim() || !selectedOS}
                  style={{ opacity: isAnalyzing || !symptoms.trim() || !selectedOS ? 0.5 : 1 }}>
                  {isAnalyzing
                    ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />Analizando...</>
                    : <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="inline mr-1.5">
                          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14"/>
                        </svg>
                        Analizar con IA
                      </>
                  }
                </button>
                <button className="btn-secondary text-xs"
                  onClick={() => { setSymptoms(''); setResults(null); setAdded(new Set()); setAddedToOS(false); }}>
                  Limpiar
                </button>
              </div>
            </div>

            {isAnalyzing && (
              <div className="mt-4 rounded-lg p-4" style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Procesando con modelo Random Forest...</span>
                </div>
                <div className="space-y-1.5">
                  {['Buscando síntomas en el catálogo...', 'Clasificando con Random Forest...', 'Armando servicios y explicación...'].map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--accent)' }}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ background: 'var(--accent)', fontSize: 9 }}>{i + 1}</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {error && (
              <p className="text-xs mt-3 font-semibold" style={{ color: '#ef4444' }}>{error}</p>
            )}
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="section-title">Resultados — </span>
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>{results.length} posibles fallas · OS: <span className="mono font-semibold" style={{ color: 'var(--accent)' }}>{selectedOS}</span></span>
              </div>
              <div className="flex items-center gap-3">
                {addedToOS && (
                  <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#22c55e' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Agregado a la orden
                  </span>
                )}
                {results.some((item, idx) => (item.services?.length ?? 0) > 0 && !added.has(idx)) && (
                  <button className="btn-primary text-xs" onClick={addAllToOrder}>
                    + Agregar todo a {selectedOS}
                  </button>
                )}
              </div>
            </div>

            {results.map((result, idx) => {
              const m = (result.priority && priorityMeta[result.priority]) || {
                color: 'var(--text-2)',
                bg: 'var(--surface-3)',
                border: 'var(--border)',
              };
              const isAdded = added.has(idx);
              const servicios = result.services ?? [];
              const confianza = result.confidence == null
                ? (result.category ? 'Regla' : '—')
                : `${result.confidence}%`;
              return (
                <div key={idx} className="card overflow-hidden">
                  <button
                    className="w-full px-4 py-3 flex items-center gap-4 text-left transition-colors"
                    style={{ background: expanded === idx ? 'var(--surface-2)' : 'var(--surface)' }}
                    onClick={() => setExpanded(expanded === idx ? null : idx)}>
                    {/* Confidence */}
                    <div className="w-12 text-center shrink-0">
                      <div className={result.confidence == null ? 'text-sm font-bold' : 'text-xl font-bold'} style={{ fontFamily: 'DM Sans, sans-serif', color: m.color }}>
                        {confianza}
                      </div>
                      <div className="text-[9px]" style={{ color: 'var(--text-3)' }}>confianza</div>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>{result.category ?? result.estado ?? 'Sin categoría'}</span>
                        {result.priority && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                            style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}>
                            Prioridad {result.priority}
                          </span>
                        )}
                        {isAdded && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"
                            style={{ color: '#22c55e', background: 'rgba(34,197,94,0.1)' }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            En orden
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{result.description}</div>
                      <div className="mt-1.5 rounded-full h-1" style={{ background: 'var(--border)', width: 180 }}>
                        <div className="h-1 rounded-full" style={{ width: `${result.confidence ?? (result.category ? 100 : 0)}%`, background: m.color }} />
                      </div>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round"
                      style={{ transform: expanded === idx ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {expanded === idx && (
                    <div className="px-4 py-4 space-y-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                      {/* Services */}
                      {servicios.length > 0 && (
                      <div>
                        <p className="section-title mb-2">Servicios Recomendados</p>
                        <div className="space-y-1.5">
                          {servicios.map(s => (
                            <div key={s.code} className="flex items-center justify-between text-xs px-3 py-2 rounded"
                              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                              <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{s.name}</span>
                              <div className="flex items-center gap-4" style={{ color: 'var(--text-2)' }}>
                                <span>{s.time}</span>
                                <span className="font-bold mono" style={{ color: 'var(--text-1)' }}>${s.price.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs mt-1.5 font-semibold text-right" style={{ color: 'var(--text-2)' }}>
                          Total estimado: <span className="mono" style={{ color: 'var(--text-1)' }}>
                            ${servicios.reduce((s, r) => s + r.price, 0).toFixed(2)}
                          </span>
                        </p>
                      </div>
                      )}
                      {/* AI explanation */}
                      <div className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
                            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14"/>
                          </svg>
                          <span className="section-title">Explicación del diagnóstico</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{result.explanation}</p>
                      </div>
                      {/* Actions */}
                      <div className="flex gap-2">
                        {servicios.length > 0 && (isAdded
                          ? <span className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded"
                              style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Agregado a {selectedOS}
                            </span>
                          : <button className="btn-primary text-xs" onClick={() => addResultToOrder(result, idx)}>
                              + Agregar a {selectedOS}
                            </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
