import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import type { ServiceOrder, Client, Vehicle } from '../store';

const ordenesPorDia = [
  { dia: 'Lun', ordenes: 5 }, { dia: 'Mar', ordenes: 8 }, { dia: 'Mié', ordenes: 6 },
  { dia: 'Jue', ordenes: 9 }, { dia: 'Vie', ordenes: 12 }, { dia: 'Sáb', ordenes: 4 },
];
const ingresosData = [
  { mes: 'Ene', ingresos: 5200 }, { mes: 'Feb', ingresos: 6100 }, { mes: 'Mar', ingresos: 5800 },
  { mes: 'Abr', ingresos: 7200 }, { mes: 'May', ingresos: 8450 }, { mes: 'Jun', ingresos: 7600 },
];
const pieColors = ['#f59e0b', '#3b82f6', '#22c55e'];

const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  recepcion: { label: 'Recepción', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  en_taller: { label: 'En Taller',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  terminada: { label: 'Terminada',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
};

interface DashboardProps {
  orders: ServiceOrder[];
  clients: Client[];
  vehicles: Vehicle[];
  onNavigate: (v: 'reception' | 'orders' | 'workshop' | 'inventory') => void;
  onSelectOS: (os: string) => void;
}

export default function Dashboard({ orders, clients, vehicles, onNavigate, onSelectOS }: DashboardProps) {
  const active      = orders.filter(o => o.status !== 'terminada');
  const inWorkshop  = orders.filter(o => o.status === 'en_taller');
  const recepcion   = orders.filter(o => o.status === 'recepcion');
  const terminadas  = orders.filter(o => o.status === 'terminada');
  const totalRevenue = terminadas.reduce((s, o) => s + o.services.reduce((a, v) => a + v.price, 0), 0);

  const pieData = [
    { name: 'Recepción', value: recepcion.length },
    { name: 'En Taller', value: inWorkshop.length },
    { name: 'Terminadas', value: terminadas.length },
  ];

  const getClient  = (id: string) => clients.find(c => c.id === id);
  const getVehicle = (id: string) => vehicles.find(v => v.id === id);

  const kpis = [
    {
      label: 'Órdenes Activas', value: active.length,
      sub: `${recepcion.length} recepción · ${inWorkshop.length} taller`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
      color: '#2563eb', action: () => onNavigate('orders'),
      delta: '+2', deltaUp: true,
    },
    {
      label: 'En Taller Ahora', value: inWorkshop.length,
      sub: 'Vehículos activos',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
      color: '#059669', action: () => onNavigate('workshop'),
      delta: '', deltaUp: true,
    },
    {
      label: 'Ingresos del Mes', value: `$${totalRevenue.toFixed(0)}`,
      sub: `${terminadas.length} órdenes completadas`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
      color: '#7c3aed', action: () => onNavigate('orders'),
      delta: '+12%', deltaUp: true,
    },
    {
      label: 'Total Clientes', value: clients.length,
      sub: `${vehicles.length} vehículos registrados`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      color: '#0891b2', action: () => onNavigate('orders'),
      delta: '+1', deltaUp: true,
    },
  ];

  const tooltipStyle = {
    contentStyle: { fontSize: 11, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-1)' },
    labelStyle: { color: 'var(--text-2)' },
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--surface-2)' }}>
      <div className="p-5 space-y-4 w-full">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Panel de Control</h1>
            <p className="page-subtitle">Martes, 8 de mayo de 2024 · AutoServ AI · Milagro</p>
          </div>
          <button className="btn-primary text-xs" onClick={() => onNavigate('reception')}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva Recepción
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          {kpis.map(k => (
            <button key={k.label} onClick={k.action} className="stat-tile text-left w-full transition-all"
              onMouseEnter={e => (e.currentTarget.style.borderColor = k.color + '44')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: k.color + '18', color: k.color }}>
                  {k.icon}
                </div>
                {k.delta && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: k.deltaUp ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: k.deltaUp ? '#22c55e' : '#ef4444' }}>
                    {k.delta}
                  </span>
                )}
              </div>
              <div className="stat-value" style={{ color: k.color }}>{k.value}</div>
              <div className="stat-label">{k.label}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>{k.sub}</div>
            </button>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card">
            <div className="card-header"><span className="card-title">Órdenes por Día</span></div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={ordenesPorDia} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="ordenes" fill="#2563eb" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Ingresos Mensuales</span></div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={ingresosData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Ingresos']} />
                  <Line type="monotone" dataKey="ingresos" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed', r: 3, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Estado de Órdenes</span></div>
            <div className="p-4 flex items-center gap-4">
              <ResponsiveContainer width={100} height={110}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={44} dataKey="value" stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: pieColors[i] }} />
                    <span className="text-[11px] flex-1" style={{ color: 'var(--text-2)' }}>{d.name}</span>
                    <span className="text-[11px] font-bold mono" style={{ color: 'var(--text-1)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent orders table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Órdenes Recientes</span>
            <button className="text-xs font-semibold" style={{ color: 'var(--accent)' }}
              onClick={() => onNavigate('orders')}>Ver todas →</button>
          </div>
          <table className="data-table w-full">
            <thead>
              <tr>
                {['Orden', 'Cliente', 'Vehículo', 'Asesor', 'Fecha', 'Estado', 'Total'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 6).map(o => {
                const cl = getClient(o.clientId);
                const vh = getVehicle(o.vehicleId);
                const total = o.services.reduce((s, v) => s + v.price, 0);
                const m = statusMeta[o.status];
                return (
                  <tr key={o.os} className="cursor-pointer"
                    onClick={() => { onSelectOS(o.os); onNavigate('reception'); }}>
                    <td><span className="mono font-semibold" style={{ color: 'var(--accent)' }}>{o.os}</span></td>
                    <td style={{ color: 'var(--text-1)' }}>{cl?.name}</td>
                    <td>
                      {vh ? (
                        <span>{vh.brand} {vh.model} · <span className="mono">{vh.plate}</span></span>
                      ) : '—'}
                    </td>
                    <td>{o.advisor}</td>
                    <td><span className="mono">{o.date}</span></td>
                    <td>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm"
                        style={{ color: m.color, background: m.bg }}>
                        {m.label.toUpperCase()}
                      </span>
                    </td>
                    <td><span className="mono font-semibold">${total.toFixed(2)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
