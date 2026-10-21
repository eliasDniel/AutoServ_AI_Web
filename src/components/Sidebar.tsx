import { useState } from 'react';
import type { ServiceOrder, Client, Vehicle } from '../store';

const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  recepcion: { label: 'Recepción', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  en_taller: { label: 'En taller',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  terminada: { label: 'Terminada',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
};

interface SidebarProps {
  orders: ServiceOrder[];
  clients: Client[];
  vehicles: Vehicle[];
  selectedOS: string;
  onSelectOS: (os: string) => void;
  onNewOrder: () => void;
}

export default function Sidebar({ orders, clients, vehicles, selectedOS, onSelectOS, onNewOrder }: SidebarProps) {
  const [query, setQuery] = useState('');
  const getClient  = (id: string) => clients.find(c => c.id === id);
  const getVehicle = (id: string) => vehicles.find(v => v.id === id);

  const filtered = query.trim()
    ? orders.filter(o => {
        const cl = getClient(o.clientId);
        const vh = getVehicle(o.vehicleId);
        const q  = query.toLowerCase();
        return (
          o.os.toLowerCase().includes(q) ||
          cl?.name.toLowerCase().includes(q) ||
          vh?.plate.toLowerCase().includes(q)
        );
      })
    : orders;

  return (
    <aside className="flex flex-col shrink-0 overflow-hidden"
      style={{ width: 210, background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>

      {/* Search */}
      <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar orden o cliente..."
            className="w-full rounded-md pl-7 pr-3 py-1.5 text-xs outline-none"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)',
              fontFamily: 'Inter, sans-serif',
            }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
          Órdenes
        </span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}>
          {filtered.length}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs" style={{ color: 'var(--text-3)' }}>Sin resultados</div>
        ) : filtered.map(order => {
          const cl = getClient(order.clientId);
          const vh = getVehicle(order.vehicleId);
          const m  = statusMeta[order.status];
          const sel = selectedOS === order.os;
          return (
            <button key={order.os} onClick={() => onSelectOS(order.os)}
              className="w-full text-left px-3 py-2.5 transition-colors relative"
              style={{
                borderBottom: '1px solid var(--border)',
                background: sel ? 'rgba(37,99,235,0.06)' : 'transparent',
                borderLeft: sel ? '2px solid var(--accent)' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'var(--surface-2)'; }}
              onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-bold mono" style={{ color: sel ? 'var(--accent)' : 'var(--text-1)' }}>
                  {order.os.replace('OS-2024-', '#')}
                </span>
                <span className="text-[9px] font-bold px-1 py-0.5 rounded-sm" style={{ color: m.color, background: m.bg }}>
                  {m.label.toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] truncate" style={{ color: 'var(--text-2)' }}>{cl?.name}</div>
              {vh && (
                <div className="text-[10px] mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
                  <span className="mono">{vh.plate}</span>
                  <span>·</span>
                  <span>{vh.brand} {vh.model}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <button onClick={onNewOrder} className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5"
          style={{ background: 'var(--accent)', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva Orden
        </button>
      </div>
    </aside>
  );
}
