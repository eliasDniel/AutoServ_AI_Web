import { useEffect, useState } from 'react';
import type { Client, Vehicle, ServiceOrder } from '../store';

interface ClientsProps {
  clients: Client[];
  vehicles: Vehicle[];
  orders: ServiceOrder[];
  onSelectOS: (os: string) => void;
  onNavigate: (v: 'reception') => void;
  onAddClient: (c: Client) => void;
  onUpdateClient: (c: Client) => void;
  onAddVehicle: (v: Vehicle) => void;
}

const statusLabel: Record<string, string> = { recepcion: 'RECEPCIÓN', en_taller: 'EN TALLER', terminada: 'TERMINADA' };
const statusClass: Record<string, string> = { recepcion: 'status-recepcion', en_taller: 'status-taller', terminada: 'status-terminada' };

const blankClient = (): Omit<Client, 'id'> => ({ name: '', phone: '', email: '', address: '', city: 'Milagro' });
const blankVehicle = (clientId: string): Omit<Vehicle, 'id'> => ({
  clientId, plate: '', brand: 'Chevrolet', model: '', year: String(new Date().getFullYear()),
  color: '', vin: '', engine: '', fuel: 'Gasolina', transmission: 'Automática', km: 0,
});

const initials = (name?: string) =>
  (name ?? '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0] ?? '').join('') || '?';

export default function Clients({ clients, vehicles, orders, onSelectOS, onNavigate, onAddClient, onUpdateClient, onAddVehicle }: ClientsProps) {
  const [selected, setSelected] = useState<Client | null>(clients[0] ?? null);
  const [search, setSearch] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Client | null>(clients[0] ?? null);
  const [savedMsg, setSavedMsg] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [newClientDraft, setNewClientDraft] = useState(blankClient());
  const [newVehicleDraft, setNewVehicleDraft] = useState(blankVehicle(clients[0]?.id ?? ''));
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!clients.length) {
      setSelected(null);
      setDraft(null);
      return;
    }
    const stillExists = selected && clients.some(c => c.id === selected.id);
    if (!stillExists) {
      setSelected(clients[0]);
      setDraft(clients[0]);
      setEditMode(false);
    }
  }, [clients, selected]);

  const query = search.toLowerCase();
  const filtered = clients.filter(c =>
    (c.name ?? '').toLowerCase().includes(query) ||
    (c.phone ?? '').includes(search) ||
    (c.email ?? '').toLowerCase().includes(query)
  );

  const clientVehicles = selected ? vehicles.filter(v => v.clientId === selected.id) : [];
  const clientOrders = selected ? orders.filter(o => o.clientId === selected.id) : [];

  const selectClient = (c: Client) => { setSelected(c); setDraft(c); setEditMode(false); setSavedMsg(''); };

  const saveEdit = () => {
    if (!draft) return;
    onUpdateClient(draft);
    setSelected(draft);
    setSavedMsg('✓ Cambios guardados');
    setEditMode(false);
    setTimeout(() => setSavedMsg(''), 2500);
  };

  const validateNewClient = () => {
    const errs: Record<string, string> = {};
    if (!newClientDraft.name.trim()) errs.name = 'Nombre requerido';
    if (!newClientDraft.phone.trim()) errs.phone = 'Teléfono requerido';
    return errs;
  };

  const submitNewClient = () => {
    const errs = validateNewClient();
    if (Object.keys(errs).length) { setClientErrors(errs); return; }
    const newId = `C${String(clients.length + 1).padStart(3, '0')}`;
    const newC: Client = { id: newId, ...newClientDraft };
    onAddClient(newC);
    setSelected(newC);
    setDraft(newC);
    setShowNewClient(false);
    setNewClientDraft(blankClient());
    setClientErrors({});
  };

  const submitNewVehicle = () => {
    if (!selected || !newVehicleDraft.plate.trim() || !newVehicleDraft.model.trim()) return;
    const newId = `V${String(vehicles.length + 1).padStart(3, '0')}`;
    onAddVehicle({ id: newId, clientId: selected.id, ...newVehicleDraft });
    setShowNewVehicle(false);
    setNewVehicleDraft(blankVehicle(selected.id));
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* New Client Modal */}
      {showNewClient && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowNewClient(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-96 p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-700 mb-4">Nuevo Cliente</h3>
            <div className="space-y-3">
              {([
                { label: 'Nombre completo *', field: 'name', placeholder: 'Ej. Juan García Pérez' },
                { label: 'Teléfono *', field: 'phone', placeholder: '099 000 0000' },
                { label: 'Email', field: 'email', placeholder: 'correo@email.com' },
                { label: 'Dirección', field: 'address', placeholder: 'Calle y número' },
                { label: 'Ciudad', field: 'city', placeholder: 'Milagro' },
              ] as { label: string; field: keyof typeof newClientDraft; placeholder: string }[]).map(f => (
                <div key={f.field}>
                  <label className="form-label">{f.label}</label>
                  <input className={`form-input ${clientErrors[f.field] ? 'border-red-400' : ''}`}
                    placeholder={f.placeholder}
                    value={newClientDraft[f.field]}
                    onChange={e => { setNewClientDraft(p => ({ ...p, [f.field]: e.target.value })); setClientErrors(p => ({ ...p, [f.field]: '' })); }} />
                  {clientErrors[f.field] && <p className="text-[10px] text-red-500 mt-0.5">{clientErrors[f.field]}</p>}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-primary flex-1 justify-center text-xs" onClick={submitNewClient}>Guardar Cliente</button>
              <button className="btn-secondary flex-1 justify-center text-xs" onClick={() => { setShowNewClient(false); setClientErrors({}); }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* New Vehicle Modal */}
      {showNewVehicle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowNewVehicle(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-96 p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-700 mb-1">Registrar Vehículo</h3>
            <p className="text-xs text-slate-500 mb-4">Para: {selected?.name ?? 'cliente'}</p>
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="form-label">Placa *</label>
                  <input className={`form-input ${!newVehicleDraft.plate && 'border-slate-300'}`} placeholder="ABC-1234"
                    value={newVehicleDraft.plate} onChange={e => setNewVehicleDraft(p => ({ ...p, plate: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <label className="form-label">Color</label>
                  <input className="form-input" placeholder="Blanco" value={newVehicleDraft.color} onChange={e => setNewVehicleDraft(p => ({ ...p, color: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="form-label">Marca</label>
                  <select className="form-select" value={newVehicleDraft.brand} onChange={e => setNewVehicleDraft(p => ({ ...p, brand: e.target.value }))}>
                    {['Chevrolet', 'Toyota', 'Hyundai', 'Kia', 'Ford', 'Nissan', 'Mazda', 'Volkswagen', 'Otro'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Modelo *</label>
                  <input className="form-input" placeholder="Tracker" value={newVehicleDraft.model} onChange={e => setNewVehicleDraft(p => ({ ...p, model: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="form-label">Año</label>
                  <input className="form-input" type="number" min="1990" max="2025" value={newVehicleDraft.year} onChange={e => setNewVehicleDraft(p => ({ ...p, year: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Kilometraje</label>
                  <input className="form-input" type="number" min="0" value={newVehicleDraft.km} onChange={e => setNewVehicleDraft(p => ({ ...p, km: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="form-label">Combustible</label>
                  <select className="form-select" value={newVehicleDraft.fuel} onChange={e => setNewVehicleDraft(p => ({ ...p, fuel: e.target.value }))}>
                    <option>Gasolina</option><option>Diésel</option><option>Híbrido</option><option>Eléctrico</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Transmisión</label>
                  <select className="form-select" value={newVehicleDraft.transmission} onChange={e => setNewVehicleDraft(p => ({ ...p, transmission: e.target.value }))}>
                    <option>Automática</option><option>Manual</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="form-label">Motor</label>
                  <input className="form-input" placeholder="1.5L" value={newVehicleDraft.engine} onChange={e => setNewVehicleDraft(p => ({ ...p, engine: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">VIN</label>
                  <input className="form-input" placeholder="Opcional" value={newVehicleDraft.vin} onChange={e => setNewVehicleDraft(p => ({ ...p, vin: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-primary flex-1 justify-center text-xs"
                disabled={!newVehicleDraft.plate.trim() || !newVehicleDraft.model.trim()}
                onClick={submitNewVehicle}>Registrar Vehículo</button>
              <button className="btn-secondary flex-1 justify-center text-xs" onClick={() => setShowNewVehicle(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Client list */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Clientes</span>
            <span className="text-[10px] text-slate-400">{clients.length} registros</span>
          </div>
          <input type="text" placeholder="Buscar cliente..."
            className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 bg-slate-50"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(c => (
            <button key={c.id} onClick={() => selectClient(c)}
              className={`w-full text-left px-3 py-2.5 border-b border-slate-50 hover:bg-blue-50 transition-colors ${selected?.id === c.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                  {initials(c.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-700 truncate">{c.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{c.phone}</div>
                </div>
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                {vehicles.filter(v => v.clientId === c.id).length} veh. · {orders.filter(o => o.clientId === c.id).length} órd.
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400">No se encontraron clientes.</div>
          )}
        </div>
        <div className="p-3 border-t border-slate-200">
          <button className="btn-primary w-full justify-center text-xs" onClick={() => setShowNewClient(true)}>+ Nuevo Cliente</button>
        </div>
      </div>

      {/* Detail */}
      {!selected || !draft ? (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="text-center space-y-3">
            <p className="text-sm font-semibold text-slate-600">No hay clientes registrados.</p>
            <p className="text-xs text-slate-400">Crea el primero para ver su ficha aquí.</p>
            <button className="btn-primary justify-center text-xs" onClick={() => setShowNewClient(true)}>+ Nuevo Cliente</button>
          </div>
        </div>
      ) : (
      <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
              {initials(selected.name)}
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>{selected.name}</h1>
              <p className="text-xs text-slate-500">{selected.city} · {clientVehicles.length} vehículo(s) · {clientOrders.length} órdenes</p>
              {savedMsg && <span className="text-xs text-green-600 font-semibold">{savedMsg}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button className="btn-primary text-xs" onClick={saveEdit}>💾 Guardar Cambios</button>
                <button className="btn-secondary text-xs" onClick={() => { setEditMode(false); setDraft(selected); }}>✕ Cancelar</button>
              </>
            ) : (
              <>
                <button className="btn-secondary text-xs" onClick={() => setEditMode(true)}>✏️ Editar</button>
                <button className="btn-primary text-xs" onClick={() => onNavigate('reception')}>+ Nueva OS</button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Contact */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Información de Contacto</h3>
            <div className="space-y-2.5">
              {([
                { label: 'Nombre completo', field: 'name' },
                { label: 'Teléfono', field: 'phone' },
                { label: 'Email', field: 'email' },
                { label: 'Dirección', field: 'address' },
                { label: 'Ciudad', field: 'city' },
              ] as { label: string; field: keyof Omit<Client, 'id'> }[]).map(f => (
                <div key={f.field}>
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" value={draft[f.field] ?? ''}
                    readOnly={!editMode}
                    onChange={e => setDraft(prev => prev ? { ...prev, [f.field]: e.target.value } : prev)}
                    style={{ background: editMode ? '#fff' : '#f8fafc' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Vehicles */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Vehículos Registrados</h3>
              <button className="btn-primary text-xs" onClick={() => { setNewVehicleDraft(blankVehicle(selected.id)); setShowNewVehicle(true); }}>+ Agregar</button>
            </div>
            {clientVehicles.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Sin vehículos registrados.</p>
            ) : (
              <div className="space-y-2">
                {clientVehicles.map(v => (
                  <div key={v.id} className="border border-slate-100 rounded-lg p-3 hover:bg-blue-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-700">{v.brand} {v.model}</span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{v.plate}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-slate-500">
                      <span>Año: <strong>{v.year}</strong></span>
                      <span>Color: <strong>{v.color}</strong></span>
                      <span>Motor: <strong>{v.engine || '—'}</strong></span>
                      <span>Km: <strong>{Number(v.km ?? 0).toLocaleString()}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order history */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Historial de Órdenes</h3>
          </div>
          {clientOrders.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No hay órdenes para este cliente.</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>{['OS', 'Fecha', 'Vehículo', 'Servicios', 'Total', 'Estado', ''].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase px-4 py-2">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {clientOrders.map(o => {
                  const vh = vehicles.find(v => v.id === o.vehicleId);
                  const total = (o.services ?? []).reduce((s, v) => s + v.price, 0);
                  return (
                    <tr key={o.os} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => { onSelectOS(o.os); onNavigate('reception'); }}>
                      <td className="px-4 py-2.5 text-blue-600 font-semibold">{o.os}</td>
                      <td className="px-4 py-2.5 text-slate-500">{o.date}</td>
                      <td className="px-4 py-2.5 text-slate-700">{vh ? `${vh.brand} ${vh.model}` : '—'}</td>
                      <td className="px-4 py-2.5 text-slate-500">{(o.services ?? []).length} serv.</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-700">${total.toFixed(2)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`status-badge ${statusClass[o.status]}`}>{statusLabel[o.status]}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <button className="btn-secondary text-[10px] px-2 py-0.5">Ver OS</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
