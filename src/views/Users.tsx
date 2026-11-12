import { useEffect, useState } from 'react';
import {
  actualizarUsuario,
  crearUsuario,
  listarUsuarios,
  STAFF_ROLES,
  type StaffRoleName,
  type StaffUser,
} from '../../utils/auth';

const emptyForm = {
  nombre: '',
  apellido: '',
  correo: '',
  password: '',
  rol: 'Asesor de Servicio' as StaffRoleName,
  activo: true,
};

export default function Users() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await listarUsuarios());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setOk('');
    setShowForm(true);
  };

  const openEdit = (u: StaffUser) => {
    setEditingId(u.id);
    setForm({
      nombre: u.nombre,
      apellido: u.apellido,
      correo: u.correo,
      password: '',
      rol: (STAFF_ROLES.includes(u.rol as StaffRoleName) ? u.rol : 'Asesor de Servicio') as StaffRoleName,
      activo: u.activo,
    });
    setError('');
    setOk('');
    setShowForm(true);
  };

  const save = async () => {
    setError('');
    setOk('');
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('Completa nombre y apellido.');
      return;
    }
    if (!editingId && (!form.correo.trim() || form.password.length < 8)) {
      setError('Correo y contraseña (mín. 8) son obligatorios al crear.');
      return;
    }
    if (editingId && form.password && form.password.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const actualizado = await actualizarUsuario(editingId, {
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          rol: form.rol,
          activo: form.activo,
          ...(form.password ? { password: form.password } : {}),
        });
        setUsers((prev) =>
          prev
            .map((u) => (u.id === actualizado.id ? actualizado : u))
            .sort((a, b) => Number(b.activo) - Number(a.activo)),
        );
        setOk(`Usuario ${actualizado.correo} actualizado.`);
      } else {
        const creado = await crearUsuario({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          correo: form.correo.trim().toLowerCase(),
          password: form.password,
          rol: form.rol,
        });
        setUsers((prev) => [creado, ...prev].sort((a, b) => Number(b.activo) - Number(a.activo)));
        setOk(`Usuario ${creado.correo} creado con rol ${creado.rol}.`);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el usuario.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (u: StaffUser) => {
    try {
      const actualizado = await actualizarUsuario(u.id, { activo: !u.activo });
      setUsers((prev) =>
        prev
          .map((x) => (x.id === actualizado.id ? actualizado : x))
          .sort((a, b) => Number(b.activo) - Number(a.activo)),
      );
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo cambiar el estado.');
    }
  };

  return (
    <div className="p-5 overflow-y-auto h-full space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Usuarios del sistema
          </h1>
          <p className="text-xs text-slate-500">
            Solo administrador · crear, editar, desactivar · roles: Administrador, Asesor, Técnico
          </p>
        </div>
        <button className="btn-primary text-xs" onClick={openNew}>
          + Nuevo usuario
        </button>
      </div>

      {ok && <p className="text-xs font-semibold text-green-600">{ok}</p>}
      {error && !showForm && <p className="text-xs font-semibold text-red-500">{error}</p>}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-xs text-slate-400">Cargando usuarios...</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                {['Nombre', 'Correo', 'Rol', 'Estado', ''].map((h) => (
                  <th key={h || 'acciones'} className="text-left text-[10px] font-bold text-slate-400 uppercase px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-700">
                    {u.nombre} {u.apellido}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 mono">{u.correo}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${u.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right space-x-2">
                    <button className="text-blue-500 hover:text-blue-700" onClick={() => openEdit(u)}>Editar</button>
                    <button
                      className={u.activo ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700'}
                      onClick={() => { void toggleActivo(u); }}
                    >
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-[420px] p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-700 mb-4">
              {editingId ? 'Editar usuario' : 'Crear usuario'}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="form-label">Nombre *</label>
                  <input
                    className="form-input"
                    value={form.nombre}
                    onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Apellido *</label>
                  <input
                    className="form-input"
                    value={form.apellido}
                    onChange={(e) => setForm((p) => ({ ...p, apellido: e.target.value }))}
                  />
                </div>
              </div>
              {!editingId && (
                <div>
                  <label className="form-label">Correo *</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="usuario@autoserv.local"
                    value={form.correo}
                    onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
                  />
                </div>
              )}
              <div>
                <label className="form-label">
                  {editingId ? 'Nueva contraseña (opcional)' : 'Contraseña * (mín. 8)'}
                </label>
                <input
                  className="form-input"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">Rol *</label>
                <select
                  className="form-select"
                  value={form.rol}
                  onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value as StaffRoleName }))}
                >
                  {STAFF_ROLES.map((rol) => (
                    <option key={rol} value={rol}>{rol}</option>
                  ))}
                </select>
              </div>
              {editingId && (
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
                  />
                  Usuario activo
                </label>
              )}
              {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                className="btn-primary flex-1 justify-center text-xs"
                disabled={saving}
                onClick={() => { void save(); }}
              >
                {saving ? 'Guardando...' : 'Guardar'}
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
