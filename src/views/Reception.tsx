import { useState, useEffect, useRef } from 'react';
import type { ServiceOrder, Client, Vehicle, InventoryItem } from '../store';
import { catalogServices } from '../store';

const tabs = [
  { id: 'datos', label: 'Datos del Cliente y Vehículo', icon: '👤' },
  { id: 'recepcion', label: 'Recepción del Vehículo', icon: '🚗' },
  { id: 'servicios', label: 'Servicios Solicitados', icon: '🔧' },
  { id: 'repuestos', label: 'Repuestos', icon: '⚙️' },
  { id: 'resumen', label: 'Resumen', icon: '📋' },
];

const partsLeft = ['Parabrisas', 'Espejo Izq.', 'Faro Izq.', 'Llanta Del. Izq.', 'Puerta Izq.', 'Puerta Tras. Izq.'];
const partsRight = ['Parabrisas Tras.', 'Espejo Der.', 'Faro Der.', 'Llanta Del. Der.', 'Puerta Der.', 'Puerta Tras. Der.', 'Parachoques Tras.'];

function FuelGauge({ level, onChange }: { level: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <svg viewBox="0 0 120 70" className="w-28 h-16 mx-auto block">
        <path d="M10 65 A50 50 0 0 1 110 65" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
        <path d="M10 65 A50 50 0 0 1 110 65" fill="none"
          stroke={level < 25 ? '#ef4444' : level < 50 ? '#f59e0b' : '#22c55e'}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(level / 100) * 157} 157`} />
        <text x="10" y="68" fontSize="8" fill="#94a3b8">E</text>
        <text x="105" y="68" fontSize="8" fill="#94a3b8">F</text>
        <line x1="60" y1="65"
          x2={60 + 35 * Math.cos(((-90 + (level / 100) * 180 - 90) * Math.PI) / 180)}
          y2={65 + 35 * Math.sin(((-90 + (level / 100) * 180 - 90) * Math.PI) / 180)}
          stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
        <circle cx="60" cy="65" r="4" fill="#1e293b" />
      </svg>
      <input type="range" min={0} max={100} value={level} onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-blue-600" />
      <div className="text-center text-xs text-slate-500">{level}%</div>
    </div>
  );
}

function CarSVG({ parts, onToggle }: { parts: Record<string, boolean>; onToggle: (p: string) => void }) {
  const zones = [
    { id: 'Parabrisas', cx: 100, cy: 68, r: 18 }, { id: 'Parabrisas Tras.', cx: 100, cy: 232, r: 16 },
    { id: 'Espejo Izq.', cx: 48, cy: 90, r: 10 }, { id: 'Espejo Der.', cx: 152, cy: 90, r: 10 },
    { id: 'Faro Izq.', cx: 60, cy: 52, r: 9 }, { id: 'Faro Der.', cx: 140, cy: 52, r: 9 },
    { id: 'Puerta Izq.', cx: 44, cy: 148, r: 13 }, { id: 'Puerta Der.', cx: 156, cy: 148, r: 13 },
    { id: 'Puerta Tras. Izq.', cx: 44, cy: 190, r: 13 }, { id: 'Puerta Tras. Der.', cx: 156, cy: 190, r: 13 },
    { id: 'Llanta Del. Izq.', cx: 40, cy: 105, r: 10 }, { id: 'Llanta Del. Der.', cx: 160, cy: 105, r: 10 },
    { id: 'Parachoques Tras.', cx: 100, cy: 262, r: 13 },
  ];
  return (
    <svg viewBox="0 0 200 300" className="w-36 h-52 mx-auto">
      <ellipse cx="100" cy="155" rx="58" ry="118" fill="#e8edf5" stroke="#94a3b8" strokeWidth="1.5" />
      <ellipse cx="100" cy="68" rx="40" ry="30" fill="#d1dce8" stroke="#94a3b8" strokeWidth="1" />
      <ellipse cx="100" cy="240" rx="36" ry="22" fill="#d1dce8" stroke="#94a3b8" strokeWidth="1" />
      <ellipse cx="100" cy="80" rx="28" ry="16" fill="#bfdbfe" opacity="0.8" />
      <ellipse cx="100" cy="228" rx="24" ry="12" fill="#bfdbfe" opacity="0.8" />
      {[{ cx: 42, cy: 108 }, { cx: 158, cy: 108 }, { cx: 42, cy: 200 }, { cx: 158, cy: 200 }].map((w, i) => (
        <g key={i}><ellipse cx={w.cx} cy={w.cy} rx="13" ry="18" fill="#475569" /><ellipse cx={w.cx} cy={w.cy} rx="7" ry="10" fill="#94a3b8" /></g>
      ))}
      {zones.map(z => (
        <circle key={z.id} cx={z.cx} cy={z.cy} r={z.r}
          fill={parts[z.id] === false ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.25)'}
          stroke={parts[z.id] === false ? '#ef4444' : '#22c55e'} strokeWidth="1.5"
          className="cursor-pointer" onClick={() => onToggle(z.id)} />
      ))}
    </svg>
  );
}

interface ReceptionProps {
  order: ServiceOrder;
  client: Client;
  vehicle: Vehicle;
  inventory: InventoryItem[];
  allOrders: ServiceOrder[];
  onSave: (
    updated: ServiceOrder,
    client?: Client,
    vehicle?: Vehicle,
  ) => Promise<ServiceOrder>;
  onAdvance: (os: string, status?: ServiceOrder['status']) => void;
  onCreateClientVehicle?: (c: Client, v: Vehicle, osId: string) => void;
  onUpdateClientVehicle?: (c: Client, v: Vehicle) => void;
}

export default function Reception({ order, client, vehicle, inventory, allOrders, onSave, onAdvance }: ReceptionProps) {
  const isNew = client.id === '';

  const [activeTab, setActiveTab] = useState('datos');
  const [draft, setDraft] = useState<ServiceOrder>({ services: [], usedParts: [], ...order });
  const [saved, setSaved] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigLastPos = useRef<{ x: number; y: number } | null>(null);
  const savingRef = useRef(false);

  // Editable client/vehicle for new orders
  const [draftClient, setDraftClient] = useState<Client>({
    id: '', name: '', phone: '', email: '', address: '', city: '', ...client,
  });
  const [draftVehicle, setDraftVehicle] = useState<Vehicle>({
    id: '', clientId: '', plate: '', brand: '', model: '', year: '', color: '',
    vin: '', engine: '', fuel: '', transmission: '', km: vehicle.km ?? 0, ...vehicle,
  });

  useEffect(() => {
    setDraft({ services: [], usedParts: [], ...order });
    setDraftClient({ id: '', name: '', phone: '', email: '', address: '', city: '', ...client });
    setDraftVehicle({ id: '', clientId: '', plate: '', brand: '', model: '', year: '', color: '', vin: '', engine: '', fuel: '', transmission: '', km: vehicle.km ?? 0, ...vehicle });
    setActiveTab('datos');
    setSaved(false);
    setVehiclePhoto(null);
    setHasSig(false);
  }, [order.os]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVehiclePhoto(URL.createObjectURL(file));
  };

  const getSigPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const src = 'touches' in e ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * (canvas.width / rect.width), y: (src.clientY - rect.top) * (canvas.height / rect.height) };
  };

  const sigStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasSig(true);
    const pos = getSigPos(e);
    sigLastPos.current = pos;
    const ctx = sigCanvasRef.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const sigMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || !sigLastPos.current) return;
    const pos = getSigPos(e);
    const ctx = sigCanvasRef.current!.getContext('2d')!;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    sigLastPos.current = pos;
  };

  const sigEnd = () => { setIsDrawing(false); sigLastPos.current = null; };

  const clearSig = () => {
    const canvas = sigCanvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
    update({ signature: undefined });
  };

  const printOS = () => window.print();

  const update = (patch: Partial<ServiceOrder>) => {
    setDraft(prev => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const togglePart = (p: string) => update({ parts: { ...draft.parts, [p]: !draft.parts[p] } });

  const persist = async () => {
    if (savingRef.current) return draft;
    savingRef.current = true;
    try {
      const firma = hasSig && sigCanvasRef.current
        ? sigCanvasRef.current.toDataURL('image/png')
        : draft.signature;
      const next: ServiceOrder = {
        ...draft,
        signature: firma,
        authSigned: draft.authSigned || Boolean(firma),
      };
      const savedOrder = await onSave(next, draftClient, draftVehicle);
      setDraft(savedOrder);
      setDraftClient(prev => ({ ...prev, id: savedOrder.clientId }));
      setDraftVehicle(prev => ({
        ...prev,
        id: savedOrder.vehicleId,
        clientId: savedOrder.clientId,
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return savedOrder;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar la recepción.';
      window.alert(message);
      return draft;
    } finally {
      savingRef.current = false;
    }
  };

  const save = () => {
    void persist();
  };

  const saveAndAdvance = async () => {
    const savedOrder = await persist();
    if (savedOrder.os.startsWith('OS-2024-')) return;
    onAdvance(savedOrder.os, savedOrder.status);
  };

  const removeService = (code: string) => update({ services: draft.services.filter(s => s.code !== code) });

  const addService = (svc: typeof catalogServices[0]) => {
    if (draft.services.find(s => s.code === svc.code)) return;
    update({ services: [...draft.services, svc] });
    setShowServiceModal(false);
  };

  const toggleUsedPart = (code: string) =>
    update({ usedParts: draft.usedParts.map(p => p.code === code ? { ...p, used: !p.used } : p) });

  const addInventoryPart = (item: InventoryItem) => {
    if (draft.usedParts.find(p => p.code === item.code)) return;
    update({ usedParts: [...draft.usedParts, { code: item.code, name: item.name, qty: 1, price: item.price, used: false }] });
  };

  const removeUsedPart = (code: string) => update({ usedParts: draft.usedParts.filter(p => p.code !== code) });

  const total = (draft.services ?? []).reduce((s, v) => s + v.price, 0) +
    (draft.usedParts ?? []).filter(p => p.used).reduce((s, p) => s + p.price * p.qty, 0);

  const vehicleHistory = allOrders.filter(o => o.vehicleId === vehicle.id && o.os !== draft.os);

  const statusMap: Record<string, string> = { recepcion: 'RECEPCIÓN', en_taller: 'EN TALLER', terminada: 'TERMINADA' };
  const statusClass: Record<string, string> = { recepcion: 'status-recepcion', en_taller: 'status-taller', terminada: 'status-terminada' };
  const nextLabel: Record<string, string> = { recepcion: 'Enviar a Taller', en_taller: 'Marcar Terminada', terminada: '' };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-bold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          Orden de Servicio / Recepción de Vehículo
        </h1>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span><span className="font-semibold text-slate-700">OS:</span> {draft.os}</span>
          <span><span className="font-semibold text-slate-700">Fecha:</span> {draft.date}</span>
          <span className={`status-badge ${statusClass[draft.status]}`}>{statusMap[draft.status]}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-3 flex gap-0.5 shrink-0 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">

        {/* TAB: Datos */}
        {activeTab === 'datos' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Client */}
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
                  Datos del Cliente
                  {isNew && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>Nueva orden — completa los datos</span>}
                </h3>
                <div className="space-y-2.5">
                  {([
                    { label: 'Nombre completo', key: 'name' as keyof Client },
                    { label: 'Teléfono', key: 'phone' as keyof Client },
                    { label: 'Email', key: 'email' as keyof Client },
                    { label: 'Dirección', key: 'address' as keyof Client },
                    { label: 'Ciudad', key: 'city' as keyof Client },
                  ] as { label: string; key: keyof Client }[]).map(f => (
                    <div key={f.label}>
                      <label className="form-label">{f.label}</label>
                      <input
                        className="form-input"
                        value={draftClient[f.key] as string}
                        onChange={e => setDraftClient(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.label}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Vehicle */}
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 pb-2 border-b border-slate-100">Datos del Vehículo</h3>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { label: 'Placa',        key: 'plate' as keyof Vehicle },
                        { label: 'Color',        key: 'color' as keyof Vehicle },
                        { label: 'Marca',        key: 'brand' as keyof Vehicle },
                        { label: 'Kilometraje',  key: 'km' as keyof Vehicle },
                        { label: 'Modelo',       key: 'model' as keyof Vehicle },
                        { label: 'Combustible',  key: 'fuel' as keyof Vehicle },
                        { label: 'Año',          key: 'year' as keyof Vehicle },
                        { label: 'Transmisión',  key: 'transmission' as keyof Vehicle },
                      ] as { label: string; key: keyof Vehicle }[]).map(f => (
                        <div key={f.label}>
                          <label className="form-label">{f.label}</label>
                          <input
                            className="form-input"
                            value={f.key === 'km' ? String(draftVehicle.km) : (draftVehicle[f.key] as string)}
                            onChange={e => setDraftVehicle(prev => ({ ...prev, [f.key]: f.key === 'km' ? Number(e.target.value) || 0 : e.target.value }))}
                            placeholder={f.label}
                            type={f.key === 'km' ? 'number' : 'text'}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="form-label">VIN</label>
                        <input className="form-input" value={draftVehicle.vin}
                          onChange={e => setDraftVehicle(prev => ({ ...prev, vin: e.target.value }))}
                          placeholder="VIN" />
                      </div>
                      <div><label className="form-label">Motor</label>
                        <input className="form-input" value={draftVehicle.engine}
                          onChange={e => setDraftVehicle(prev => ({ ...prev, engine: e.target.value }))}
                          placeholder="Motor" />
                      </div>
                    </div>
                  </div>
                  <div className="w-28 shrink-0">
                    <div className="relative group">
                      <img
                        src={vehiclePhoto ?? 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=200&h=130&fit=crop&auto=format'}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-full h-20 object-cover rounded-lg border border-slate-200" />
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-xs font-semibold">
                        📷 Cambiar
                      </button>
                    </div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="mt-1 w-full text-[10px] text-blue-600 border border-blue-200 rounded py-0.5 hover:bg-blue-50">
                      📷 Cambiar foto
                    </button>
                    {vehiclePhoto && (
                      <button onClick={() => setVehiclePhoto(null)} className="mt-0.5 w-full text-[10px] text-red-400 hover:text-red-600">
                        ✕ Quitar foto
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 pb-2 border-b border-slate-100">Recepción del Vehículo</h3>
                <div className="space-y-2.5">
                  <div><label className="form-label">Asesor de Servicio</label>
                    <input className="form-input" value={draft.advisor ?? ''} readOnly onChange={() => {}} /></div>
                  <div><label className="form-label">Fecha y Hora Recepción</label>
                    <input className="form-input" value={draft.date ?? ''} readOnly onChange={() => {}} /></div>
                  <div><label className="form-label">Kilometraje al Ingreso</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      placeholder="Ej: 24560"
                      value={draftVehicle.km === 0 && !isNew ? vehicle.km : draftVehicle.km}
                      onChange={e => setDraftVehicle(prev => ({ ...prev, km: Number(e.target.value) || 0 }))}
                    /></div>
                  <div>
                    <label className="form-label">Nivel de Combustible</label>
                    <FuelGauge level={draft.fuelLevel} onChange={v => update({ fuelLevel: v })} />
                  </div>
                  {[{ label: 'Llave', key: 'hasKey' as const }, { label: 'Control/Alarma', key: 'hasAlarm' as const }].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <label className="form-label mb-0">{item.label}</label>
                      <div className="flex gap-1">
                        <button onClick={() => update({ [item.key]: true })}
                          className={`text-xs px-3 py-1 rounded font-semibold ${draft[item.key] ? 'bg-green-500 text-white' : 'btn-secondary'}`}>Sí</button>
                        <button onClick={() => update({ [item.key]: false })}
                          className={`text-xs px-3 py-1 rounded font-semibold ${!draft[item.key] ? 'bg-slate-400 text-white' : 'btn-secondary'}`}>No</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 pb-2 border-b border-slate-100">Observaciones del Cliente</h3>
                <textarea className="form-input h-40 resize-none" value={draft.clientObservations}
                  onChange={e => update({ clientObservations: e.target.value })} />
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 pb-2 border-b border-slate-100">
                  Inspección Visual — <span className="text-blue-600 font-normal normal-case">clic para marcar daño</span>
                </h3>
                <div className="flex gap-1">
                  <div className="flex-1 space-y-1">
                    {partsLeft.map(p => (
                      <div key={p} className="flex items-center gap-1 text-[11px] cursor-pointer" onClick={() => togglePart(p)}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${draft.parts[p] ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {draft.parts[p] ? '✓' : '✗'}
                        </span>
                        <span className="text-slate-600">{p}</span>
                      </div>
                    ))}
                  </div>
                  <CarSVG parts={draft.parts} onToggle={togglePart} />
                  <div className="flex-1 space-y-1">
                    {partsRight.map(p => (
                      <div key={p} className="flex items-center gap-1 text-[11px] cursor-pointer" onClick={() => togglePart(p)}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${draft.parts[p] ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {draft.parts[p] ? '✓' : '✗'}
                        </span>
                        <span className="text-slate-600">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-2">
                  <label className="form-label">Observaciones de Inspección</label>
                  <input className="form-input" value={draft.inspectionNotes} onChange={e => update({ inspectionNotes: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 pb-2 border-b border-slate-100">Documentos y Autorizaciones</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                  {[
                    { label: 'Autorización de Trabajo Firmada', key: 'authSigned' as const },
                    { label: 'Garantía Vigente', key: 'warranty' as const },
                  ].map(f => (
                    <div key={f.key} className="flex items-center justify-between">
                      <label className="form-label mb-0 text-[11px]">{f.label}</label>
                      <div className="flex gap-1">
                        <button onClick={() => update({ [f.key]: true })}
                          className={`text-[11px] px-2 py-0.5 rounded font-semibold ${draft[f.key] ? 'bg-green-500 text-white' : 'btn-secondary'}`}>Sí</button>
                        <button onClick={() => update({ [f.key]: false })}
                          className={`text-[11px] px-2 py-0.5 rounded font-semibold ${!draft[f.key] ? 'bg-slate-400 text-white' : 'btn-secondary'}`}>No</button>
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="form-label">Tipo de Garantía</label>
                    <select className="form-select" value={draft.warrantyType} onChange={e => update({ warrantyType: e.target.value })}>
                      <option>Fábrica</option><option>Extendida</option><option>Sin garantía</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Nro. Garantía</label>
                    <input className="form-input" value={draft.warrantyNum} onChange={e => update({ warrantyNum: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="form-label mb-0">Firma Digital</label>
                      {hasSig && (
                        <button onClick={clearSig} className="text-[10px] text-red-400 hover:text-red-600">✕ Borrar firma</button>
                      )}
                    </div>
                    <canvas
                      ref={sigCanvasRef}
                      width={400} height={80}
                      className="w-full rounded border border-slate-200 bg-slate-50 cursor-crosshair touch-none"
                      style={{ height: 80 }}
                      onMouseDown={sigStart} onMouseMove={sigMove} onMouseUp={sigEnd} onMouseLeave={sigEnd}
                      onTouchStart={sigStart} onTouchMove={sigMove} onTouchEnd={sigEnd}
                    />
                    {!hasSig && (
                      <p className="text-[10px] text-slate-400 mt-1 text-center">Dibuja aquí la firma del cliente</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 pb-2 border-b border-slate-100">
                  Historial del Vehículo
                </h3>
                {vehicleHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Sin historial previo para este vehículo.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-slate-100">
                      {['Fecha', 'Servicio', 'OS'].map(h => (
                        <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase pb-1.5">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {vehicleHistory.map(o => (
                        <tr key={o.os} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-1.5 text-slate-500">{o.date}</td>
                          <td className="py-1.5 text-slate-700">{o.services[0]?.name ?? '—'}</td>
                          <td className="py-1.5 text-blue-600 font-medium">{o.os}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Recepción del vehículo (resumen) */}
        {activeTab === 'recepcion' && (
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 max-w-xl">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Resumen de Recepción</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {[
                { l: 'Asesor', v: draft.advisor }, { l: 'Fecha', v: draft.date },
                { l: 'Combustible', v: `${draft.fuelLevel}%` }, { l: 'Kilometraje', v: `${vehicle.km.toLocaleString()} km` },
                { l: 'Llave entregada', v: draft.hasKey ? 'Sí' : 'No' }, { l: 'Control/Alarma', v: draft.hasAlarm ? 'Sí' : 'No' },
                { l: 'Autorización firmada', v: draft.authSigned ? 'Sí' : 'No' }, { l: 'Garantía vigente', v: draft.warranty ? 'Sí' : 'No' },
              ].map(f => (
                <div key={f.l}>
                  <span className="text-slate-400">{f.l}:</span>{' '}
                  <span className="font-semibold text-slate-700">{f.v}</span>
                </div>
              ))}
            </div>
            <div>
              <label className="form-label">Observaciones del Cliente</label>
              <div className="bg-slate-50 rounded p-2 text-xs text-slate-600 whitespace-pre-wrap border border-slate-200">{draft.clientObservations}</div>
            </div>
            <div>
              <label className="form-label">Observaciones de Inspección</label>
              <div className="bg-slate-50 rounded p-2 text-xs text-slate-600 border border-slate-200">{draft.inspectionNotes || '—'}</div>
            </div>
          </div>
        )}

        {/* TAB: Servicios */}
        {activeTab === 'servicios' && (
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Servicios Solicitados</h3>
              <button className="btn-primary text-xs" onClick={() => setShowServiceModal(true)}>+ Agregar Servicio</button>
            </div>
            {showServiceModal && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowServiceModal(false)}>
                <div className="bg-white rounded-xl shadow-2xl w-96 p-5" onClick={e => e.stopPropagation()}>
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Seleccionar Servicio</h3>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {catalogServices.map(s => {
                      const added = !!draft.services.find(x => x.code === s.code);
                      return (
                        <button key={s.code} disabled={added}
                          onClick={() => addService(s)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center justify-between transition-colors ${added ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'hover:bg-blue-50 text-slate-700'}`}>
                          <span>{s.name}</span>
                          <span className="font-semibold">${s.price.toFixed(2)}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button className="mt-3 btn-secondary w-full justify-center text-xs" onClick={() => setShowServiceModal(false)}>Cerrar</button>
                </div>
              </div>
            )}
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>{['Código', 'Servicio', 'Tiempo Est.', 'Precio', ''].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase px-4 py-2">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {draft.services.map(s => (
                  <tr key={s.code} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-blue-600 font-medium">{s.code}</td>
                    <td className="px-4 py-2.5 text-slate-700">{s.name}</td>
                    <td className="px-4 py-2.5 text-slate-500">{s.time}</td>
                    <td className="px-4 py-2.5 font-semibold">${s.price.toFixed(2)}</td>
                    <td className="px-4 py-2.5">
                      <button className="text-red-400 hover:text-red-600 text-sm" onClick={() => removeService(s.code)}>🗑️</button>
                    </td>
                  </tr>
                ))}
                {draft.services.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400 text-xs">No hay servicios agregados.</td></tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right text-xs font-bold text-slate-600">Total Servicios:</td>
                  <td className="px-4 py-2 font-bold text-slate-800">${draft.services.reduce((s, v) => s + v.price, 0).toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* TAB: Repuestos */}
        {activeTab === 'repuestos' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="p-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Catálogo de Repuestos</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {(inventory ?? []).length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">Sin repuestos en el catálogo.</div>
                ) : (inventory ?? []).map(item => {
                  const usedParts = draft.usedParts ?? [];
                  const added = !!usedParts.find(p => p.code === item.code);
                  return (
                    <div key={item.code} className={`flex items-center justify-between px-3 py-2 border-b border-slate-50 text-xs ${item.stock === 0 ? 'opacity-50' : ''}`}>
                      <div>
                        <div className="font-medium text-slate-700">{item.name}</div>
                        <div className="text-slate-400">Stock: {item.stock} · ${item.price.toFixed(2)}</div>
                      </div>
                      <button
                        disabled={added || item.stock === 0}
                        onClick={() => addInventoryPart(item)}
                        className={`text-xs px-2 py-1 rounded font-medium ${added ? 'bg-green-100 text-green-600 cursor-not-allowed' : item.stock === 0 ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'btn-primary'}`}>
                        {added ? '✓ Agregado' : item.stock === 0 ? 'Sin stock' : '+ Agregar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="p-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Repuestos en esta Orden</h3>
              </div>
              {draft.usedParts.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">Ningún repuesto agregado.</div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>{['Repuesto', 'Cant.', 'Precio', 'Usado', ''].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase px-3 py-2">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {draft.usedParts.map(p => (
                      <tr key={p.code} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-700">{p.name}</td>
                        <td className="px-3 py-2">{p.qty}</td>
                        <td className="px-3 py-2">${(p.price * p.qty).toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={p.used} onChange={() => toggleUsedPart(p.code)} className="accent-blue-600" />
                        </td>
                        <td className="px-3 py-2">
                          <button className="text-red-400 hover:text-red-600" onClick={() => removeUsedPart(p.code)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200 bg-slate-50">
                    <tr>
                      <td colSpan={2} className="px-3 py-2 text-right text-xs font-bold text-slate-600">Total repuestos:</td>
                      <td className="px-3 py-2 font-bold">${draft.usedParts.filter(p => p.used).reduce((s, p) => s + p.price * p.qty, 0).toFixed(2)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB: Resumen */}
        {activeTab === 'resumen' && (
          <div className="space-y-4 max-w-2xl">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-blue-800 mb-3">Resumen de la Orden de Servicio</h3>
              <div className="grid grid-cols-3 gap-3 text-xs">
                {[
                  { l: 'Nro. OS', v: draft.os }, { l: 'Estado', v: statusMap[draft.status] }, { l: 'Fecha', v: draft.date },
                  { l: 'Cliente', v: draftClient.name }, { l: 'Vehículo', v: `${draftVehicle.brand} ${draftVehicle.model} ${draftVehicle.year}` }, { l: 'Placa', v: draftVehicle.plate },
                  { l: 'Km Ingreso', v: `${Number(draftVehicle.km || 0).toLocaleString()} km` }, { l: 'Combustible', v: `${draft.fuelLevel}%` }, { l: 'Asesor', v: draft.advisor },
                ].map(f => (
                  <div key={f.l}><span className="text-slate-500">{f.l}:</span> <span className="font-semibold text-slate-800">{f.v}</span></div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-2">
              <div className="text-xs font-bold text-slate-600 uppercase">Servicios ({draft.services.length})</div>
              {draft.services.map(s => (
                <div key={s.code} className="flex justify-between text-xs text-slate-600 border-b border-slate-50 pb-1">
                  <span>{s.name}</span><span className="font-medium">${s.price.toFixed(2)}</span>
                </div>
              ))}
              <div className="text-xs font-bold text-slate-600 uppercase mt-3 pt-2 border-t border-slate-100">Repuestos usados</div>
              {draft.usedParts.filter(p => p.used).map(p => (
                <div key={p.code} className="flex justify-between text-xs text-slate-600 border-b border-slate-50 pb-1">
                  <span>{p.name} x{p.qty}</span><span className="font-medium">${(p.price * p.qty).toFixed(2)}</span>
                </div>
              ))}
              {draft.usedParts.filter(p => p.used).length === 0 && <p className="text-xs text-slate-400">Sin repuestos marcados como usados.</p>}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
                <span className="font-bold text-slate-700 text-sm">Total Estimado</span>
                <span className="text-xl font-bold text-blue-700">${total.toFixed(2)}</span>
              </div>
            </div>
            {draft.status !== 'terminada' && (
              <div className="flex gap-3">
                <button className="btn-primary flex-1 justify-center" onClick={() => { void saveAndAdvance(); }}>
                  {nextLabel[draft.status]} →
                </button>
              </div>
            )}
            {draft.status === 'terminada' && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center text-xs text-green-700 font-semibold">
                  ✅ Orden completada — lista para entrega al cliente
                </div>
                {draft.payment && (
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3 pb-2 border-b border-slate-100">
                      Comprobante de Pago
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Método</span>
                        <span className="font-semibold text-slate-700 capitalize">
                          {draft.payment.method === 'efectivo' ? '💵 Efectivo' : draft.payment.method === 'tarjeta' ? '💳 Tarjeta' : '🔀 Mixto'}
                        </span>
                      </div>
                      {draft.payment.cash != null && draft.payment.cash > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Efectivo recibido</span>
                          <span className="font-semibold">${draft.payment.cash.toFixed(2)}</span>
                        </div>
                      )}
                      {(draft.payment.method === 'tarjeta' || draft.payment.method === 'mixto') && draft.payment.cardLast4 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500 capitalize">
                            {draft.payment.cardBrand ?? 'Tarjeta'} ****{draft.payment.cardLast4}
                          </span>
                          <span className="font-semibold">
                            ${(draft.payment.method === 'tarjeta' ? total : draft.payment.card ?? 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-100 pt-2">
                        <span className="font-bold text-slate-700">Total cobrado</span>
                        <span className="font-bold text-green-700">${total.toFixed(2)}</span>
                      </div>
                      {draft.payment.paidAt && (
                        <div className="flex justify-between text-slate-400">
                          <span>Fecha de pago</span>
                          <span>{draft.payment.paidAt}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-200 px-5 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-600 font-semibold">✓ Guardado</span>}
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs" onClick={save}>💾 Guardar</button>
          <button className="btn-secondary text-xs" onClick={printOS}>🖨️ Imprimir OS</button>
          {draft.status !== 'terminada' && (
            <button className="btn-primary text-xs" onClick={() => { void saveAndAdvance(); }}>
              {nextLabel[draft.status]} ›
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
