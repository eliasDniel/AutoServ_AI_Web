import { useState } from 'react';
import { reservarCitaPublica } from '../../utils/recepcion';

const WHATSAPP_NUMBER = '593997328741'; // ← cambia por el número real del taller

const services = [
  { icon: '🔧', name: 'Cambio de Aceite y Filtro', desc: 'Aceites sintéticos y convencionales. Todos los vehículos.', time: '1h', price: '$45' },
  { icon: '🛞', name: 'Alineación y Balanceo', desc: 'Equipos de última generación para mayor vida útil de llantas.', time: '1h', price: '$40' },
  { icon: '🔩', name: 'Frenos y Suspensión', desc: 'Revisión, ajuste y cambio de pastillas, discos y amortiguadores.', time: '2h', price: 'Desde $80' },
  { icon: '❄️', name: 'Sistema A/C', desc: 'Diagnóstico, carga de gas y reparación de aire acondicionado.', time: '1.5h', price: '$60' },
  { icon: '💻', name: 'Diagnóstico Computarizado', desc: 'Scanner OBD2 para detectar fallas electrónicas.', time: '0.5h', price: '$35' },
  { icon: '🔋', name: 'Revisión General', desc: 'Inspección completa de 60 puntos de tu vehículo.', time: '1h', price: '$80' },
];

const mechanics = [
  { id: 'M1', name: 'Carlos Mendoza', specialty: 'Motor y Transmisión', avatar: 'CM' },
  { id: 'M2', name: 'Diego Paredes', specialty: 'Frenos y Suspensión', avatar: 'DP' },
  { id: 'M3', name: 'Luis Torres', specialty: 'Electrónica y A/C', avatar: 'LT' },
  { id: 'M4', name: 'Roberto Aguirre', specialty: 'Mecánica General', avatar: 'RA' },
];

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

interface FormData {
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  mechanic: string;
  plate: string;
  notes: string;
}

interface LandingPageProps {
  onStaffClick?: () => void;
}

