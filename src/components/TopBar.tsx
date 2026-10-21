import { useState, useRef, useMemo, useEffect } from 'react';
import type { ServiceOrder, InventoryItem } from '../store';
import type { Role, View } from '../store';

export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  body: string;
  time: string;
  read: boolean;
  action?: { label: string; view: View };
}

function buildNotifications(orders: ServiceOrder[], inventory: InventoryItem[], role: Role): Omit<Notification, 'read'>[] {
  const notifs: Omit<Notification, 'read'>[] = [];
  const now = new Date();
  const fmt = (d: Date) => d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

  if (role === 'admin') {
    inventory.filter(i => i.stock < i.min).forEach(i => {
      notifs.push({
        id: `stock-${i.code}`, type: 'error',
        title: 'Stock bajo',
        body: `${i.name}: ${i.stock} uds. (mín. ${i.min})`,
        time: fmt(now),
        action: { label: 'Ver inventario', view: 'inventory' },
      });
    });
  }

  if (role === 'tecnico' || role === 'admin') {
    const enTaller = orders.filter(o => o.status === 'en_taller');
    if (enTaller.length > 0) {
      notifs.push({
        id: 'en-taller', type: 'info',
        title: `${enTaller.length} orden${enTaller.length > 1 ? 'es' : ''} activa${enTaller.length > 1 ? 's' : ''}`,
        body: enTaller.map(o => o.os).join(' · '),
        time: fmt(now),
        action: { label: 'Ir al taller', view: 'workshop' },
      });
    }
  }

  if (role === 'admin' || role === 'asesor') {
    const sinCobrar = orders.filter(o => o.status === 'terminada' && !o.payment);
    if (sinCobrar.length > 0) {
      notifs.push({
        id: 'sin-cobrar', type: 'warning',
        title: `${sinCobrar.length} orden${sinCobrar.length > 1 ? 'es' : ''} sin cobrar`,
        body: sinCobrar.map(o => o.os).join(' · '),
        time: fmt(now),
        action: { label: 'Ver órdenes', view: 'orders' },
      });
    }
    const enRecep = orders.filter(o => o.status === 'recepcion');
    if (enRecep.length > 0) {
      notifs.push({
        id: 'en-recepcion', type: 'info',
        title: `${enRecep.length} vehículo${enRecep.length > 1 ? 's' : ''} en recepción`,
        body: enRecep.map(o => o.os).join(' · '),
        time: fmt(now),
        action: { label: 'Ver recepción', view: 'reception' },
      });
    }
  }

  const cobradas = orders.filter(o => o.status === 'terminada' && o.payment);
  if (cobradas.length > 0) {
    notifs.push({
      id: 'cobradas', type: 'success',
      title: `${cobradas.length} orden${cobradas.length > 1 ? 'es' : ''} cobrada${cobradas.length > 1 ? 's' : ''}`,
      body: `Total: $${cobradas.reduce((s, o) => s + (o.services ?? []).reduce((a, v) => a + v.price, 0), 0).toFixed(2)}`,
      time: fmt(now),
      action: { label: 'Ver reportes', view: 'reports' },
    });
  }

  return notifs;
}

const dotColor: Record<string, string> = {
  error: '#ef4444', warning: '#f59e0b', info: '#3b82f6', success: '#22c55e',
};

interface TopBarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  role: Role;
  darkMode?: boolean;
  onToggleDark?: () => void;
  orders?: ServiceOrder[];
  inventory?: InventoryItem[];
}

export default function TopBar({ currentView, onNavigate, role, darkMode, onToggleDark, orders = [], inventory = [] }: TopBarProps) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const baseNotifs = useMemo(
    () => buildNotifications(orders, inventory, role),
    [orders, inventory, role],
  );
  const notifs = baseNotifs.map(n => ({ ...n, read: readIds.has(n.id) }));
  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = (id: string) => setReadIds(prev => new Set([...prev, id]));
  const markAllRead = () => setReadIds(new Set(notifs.map(n => n.id)));

  const handleAction = (n: typeof notifs[0]) => {
    markRead(n.id);
    if (n.action) onNavigate(n.action.view);
    setNotifOpen(false);
  };

  // Page title from current view
  const pageTitles: Partial<Record<View, string>> = {
    dashboard: 'Panel de Control',
    reception: 'Recepción de Vehículos',
    orders: 'Órdenes de Servicio',
    workshop: 'Taller',
    diagnosis: 'Diagnóstico IA',
    parts: 'Repuestos',
    inventory: 'Inventario',
    clients: 'Clientes',
    reports: 'Reportes',
    config: 'Configuración',
    dbschema: 'Base de Datos',
  };

  return (
    <header className="flex items-center h-12 shrink-0 px-4 gap-3"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}>
          {pageTitles[currentView] ?? ''}
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1">
        {/* Dark mode */}
        <button onClick={onToggleDark} title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          className="dark-toggle w-8 h-8 rounded flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
          {darkMode
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen(v => !v)}
            className="w-8 h-8 rounded flex items-center justify-center relative transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
            onMouseLeave={e => !notifOpen && (e.currentTarget.style.color = 'var(--text-3)')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white"
                style={{ background: '#ef4444', fontSize: 8, fontWeight: 700 }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 rounded-lg overflow-hidden z-50"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}>
              <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="text-xs font-bold" style={{ color: 'var(--text-1)' }}>Notificaciones</span>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>
                    Marcar leídas
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifs.length === 0
                  ? <div className="py-8 text-center text-xs" style={{ color: 'var(--text-3)' }}>Sin notificaciones</div>
                  : notifs.map(n => (
                    <div key={n.id} className="px-4 py-3"
                      style={{ borderBottom: '1px solid var(--border)', background: n.read ? 'transparent' : 'rgba(37,99,235,0.04)' }}>
                      <div className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                          style={{ background: n.read ? 'var(--border-strong)' : dotColor[n.type] }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="text-xs font-semibold" style={{ color: n.read ? 'var(--text-2)' : 'var(--text-1)' }}>{n.title}</span>
                            <span className="text-[10px] shrink-0" style={{ color: 'var(--text-3)' }}>{n.time}</span>
                          </div>
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-2)' }}>{n.body}</p>
                          {n.action && (
                            <button onClick={() => handleAction(n)} className="text-[11px] mt-1 font-semibold" style={{ color: 'var(--accent)' }}>
                              {n.action.label} →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
              <div className="px-4 py-2 text-center" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <button onClick={() => { setNotifOpen(false); onNavigate('reports'); }}
                  className="text-[11px] font-medium" style={{ color: 'var(--text-2)' }}>
                  Ver reportes →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
