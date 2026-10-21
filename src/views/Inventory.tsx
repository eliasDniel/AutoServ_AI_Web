import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import type { InventoryItem } from '../store';

interface InventoryProps {
  inventory: InventoryItem[];
  onUpdateInventory: (items: InventoryItem[]) => void;
  role?: string;
}

const demandForecast = [
  { mes: 'Ene', real: 28, pred: null }, { mes: 'Feb', real: 32, pred: null },
  { mes: 'Mar', real: 25, pred: null }, { mes: 'Abr', real: 38, pred: null },
  { mes: 'May', real: 30, pred: 30 }, { mes: 'Jun', real: null, pred: 35 },
  { mes: 'Jul', real: null, pred: 41 }, { mes: 'Ago', real: null, pred: 38 },
];

const rotationColor: Record<string, { background: string; color: string }> = {
  Alta:  { background: 'rgba(34,197,94,0.15)',  color: '#16a34a' },
  Media: { background: 'rgba(245,158,11,0.15)', color: '#d97706' },
  Baja:  { background: 'rgba(148,163,184,0.15)', color: '#64748b' },
};

type MovementType = 'entrada' | 'salida';
interface Movement { type: MovementType; qty: number; date: string; note: string; }

interface NewPart { name: string; category: string; stock: string; min: string; max: string; price: string; rotation: 'Alta' | 'Media' | 'Baja'; }

