import { useState } from 'react';
import type { ServiceOrder, Client, Vehicle, Role } from '../store';

interface WorkshopProps {
  role: Role;
  orders: ServiceOrder[];
  clients: Client[];
  vehicles: Vehicle[];
  onUpdateOrder: (updated: ServiceOrder) => void;
  onAdvanceOrder?: (os: string) => void;
}

const statusLabel: Record<string, string> = { recepcion: 'RECEPCIÓN', en_taller: 'EN TALLER', terminada: 'TERMINADA' };
const statusClass: Record<string, string> = { recepcion: 'status-recepcion', en_taller: 'status-taller', terminada: 'status-terminada' };
const nextStatus: Record<string, ServiceOrder['status']> = { en_taller: 'terminada', terminada: 'terminada' };
const nextLabel: Record<string, string> = { en_taller: '✅ Marcar Terminada', terminada: 'Completada' };

export default function Workshop({ role, orders, clients, vehicles, onUpdateOrder, onAdvanceOrder }: WorkshopProps) {
  const workshopOrders = orders.filter(o => o.status === 'en_taller' || o.status === 'terminada');
  const [selectedOS, setSelectedOS] = useState(workshopOrders[0]?.os ?? '');
  const selected = workshopOrders.find(o => o.os === selectedOS) ?? workshopOrders[0];
  const [notes, setNotes] = useState(selected?.techNotes ?? '');

  const getClient = (id: string) => clients.find(c => c.id === id);
  const getVehicle = (id: string) => vehicles.find(v => v.id === id);

  if (!selected) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-4xl mb-3">🔧</div>
          <p className="text-sm font-semibold text-slate-600">No hay vehículos en taller actualmente.</p>
        </div>
      </div>
    );
  }

  const cl = getClient(selected.clientId);
  const vh = getVehicle(selected.vehicleId);

  const advanceStatus = () => {
    if (selected.status === 'en_taller' && onAdvanceOrder) {
      onAdvanceOrder(selected.os);
    } else {
      onUpdateOrder({ ...selected, status: nextStatus[selected.status] ?? selected.status });
    }
  };

  const saveNotes = () => onUpdateOrder({ ...selected, techNotes: notes });

  const togglePart = (code: string) => {
    onUpdateOrder({
      ...selected,
      usedParts: selected.usedParts.map(p => p.code === code ? { ...p, used: !p.used } : p),
    });
  };

  const canEdit = role === 'tecnico' || role === 'admin';

  return (
    <div className="flex h-full overflow-hidden">
      {/* Order list */}
      <div className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            {role === 'tecnico' ? 'Mis Órdenes' : 'Vehículos en Taller'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{workshopOrders.length} órdenes</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {workshopOrders.map(o => {
            const c = getClient(o.clientId);
            const v = getVehicle(o.vehicleId);
            return (
              <button key={o.os} onClick={() => { setSelectedOS(o.os); setNotes(o.techNotes); }}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-blue-50 transition-colors ${selectedOS === o.os ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}>
                <div className="text-xs font-semibold text-blue-600 truncate">{o.os}</div>
                <div className="text-xs font-medium text-slate-700 truncate">{c?.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{v ? `${v.brand} ${v.model}` : ''}</div>
                <div className="mt-1.5 flex items-center gap-1">
                  <span className={`status-badge ${statusClass[o.status]}`}>{statusLabel[o.status]}</span>
                  {o.services.length > 0 && <span className="text-[9px] text-slate-400">{o.services.length} serv.</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>{selected.os}</h1>
            <p className="text-xs text-slate-500">
              {cl?.name} · {vh ? `${vh.brand} ${vh.model} ${vh.year}` : ''} ·{' '}
              <span className="font-semibold">{vh?.plate}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`status-badge text-xs px-3 py-1 ${statusClass[selected.status]}`}>{statusLabel[selected.status]}</span>
            {selected.status !== 'terminada' && canEdit && (
              <button className="btn-primary text-xs" onClick={advanceStatus}>{nextLabel[selected.status]}</button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Services */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Servicios a Realizar</h3>
            {selected.services.length === 0 ? (
              <p className="text-xs text-slate-400">Sin servicios asignados.</p>
            ) : (
              <div className="space-y-2">
                {selected.services.map((s, i) => (
                  <div key={s.code} className="flex items-center gap-2 text-xs">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${selected.status === 'terminada' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {selected.status === 'terminada' ? '✓' : i + 1}
                    </span>
                    <span className="text-slate-700 flex-1">{s.name}</span>
                    <span className="text-slate-400">{s.time}</span>
                    <span className="font-semibold text-slate-600">${s.price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Parts */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Repuestos</h3>
            {selected.usedParts.length === 0 ? (
              <p className="text-xs text-slate-400">Sin repuestos asignados.</p>
            ) : (
              <div className="space-y-2">
                {selected.usedParts.map(p => (
                  <div key={p.code} className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={p.used} onChange={() => togglePart(p.code)}
                      disabled={!canEdit} className="accent-blue-600" />
                    <span className={`flex-1 ${p.used ? 'text-slate-700' : 'text-slate-400'}`}>{p.name} x{p.qty}</span>
                    {p.used && <span className="text-[10px] text-green-600 font-semibold">✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tech notes */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Notas Técnicas</h3>
          <textarea className="form-input h-24 resize-none" value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Observaciones técnicas del servicio..."
            readOnly={!canEdit} />
          {canEdit && (
            <div className="flex justify-end mt-2">
              <button className="btn-primary text-xs" onClick={saveNotes}>💾 Guardar Notas</button>
            </div>
          )}
        </div>

        {/* Client observations */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="text-[11px] font-bold text-amber-700 mb-1">💬 Observaciones del Cliente</div>
          <p className="text-xs text-amber-800 whitespace-pre-wrap">{selected.clientObservations || 'Sin observaciones.'}</p>
        </div>

        {role === 'tecnico' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <strong>ℹ️</strong> Puedes actualizar el estado, marcar repuestos y agregar notas técnicas.
            Para modificar servicios o datos del cliente, contacta al Asesor de Servicio.
          </div>
        )}
      </div>
    </div>
  );
}
