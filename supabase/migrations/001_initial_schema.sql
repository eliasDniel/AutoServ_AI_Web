-- ============================================================
-- AutoServ AI — Esquema completo de base de datos
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. USUARIOS (personal del taller)
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin','asesor','tecnico')),
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. MECÁNICOS
CREATE TABLE IF NOT EXISTS mechanics (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  specialty   TEXT,
  avatar      TEXT,
  active      BOOLEAN DEFAULT true
);

-- 3. CLIENTES
CREATE TABLE IF NOT EXISTS clients (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  address     TEXT,
  city        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. VEHÍCULOS
CREATE TABLE IF NOT EXISTS vehicles (
  id            TEXT PRIMARY KEY,
  client_id     TEXT REFERENCES clients(id) ON DELETE CASCADE,
  plate         TEXT,
  brand         TEXT,
  model         TEXT,
  year          TEXT,
  color         TEXT,
  vin           TEXT,
  engine        TEXT,
  fuel          TEXT,
  transmission  TEXT,
  km            INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 5. ÓRDENES DE SERVICIO
CREATE TABLE IF NOT EXISTS service_orders (
  id                   TEXT PRIMARY KEY,
  client_id            TEXT REFERENCES clients(id),
  vehicle_id           TEXT REFERENCES vehicles(id),
  advisor              TEXT,
  date                 TEXT,
  status               TEXT DEFAULT 'recepcion' CHECK (status IN ('recepcion','en_taller','terminada')),
  fuel_level           INTEGER DEFAULT 50,
  has_key              BOOLEAN DEFAULT false,
  has_alarm            BOOLEAN DEFAULT false,
  auth_signed          BOOLEAN DEFAULT false,
  warranty             BOOLEAN DEFAULT false,
  warranty_type        TEXT DEFAULT '',
  warranty_num         TEXT DEFAULT '',
  client_observations  TEXT DEFAULT '',
  tech_notes           TEXT DEFAULT '',
  inspection_notes     TEXT DEFAULT '',
  parts_checklist      JSONB DEFAULT '{}',
  services             JSONB DEFAULT '[]',
  used_parts           JSONB DEFAULT '[]',
  payment              JSONB,
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- 6. CITAS (desde la landing page)
CREATE TABLE IF NOT EXISTS appointments (
  id            TEXT PRIMARY KEY,
  client_name   TEXT NOT NULL,
  client_phone  TEXT,
  plate         TEXT,
  service       TEXT,
  date          TEXT NOT NULL,
  time          TEXT NOT NULL,
  mechanic      TEXT,
  notes         TEXT DEFAULT '',
  status        TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente','confirmada','cancelada')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 7. INVENTARIO
CREATE TABLE IF NOT EXISTS inventory (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT UNIQUE,
  category    TEXT,
  brand       TEXT,
  price       NUMERIC DEFAULT 0,
  stock       INTEGER DEFAULT 0,
  min_stock   INTEGER DEFAULT 0,
  rotation    TEXT DEFAULT 'Media' CHECK (rotation IN ('Alta','Media','Baja')),
  location    TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

INSERT INTO mechanics (id, name, specialty, avatar) VALUES
  ('M1', 'Carlos Mendoza',  'Motor y Transmisión', 'CM'),
  ('M2', 'Diego Paredes',   'Frenos y Suspensión', 'DP'),
  ('M3', 'Luis Torres',     'Electrónica y A/C',   'LT'),
  ('M4', 'Roberto Aguirre', 'Mecánica General',    'RA')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, email, role) VALUES
  ('U1', 'Admin AutoServ',  'admin@autoserv.com',  'admin'),
  ('U2', 'Juan Pérez',      'juan@autoserv.com',   'asesor'),
  ('U3', 'Pedro Técnico',   'pedro@autoserv.com',  'tecnico')
ON CONFLICT (id) DO NOTHING;

INSERT INTO clients (id, name, phone, email, address, city) VALUES
  ('C001', 'Ana Torres Reyes',     '096 456 7890', 'ana.torres@email.com',   'Urb. Los Almendros, Casa 12', 'Milagro'),
  ('C002', 'Luis Hernández Mora',  '097 345 6789', 'luis.h@email.com',       'Av. Principal 45',            'Milagro'),
  ('C003', 'María González',       '098 234 5678', 'maria.g@email.com',      'Cdla. Nueva 8',               'Naranjito'),
  ('C004', 'Roberto Díaz',         '099 123 4567', 'roberto.d@email.com',    'Calle 5 de Junio 12',         'Milagro')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vehicles (id, client_id, plate, brand, model, year, color, km, fuel, transmission) VALUES
  ('V001', 'C001', 'MBC-7890', 'Ford',    'EcoSport',  '2020', 'Azul Eléctrico', 38500, 'Gasolina',  'Automática'),
  ('V002', 'C002', 'MBB-9012', 'Hyundai', 'Tucson',    '2021', 'Blanco',         22000, 'Gasolina',  'Automática'),
  ('V003', 'C003', 'GAC-3456', 'Chevrolet','Sail',     '2019', 'Rojo',           55000, 'Gasolina',  'Manual'),
  ('V004', 'C004', 'GAD-2345', 'Toyota',  'Corolla',   '2022', 'Negro',          15000, 'Gasolina',  'Automática')
ON CONFLICT (id) DO NOTHING;

INSERT INTO inventory (id, name, code, category, brand, price, stock, min_stock, rotation, location) VALUES
  ('I001', 'Filtro de aceite Toyota',     'FIL-001', 'Filtros',   'Toyota',   12.50,  45, 10, 'Alta',  'A-1'),
  ('I002', 'Pastillas de freno Bosch',    'FRE-001', 'Frenos',    'Bosch',    35.00,  28,  5, 'Alta',  'B-2'),
  ('I003', 'Aceite 5W-30 sintético 4L',  'ACE-001', 'Lubricantes','Castrol', 28.00,  60, 15, 'Alta',  'C-1'),
  ('I004', 'Filtro de aire universal',   'FIL-002', 'Filtros',   'Mann',      8.50,  32,  8, 'Media', 'A-2'),
  ('I005', 'Batería 60Ah',               'BAT-001', 'Eléctrico', 'Bosch',    95.00,   8,  3, 'Media', 'D-1'),
  ('I006', 'Bujías NGK (set 4)',         'BUJ-001', 'Motor',     'NGK',      22.00,  25,  5, 'Alta',  'E-1'),
  ('I007', 'Correa de distribución',     'COR-001', 'Motor',     'Gates',    45.00,  12,  3, 'Baja',  'E-2'),
  ('I008', 'Líquido de frenos DOT4',     'LIQ-001', 'Frenos',    'Brembo',    6.50,  40, 10, 'Media', 'B-3')
ON CONFLICT (id) DO NOTHING;
