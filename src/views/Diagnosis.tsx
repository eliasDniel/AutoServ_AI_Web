import { useState, useMemo } from 'react';
import type { ServiceOrder, Client, Vehicle, ServiceLine } from '../store';

interface DiagnosisResult {
  category: string;
  confidence: number;
  description: string;
  priority: 'Alta' | 'Media' | 'Baja';
  services: { name: string; time: string; price: number }[];
  explanation: string;
}

const sampleResultsBySymptom: DiagnosisResult[] = [
  {
    category: 'Sistema de Suspensión',
    confidence: 87,
    description: 'Falla en amortiguadores delanteros',
    priority: 'Alta',
    services: [
      { name: 'Revisión completa de suspensión', time: '2h', price: 80 },
      { name: 'Cambio de amortiguadores delanteros', time: '3h', price: 180 },
      { name: 'Alineación y balanceo', time: '1h', price: 40 },
    ],
    explanation: 'Los síntomas descritos indican alta probabilidad de falla en amortiguadores delanteros. El modelo detectó patrones consistentes con desgaste de bujes basándose en 600 casos similares. Se recomienda atención prioritaria para garantizar la seguridad del vehículo.',
  },
  {
    category: 'Sistema de Climatización',
    confidence: 72,
    description: 'Falla en compresor o bajo nivel de refrigerante',
    priority: 'Media',
    services: [
      { name: 'Diagnóstico sistema A/C', time: '1h', price: 35 },
      { name: 'Recarga de refrigerante R-134a', time: '0.5h', price: 45 },
      { name: 'Revisión del compresor', time: '1.5h', price: 60 },
    ],
    explanation: 'El síntoma de aire acondicionado que no enfría sugiere bajo nivel de refrigerante o falla en el compresor. El LLM identificó esta correlación con 72% de confianza. Se recomienda diagnóstico electrónico antes de proceder.',
  },
  {
    category: 'Sistema de Monitoreo TPMS',
    confidence: 95,
    description: 'Sensor TPMS activo o llanta con baja presión',
    priority: 'Baja',
    services: [
      { name: 'Calibración de presión de llantas', time: '0.5h', price: 20 },
      { name: 'Revisión y reset de sensor TPMS', time: '0.5h', price: 25 },
    ],
    explanation: 'El testigo de presión de llantas encendido es señal directa del sistema TPMS. Con 95% de confianza se requiere verificar presión en las 4 llantas y resetear sensores tras calibración.',
  },
];

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

  const [selectedOS, setSelectedOS] = useState<string>(activeOrders[0]?.os ?? '');
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<DiagnosisResult[] | null>(null);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [addedToOS, setAddedToOS] = useState(false);

  const currentOrder = useMemo(() => orders.find(o => o.os === selectedOS), [orders, selectedOS]);
  const currentVehicle = useMemo(() => vehicles.find(v => v.id === currentOrder?.vehicleId), [vehicles, currentOrder]);
  const currentClient  = useMemo(() => clients.find(c => c.id === currentOrder?.clientId),   [clients, currentOrder]);

  const handleSelectOS = (os: string) => {
    setSelectedOS(os);
    setResults(null);
    setAdded(new Set());
    setAddedToOS(false);
    const order = orders.find(o => o.os === os);
    if (order?.clientObservations) setSymptoms(order.clientObservations);
    else setSymptoms('');
  };

  const runDiagnosis = () => {
    if (!symptoms.trim()) return;
    setIsAnalyzing(true);
    setResults(null);
    setAdded(new Set());
    setAddedToOS(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setResults(sampleResultsBySymptom);
      setExpanded(0);
    }, 2200);
  };

  const addResultToOrder = (result: DiagnosisResult, idx: number) => {
    if (!currentOrder) return;
    const newServices: ServiceLine[] = result.services.map((s, i) => ({
      code: `IA-${Date.now()}-${i}`,
      name: s.name,
      time: s.time,
      price: s.price,
    }));
    const diagText = `[Diagnóstico IA — ${result.category}]\n${result.description}\nConfianza: ${result.confidence}%\n${result.explanation}`;
    onUpdateOrder({
      ...currentOrder,
      services: [...(currentOrder.services ?? []), ...newServices],
      diagnosisNotes: (currentOrder.diagnosisNotes ? currentOrder.diagnosisNotes + '\n\n' : '') + diagText,
    });
    setAdded(prev => new Set([...prev, idx]));
    setAddedToOS(true);
  };

  const addAllToOrder = () => {
    if (!currentOrder || !results) return;
    let allServices: ServiceLine[] = [];
    let allNotes = '';
    results.forEach(r => {
      allServices = [...allServices, ...r.services.map((s, i) => ({
        code: `IA-${Date.now()}-${i}`,
        name: s.name,
        time: s.time,
        price: s.price,
      }))];
      allNotes += `[${r.category}] ${r.description} (${r.confidence}%)\n`;
    });
    onUpdateOrder({
      ...currentOrder,
      services: [...(currentOrder.services ?? []), ...allServices],
      diagnosisNotes: `Diagnóstico IA completo — ${new Date().toLocaleString('es-EC')}\n\n${allNotes}`,
    });
    setAdded(new Set(results.map((_, i) => i)));
    setAddedToOS(true);
  };

  const demoText = 'Ruidos en suspensión delantera derecha al pasar por baches. El aire acondicionado no enfría bien. Testigo de presión de llantas encendido.';

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--surface-2)' }}>
      <div className="p-5 space-y-4 w-full">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Diagnóstico Asistido por IA</h1>
            <p className="page-subtitle">Random Forest + LLM · 600 casos de entrenamiento · 10 categorías de falla</p>
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
                  {['Extrayendo síntomas del texto...', 'Clasificando con Random Forest (150 árboles)...', 'Generando explicación con LLM...'].map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--accent)' }}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ background: 'var(--accent)', fontSize: 9 }}>{i + 1}</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
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
                {added.size < results.length && (
                  <button className="btn-primary text-xs" onClick={addAllToOrder}>
                    + Agregar todo a OS {selectedOS.replace('OS-2024-', '#')}
                  </button>
                )}
              </div>
            </div>

            {results.map((result, idx) => {
              const m = priorityMeta[result.priority];
              const isAdded = added.has(idx);
              return (
                <div key={idx} className="card overflow-hidden">
                  <button
                    className="w-full px-4 py-3 flex items-center gap-4 text-left transition-colors"
                    style={{ background: expanded === idx ? 'var(--surface-2)' : 'var(--surface)' }}
                    onClick={() => setExpanded(expanded === idx ? null : idx)}>
                    {/* Confidence */}
                    <div className="w-12 text-center shrink-0">
                      <div className="text-xl font-bold" style={{ fontFamily: 'DM Sans, sans-serif', color: m.color }}>
                        {result.confidence}%
                      </div>
                      <div className="text-[9px]" style={{ color: 'var(--text-3)' }}>confianza</div>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>{result.category}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                          style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}>
                          Prioridad {result.priority}
                        </span>
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
                        <div className="h-1 rounded-full" style={{ width: `${result.confidence}%`, background: m.color }} />
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
                      <div>
                        <p className="section-title mb-2">Servicios Recomendados</p>
                        <div className="space-y-1.5">
                          {result.services.map(s => (
                            <div key={s.name} className="flex items-center justify-between text-xs px-3 py-2 rounded"
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
                            ${result.services.reduce((s, r) => s + r.price, 0).toFixed(2)}
                          </span>
                        </p>
                      </div>
                      {/* AI explanation */}
                      <div className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
                            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14"/>
                          </svg>
                          <span className="section-title">Explicación generada por IA</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{result.explanation}</p>
                      </div>
                      {/* Actions */}
                      <div className="flex gap-2">
                        {isAdded
                          ? <span className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded"
                              style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Agregado a {selectedOS.replace('OS-2024-', 'OS #')}
                            </span>
                          : <button className="btn-primary text-xs" onClick={() => addResultToOrder(result, idx)}>
                              + Agregar a {selectedOS.replace('OS-2024-', 'OS #')}
                            </button>
                        }
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
