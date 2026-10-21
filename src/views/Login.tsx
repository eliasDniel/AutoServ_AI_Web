import { useState } from 'react';

type Role = 'admin' | 'asesor' | 'tecnico';

interface LoginProps {
  onLogin: (role: Role, name: string) => void;
}

const roles: { id: Role; label: string; desc: string; color: string; accent: string }[] = [
  { id: 'admin',   label: 'Administrador',      desc: 'Acceso total: configuración, reportes, inventario y usuarios.', color: '#7c3aed', accent: 'rgba(124,58,237,0.12)' },
  { id: 'asesor',  label: 'Asesor de Servicio', desc: 'Recepción, órdenes, diagnóstico IA y atención al cliente.',     color: '#2563eb', accent: 'rgba(37,99,235,0.12)'  },
  { id: 'tecnico', label: 'Técnico Mecánico',   desc: 'Órdenes asignadas, actualización de estado y repuestos.',        color: '#059669', accent: 'rgba(5,150,105,0.12)'  },
];

const demoUsers: Record<Role, { name: string; email: string; pass: string }> = {
  admin:   { name: 'Roberto Vásquez', email: 'admin@autoserv.ec',   pass: '1234' },
  asesor:  { name: 'Juan Pérez',      email: 'asesor@autoserv.ec',  pass: '1234' },
  tecnico: { name: 'Miguel Torres',   email: 'tecnico@autoserv.ec', pass: '1234' },
};

export default function Login({ onLogin }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fillDemo = (role: Role) => {
    setSelectedRole(role);
    setEmail(demoUsers[role].email);
    setPass(demoUsers[role].pass);
    setError('');
  };

  const handleLogin = () => {
    if (!selectedRole) { setError('Selecciona un rol para continuar.'); return; }
    const demo = demoUsers[selectedRole];
    if (email !== demo.email || pass !== demo.pass) {
      setError('Credenciales incorrectas. Usa las credenciales del rol seleccionado.');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => onLogin(selectedRole, demo.name), 800);
  };

  const accentCol = selectedRole ? roles.find(r => r.id === selectedRole)!.color : '#2563eb';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#060d18' }}>

      {/* Workshop photo — Ken Burns slow zoom */}
      <div className="absolute inset-0 login-bg"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1786489623043-fb024ae22e82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1920')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />

      {/* Dark overlay — enough contrast for readability, not enough to hide the photo */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(160deg, rgba(6,13,24,0.72) 0%, rgba(11,17,32,0.58) 50%, rgba(6,13,24,0.78) 100%)',
      }} />

      {/* Blue accent vignette bottom */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 120% 50% at 50% 110%, rgba(37,99,235,0.12) 0%, transparent 70%)',
      }} />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8 login-brand" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.8)' }}>
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#2563eb', boxShadow: '0 0 24px rgba(37,99,235,0.5)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
                <rect x="9" y="11" width="14" height="10" rx="2"/>
                <circle cx="12" cy="16" r="1"/>
              </svg>
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-white leading-none" style={{ fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.5px' }}>AutoServ AI</div>
              <div className="text-xs font-medium" style={{ color: '#94a3b8' }}>Sistema de Gestión de Taller</div>
            </div>
          </div>
          <p className="text-xs font-medium" style={{ color: '#64748b' }}>Cantón Milagro · Provincia del Guayas</p>
        </div>

        {/* Card */}
        <div className="rounded-xl overflow-hidden login-card" style={{
          background: '#111827',
          border: '1px solid #1e2d45',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}>
          <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid #1e2d45' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>Selecciona tu rol</p>
            <div className="grid grid-cols-3 gap-2">
              {roles.map(role => {
                const sel = selectedRole === role.id;
                return (
                  <button key={role.id} onClick={() => fillDemo(role.id)}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg transition-all text-center"
                    style={{
                      background: sel ? role.accent : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${sel ? role.color : '#1e2d45'}`,
                      outline: 'none',
                    }}>
                    <RoleIcon id={role.id} color={sel ? role.color : '#475569'} />
                    <span className="text-[11px] font-semibold leading-tight"
                      style={{ color: sel ? role.color : '#94a3b8' }}>{role.label}</span>
                  </button>
                );
              })}
            </div>
            {selectedRole && (
              <p className="mt-3 text-[11px] leading-relaxed px-1" style={{ color: '#94a3b8' }}>
                {roles.find(r => r.id === selectedRole)?.desc}
              </p>
            )}
          </div>

          <div className="px-6 py-5 space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#64748b' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                placeholder="usuario@autoserv.ec"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${error ? '#ef4444' : '#1e2d45'}`,
                  color: '#e2e8f0',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#64748b' }}>
                Contraseña
              </label>
              <input
                type="password"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                placeholder="••••••••"
                value={pass}
                onChange={e => { setPass(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${error ? '#ef4444' : '#1e2d45'}`,
                  color: '#e2e8f0',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-all mt-1"
              style={{
                background: loading ? '#1d4ed8' : accentCol,
                boxShadow: `0 4px 16px ${accentCol}40`,
                opacity: loading ? 0.8 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : 'Ingresar al sistema'}
            </button>
          </div>

          <div className="px-6 pb-4 pt-0">
            <p className="text-center text-[10px]" style={{ color: '#475569' }}>
              Selecciona un rol para autocompletar · Contraseña demo: <span style={{ color: '#94a3b8' }}>1234</span>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] mt-5" style={{ color: '#475569' }}>
          AutoServ AI · Proyecto de Tesis · Ingeniería de Software · UNEMI 2024
        </p>
      </div>
    </div>
  );
}

function RoleIcon({ id, color }: { id: Role; color: string }) {
  if (id === 'admin') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
  if (id === 'asesor') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  );
}
