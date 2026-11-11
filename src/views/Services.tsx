import { useEffect, useRef, useState } from 'react';
import type { ServiceLine } from '../store';
import {
  eliminarServicio,
  guardarServicio,
  importarServicios,
  listarServicios,
} from '../../utils/recepcion';
import { aCsv, descargarCsv, parsearCsv } from '../../utils/csv';

interface ServicesProps {
  role?: string;
}

const emptyForm = { code: '', name: '', time: '1h', price: '' };

export default function Services({ role }: ServicesProps) {
  const isAdmin = role === 'admin';
  const canEdit = role === 'admin' || role === 'asesor';
  const [items, setItems] = useState<ServiceLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await listarServicios());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const filtered = items.filter((s) => {
    const q = search.toLowerCase();
    return s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
  });

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (s: ServiceLine) => {
    setEditing(s.code);
    setForm({ code: s.code, name: s.name, time: s.time, price: String(s.price) });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    try {
      const saved = await guardarServicio({
        codigo: form.code.trim() || undefined,
        nombre: form.name.trim(),
        tiempo: form.time.trim() || '1h',
        precio: Number.parseFloat(form.price) || 0,
      });
      setItems((prev) => {
        const sin = prev.filter((p) => p.code !== saved.code);
        return [...sin, saved].sort((a, b) => a.code.localeCompare(b.code));
      });
      setShowForm(false);
      setForm(emptyForm);
      setEditing(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo guardar el servicio.');
    }
  };

  const remove = async (code: string) => {
    if (!isAdmin) return;
    if (!window.confirm(`¿Eliminar el servicio ${code}?`)) return;
    try {
      await eliminarServicio(code);
      setItems((prev) => prev.filter((p) => p.code !== code));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo eliminar.');
    }
  };

  const download = () => {
    const csv = aCsv(
      ['codigo', 'nombre', 'tiempo', 'precio'],
      items.map((s) => [s.code, s.name, s.time, s.price]),
    );
    descargarCsv('servicios.csv', csv);
  };

  const onFile = async (file: File) => {
    try {
      const texto = await file.text();
      const filas = parsearCsv(texto);
      const mapped = filas
        .map((f) => ({
          codigo: (f.codigo || f.code || '').trim(),
          nombre: (f.nombre || f.name || '').trim(),
          tiempo: (f.tiempo || f.time || '1h').trim(),
          precio: Number.parseFloat(f.precio || f.price || '0') || 0,
        }))
        .filter((f) => f.codigo && f.nombre);
      if (mapped.length === 0) {
        window.alert('El CSV no tiene filas válidas. Columnas: codigo,nombre,tiempo,precio');
        return;
      }
      const guardados = await importarServicios(mapped);
      setItems(guardados.length ? (await listarServicios()) : items);
      window.alert(`Se importaron / actualizaron ${mapped.length} servicios.`);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo importar el CSV.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="p-5 overflow-y-auto h-full space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Catálogo de Servicios
          </h1>
          <p className="text-xs text-slate-500">CRUD + descarga/carga CSV · alimenta diagnóstico y órdenes</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-secondary text-xs" onClick={download} disabled={items.length === 0}>
            Descargar CSV
          </button>
          {canEdit && (
            <>
              <button className="btn-secondary text-xs" onClick={() => fileRef.current?.click()}>
                Cargar CSV
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onFile(file);
                }}
              />
              <button className="btn-primary text-xs" onClick={openNew}>+ Nuevo Servicio</button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <input
          className="form-input"
          placeholder="Buscar por código o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
      {loading ? (
        <p className="text-xs text-slate-400">Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                {['Código', 'Nombre', 'Tiempo', 'Precio', ''].map((h) => (
                  <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.code} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-blue-600 font-medium mono">{s.code}</td>
                  <td className="px-4 py-2.5 text-slate-700">{s.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{s.time}</td>
                  <td className="px-4 py-2.5 font-semibold">${s.price.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right space-x-2">
                    {canEdit && (
                      <button className="text-blue-500 hover:text-blue-700" onClick={() => openEdit(s)}>Editar</button>
                    )}
                    {isAdmin && (
                      <button className="text-red-400 hover:text-red-600" onClick={() => { void remove(s.code); }}>Eliminar</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No hay servicios en el catálogo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-96 p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-700 mb-4">
              {editing ? `Editar ${editing}` : 'Nuevo servicio'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="form-label">Código {editing ? '' : '(opcional)'}</label>
                <input
                  className="form-input mono"
                  disabled={!!editing}
                  placeholder="SRV-009"
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">Nombre *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="form-label">Tiempo</label>
                  <input
                    className="form-input"
                    placeholder="1.5h"
                    value={form.time}
                    onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Precio</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-primary flex-1 justify-center text-xs" onClick={() => { void save(); }} disabled={!form.name.trim()}>
                Guardar
              </button>
              <button className="btn-secondary flex-1 justify-center text-xs" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
