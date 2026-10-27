import type { View, Role } from '../store';

interface NavItem {
  id: View;
  label: string;
  icon?: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const icon = (path: React.ReactNode, extra?: React.ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {path}{extra}
  </svg>
);

const icons: Record<View, React.ReactNode> = {
  dashboard: icon(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>),
  reception: icon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>),
  orders: icon(<><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>),
  workshop: icon(<><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>),
  diagnosis: icon(<><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14"/></>),
  parts: icon(<><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="16" r="1"/></>),
  inventory: icon(<><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="16" r="1"/></>),
  clients: icon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
  reports: icon(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>),
  config: icon(<><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M2 12h2M20 12h2M19.07 19.07l-1.41-1.41M5.34 5.34L3.93 3.93M12 2v2M12 20v2"/></>),
  dbschema: icon(<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>),
  agenda: icon(<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
};

const allGroups: Record<Role, NavGroup[]> = {
  admin: [
    {
      label: 'Principal',
      items: [
        { id: 'dashboard', label: 'Inicio' },
      ],
    },
    {
      label: 'Operaciones',
      items: [
        { id: 'reception', label: 'Recepción' },
        { id: 'orders',    label: 'Órdenes' },
        { id: 'workshop',  label: 'Taller' },
        { id: 'agenda',    label: 'Agenda' },
        { id: 'diagnosis', label: 'Diagnóstico IA' },
      ],
    },
    {
      label: 'Gestión',
      items: [
        { id: 'clients',   label: 'Clientes' },
        { id: 'inventory', label: 'Inventario' },
        { id: 'reports',   label: 'Reportes' },
      ],
    },
    {
      label: 'Sistema',
      items: [
        { id: 'config',   label: 'Configuración' },
        { id: 'dbschema', label: 'Base de Datos' },
      ],
    },
  ],
  asesor: [
    {
      label: 'Principal',
      items: [
        { id: 'dashboard', label: 'Inicio' },
      ],
    },
    {
      label: 'Operaciones',
      items: [
        { id: 'reception', label: 'Recepción' },
        { id: 'orders',    label: 'Órdenes' },
        { id: 'workshop',  label: 'Taller' },
        { id: 'agenda',    label: 'Agenda' },
        { id: 'diagnosis', label: 'Diagnóstico IA' },
      ],
    },
    {
      label: 'Gestión',
      items: [
        { id: 'clients',   label: 'Clientes' },
        { id: 'inventory', label: 'Inventario' },
      ],
    },
  ],
  tecnico: [
    {
      label: 'Trabajo',
      items: [
        { id: 'workshop', label: 'Taller' },
        { id: 'orders',   label: 'Órdenes' },
      ],
    },
  ],
};

const roleColor: Record<Role, string> = {
  admin: '#7c3aed', asesor: '#2563eb', tecnico: '#059669',
};
const roleLabel: Record<Role, string> = {
  admin: 'Administrador', asesor: 'Asesor de Servicio', tecnico: 'Técnico Mecánico',
};

interface NavSidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  role: Role;
  userName: string;
  onLogout: () => void;
}

export default function NavSidebar({ currentView, onNavigate, role, userName, onLogout }: NavSidebarProps) {
  const groups = allGroups[role];
  const initials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="flex flex-col shrink-0 h-full overflow-hidden"
      style={{ width: 220, background: 'var(--shell)', borderRight: '1px solid var(--shell-border)' }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-12 shrink-0"
        style={{ borderBottom: '1px solid var(--shell-border)' }}>
        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent)', boxShadow: '0 2px 8px rgba(37,99,235,0.4)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
            <rect x="9" y="11" width="14" height="10" rx="2"/>
            <circle cx="12" cy="16" r="1"/>
          </svg>
        </div>
        <div>
          <div className="text-white text-sm font-bold leading-tight"
            style={{ fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.3px' }}>AutoServ AI</div>
          <div style={{ color: '#334155', fontSize: 10 }}>Gestión de Taller</div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {groups.map(group => (
          <div key={group.label}>
            <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: '#1e3a5f' }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all"
                    style={{
                      background: active ? 'rgba(37,99,235,0.15)' : 'transparent',
                      color: active ? '#60a5fa' : '#475569',
                      fontWeight: active ? 600 : 400,
                      fontSize: 12.5,
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
                  >
                    <span style={{ color: active ? '#60a5fa' : '#334155', flexShrink: 0 }}>
                      {icons[item.id]}
                    </span>
                    {item.label}
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: '#2563eb' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid var(--shell-border)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--shell-border)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0"
            style={{ background: roleColor[role], fontSize: 10, fontWeight: 700 }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold leading-tight truncate" style={{ fontSize: 11.5 }}>
              {userName}
            </div>
            <div style={{ color: '#334155', fontSize: 10, lineHeight: 1.4 }}>{roleLabel[role]}</div>
          </div>
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="shrink-0 rounded p-1 transition-colors"
            style={{ color: '#334155' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
