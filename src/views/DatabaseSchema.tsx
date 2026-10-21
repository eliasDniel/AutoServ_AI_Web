import { useState } from 'react';

interface Column {
  name: string;
  type: string;
  pk?: boolean;
  fk?: string;
  notNull?: boolean;
  unique?: boolean;
  default?: string;
  description?: string;
}

interface Table {
  name: string;
  label: string;
  color: string;
  icon: string;
  description: string;
  columns: Column[];
}

const tables: Table[] = [
  {
    name: 'usuarios',
    label: 'Usuarios',
    color: '#7c3aed',
    icon: '👤',
    description: 'Usuarios del sistema con acceso por roles',
    columns: [
      { name: 'id', type: 'UUID', pk: true, notNull: true, default: 'gen_random_uuid()', description: 'Identificador único' },
      { name: 'nombre', type: 'VARCHAR(100)', notNull: true, description: 'Nombre completo del usuario' },
      { name: 'email', type: 'VARCHAR(150)', notNull: true, unique: true, description: 'Correo electrónico único' },
      { name: 'password_hash', type: 'TEXT', notNull: true, description: 'Contraseña cifrada (bcrypt)' },
      { name: 'rol', type: "ENUM('admin','asesor','tecnico')", notNull: true, description: 'Rol de acceso al sistema' },
      { name: 'activo', type: 'BOOLEAN', notNull: true, default: 'TRUE', description: 'Estado de la cuenta' },
      { name: 'created_at', type: 'TIMESTAMP', notNull: true, default: 'NOW()' },
    ],
  },
  {
    name: 'clientes',
    label: 'Clientes',
    color: '#0369a1',
    icon: '👥',
    description: 'Datos de los clientes del taller',
    columns: [
      { name: 'id', type: 'VARCHAR(10)', pk: true, notNull: true, description: 'Ej: C001' },
      { name: 'nombre', type: 'VARCHAR(150)', notNull: true, description: 'Nombre completo del cliente' },
      { name: 'telefono', type: 'VARCHAR(20)', notNull: true, description: 'Número de contacto' },
      { name: 'email', type: 'VARCHAR(150)', unique: true, description: 'Correo electrónico' },
      { name: 'direccion', type: 'VARCHAR(255)', description: 'Dirección domiciliaria' },
      { name: 'ciudad', type: 'VARCHAR(100)', description: 'Ciudad de residencia' },
      { name: 'created_at', type: 'TIMESTAMP', notNull: true, default: 'NOW()' },
    ],
  },
  {
    name: 'vehiculos',
    label: 'Vehículos',
    color: '#0891b2',
    icon: '🚗',
    description: 'Vehículos registrados por cliente',
    columns: [
      { name: 'id', type: 'VARCHAR(10)', pk: true, notNull: true, description: 'Ej: V001' },
      { name: 'cliente_id', type: 'VARCHAR(10)', fk: 'clientes.id', notNull: true, description: 'Cliente propietario' },
      { name: 'placa', type: 'VARCHAR(15)', notNull: true, unique: true, description: 'Placa del vehículo' },
      { name: 'marca', type: 'VARCHAR(50)', notNull: true, description: 'Ej: Chevrolet, Toyota' },
      { name: 'modelo', type: 'VARCHAR(50)', notNull: true, description: 'Ej: Tracker, Corolla' },
      { name: 'anio', type: 'SMALLINT', notNull: true, description: 'Año de fabricación' },
      { name: 'color', type: 'VARCHAR(50)', description: 'Color del vehículo' },
      { name: 'vin', type: 'VARCHAR(17)', unique: true, description: 'Número de identificación vehicular' },
      { name: 'motor', type: 'VARCHAR(30)', description: 'Tipo de motor (ej: 1.2L Turbo)' },
      { name: 'combustible', type: "ENUM('Gasolina','Diesel','Híbrido','Eléctrico')", description: 'Tipo de combustible' },
      { name: 'transmision', type: "ENUM('Manual','Automática','CVT')", description: 'Tipo de transmisión' },
      { name: 'kilometraje', type: 'INTEGER', notNull: true, default: '0', description: 'Km al momento del registro' },
      { name: 'created_at', type: 'TIMESTAMP', notNull: true, default: 'NOW()' },
    ],
  },
  {
    name: 'ordenes_servicio',
    label: 'Órdenes de Servicio',
    color: '#b45309',
    icon: '📋',
    description: 'Cabecera de cada orden de trabajo',
    columns: [
      { name: 'os', type: 'VARCHAR(20)', pk: true, notNull: true, description: 'Ej: OS-2024-000567' },
      { name: 'cliente_id', type: 'VARCHAR(10)', fk: 'clientes.id', notNull: true },
      { name: 'vehiculo_id', type: 'VARCHAR(10)', fk: 'vehiculos.id', notNull: true },
      { name: 'asesor_id', type: 'UUID', fk: 'usuarios.id', notNull: true, description: 'Asesor que recibió el vehículo' },
      { name: 'fecha_recepcion', type: 'TIMESTAMP', notNull: true, default: 'NOW()' },
      { name: 'estado', type: "ENUM('recepcion','en_taller','terminada')", notNull: true, default: "'recepcion'" },
      { name: 'nivel_combustible', type: 'SMALLINT', notNull: true, description: 'Porcentaje 0-100' },
      { name: 'km_ingreso', type: 'INTEGER', notNull: true, description: 'Kilometraje al ingresar' },
      { name: 'entrega_llave', type: 'BOOLEAN', default: 'FALSE' },
      { name: 'entrega_alarma', type: 'BOOLEAN', default: 'FALSE' },
      { name: 'autorizacion_firmada', type: 'BOOLEAN', default: 'FALSE' },
      { name: 'garantia_vigente', type: 'BOOLEAN', default: 'FALSE' },
      { name: 'tipo_garantia', type: 'VARCHAR(50)' },
      { name: 'nro_garantia', type: 'VARCHAR(50)' },
      { name: 'observaciones_cliente', type: 'TEXT' },
      { name: 'notas_tecnicas', type: 'TEXT' },
      { name: 'notas_inspeccion', type: 'TEXT' },
      { name: 'firma_cliente', type: 'TEXT', description: 'Firma en base64' },
      { name: 'foto_vehiculo', type: 'TEXT', description: 'URL de foto almacenada' },
      { name: 'created_at', type: 'TIMESTAMP', notNull: true, default: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMP', notNull: true, default: 'NOW()' },
    ],
  },
  {
    name: 'inspeccion_partes',
    label: 'Inspección de Partes',
    color: '#b45309',
    icon: '🔍',
    description: 'Estado de cada parte del vehículo en la recepción',
    columns: [
      { name: 'id', type: 'SERIAL', pk: true },
      { name: 'os', type: 'VARCHAR(20)', fk: 'ordenes_servicio.os', notNull: true },
      { name: 'parte', type: 'VARCHAR(50)', notNull: true, description: 'Ej: Parabrisas, Faro Izq.' },
      { name: 'estado_ok', type: 'BOOLEAN', notNull: true, description: 'TRUE = sin daño, FALSE = con daño' },
    ],
  },
  {
    name: 'catalogo_servicios',
    label: 'Catálogo de Servicios',
    color: '#059669',
    icon: '🔧',
    description: 'Servicios disponibles en el taller',
    columns: [
      { name: 'codigo', type: 'VARCHAR(10)', pk: true, notNull: true, description: 'Ej: SRV-001' },
      { name: 'nombre', type: 'VARCHAR(150)', notNull: true },
      { name: 'tiempo_estimado', type: 'VARCHAR(10)', description: 'Ej: 1h, 2.5h' },
      { name: 'precio', type: 'DECIMAL(10,2)', notNull: true },
      { name: 'activo', type: 'BOOLEAN', notNull: true, default: 'TRUE' },
    ],
  },
  {
    name: 'servicios_orden',
    label: 'Servicios por Orden',
    color: '#059669',
    icon: '🔩',
    description: 'Servicios asignados a cada orden (tabla intermedia)',
    columns: [
      { name: 'id', type: 'SERIAL', pk: true },
      { name: 'os', type: 'VARCHAR(20)', fk: 'ordenes_servicio.os', notNull: true },
      { name: 'servicio_codigo', type: 'VARCHAR(10)', fk: 'catalogo_servicios.codigo', notNull: true },
      { name: 'precio_cobrado', type: 'DECIMAL(10,2)', notNull: true, description: 'Precio al momento de la OS' },
    ],
  },
  {
    name: 'inventario',
    label: 'Inventario / Repuestos',
    color: '#dc2626',
    icon: '⚙️',
    description: 'Stock de repuestos y materiales del taller',
    columns: [
      { name: 'codigo', type: 'VARCHAR(10)', pk: true, notNull: true, description: 'Ej: REP-001' },
      { name: 'nombre', type: 'VARCHAR(150)', notNull: true },
      { name: 'categoria', type: 'VARCHAR(50)', notNull: true, description: 'Lubricantes, Frenos, Motor…' },
      { name: 'stock_actual', type: 'INTEGER', notNull: true, default: '0' },
      { name: 'stock_minimo', type: 'INTEGER', notNull: true, description: 'Dispara alerta de reabastecimiento' },
      { name: 'stock_maximo', type: 'INTEGER', notNull: true },
      { name: 'precio_unitario', type: 'DECIMAL(10,2)', notNull: true },
      { name: 'rotacion', type: "ENUM('Alta','Media','Baja')", description: 'Velocidad de salida del ítem' },
      { name: 'created_at', type: 'TIMESTAMP', notNull: true, default: 'NOW()' },
    ],
  },
  {
    name: 'movimientos_inventario',
    label: 'Movimientos de Inventario',
    color: '#dc2626',
    icon: '📦',
    description: 'Historial de entradas y salidas de stock',
    columns: [
      { name: 'id', type: 'SERIAL', pk: true },
      { name: 'repuesto_codigo', type: 'VARCHAR(10)', fk: 'inventario.codigo', notNull: true },
      { name: 'tipo', type: "ENUM('entrada','salida')", notNull: true },
      { name: 'cantidad', type: 'INTEGER', notNull: true },
      { name: 'nota', type: 'VARCHAR(255)' },
      { name: 'usuario_id', type: 'UUID', fk: 'usuarios.id', notNull: true },
      { name: 'fecha', type: 'TIMESTAMP', notNull: true, default: 'NOW()' },
    ],
  },
  {
    name: 'repuestos_orden',
    label: 'Repuestos por Orden',
    color: '#dc2626',
    icon: '🔗',
    description: 'Repuestos utilizados en cada orden de servicio',
    columns: [
      { name: 'id', type: 'SERIAL', pk: true },
      { name: 'os', type: 'VARCHAR(20)', fk: 'ordenes_servicio.os', notNull: true },
      { name: 'repuesto_codigo', type: 'VARCHAR(10)', fk: 'inventario.codigo', notNull: true },
      { name: 'cantidad', type: 'INTEGER', notNull: true, default: '1' },
      { name: 'precio_cobrado', type: 'DECIMAL(10,2)', notNull: true, description: 'Precio al momento de uso' },
      { name: 'usado', type: 'BOOLEAN', notNull: true, default: 'FALSE', description: 'Confirmado como usado por el técnico' },
    ],
  },
  {
    name: 'pagos',
    label: 'Pagos',
    color: '#0f766e',
    icon: '💰',
    description: 'Registro de cobros por orden de servicio',
    columns: [
      { name: 'id', type: 'SERIAL', pk: true },
      { name: 'os', type: 'VARCHAR(20)', fk: 'ordenes_servicio.os', notNull: true, unique: true },
      { name: 'metodo', type: "ENUM('efectivo','tarjeta','mixto')", notNull: true },
      { name: 'monto_efectivo', type: 'DECIMAL(10,2)', default: '0' },
      { name: 'monto_tarjeta', type: 'DECIMAL(10,2)', default: '0' },
      { name: 'total', type: 'DECIMAL(10,2)', notNull: true },
      { name: 'tarjeta_ultimos4', type: 'CHAR(4)', description: 'Últimos 4 dígitos' },
      { name: 'tarjeta_marca', type: 'VARCHAR(20)', description: 'Visa, Mastercard, etc.' },
      { name: 'stripe_payment_method_id', type: 'VARCHAR(100)', description: 'ID de Stripe (tarjeta)' },
      { name: 'fecha_pago', type: 'TIMESTAMP', notNull: true, default: 'NOW()' },
      { name: 'registrado_por', type: 'UUID', fk: 'usuarios.id', notNull: true },
    ],
  },
];

const typeColor: Record<string, string> = {
  UUID: '#7c3aed', SERIAL: '#7c3aed', VARCHAR: '#0369a1', TEXT: '#0369a1',
  CHAR: '#0369a1', BOOLEAN: '#059669', INTEGER: '#b45309', SMALLINT: '#b45309',
  DECIMAL: '#0f766e', TIMESTAMP: '#64748b', ENUM: '#dc2626',
};

function getTypeColor(type: string) {
  const key = Object.keys(typeColor).find(k => type.startsWith(k));
  return key ? typeColor[key] : '#64748b';
}

const SQL_DDL = `-- ============================================
--  AutoServ AI — Script DDL (PostgreSQL)
-- ============================================

CREATE TABLE usuarios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  rol             VARCHAR(10) NOT NULL CHECK (rol IN ('admin','asesor','tecnico')),
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE clientes (
  id          VARCHAR(10) PRIMARY KEY,
  nombre      VARCHAR(150) NOT NULL,
  telefono    VARCHAR(20) NOT NULL,
  email       VARCHAR(150) UNIQUE,
  direccion   VARCHAR(255),
  ciudad      VARCHAR(100),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE vehiculos (
  id          VARCHAR(10) PRIMARY KEY,
  cliente_id  VARCHAR(10) NOT NULL REFERENCES clientes(id),
  placa       VARCHAR(15) NOT NULL UNIQUE,
  marca       VARCHAR(50) NOT NULL,
  modelo      VARCHAR(50) NOT NULL,
  anio        SMALLINT NOT NULL,
  color       VARCHAR(50),
  vin         VARCHAR(17) UNIQUE,
  motor       VARCHAR(30),
  combustible VARCHAR(20),
  transmision VARCHAR(20),
  kilometraje INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE ordenes_servicio (
  os                    VARCHAR(20) PRIMARY KEY,
  cliente_id            VARCHAR(10) NOT NULL REFERENCES clientes(id),
  vehiculo_id           VARCHAR(10) NOT NULL REFERENCES vehiculos(id),
  asesor_id             UUID NOT NULL REFERENCES usuarios(id),
  fecha_recepcion       TIMESTAMP NOT NULL DEFAULT NOW(),
  estado                VARCHAR(15) NOT NULL DEFAULT 'recepcion'
                          CHECK (estado IN ('recepcion','en_taller','terminada')),
  nivel_combustible     SMALLINT NOT NULL,
  km_ingreso            INTEGER NOT NULL,
  entrega_llave         BOOLEAN DEFAULT FALSE,
  entrega_alarma        BOOLEAN DEFAULT FALSE,
  autorizacion_firmada  BOOLEAN DEFAULT FALSE,
  garantia_vigente      BOOLEAN DEFAULT FALSE,
  tipo_garantia         VARCHAR(50),
  nro_garantia          VARCHAR(50),
  observaciones_cliente TEXT,
  notas_tecnicas        TEXT,
  notas_inspeccion      TEXT,
  firma_cliente         TEXT,
  foto_vehiculo         TEXT,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE inspeccion_partes (
  id        SERIAL PRIMARY KEY,
  os        VARCHAR(20) NOT NULL REFERENCES ordenes_servicio(os),
  parte     VARCHAR(50) NOT NULL,
  estado_ok BOOLEAN NOT NULL
);

CREATE TABLE catalogo_servicios (
  codigo          VARCHAR(10) PRIMARY KEY,
  nombre          VARCHAR(150) NOT NULL,
  tiempo_estimado VARCHAR(10),
  precio          DECIMAL(10,2) NOT NULL,
  activo          BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE servicios_orden (
  id              SERIAL PRIMARY KEY,
  os              VARCHAR(20) NOT NULL REFERENCES ordenes_servicio(os),
  servicio_codigo VARCHAR(10) NOT NULL REFERENCES catalogo_servicios(codigo),
  precio_cobrado  DECIMAL(10,2) NOT NULL
);

CREATE TABLE inventario (
  codigo         VARCHAR(10) PRIMARY KEY,
  nombre         VARCHAR(150) NOT NULL,
  categoria      VARCHAR(50) NOT NULL,
  stock_actual   INTEGER NOT NULL DEFAULT 0,
  stock_minimo   INTEGER NOT NULL,
  stock_maximo   INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  rotacion       VARCHAR(5) CHECK (rotacion IN ('Alta','Media','Baja')),
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE movimientos_inventario (
  id              SERIAL PRIMARY KEY,
  repuesto_codigo VARCHAR(10) NOT NULL REFERENCES inventario(codigo),
  tipo            VARCHAR(7) NOT NULL CHECK (tipo IN ('entrada','salida')),
  cantidad        INTEGER NOT NULL,
  nota            VARCHAR(255),
  usuario_id      UUID NOT NULL REFERENCES usuarios(id),
  fecha           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE repuestos_orden (
  id              SERIAL PRIMARY KEY,
  os              VARCHAR(20) NOT NULL REFERENCES ordenes_servicio(os),
  repuesto_codigo VARCHAR(10) NOT NULL REFERENCES inventario(codigo),
  cantidad        INTEGER NOT NULL DEFAULT 1,
  precio_cobrado  DECIMAL(10,2) NOT NULL,
  usado           BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE pagos (
  id                        SERIAL PRIMARY KEY,
  os                        VARCHAR(20) NOT NULL UNIQUE REFERENCES ordenes_servicio(os),
  metodo                    VARCHAR(10) NOT NULL CHECK (metodo IN ('efectivo','tarjeta','mixto')),
  monto_efectivo            DECIMAL(10,2) DEFAULT 0,
  monto_tarjeta             DECIMAL(10,2) DEFAULT 0,
  total                     DECIMAL(10,2) NOT NULL,
  tarjeta_ultimos4          CHAR(4),
  tarjeta_marca             VARCHAR(20),
  stripe_payment_method_id  VARCHAR(100),
  fecha_pago                TIMESTAMP NOT NULL DEFAULT NOW(),
  registrado_por            UUID NOT NULL REFERENCES usuarios(id)
);`;

export default function DatabaseSchema() {
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [showSQL, setShowSQL] = useState(false);
  const [copied, setCopied] = useState(false);

  const copySQL = () => {
    navigator.clipboard.writeText(SQL_DDL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selected = tables.find(t => t.name === activeTable);

  const relations = [
    { from: 'vehiculos.cliente_id', to: 'clientes.id' },
    { from: 'ordenes_servicio.cliente_id', to: 'clientes.id' },
    { from: 'ordenes_servicio.vehiculo_id', to: 'vehiculos.id' },
    { from: 'ordenes_servicio.asesor_id', to: 'usuarios.id' },
    { from: 'servicios_orden.os', to: 'ordenes_servicio.os' },
    { from: 'servicios_orden.servicio_codigo', to: 'catalogo_servicios.codigo' },
    { from: 'repuestos_orden.os', to: 'ordenes_servicio.os' },
    { from: 'repuestos_orden.repuesto_codigo', to: 'inventario.codigo' },
    { from: 'inspeccion_partes.os', to: 'ordenes_servicio.os' },
    { from: 'movimientos_inventario.repuesto_codigo', to: 'inventario.codigo' },
    { from: 'movimientos_inventario.usuario_id', to: 'usuarios.id' },
    { from: 'pagos.os', to: 'ordenes_servicio.os' },
    { from: 'pagos.registrado_por', to: 'usuarios.id' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-bold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Esquema de Base de Datos
          </h1>
          <p className="text-xs text-slate-500">{tables.length} tablas · {tables.reduce((s, t) => s + t.columns.length, 0)} columnas · PostgreSQL</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSQL(!showSQL)}
            className={`btn-secondary text-xs ${showSQL ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}`}
          >
            {showSQL ? '📊 Ver Diagrama' : '📄 Ver SQL DDL'}
          </button>
          <button onClick={copySQL} className="btn-primary text-xs">
            {copied ? '✓ Copiado' : '📋 Copiar SQL'}
          </button>
        </div>
      </div>

      {showSQL ? (
        /* SQL View */
        <div className="flex-1 overflow-y-auto p-6">
          <pre className="bg-slate-900 text-green-300 rounded-xl p-5 text-[11px] leading-relaxed font-mono overflow-x-auto whitespace-pre">
            {SQL_DDL}
          </pre>
        </div>
      ) : (
        /* Diagram View */
        <div className="flex flex-1 overflow-hidden">
          {/* Table list */}
          <div className="w-52 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
            <div className="p-3 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tablas</p>
            </div>
            {tables.map(t => (
              <button
                key={t.name}
                onClick={() => setActiveTable(activeTable === t.name ? null : t.name)}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 text-xs transition-colors border-b border-slate-50 ${
                  activeTable === t.name ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-base">{t.icon}</span>
                <div>
                  <div className="font-semibold leading-tight">{t.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{t.name}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Main area */}
          <div className="flex-1 overflow-y-auto p-5">
            {selected ? (
              /* Detail view */
              <div className="max-w-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: selected.color + '20' }}>
                    {selected.icon}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>{selected.label}</h2>
                    <p className="text-xs text-slate-500">{selected.description}</p>
                  </div>
                  <div className="ml-auto flex gap-2 text-[10px] font-bold text-slate-400">
                    <span className="px-2 py-1 rounded bg-amber-50 text-amber-600 font-mono">PK</span>
                    <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 font-mono">FK</span>
                    <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 font-mono">NOT NULL</span>
                    <span className="px-2 py-1 rounded bg-purple-50 text-purple-600 font-mono">UNIQUE</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {['Columna', 'Tipo', 'Restricciones', 'Default', 'Descripción'].map(h => (
                          <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase px-4 py-2.5 tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.columns.map((col, i) => (
                        <tr key={col.name} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                          <td className="px-4 py-2.5 font-mono font-semibold text-slate-800">
                            {col.name}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: getTypeColor(col.type) + '18', color: getTypeColor(col.type) }}>
                              {col.type}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {col.pk && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">PK</span>}
                              {col.fk && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">FK → {col.fk}</span>}
                              {col.notNull && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">NOT NULL</span>}
                              {col.unique && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">UNIQUE</span>}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-500 text-[10px]">{col.default ?? '—'}</td>
                          <td className="px-4 py-2.5 text-slate-500">{col.description ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* FK relations from this table */}
                {(() => {
                  const rels = relations.filter(r => r.from.startsWith(selected.name + '.'));
                  return rels.length > 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Relaciones (claves foráneas)</h3>
                      <div className="space-y-2">
                        {rels.map(r => (
                          <div key={r.from} className="flex items-center gap-2 text-xs">
                            <span className="font-mono font-semibold text-blue-700">{r.from.split('.')[1]}</span>
                            <span className="text-slate-400">→ referencia →</span>
                            <span className="font-mono font-semibold text-amber-700">{r.to}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            ) : (
              /* Cards overview */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total tablas', value: tables.length, icon: '🗃️', color: '#0369a1' },
                    { label: 'Total columnas', value: tables.reduce((s, t) => s + t.columns.length, 0), icon: '📊', color: '#059669' },
                    { label: 'Relaciones FK', value: relations.length, icon: '🔗', color: '#7c3aed' },
                    { label: 'Motor de BD', value: 'PostgreSQL', icon: '🐘', color: '#b45309' },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: s.color + '18' }}>{s.icon}</div>
                      <div>
                        <div className="text-lg font-bold text-slate-800">{s.value}</div>
                        <div className="text-xs text-slate-500">{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {tables.map(t => (
                    <button
                      key={t.name}
                      onClick={() => setActiveTable(t.name)}
                      className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:border-blue-300 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{t.icon}</span>
                        <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                      </div>
                      <div className="font-bold text-slate-800 text-xs group-hover:text-blue-700 transition-colors">{t.label}</div>
                      <div className="text-[10px] font-mono text-slate-400 mb-1">{t.name}</div>
                      <div className="text-[10px] text-slate-500">{t.columns.length} columnas</div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {t.columns.filter(c => c.pk || c.fk).slice(0, 3).map(c => (
                          <span key={c.name} className={`text-[8px] px-1 py-0.5 rounded font-bold ${c.pk ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {c.pk ? '🔑' : '🔗'} {c.name}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Relations list */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Diagrama de Relaciones</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {relations.map(r => (
                      <div key={r.from} className="flex items-center gap-2 text-[11px] bg-slate-50 rounded-lg px-3 py-1.5">
                        <span className="font-mono text-blue-700 font-semibold">{r.from}</span>
                        <span className="text-slate-300">→</span>
                        <span className="font-mono text-amber-700 font-semibold">{r.to}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
