import { useState } from 'react';
import type { Role } from '../store';

interface User { id: string; name: string; email: string; role: Role; status: 'active' | 'inactive'; }

const initialUsers: User[] = [
  { id: 'U001', name: 'Roberto Vásquez', email: 'admin@autoserv.ec', role: 'admin', status: 'active' },
  { id: 'U002', name: 'Juan Pérez', email: 'asesor@autoserv.ec', role: 'asesor', status: 'active' },
  { id: 'U003', name: 'Ana García', email: 'ana@autoserv.ec', role: 'asesor', status: 'active' },
  { id: 'U004', name: 'Miguel Torres', email: 'tecnico@autoserv.ec', role: 'tecnico', status: 'active' },
  { id: 'U005', name: 'Luis Castro', email: 'luis@autoserv.ec', role: 'tecnico', status: 'inactive' },
];

const roleLabel: Record<Role, string> = { admin: 'Administrador', asesor: 'Asesor de Servicio', tecnico: 'Técnico Mecánico' };
const roleColor: Record<Role, string> = { admin: 'bg-purple-100 text-purple-700', asesor: 'bg-blue-100 text-blue-700', tecnico: 'bg-green-100 text-green-700' };

interface NewUserForm { name: string; email: string; role: Role; pass: string; }
const blankUser = (): NewUserForm => ({ name: '', email: '', role: 'asesor', pass: '' });

