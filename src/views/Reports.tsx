import { useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import type { ServiceOrder, Client, Vehicle } from '../store';

interface ReportsProps { orders: ServiceOrder[]; clients: Client[]; vehicles: Vehicle[]; }

const pieColors = ['#3b82f6', '#f59e0b', '#22c55e', '#8b5cf6', '#94a3b8'];
const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function totalOrden(o: ServiceOrder) {
  const servicios = (o.services ?? []).reduce((s, v) => s + v.price, 0);
  const repuestos = (o.usedParts ?? []).filter((p) => p.used).reduce((s, p) => s + p.price * p.qty, 0);
  return servicios + repuestos;
}

function parseFecha(valor: string): Date | null {
  const partes = valor.split(/[/-]/);
  if (partes.length !== 3) return null;
  const [d, m, y] = partes.map(Number);
  if (!d || !m || !y) return null;
  const fecha = new Date(y, m - 1, d);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export default function Reports({ orders, clients }: ReportsProps) {
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtradas = useMemo(() => {
    if (!dateFrom && !dateTo) return orders;
    const desde = dateFrom ? new Date(dateFrom + 'T00:00:00') : null;
    const hasta = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    return orders.filter((o) => {
      const f = parseFecha(o.date);
      if (!f) return false;
      if (desde && f < desde) return false;
      if (hasta && f > hasta) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo]);

  const terminadas = filtradas.filter((o) => o.status === 'terminada');
  const totalRevenue = terminadas.reduce((s, o) => s + totalOrden(o), 0);
  const avgTicket = totalRevenue / (terminadas.length || 1);

  const monthly = useMemo(() => {
    const mapa = new Map<string, { mes: string; orden: number; ingresos: number; ordenes: number }>();
    for (const o of filtradas) {
      const f = parseFecha(o.date);
      if (!f) continue;
      const clave = `${f.getFullYear()}-${f.getMonth()}`;
      const actual = mapa.get(clave) ?? {
        mes: `${meses[f.getMonth()]} ${String(f.getFullYear()).slice(2)}`,
        orden: f.getFullYear() * 12 + f.getMonth(),
        ingresos: 0,
        ordenes: 0,
      };
      actual.ordenes += 1;
      if (o.status === 'terminada') actual.ingresos += totalOrden(o);
      mapa.set(clave, actual);
    }
    return [...mapa.values()].sort((a, b) => a.orden - b.orden);
  }, [filtradas]);

  const byType = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const o of filtradas) {
      for (const s of o.services ?? []) {
        mapa.set(s.name, (mapa.get(s.name) ?? 0) + 1);
      }
    }
    return [...mapa.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filtradas]);

  const techPerf = useMemo(() => {
    const mapa = new Map<string, { tech: string; terminadas: number; enProceso: number }>();
    for (const o of filtradas) {
      const tech = o.advisor?.trim() || 'Sin asesor';
      const actual = mapa.get(tech) ?? { tech, terminadas: 0, enProceso: 0 };
      if (o.status === 'terminada') actual.terminadas += 1;
      else if (o.status === 'en_taller') actual.enProceso += 1;
      mapa.set(tech, actual);
    }
    return [...mapa.values()].sort((a, b) => b.terminadas - a.terminadas);
  }, [filtradas]);

  const kpis = [
    { label: 'Ingresos Totales', value: `$${totalRevenue.toFixed(0)}`, icon: '💰', color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Ticket Promedio', value: `$${avgTicket.toFixed(0)}`, icon: '🧾', color: '#0891b2', bg: '#cffafe' },
    { label: 'Clientes Atendidos', value: new Set(filtradas.map(o => o.clientId)).size, icon: '👥', color: '#059669', bg: '#d1fae5' },
    { label: 'Órdenes Completadas', value: terminadas.length, icon: '✅', color: '#1e40af', bg: '#dbeafe' },
  ];

  const rango = dateFrom || dateTo
    ? `${dateFrom || '…'} → ${dateTo || '…'}`
    : 'Todas las órdenes cargadas';

  return (
    <div className="p-5 overflow-y-auto h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>Reportes Gerenciales</h1>
          <p className="text-xs text-slate-500">{rango} · {filtradas.length} órdenes · {clients.length} clientes</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <button className="btn-secondary text-xs" onClick={() => setShowDateFilter(p => !p)}>📅 Filtrar fechas</button>
            {showDateFilter && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl p-3 z-20 w-56 space-y-2">
                <div><label className="form-label">Desde</label><input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
                <div><label className="form-label">Hasta</label><input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
                <button className="btn-secondary w-full justify-center text-xs" onClick={() => { setDateFrom(''); setDateTo(''); }}>Limpiar</button>
                <button className="btn-primary w-full justify-center text-xs" onClick={() => setShowDateFilter(false)}>Aplicar</button>
              </div>
            )}
          </div>
          <button className="btn-secondary text-xs" onClick={() => window.print()}>Exportar PDF</button>
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

      {filtradas.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-6 text-xs text-slate-500">
          No hay órdenes para este filtro. Los gráficos se arman solo con datos del servidor.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Ingresos por mes ($)</h3>
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
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Órdenes por mes</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthly} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  <Bar dataKey="ordenes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Servicios más usados</h3>
              {byType.length === 0 ? (
                <p className="text-xs text-slate-400">Sin servicios en las órdenes filtradas.</p>
              ) : (
                <div className="flex items-center gap-3">
                  <ResponsiveContainer width={120} height={140}>
                    <PieChart>
                      <Pie data={byType} cx="50%" cy="50%" outerRadius={55} dataKey="value" stroke="none">
                        {byType.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 flex-1">
                    {byType.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: pieColors[i % pieColors.length] }} />
                        <span className="text-slate-500 flex-1 truncate">{d.name}</span>
                        <span className="font-bold text-slate-700">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Órdenes por asesor</h3>
              {techPerf.length === 0 ? (
                <p className="text-xs text-slate-400">Sin datos de asesores.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>{['Asesor', 'Terminadas', 'En taller'].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase px-3 py-2">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {techPerf.map(t => (
                      <tr key={t.tech} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-3 font-medium text-slate-700">{t.tech}</td>
                        <td className="px-3 py-3 font-bold text-green-600">{t.terminadas}</td>
                        <td className="px-3 py-3 text-amber-600 font-semibold">{t.enProceso}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