export default function LandingPage({ onStaffClick }: LandingPageProps) {
  const goToStaff = onStaffClick ?? (() => { window.location.href = '/'; });
  const [form, setForm] = useState<FormData>({
    name: '', phone: '', service: '', date: '', time: '', mechanic: '', plate: '', notes: '',
  });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');

  const set = (k: keyof FormData, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.service || !form.date || !form.time || !form.mechanic) {
      setFormError('Por favor completa todos los campos obligatorios.');
      return;
    }
    setFormError('');
    setSending(true);
    const appointment = {
      id: `APT-${Date.now()}`,
      clientName: form.name,
      clientPhone: form.phone,
      plate: form.plate.toUpperCase(),
      service: form.service,
      date: form.date,
      time: form.time,
      mechanic: form.mechanic,
      notes: form.notes,
      status: 'pendiente' as const,
    };
    try {
      await reservarCitaPublica(appointment);
    } catch (error) {
      setSending(false);
      setFormError(error instanceof Error ? error.message : 'No se pudo reservar la cita.');
      return;
    }
    setSending(false);
    // Siempre mostrar éxito — la cita llega al sistema cuando el asesor sincroniza la Agenda
    setSent(true);
    setForm({ name: '', phone: '', service: '', date: '', time: '', mechanic: '', plate: '', notes: '' });
  };

  return (
    <div className="min-h-screen" style={{ background: '#060d18', fontFamily: 'Inter, sans-serif' }}>

      {/* NAV */}
      <nav style={{ background: 'rgba(6,13,24,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
        className="fixed top-0 left-0 right-0 z-50 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>A</div>
          <span className="font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.02em' }}>
            AutoServ <span style={{ color: '#2563eb' }}>AI</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#servicios" className="text-sm text-slate-400 hover:text-white transition-colors hidden md:block">Servicios</a>
          <a href="#cita" className="text-sm text-slate-400 hover:text-white transition-colors hidden md:block">Reservar Cita</a>
          <a href="#contacto" className="text-sm text-slate-400 hover:text-white transition-colors hidden md:block">Contacto</a>
          <button onClick={goToStaff}
            className="text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            style={{ background: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.15)'; e.currentTarget.style.color = '#60a5fa'; }}>
            Área de Staff
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative flex items-center justify-center" style={{ minHeight: '100vh', paddingTop: 80 }}>
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1615906655593-ad0386982a0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt="Taller"
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.25)' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(6,13,24,0.4) 0%, rgba(6,13,24,0.7) 60%, #060d18 100%)' }} />
        </div>
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            Taller disponible hoy · Milagro, Ecuador
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6" style={{ fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            Tu vehículo merece<br />
            <span style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              el mejor servicio
            </span>
          </h1>
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
            Taller automotriz de confianza con diagnóstico computarizado, mecánicos certificados y atención personalizada.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#cita"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-sm transition-all"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 24px rgba(37,99,235,0.35)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Reservar Cita
            </a>
            <a href="#servicios"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}>
              Ver servicios →
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto">
            {[
              { n: '+500', l: 'Vehículos atendidos' },
              { n: '8+', l: 'Años de experiencia' },
              { n: '4', l: 'Mecánicos certificados' },
            ].map(s => (
              <div key={s.n} className="text-center">
                <div className="text-2xl font-black text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>{s.n}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="py-20 px-6" style={{ background: '#0a1220' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#2563eb' }}>Lo que hacemos</div>
            <h2 className="text-3xl md:text-4xl font-black text-white" style={{ fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.02em' }}>
              Servicios especializados
            </h2>
            <p className="text-slate-400 mt-3 text-sm">Diagnóstico preciso y reparaciones con garantía de calidad</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(svc => (
              <div key={svc.name} className="p-5 rounded-2xl transition-all group"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(37,99,235,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,0.05)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}>
                <div className="text-3xl mb-3">{svc.icon}</div>
                <h3 className="font-bold text-white text-sm mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>{svc.name}</h3>
                <p className="text-slate-400 text-xs mb-3 leading-relaxed">{svc.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">⏱ {svc.time}</span>
                  <span className="font-bold text-sm" style={{ color: '#34d399' }}>{svc.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MECÁNICOS */}
      <section className="py-20 px-6" style={{ background: '#060d18' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#2563eb' }}>Nuestro equipo</div>
            <h2 className="text-3xl md:text-4xl font-black text-white" style={{ fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.02em' }}>
              Mecánicos certificados
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mechanics.map(m => (
              <div key={m.id} className="text-center p-6 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-black text-white mx-auto mb-3"
                  style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
                  {m.avatar}
                </div>
                <div className="font-bold text-white text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>{m.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{m.specialty}</div>
                <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(34,197,94,0.1)', color: '#34d399' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  Disponible
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMULARIO DE CITA */}
      <section id="cita" className="py-20 px-6" style={{ background: '#0a1220' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#2563eb' }}>Agenda tu cita</div>
            <h2 className="text-3xl md:text-4xl font-black text-white" style={{ fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.02em' }}>
              Reserva en segundos
            </h2>
            <p className="text-slate-400 mt-3 text-sm">
              Completa el formulario y un asesor confirmará tu cita a la brevedad
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-6 md:p-8 rounded-3xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nombre completo *</label>
                <input required value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Teléfono de contacto *</label>
                <input required value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="099 000 0000" type="tel"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Placa del vehículo</label>
                <input value={form.plate} onChange={e => set('plate', e.target.value)}
                  placeholder="ABC-1234"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Servicio requerido *</label>
                <select required value={form.service} onChange={e => set('service', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all appearance-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
                  <option value="" style={{ background: '#0a1220' }}>Seleccionar...</option>
                  {services.map(s => <option key={s.name} value={s.name} style={{ background: '#0a1220' }}>{s.name}</option>)}
                  <option value="Otro servicio" style={{ background: '#0a1220' }}>Otro (indicar en notas)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Fecha preferida *</label>
                <input required type="date" value={form.date} min={minDateStr} onChange={e => set('date', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Hora preferida *</label>
                <select required value={form.time} onChange={e => set('time', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all appearance-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
                  <option value="" style={{ background: '#0a1220' }}>Seleccionar...</option>
                  {timeSlots.map(t => <option key={t} value={t} style={{ background: '#0a1220' }}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Mecánico preferido (opcional)</label>
              <div className="grid grid-cols-2 gap-2">
                {mechanics.map(m => (
                  <button type="button" key={m.id}
                    onClick={() => set('mechanic', form.mechanic === m.id ? '' : m.id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{
                      background: form.mechanic === m.id ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.03)',
                      border: form.mechanic === m.id ? '1px solid rgba(37,99,235,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0"
                      style={{ background: form.mechanic === m.id ? '#2563eb' : 'rgba(255,255,255,0.1)' }}>
                      {m.avatar}
                    </div>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: form.mechanic === m.id ? '#93c5fd' : '#e2e8f0' }}>{m.name}</div>
                      <div className="text-[10px] text-slate-600">{m.specialty}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Notas adicionales</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                rows={3} placeholder="Describe el problema o síntoma de tu vehículo..."
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>

            {formError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                <span>⚠️</span> {formError}
              </div>
            )}

            {sent ? (
              <div className="flex flex-col items-center gap-3 py-6 px-4 rounded-2xl text-center"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                  style={{ background: 'rgba(34,197,94,0.15)' }}>✅</div>
                <div>
                  <p className="font-bold text-white text-base">¡Solicitud enviada con éxito!</p>
                  <p className="text-sm mt-1" style={{ color: '#86efac' }}>
                    Tu cita ha sido registrada. Un asesor de AutoServ AI confirmará tu reserva pronto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-1 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                  style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)' }}>
                  Agendar otra cita
                </button>
              </div>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-white text-sm transition-all"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 24px rgba(37,99,235,0.35)', opacity: sending ? 0.7 : 1 }}>
                  {sending ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Enviando solicitud…
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/>
                      </svg>
                      Solicitar Cita
                    </>
                  )}
                </button>
                <p className="text-center text-[11px]" style={{ color: '#475569' }}>
                  Tu solicitud será revisada por nuestro equipo y recibirás confirmación a la brevedad.
                </p>
              </>
            )}
          </form>
        </div>
      </section>

      {/* CONTACTO / FOOTER */}
      <section id="contacto" className="py-16 px-6" style={{ background: '#060d18', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>A</div>
                <span className="font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>AutoServ AI</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Taller automotriz de confianza con tecnología de diagnóstico avanzada y mecánicos certificados.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>Horarios</h4>
              <div className="space-y-1.5 text-sm text-slate-500">
                <div className="flex justify-between"><span>Lunes – Viernes</span><span className="text-white">08:00 – 18:00</span></div>
                <div className="flex justify-between"><span>Sábado</span><span className="text-white">08:00 – 14:00</span></div>
                <div className="flex justify-between"><span>Domingo</span><span style={{ color: '#ef4444' }}>Cerrado</span></div>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>Contacto</h4>
              <div className="space-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>Milagro, Guayas, Ecuador</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📱</span>
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer"
                    className="hover:text-green-400 transition-colors">+593 99 999 9999</a>
                </div>
                <div className="flex items-center gap-2">
                  <span>✉️</span>
                  <span>info@autoservai.com</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-slate-600">© 2026 AutoServ AI. Todos los derechos reservados.</p>
            <button onClick={goToStaff} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              Acceso Staff →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
