import { useState, useRef, useMemo, useEffect } from 'react';
import type { ServiceOrder, InventoryItem, View, Role } from '../store';

export type { View, Role };

interface NavItem { id: View; label: string }

const allNavItems: NavItem[] = [
  { id: 'dashboard',  label: 'Inicio' },
  { id: 'reception',  label: 'Recepción' },
  { id: 'orders',     label: 'Órdenes' },
  { id: 'workshop',   label: 'Taller' },
  { id: 'diagnosis',  label: 'Diagnóstico IA' },
  { id: 'parts',      label: 'Repuestos' },
  { id: 'clients',    label: 'Clientes' },
  { id: 'inventory',  label: 'Inventario' },
  { id: 'reports',    label: 'Reportes' },
  { id: 'config',     label: 'Configuración' },
  { id: 'dbschema',   label: 'Base de Datos' },
];

const roleNavMap: Record<Role, View[]> = {
  admin:   ['dashboard','reception','orders','workshop','clients','inventory','reports','config','dbschema'],
  asesor:  ['dashboard','reception','orders','workshop','diagnosis','parts','clients'],
  tecnico: ['workshop','orders'],
};

const roleColor: Record<Role, string> = {
  admin: '#7c3aed', asesor: '#2563eb', tecnico: '#059669',
};
const roleLabel: Record<Role, string> = {
  admin: 'Admin', asesor: 'Asesor', tecnico: 'Técnico',
};

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
        body: `${i.name}: ${i.stock} uds. restantes (mín. ${i.min})`,
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
      body: `Total: $${cobradas.reduce((s, o) => s + (o.services ?? []).reduce((a, v) => a + v.price, 0) + (o.usedParts ?? []).filter(p => p.used).reduce((a, p) => a + p.price * p.qty, 0), 0).toFixed(2)}`,
      time: fmt(now),
      action: { label: 'Ver reportes', view: 'reports' },
    });
  }

  return notifs;
}

const dotColor: Record<string, string> = {
  error: '#ef4444', warning: '#f59e0b', info: '#3b82f6', success: '#22c55e',
};

interface TopNavProps {
  currentView: View;
  onNavigate: (view: View) => void;
  role: Role;
  userName: string;
  onLogout: () => void;
  darkMode?: boolean;
  onToggleDark?: () => void;
  orders?: ServiceOrder[];
  inventory?: InventoryItem[];
}

export default function TopNav({ currentView, onNavigate, role, userName, onLogout, darkMode, onToggleDark, orders = [], inventory = [] }: TopNavProps) {
  const allowedViews = roleNavMap[role];
  const navItems = allNavItems.filter(i => allowedViews.includes(i.id));

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

  const initials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header
      className="flex items-center h-12 shrink-0 z-50 px-0"
      style={{ background: 'var(--shell)', borderBottom: '1px solid var(--shell-border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 shrink-0" style={{ width: 220, borderRight: '1px solid var(--shell-border)' }}>
        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent)', boxShadow: '0 2px 8px rgba(37,99,235,0.4)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
            <rect x="9" y="11" width="14" height="10" rx="2" />
            <circle cx="12" cy="16" r="1" />
          </svg>
        </div>
        <div>
          <div className="text-white text-sm font-bold leading-tight tracking-tight" style={{ fontFamily: 'DM Sans, sans-serif' }}>AutoServ</div>
          <div className="text-xs leading-tight" style={{ color: '#475569', fontSize: 10 }}>Gestión de Taller</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex items-center h-full px-2 gap-0.5 flex-1 overflow-x-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="nav-item h-full"
            style={{
              borderRadius: 0,
              borderBottom: currentView === item.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: currentView === item.id ? '#ffffff' : '#64748b',
              background: currentView === item.id ? 'rgba(37,99,235,0.08)' : 'transparent',
              padding: '0 12px',
              flexDirection: 'row',
              gap: 0,
              fontSize: 12,
              fontWeight: currentView === item.id ? 600 : 500,
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Right controls */}
      <div className="flex items-center gap-1 px-3 shrink-0">
        {/* Dark mode */}
        <button
          onClick={onToggleDark}
          title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          className="dark-toggle w-8 h-8 rounded flex items-center justify-center transition-colors"
          style={{ color: '#475569' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
        >
          {darkMode
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="w-8 h-8 rounded flex items-center justify-center relative transition-colors"
            style={{ color: notifOpen ? '#94a3b8' : '#475569' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
            onMouseLeave={e => !notifOpen && (e.currentTarget.style.color = '#475569')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white"
                style={{ background: '#ef4444', fontSize: 8, fontWeight: 700, lineHeight: 1 }}>
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
                    Marcar como leídas
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <div className="py-8 text-center text-xs" style={{ color: 'var(--text-3)' }}>Sin notificaciones</div>
                ) : notifs.map(n => (
                  <div key={n.id}
                    className="px-4 py-3 cursor-default"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: n.read ? 'transparent' : 'rgba(37,99,235,0.04)',
                    }}>
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
                          <button onClick={() => handleAction(n)}
                            className="text-[11px] mt-1 font-semibold" style={{ color: 'var(--accent)' }}>
                            {n.action.label} →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: 'var(--shell-border)' }} />

        {/* User */}
        <div className="relative group flex items-center gap-2 rounded px-2.5 py-1.5 cursor-pointer transition-colors"
          style={{ color: '#94a3b8' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0"
            style={{ background: roleColor[role], fontSize: 10, fontWeight: 700 }}>
            {initials}
          </div>
          <div className="hidden sm:block">
            <div className="text-white text-xs font-semibold leading-tight" style={{ fontSize: 11.5 }}>{userName.split(' ')[0]}</div>
            <div className="leading-tight" style={{ fontSize: 10, color: '#475569' }}>{roleLabel[role]}</div>
          </div>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>

          {/* Dropdown */}
          <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-40 rounded-lg overflow-hidden z-50"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
            <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>{userName}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>{roleLabel[role]}</div>
            </div>
            <button className="w-full text-left px-3 py-2 text-xs transition-colors" style={{ color: 'var(--text-2)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              Mi perfil
            </button>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <button onClick={onLogout} className="w-full text-left px-3 py-2 text-xs transition-colors" style={{ color: '#ef4444' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fff1f2')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