export default function Inventory({ inventory, onUpdateInventory, role }: InventoryProps) {
  const isAdmin = role === 'admin';
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedCode, setSelectedCode] = useState(inventory[1]?.code ?? '');
  const [showModal, setShowModal] = useState<MovementType | null>(null);
  const [movQty, setMovQty] = useState('1');
  const [movNote, setMovNote] = useState('');
  const [showNewPart, setShowNewPart] = useState(false);
  const [showPurchaseOrder, setShowPurchaseOrder] = useState(false);
  const [newPart, setNewPart] = useState<NewPart>({ name: '', category: 'Lubricantes', stock: '0', min: '5', max: '20', price: '0', rotation: 'Media' });
  const [savedPart, setSavedPart] = useState(false);
  const [movements, setMovements] = useState<Record<string, Movement[]>>({});

  const selected = inventory.find(p => p.code === selectedCode) ?? inventory[0];
  const categories = ['all', ...Array.from(new Set(inventory.map(i => i.category)))];

  const filtered = inventory.filter(p => {
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const alerts = inventory.filter(p => p.stock < p.min);

  const addNewPart = () => {
    if (!newPart.name.trim()) return;
    const code = `REP-${String(inventory.length + 1).padStart(3, '0')}`;
    onUpdateInventory([...inventory, {
      code, name: newPart.name, category: newPart.category,
      stock: parseInt(newPart.stock) || 0, min: parseInt(newPart.min) || 5,
      max: parseInt(newPart.max) || 20, price: parseFloat(newPart.price) || 0,
      rotation: newPart.rotation,
    }]);
    setSavedPart(true);
    setTimeout(() => { setShowNewPart(false); setSavedPart(false); setNewPart({ name: '', category: 'Lubricantes', stock: '0', min: '5', max: '20', price: '0', rotation: 'Media' }); }, 1200);
  };

  const applyMovement = () => {
    const qty = parseInt(movQty) || 0;
    if (qty <= 0) return;
    onUpdateInventory(inventory.map(p => p.code === selected.code
      ? { ...p, stock: showModal === 'entrada' ? p.stock + qty : Math.max(0, p.stock - qty) }
      : p
    ));
    setMovements(prev => ({
      ...prev,
      [selected.code]: [...(prev[selected.code] ?? []), { type: showModal!, qty, date: new Date().toLocaleDateString('es-EC'), note: movNote }],
    }));
    setShowModal(null); setMovQty('1'); setMovNote('');
  };

  return (
    <div className="p-5 overflow-y-auto h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>Control de Inventario</h1>
          <p className="text-xs text-slate-500">Gestión de stock · Predicción de demanda ML · Alertas inteligentes</p>
        </div>
        {isAdmin && <button className="btn-primary text-xs" onClick={() => setShowNewPart(true)}>+ Nuevo Repuesto</button>}
      </div>

      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="text-xs font-bold text-red-700">{alerts.length} repuestos bajo el stock mínimo</div>
            <div className="text-xs text-red-500">{alerts.map(a => a.name).join(' · ')}</div>
          </div>
          {isAdmin && <button className="ml-auto btn-primary text-xs" style={{ background: '#dc2626' }} onClick={() => setShowPurchaseOrder(true)}>Generar Orden de Compra</button>}
        </div>
      )}

      {/* New Part modal */}
      {showNewPart && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowNewPart(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-96 p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-700 mb-4">Nuevo Repuesto</h3>
            <div className="space-y-3">
              <div><label className="form-label">Nombre del Repuesto *</label>
                <input className="form-input" placeholder="Ej. Filtro de Aceite Toyota" value={newPart.name} onChange={e => setNewPart(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="form-label">Categoría</label>
                  <select className="form-select" value={newPart.category} onChange={e => setNewPart(p => ({ ...p, category: e.target.value }))}>
                    {['Lubricantes', 'Filtros', 'Frenos', 'Encendido', 'Motor', 'Suspensión', 'Electricidad', 'Otros'].map(c => <option key={c}>{c}</option>)}
                  </select></div>
                <div><label className="form-label">Rotación</label>
                  <select className="form-select" value={newPart.rotation} onChange={e => setNewPart(p => ({ ...p, rotation: e.target.value as 'Alta' | 'Media' | 'Baja' }))}>
                    <option>Alta</option><option>Media</option><option>Baja</option>
                  </select></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="form-label">Stock Inicial</label>
                  <input className="form-input" type="number" min="0" value={newPart.stock} onChange={e => setNewPart(p => ({ ...p, stock: e.target.value }))} /></div>
                <div><label className="form-label">Mínimo</label>
                  <input className="form-input" type="number" min="0" value={newPart.min} onChange={e => setNewPart(p => ({ ...p, min: e.target.value }))} /></div>
                <div><label className="form-label">Máximo</label>
                  <input className="form-input" type="number" min="0" value={newPart.max} onChange={e => setNewPart(p => ({ ...p, max: e.target.value }))} /></div>
              </div>
              <div><label className="form-label">Precio Unitario ($)</label>
                <input className="form-input" type="number" step="0.01" min="0" value={newPart.price} onChange={e => setNewPart(p => ({ ...p, price: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-primary flex-1 justify-center text-xs" onClick={addNewPart} disabled={!newPart.name.trim()}>
                {savedPart ? '✓ Guardado' : 'Agregar Repuesto'}
              </button>
              <button className="btn-secondary flex-1 justify-center text-xs" onClick={() => setShowNewPart(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase order modal */}
      {showPurchaseOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowPurchaseOrder(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-lg max-w-lg p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700">Orden de Compra</h3>
              <span className="text-xs text-slate-400">{new Date().toLocaleDateString('es-EC')}</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">Repuestos bajo el stock mínimo que requieren reabastecimiento:</p>
            <table className="w-full text-xs mb-4">
              <thead className="bg-slate-50">
                <tr>{['Código', 'Repuesto', 'Stock Actual', 'Mínimo', 'Cant. Sugerida'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase px-3 py-2">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {alerts.map(a => (
                  <tr key={a.code} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-blue-600 font-medium">{a.code}</td>
                    <td className="px-3 py-2 text-slate-700">{a.name}</td>
                    <td className="px-3 py-2 font-bold text-red-600">{a.stock}</td>
                    <td className="px-3 py-2 text-slate-500">{a.min}</td>
                    <td className="px-3 py-2 font-bold text-green-600">{a.max - a.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2">
              <button className="btn-primary flex-1 justify-center text-xs" onClick={() => { window.print(); setShowPurchaseOrder(false); }}>🖨️ Imprimir Orden</button>
              <button className="btn-secondary flex-1 justify-center text-xs" onClick={() => setShowPurchaseOrder(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Movement modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-80 p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-700 mb-1">{showModal === 'entrada' ? '📥 Entrada de Stock' : '📤 Salida de Stock'}</h3>
            <p className="text-xs text-slate-500 mb-4">{selected.name}</p>
            <div className="space-y-3">
              <div>
                <label className="form-label">Cantidad</label>
                <input className="form-input" type="number" min="1" value={movQty} onChange={e => setMovQty(e.target.value)} />
                {showModal === 'salida' && parseInt(movQty) > selected.stock && (
                  <p className="text-[11px] text-red-500 mt-1">⚠️ Stock insuficiente (disponible: {selected.stock})</p>
                )}
              </div>
              <div>
                <label className="form-label">Nota / Motivo</label>
                <input className="form-input" placeholder="Ej. Compra a proveedor, Uso en OS-XXX..." value={movNote} onChange={e => setMovNote(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-primary flex-1 justify-center text-xs" onClick={applyMovement}
                disabled={showModal === 'salida' && parseInt(movQty) > selected.stock}>
                Confirmar {showModal === 'entrada' ? 'Entrada' : 'Salida'}
              </button>
              <button className="btn-secondary flex-1 justify-center text-xs" onClick={() => setShowModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Table */}
        <div className="col-span-2 bg-white rounded-lg border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <input type="text" placeholder="Buscar repuesto..." className="form-input flex-1"
              value={search} onChange={e => setSearch(e.target.value)} />
            <select className="form-select w-36" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'Todas las categorías' : c}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>{['Código', 'Repuesto', 'Categoría', 'Stock', 'Mín/Máx', 'Precio', 'Rotación'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase px-3 py-2">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map(part => (
                  <tr key={part.code}
                    className={`border-t border-slate-100 cursor-pointer transition-colors ${selectedCode === part.code ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    onClick={() => setSelectedCode(part.code)}>
                    <td className="px-3 py-2.5 text-blue-600 font-medium">{part.code}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-700">{part.name}</td>
                    <td className="px-3 py-2.5 text-slate-500">{part.category}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold ${part.stock < part.min ? 'text-red-600' : 'text-slate-800'}`}>{part.stock}</span>
                        {part.stock < part.min && <span className="text-sm">⚠️</span>}
                      </div>
                      <div className="w-16 bg-slate-100 rounded-full h-1 mt-1">
                        <div className="h-1 rounded-full" style={{
                          width: `${Math.min(100, (part.stock / part.max) * 100)}%`,
                          background: part.stock < part.min ? '#ef4444' : '#22c55e'
                        }} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">{part.min} / {part.max}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-700">${part.price.toFixed(2)}</td>
                    <td className="px-3 py-2.5"><span className="status-badge" style={rotationColor[part.rotation]}>{part.rotation}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3 truncate">{selected.name}</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
              {[
                { l: 'Código', v: selected.code }, { l: 'Categoría', v: selected.category },
                { l: 'Stock actual', v: `${selected.stock} uds.` }, { l: 'Mínimo', v: String(selected.min) },
                { l: 'Precio', v: `$${selected.price.toFixed(2)}` }, { l: 'Rotación', v: selected.rotation },
              ].map(f => (
                <div key={f.l}><div className="text-slate-400 text-[10px]">{f.l}</div>
                  {f.l === 'Rotación'
                    ? <span className="status-badge" style={rotationColor[f.v]}>{f.v}</span>
                    : <div className="font-semibold" style={{ color: 'var(--text-1)' }}>{f.v}</div>
                  }</div>
              ))}
            </div>
            <div className="flex gap-1">
              {isAdmin && <button className="btn-primary text-xs flex-1 justify-center" onClick={() => setShowModal('entrada')}>📥 Entrada</button>}
              {isAdmin && <button className="btn-secondary text-xs flex-1 justify-center" onClick={() => setShowModal('salida')}>📤 Salida</button>}
            </div>
            {/* Movement history */}
            {(movements[selected.code]?.length ?? 0) > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Movimientos</div>
                {movements[selected.code].slice(-4).map((m, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] py-0.5">
                    <span className={m.type === 'entrada' ? 'text-green-600' : 'text-red-500'}>{m.type === 'entrada' ? '▲' : '▼'}</span>
                    <span className="font-semibold">{m.qty} uds.</span>
                    <span className="text-slate-400">{m.date}</span>
                    {m.note && <span className="text-slate-400 truncate">· {m.note}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prediction chart */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <span>🤖</span>
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Predicción de Demanda</h3>
            </div>
            <p className="text-[10px] text-slate-400 mb-3">Machine Learning · próximos 3 meses</p>
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={demandForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                <ReferenceLine x="May" stroke="#94a3b8" strokeDasharray="4 2" />
                <Line type="monotone" dataKey="real" stroke="#1e40af" strokeWidth={2} dot={{ r: 3, fill: '#1e40af' }} name="Real" connectNulls={false} />
                <Line type="monotone" dataKey="pred" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: '#f59e0b' }} name="Predicción" connectNulls />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded p-2 text-[10px] text-amber-700">
              <strong>IA recomienda:</strong> Comprar 25 uds. antes del 15/06 para evitar desabastecimiento (demanda proyectada Jul: 41 uds).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
