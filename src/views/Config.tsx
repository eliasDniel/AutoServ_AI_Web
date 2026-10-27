export default function Config() {
  return (
    <div className="p-5 overflow-y-auto h-full space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>Configuración del Sistema</h1>
        <p className="text-xs text-slate-500">Solo información del entorno. Los usuarios y roles viven en ms-auth.</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5 max-w-xl space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Taller</h3>
          <dl className="text-xs space-y-2 text-slate-600">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-400">Nombre</dt>
              <dd className="font-semibold text-slate-700">AutoServ AI</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-400">Ciudad</dt>
              <dd className="font-semibold text-slate-700">Milagro</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-400">Moneda</dt>
              <dd className="font-semibold text-slate-700">USD</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Zona horaria</dt>
              <dd className="font-semibold text-slate-700">America/Guayaquil</dd>
            </div>
          </dl>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Módulos conectados</h3>
          <ul className="text-xs text-slate-600 space-y-1.5">
            <li>· Autenticación JWT (ms-auth)</li>
            <li>· Recepción, órdenes, inventario y citas (ms-core / Postgres)</li>
            <li>· Diagnóstico Random Forest (ms-ia)</li>
            <li>· Proyección de inventario por consumo (preparada para modelo de demanda)</li>
          </ul>
        </div>

        <p className="text-[11px] text-slate-400">
          Para crear usuarios usa el endpoint de administración o el seed de ms-auth.
          Esta pantalla ya no guarda cambios locales falsos.
        </p>
      </div>
    </div>
  );
}