export default function Config() {
  const [tab, setTab] = useState<'users' | 'workshop' | 'system'>('users');
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<NewUserForm>(blankUser());
  const [formError, setFormError] = useState('');
  const [savedUser, setSavedUser] = useState(false);
  const [workshop, setWorkshop] = useState({
    name: 'AutoServ AI', owner: 'Roberto Vásquez', ruc: '0920123456001',
    address: 'Av. 17 de Septiembre y Guayas', city: 'Milagro', phone: '04 297 1234', email: 'info@autoserv.ec',
  });
  const [workshopSaved, setWorkshopSaved] = useState(false);
  const [aiToggles, setAiToggles] = useState({ diagnosis: true, prediction: true, alerts: true });
  const [sysParams, setSysParams] = useState({ correlativo: 'OS-2024-000568', moneda: 'USD ($)', timezone: 'America/Guayaquil (UTC-5)' });
  const [sysSaved, setSysSaved] = useState(false);

  const toggleUser = (id: string) =>
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));

  const deleteUser = (id: string) => {
    if (window.confirm('¿Eliminar este usuario?')) setUsers(prev => prev.filter(u => u.id !== id));
  };

  const openEdit = (u: User) => { setEditUser(u); setNewUser({ name: u.name, email: u.email, role: u.role, pass: '' }); setShowModal(true); setFormError(''); };
  const openNew = () => { setEditUser(null); setNewUser(blankUser()); setShowModal(true); setFormError(''); };

  const submitUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) { setFormError('Nombre y correo son requeridos.'); return; }
    if (!editUser && !newUser.pass.trim()) { setFormError('La contraseña es requerida para usuarios nuevos.'); return; }
    if (editUser) {
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, name: newUser.name, email: newUser.email, role: newUser.role } : u));
    } else {
      const id = `U${String(users.length + 1).padStart(3, '0')}`;
      setUsers(prev => [...prev, { id, name: newUser.name, email: newUser.email, role: newUser.role, status: 'active' }]);
    }
    setSavedUser(true);
    setTimeout(() => { setShowModal(false); setSavedUser(false); }, 900);
  };

  const saveWorkshop = () => { setWorkshopSaved(true); setTimeout(() => setWorkshopSaved(false), 2000); };
  const saveSystem = () => { setSysSaved(true); setTimeout(() => setSysSaved(false), 2000); };

  return (
    <div className="p-5 overflow-y-auto h-full space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>Configuración del Sistema</h1>
        <p className="text-xs text-slate-500">Administra usuarios, roles y parámetros del taller</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'users' as const, label: '👥 Usuarios y Roles' },
          { id: 'workshop' as const, label: '🏪 Datos del Taller' },
          { id: 'system' as const, label: '⚙️ Sistema' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* User modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-80 p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-700 mb-4">{editUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            <div className="space-y-3">
              <div><label className="form-label">Nombre completo *</label>
                <input className="form-input" placeholder="Nombre Apellido" value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} /></div>
              <div><label className="form-label">Correo electrónico *</label>
                <input className="form-input" placeholder="usuario@autoserv.ec" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} /></div>
              <div><label className="form-label">Rol</label>
                <select className="form-select" value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value as Role }))}>
                  <option value="admin">Administrador</option>
                  <option value="asesor">Asesor de Servicio</option>
                  <option value="tecnico">Técnico Mecánico</option>
                </select></div>
              {!editUser && (
                <div><label className="form-label">Contraseña temporal *</label>
                  <input className="form-input" type="password" placeholder="••••••••" value={newUser.pass} onChange={e => setNewUser(p => ({ ...p, pass: e.target.value }))} /></div>
              )}
              {formError && <p className="text-[11px] text-red-500">⚠️ {formError}</p>}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-primary flex-1 justify-center text-xs" onClick={submitUser}>
                {savedUser ? '✓ Guardado' : editUser ? 'Guardar Cambios' : 'Crear Usuario'}
              </button>
              <button className="btn-secondary flex-1 justify-center text-xs" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Usuarios del Sistema <span className="font-normal text-slate-400">({users.filter(u => u.status === 'active').length} activos)</span>
            </h3>
            <button className="btn-primary text-xs" onClick={openNew}>+ Nuevo Usuario</button>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>{['Usuario', 'Correo', 'Rol', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase px-4 py-2">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: u.role === 'admin' ? '#7c3aed' : u.role === 'asesor' ? '#1e40af' : '#059669' }}>
                        {u.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium text-slate-700">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3"><span className={`status-badge ${roleColor[u.role]}`}>{roleLabel[u.role]}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleUser(u.id)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${u.status === 'active' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}>
                      {u.status === 'active' ? '● Activo' : '○ Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="btn-secondary text-[10px] px-2 py-0.5" onClick={() => openEdit(u)}>✏️ Editar</button>
                      <button className="text-red-400 hover:text-red-600 text-sm px-1" onClick={() => deleteUser(u.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'workshop' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 max-w-xl">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-4">Datos del Taller</h3>
          <div className="space-y-3">
            {([
              { label: 'Nombre del Taller', field: 'name' },
              { label: 'Propietario', field: 'owner' },
              { label: 'RUC', field: 'ruc' },
              { label: 'Dirección', field: 'address' },
              { label: 'Ciudad', field: 'city' },
              { label: 'Teléfono', field: 'phone' },
              { label: 'Email', field: 'email' },
            ] as { label: string; field: keyof typeof workshop }[]).map(f => (
              <div key={f.field}>
                <label className="form-label">{f.label}</label>
                <input className="form-input" value={workshop[f.field]}
                  onChange={e => setWorkshop(p => ({ ...p, [f.field]: e.target.value }))} />
              </div>
            ))}
            <button className="btn-primary text-xs mt-2" onClick={saveWorkshop}>
              {workshopSaved ? '✓ Guardado' : '💾 Guardar Cambios'}
            </button>
          </div>
        </div>
      )}

      {tab === 'system' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 max-w-xl space-y-4">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Parámetros del Sistema</h3>
          {([
            { label: 'Correlativo de OS (próximo)', field: 'correlativo', desc: 'Número automático de la siguiente orden.' },
            { label: 'Moneda', field: 'moneda', desc: 'Moneda utilizada en cotizaciones.' },
            { label: 'Zona horaria', field: 'timezone', desc: 'Zona horaria para fechas y horas.' },
          ] as { label: string; field: keyof typeof sysParams; desc: string }[]).map(p => (
            <div key={p.field} className="pb-3 border-b border-slate-100">
              <label className="form-label">{p.label}</label>
              <input className="form-input" value={sysParams[p.field]}
                onChange={e => setSysParams(prev => ({ ...prev, [p.field]: e.target.value }))} />
              <p className="text-[10px] text-slate-400 mt-1">{p.desc}</p>
            </div>
          ))}

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Módulos IA</p>
            {([
              { label: 'Diagnóstico con Random Forest + LLM', key: 'diagnosis' as const },
              { label: 'Predicción de demanda de repuestos', key: 'prediction' as const },
              { label: 'Alertas inteligentes de inventario', key: 'alerts' as const },
            ]).map(m => (
              <div key={m.key} className="flex items-center justify-between py-1.5 cursor-pointer" onClick={() => setAiToggles(p => ({ ...p, [m.key]: !p[m.key] }))}>
                <span className="text-xs text-slate-600">{m.label}</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${aiToggles[m.key] ? 'bg-blue-600' : 'bg-slate-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow transition-all ${aiToggles[m.key] ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </div>
            ))}
          </div>

          <button className="btn-primary text-xs" onClick={saveSystem}>
            {sysSaved ? '✓ Configuración Guardada' : '💾 Guardar Configuración'}
          </button>
        </div>
      )}
    </div>
  );
}
