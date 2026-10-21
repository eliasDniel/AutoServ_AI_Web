import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import type { ServiceOrder, Client, Vehicle } from '../store';

interface ReportsProps { orders: ServiceOrder[]; clients: Client[]; vehicles: Vehicle[]; }

const monthly = [
  { mes: 'Ene', ingresos: 5200, ordenes: 38 }, { mes: 'Feb', ingresos: 6100, ordenes: 45 },
  { mes: 'Mar', ingresos: 5800, ordenes: 42 }, { mes: 'Abr', ingresos: 7200, ordenes: 51 },
  { mes: 'May', ingresos: 8450, ordenes: 58 },
];

const byType = [
  { name: 'Mantenimiento', value: 42 }, { name: 'Frenos', value: 18 },
  { name: 'Suspensión', value: 14 }, { name: 'A/C', value: 10 }, { name: 'Otros', value: 16 },
];

const techPerf = [
  { tech: 'Miguel Torres', terminadas: 28, enProceso: 3 },
  { tech: 'Luis Castro', terminadas: 22, enProceso: 2 },
  { tech: 'Pedro Vera', terminadas: 17, enProceso: 4 },
];

const pieColors = ['#3b82f6', '#f59e0b', '#22c55e', '#8b5cf6', '#94a3b8'];

export default function Reports({ orders, clients, vehicles }: ReportsProps) {
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-05-31');
  const totalRevenue = orders.filter(o => o.status === 'terminada')
    .reduce((s, o) => s + o.services.reduce((a, v) => a + v.price, 0), 0);
  const avgTicket = totalRevenue / (orders.filter(o => o.status === 'terminada').length || 1);

  const kpis = [
    { label: 'Ingresos Totales', value: `$${totalRevenue.toFixed(0)}`, icon: '💰', color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Ticket Promedio', value: `$${avgTicket.toFixed(0)}`, icon: '🧾', color: '#0891b2', bg: '#cffafe' },
    { label: 'Clientes Atendidos', value: new Set(orders.map(o => o.clientId)).size, icon: '👥', color: '#059669', bg: '#d1fae5' },
    { label: 'Órdenes Completadas', value: orders.filter(o => o.status === 'terminada').length, icon: '✅', color: '#1e40af', bg: '#dbeafe' },
  ];

  return (
    <div className="p-5 overflow-y-auto h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>Reportes Gerenciales</h1>
          <p className="text-xs text-slate-500">Enero – Mayo 2024 · Taller AutoServ Milagro</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <button className="btn-secondary text-xs" onClick={() => setShowDateFilter(p => !p)}>📅 {dateFrom.slice(0, 7)} → {dateTo.slice(0, 7)}</button>
            {showDateFilter && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl p-3 z-20 w-56 space-y-2">
                <div><label className="form-label">Desde</label><input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
                <div><label className="form-label">Hasta</label><input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
                <button className="btn-primary w-full justify-center text-xs" onClick={() => setShowDateFilter(false)}>Aplicar</button>
              </div>
            )}
          </div>
          <button className="btn-secondary text-xs" onClick={() => window.print()}>📊 Exportar PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-lg border border-slate-200 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ background: k.bg }}>{k.icon}</div>
            <div>
              <div className="text-xl font-bold leading-tight" style={{ color: k.color, fontFamily: 'DM Sans, sans-serif' }}>{k.value}</div>
              <div className="text-xs font-semibold text-slate-600">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Ingresos Mensuales ($)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Ingresos']} />
              <Line type="monotone" dataKey="ingresos" stroke="#1e40af" strokeWidth={2.5} dot={{ fill: '#1e40af', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Órdenes por Mes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              <Bar dataKey="ordenes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Servicios por Tipo</h3>
          <div className="flex items-center gap-3">
            <ResponsiveContainer width={120} height={140}>
              <PieChart>
                <Pie data={byType} cx="50%" cy="50%" outerRadius={55} dataKey="value" stroke="none">
                  {byType.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 flex-1">
              {byType.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: pieColors[i] }} />
                  <span className="text-slate-500 flex-1">{d.name}</span>
                  <span className="font-bold text-slate-700">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Rendimiento por Técnico</h3>
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>{['Técnico', 'Terminadas', 'En Proceso', 'Eficiencia'].map(h => (
                <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase px-3 py-2">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {techPerf.map(t => {
                const total = t.terminadas + t.enProceso;
                const pct = Math.round((t.terminadas / total) * 100);
                return (
                  <tr key={t.tech} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-700 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold">
                        {t.tech.split(' ').map(w => w[0]).join('')}
                      </div>
                      {t.tech}
                    </td>
                    <td className="px-3 py-3 font-bold text-green-600">{t.terminadas}</td>
                    <td className="px-3 py-3 text-amber-600 font-semibold">{t.enProceso}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{pct}%</span>
                      </div>
                    </td>
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
