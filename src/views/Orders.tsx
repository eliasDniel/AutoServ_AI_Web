import { useState } from 'react';
import type { ServiceOrder, Client, Vehicle } from '../store';
import type { Role } from '../store';

interface OrdersProps {
  orders: ServiceOrder[];
  clients: Client[];
  vehicles: Vehicle[];
  role?: Role;
  onSelectOS: (os: string) => void;
  onNavigate: (v: 'reception') => void;
  onOpenOrder: (os: string) => void;
  onDeleteOrder?: (os: string) => void;
}

const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  recepcion: { label: 'Recepción', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  en_taller: { label: 'En Taller',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  terminada: { label: 'Terminada',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
};

export default function Orders({ orders, clients, vehicles, role, onSelectOS, onNavigate, onOpenOrder, onDeleteOrder }: OrdersProps) {
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const isAdmin = role === 'admin';
  const canEdit = role === 'admin' || role === 'asesor';

  const getClient  = (id: string) => clients.find(c => c.id === id);
  const getVehicle = (id: string) => vehicles.find(v => v.id === id);

  const filtered = orders.filter(o => {
    const cl = getClient(o.clientId);
    const matchStatus = filter === 'all' || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch = (cl?.name ?? '').toLowerCase().includes(q) ||
      o.os.toLowerCase().includes(q) ||
      (getVehicle(o.vehicleId)?.plate ?? '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    all:       orders.length,
    recepcion: orders.filter(o => o.status === 'recepcion').length,
    en_taller: orders.filter(o => o.status === 'en_taller').length,
    terminada: orders.filter(o => o.status === 'terminada').length,
  };

  const openOrder = (os: string) => { onOpenOrder(os); };

  const handleDelete = (os: string) => {
    onDeleteOrder?.(os);
    setConfirmDelete(null);
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--surface-2)' }}>
      <div className="p-5 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Órdenes de Servicio</h1>
            <p className="page-subtitle">Ciclo completo: Recepción → En Taller → Terminada</p>
          </div>
          {canEdit && (
            <button className="btn-primary text-xs" onClick={() => onNavigate('reception')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nueva Orden
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {[
            { id: 'all',       label: `Todas`,       count: counts.all },
            { id: 'recepcion', label: `Recepción`,   count: counts.recepcion },
            { id: 'en_taller', label: `En Taller`,   count: counts.en_taller },
            { id: 'terminada', label: `Terminadas`,  count: counts.terminada },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
              style={{
                background: filter === f.id ? 'var(--accent)' : 'transparent',
                color: filter === f.id ? '#fff' : 'var(--text-2)',
              }}>
              {f.label}
              <span className="px-1 py-0.5 rounded text-[10px] font-bold"
                style={{ background: filter === f.id ? 'rgba(255,255,255,0.2)' : 'var(--surface-3)', color: filter === f.id ? '#fff' : 'var(--text-3)' }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Table card */}
        <div className="card">
          <div className="card-header">
            <input type="text" placeholder="Buscar por cliente, orden o placa..."
              className="form-input" style={{ width: 280 }}
              value={search} onChange={e => setSearch(e.target.value)} />
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>{filtered.length} orden(es)</span>
          </div>

          <table className="data-table w-full">
            <thead>
              <tr>
                {['Nro. OS', 'Cliente', 'Vehículo / Placa', 'Asesor', 'Fecha', 'Total', 'Estado', 'Acciones'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const cl = getClient(o.clientId);
                const vh = getVehicle(o.vehicleId);
                const total = (o.services ?? []).reduce((s, v) => s + v.price, 0);
                const m = statusMeta[o.status];
                return (
                  <tr key={o.os} className="cursor-pointer" onClick={() => openOrder(o.os)}>
                    <td>
                      <span className="mono font-bold" style={{ color: 'var(--accent)' }}>{o.os}</span>
                    </td>
                    <td>
                      <span className="font-medium" style={{ color: 'var(--text-1)' }}>{cl?.name ?? <span style={{ color: 'var(--text-3)' }}>Sin cliente</span>}</span>
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-1)' }}>{vh ? `${vh.brand} ${vh.model} ${vh.year}` : '—'}</div>
                      {vh && <div className="mono text-[11px]" style={{ color: 'var(--text-3)' }}>{vh.plate}</div>}
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>{o.advisor}</td>
                    <td><span className="mono" style={{ color: 'var(--text-2)' }}>{o.date}</span></td>
                    <td><span className="mono font-bold" style={{ color: 'var(--text-1)' }}>${total.toFixed(2)}</span></td>
                    <td>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                        style={{ color: m.color, background: m.bg }}>
                        {m.label.toUpperCase()}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1.5">
                        {canEdit && (
                          <button
                            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded transition-colors"
                            style={{ background: 'var(--accent)', color: '#fff' }}
                            onClick={() => openOrder(o.os)}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Editar
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded transition-colors"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                            onClick={() => setConfirmDelete(o.os)}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs" style={{ color: 'var(--text-3)' }}>
                    No se encontraron órdenes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}>
                Confirmar eliminación
              </h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                ¿Estás seguro que deseas eliminar la orden{' '}
                <span className="mono font-bold" style={{ color: 'var(--text-1)' }}>{confirmDelete}</span>?
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                Esta acción no se puede deshacer. Se eliminará la orden y toda su información asociada.
              </p>
            </div>
            <div className="px-5 py-3 flex justify-end gap-2" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <button className="btn-secondary text-xs" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn-danger text-xs" onClick={() => handleDelete(confirmDelete)}>
                Sí, eliminar orden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
