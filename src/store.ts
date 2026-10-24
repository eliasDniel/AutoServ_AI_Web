export type OrderStatus = 'recepcion' | 'en_taller' | 'terminada';
export type Role = 'admin' | 'asesor' | 'tecnico';
export type View = 'dashboard' | 'reception' | 'orders' | 'workshop' | 'parts' | 'clients' | 'reports' | 'diagnosis' | 'inventory' | 'config' | 'dbschema' | 'agenda';

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'cancelada';

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  plate: string;
  service: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  mechanic: string;
  notes: string;
  status: AppointmentStatus;
}

export const mechanics = [
  { id: 'M1', name: 'Carlos Mendoza',  specialty: 'Motor y Transmisión',  avatar: 'CM' },
  { id: 'M2', name: 'Diego Paredes',   specialty: 'Frenos y Suspensión',  avatar: 'DP' },
  { id: 'M3', name: 'Luis Torres',     specialty: 'Electrónica y A/C',    avatar: 'LT' },
  { id: 'M4', name: 'Roberto Aguirre', specialty: 'Mecánica General',     avatar: 'RA' },
];

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
}

export interface Vehicle {
  id: string;
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  vin: string;
  engine: string;
  fuel: string;
  transmission: string;
  km: number;
}

export interface ServiceLine {
  code: string;
  name: string;
  time: string;
  price: number;
}

export interface PartLine {
  code: string;
  name: string;
  qty: number;
  price: number;
  used: boolean;
}

export interface DiagnosisService {
  code: string;
  name: string;
  time: string;
  price: number;
}

export interface DiagnosisCard {
  category: string | null;
  confidence: number | null;
  description: string;
  priority: 'Alta' | 'Media' | 'Baja' | null;
  services: DiagnosisService[];
  explanation: string;
  estado?: string;
  fragmento?: string;
}

export interface SavedDiagnosis {
  texto: string;
  resultados: DiagnosisCard[];
}

export interface ServiceOrder {
  os: string;
  clientId: string;
  vehicleId: string;
  advisor: string;
  date: string;
  status: OrderStatus;
  fuelLevel: number;
  hasKey: boolean;
  hasAlarm: boolean;
  authSigned: boolean;
  warranty: boolean;
  warrantyType: string;
  warrantyNum: string;
  clientObservations: string;
  techNotes: string;
  inspectionNotes: string;
  parts: Record<string, boolean>;
  services: ServiceLine[];
  usedParts: PartLine[];
  signature?: string;
  diagnosisNotes?: string;
  diagnosis?: SavedDiagnosis;
  payment?: {
    method: 'efectivo' | 'tarjeta' | 'mixto';
    cash?: number;
    card?: number;
    cardLast4?: string;
    cardBrand?: string;
    paymentMethodId?: string;
    paidAt?: string;
  };
}

export interface InventoryItem {
  code: string;
  name: string;
  category: string;
  stock: number;
  min: number;
  max: number;
  price: number;
  rotation: 'Alta' | 'Media' | 'Baja';
  demanda30?: number;
  coberturaDias?: number | null;
  sugerido?: number;
  movimientos?: { type: 'entrada' | 'salida'; qty: number; date: string; note: string }[];
}

export const initialClients: Client[] = [
  { id: 'C001', name: 'María González Fernández', phone: '099 123 4567', email: 'maria.gonzalez@email.com', address: 'Av. 10 de Agosto N34-123 y América', city: 'Milagro' },
  { id: 'C002', name: 'Luis Hernández Mora', phone: '098 234 5678', email: 'luis.hernandez@email.com', address: 'Cdla. Las Piñas, Mz. 3 Villa 5', city: 'Milagro' },
  { id: 'C003', name: 'Pedro Martínez Silva', phone: '097 345 6789', email: 'pedro.martinez@email.com', address: 'Av. García Moreno 456', city: 'Milagro' },
  { id: 'C004', name: 'Ana Torres Reyes', phone: '096 456 7890', email: 'ana.torres@email.com', address: 'Urb. Los Almendros, Casa 12', city: 'Milagro' },
  { id: 'C005', name: 'Carlos Ramírez Vega', phone: '095 567 8901', email: 'carlos.ramirez@email.com', address: 'Calle Bolívar 789 y Sucre', city: 'Milagro' },
  { id: 'C006', name: 'Rosa Vega Castillo', phone: '094 678 9012', email: 'rosa.vega@email.com', address: 'Av. Chirijos 101', city: 'Naranjito' },
  { id: 'C007', name: 'Diego Muñoz Paredes', phone: '093 789 0123', email: 'diego.munoz@email.com', address: 'Cdla. Nuevo Milagro, Bloque B', city: 'Milagro' },
];

export const initialVehicles: Vehicle[] = [
  { id: 'V001', clientId: 'C001', plate: 'PBC-1234', brand: 'Chevrolet', model: 'Tracker', year: '2022', color: 'Plata Brillante', vin: 'KL7CJNS82NB123456', engine: '1.2L Turbo', fuel: 'Gasolina', transmission: 'Automática', km: 24560 },
  { id: 'V002', clientId: 'C001', plate: 'GAA-5678', brand: 'Toyota', model: 'Corolla', year: '2020', color: 'Blanco Perla', vin: 'JTDBE32K413045678', engine: '2.0L', fuel: 'Gasolina', transmission: 'Manual', km: 48200 },
  { id: 'V003', clientId: 'C002', plate: 'MBB-9012', brand: 'Hyundai', model: 'Tucson', year: '2021', color: 'Gris Grafito', vin: 'KM8J3CA48MU123456', engine: '2.0L', fuel: 'Gasolina', transmission: 'Automática', km: 31000 },
  { id: 'V004', clientId: 'C003', plate: 'GAC-3456', brand: 'Kia', model: 'Sportage', year: '2019', color: 'Negro Midnight', vin: 'KNDPMCAC5K7234567', engine: '2.4L', fuel: 'Gasolina', transmission: 'Automática', km: 62000 },
  { id: 'V005', clientId: 'C004', plate: 'MBC-7890', brand: 'Ford', model: 'EcoSport', year: '2020', color: 'Azul Eléctrico', vin: 'WF0JXXGAHJKL12345', engine: '1.5L', fuel: 'Gasolina', transmission: 'Automática', km: 38500 },
  { id: 'V006', clientId: 'C005', plate: 'GAD-2345', brand: 'Chevrolet', model: 'Aveo', year: '2018', color: 'Rojo Racing', vin: 'KL1TG5DE9JB567890', engine: '1.4L', fuel: 'Gasolina', transmission: 'Manual', km: 87000 },
  { id: 'V007', clientId: 'C007', plate: 'GAE-1122', brand: 'Hyundai', model: 'Tucson', year: '2021', color: 'Blanco', vin: 'KM8J3CA11MU654321', engine: '2.0L', fuel: 'Gasolina', transmission: 'Automática', km: 21000 },
];

const defaultParts: Record<string, boolean> = {
  'Parabrisas': true, 'Espejo Izq.': true, 'Faro Izq.': true,
  'Llanta Del. Izq.': true, 'Puerta Izq.': true, 'Puerta Tras. Izq.': true,
  'Parabrisas Tras.': true, 'Espejo Der.': true, 'Faro Der.': true,
  'Llanta Del. Der.': false, 'Puerta Der.': true, 'Puerta Tras. Der.': true, 'Parachoques Tras.': true,
};

export const initialOrders: ServiceOrder[] = [
  {
    os: 'OS-2024-000567', clientId: 'C001', vehicleId: 'V001',
    advisor: 'Juan Pérez', date: '08/05/2024', status: 'recepcion', fuelLevel: 65,
    hasKey: true, hasAlarm: true, authSigned: true, warranty: true, warrantyType: 'Fábrica', warrantyNum: 'G-2022-778899',
    clientObservations: 'Mantención de 20,000 km.\nRevisar ruidos en suspensión delantera derecha.\nEl aire acondicionado no enfría bien.\nTestigo de presión de llantas encendido.',
    techNotes: '', inspectionNotes: 'Rayón leve en parachoques delantero.', parts: defaultParts,
    services: [
      { code: 'SRV-001', name: 'Cambio de aceite y filtro', time: '1h', price: 45 },
      { code: 'SRV-002', name: 'Revisión de suspensión delantera', time: '2h', price: 80 },
      { code: 'SRV-003', name: 'Revisión sistema A/C', time: '1.5h', price: 60 },
      { code: 'SRV-004', name: 'Revisión y calibración de llantas', time: '0.5h', price: 20 },
    ],
    usedParts: [],
  },
  {
    os: 'OS-2024-000566', clientId: 'C001', vehicleId: 'V002',
    advisor: 'Ana García', date: '08/05/2024', status: 'en_taller', fuelLevel: 40,
    hasKey: true, hasAlarm: false, authSigned: true, warranty: false, warrantyType: '', warrantyNum: '',
    clientObservations: 'Cambio de aceite. Revisión general.',
    techNotes: 'Aceite cambiado. Revisión completada sin inconvenientes.',
    inspectionNotes: '', parts: { ...defaultParts, 'Llanta Del. Der.': true },
    services: [{ code: 'SRV-001', name: 'Cambio de aceite y filtro', time: '1h', price: 45 }],
    usedParts: [
      { code: 'REP-001', name: 'Aceite Motor 5W-30 (1L)', qty: 4, price: 8.50, used: true },
      { code: 'REP-002', name: 'Filtro de Aceite Chevrolet', qty: 1, price: 12, used: true },
    ],
  },
  {
    os: 'OS-2024-000565', clientId: 'C002', vehicleId: 'V003',
    advisor: 'Juan Pérez', date: '07/05/2024', status: 'terminada', fuelLevel: 80,
    hasKey: true, hasAlarm: true, authSigned: true, warranty: false, warrantyType: '', warrantyNum: '',
    clientObservations: 'Cambio de pastillas de freno.',
    techNotes: 'Pastillas delanteras y traseras reemplazadas.',
    inspectionNotes: '', parts: { ...defaultParts, 'Llanta Del. Der.': true },
    services: [{ code: 'SRV-005', name: 'Cambio de pastillas de freno', time: '1.5h', price: 150 }],
    usedParts: [{ code: 'REP-003', name: 'Pastillas de Freno Delanteras', qty: 1, price: 45, used: true }],
  },
  {
    os: 'OS-2024-000564', clientId: 'C003', vehicleId: 'V004',
    advisor: 'Ana García', date: '07/05/2024', status: 'recepcion', fuelLevel: 30,
    hasKey: true, hasAlarm: true, authSigned: true, warranty: false, warrantyType: '', warrantyNum: '',
    clientObservations: 'Revisión general del vehículo.',
    techNotes: '', inspectionNotes: '', parts: { ...defaultParts, 'Llanta Del. Der.': true },
    services: [{ code: 'SRV-006', name: 'Revisión general', time: '1h', price: 80 }],
    usedParts: [],
  },
  {
    os: 'OS-2024-000563', clientId: 'C004', vehicleId: 'V005',
    advisor: 'Juan Pérez', date: '06/05/2024', status: 'en_taller', fuelLevel: 55,
    hasKey: true, hasAlarm: false, authSigned: true, warranty: false, warrantyType: '', warrantyNum: '',
    clientObservations: 'Cambio de pastillas de freno y alineación.',
    techNotes: '',
    inspectionNotes: '', parts: { ...defaultParts, 'Llanta Del. Der.': true },
    services: [
      { code: 'SRV-005', name: 'Cambio de pastillas de freno', time: '1.5h', price: 150 },
      { code: 'SRV-007', name: 'Alineación y balanceo', time: '1h', price: 40 },
    ],
    usedParts: [],
  },
  {
    os: 'OS-2024-000562', clientId: 'C005', vehicleId: 'V006',
    advisor: 'Ana García', date: '06/05/2024', status: 'terminada', fuelLevel: 20,
    hasKey: true, hasAlarm: false, authSigned: true, warranty: false, warrantyType: '', warrantyNum: '',
    clientObservations: 'Cambio de aceite.',
    techNotes: 'Aceite 10W-40 colocado.',
    inspectionNotes: '', parts: { ...defaultParts, 'Llanta Del. Der.': true },
    services: [{ code: 'SRV-001', name: 'Cambio de aceite y filtro', time: '1h', price: 45 }],
    usedParts: [],
  },
];

export const initialInventory: InventoryItem[] = [
  { code: 'REP-001', name: 'Aceite Motor 5W-30 (1L)', category: 'Lubricantes', stock: 42, min: 20, max: 100, price: 8.50, rotation: 'Alta' },
  { code: 'REP-002', name: 'Filtro de Aceite Chevrolet', category: 'Filtros', stock: 8, min: 10, max: 40, price: 12.00, rotation: 'Alta' },
  { code: 'REP-003', name: 'Pastillas de Freno Delanteras', category: 'Frenos', stock: 3, min: 5, max: 20, price: 45.00, rotation: 'Media' },
  { code: 'REP-004', name: 'Bujías NGK (juego)', category: 'Encendido', stock: 15, min: 8, max: 30, price: 28.00, rotation: 'Media' },
  { code: 'REP-005', name: 'Refrigerante 50/50 (1L)', category: 'Lubricantes', stock: 2, min: 10, max: 30, price: 6.50, rotation: 'Alta' },
  { code: 'REP-006', name: 'Correa de Distribución', category: 'Motor', stock: 4, min: 3, max: 10, price: 85.00, rotation: 'Baja' },
  { code: 'REP-007', name: 'Amortiguador Delantero Der.', category: 'Suspensión', stock: 1, min: 2, max: 8, price: 120.00, rotation: 'Baja' },
  { code: 'REP-008', name: 'Filtro de Aire', category: 'Filtros', stock: 18, min: 8, max: 35, price: 18.00, rotation: 'Alta' },
  { code: 'REP-009', name: 'Aceite de Transmisión ATF', category: 'Lubricantes', stock: 12, min: 6, max: 24, price: 15.00, rotation: 'Media' },
  { code: 'REP-010', name: 'Líquido de Frenos DOT 4', category: 'Frenos', stock: 7, min: 4, max: 16, price: 9.00, rotation: 'Media' },
];

export const catalogServices = [
  { code: 'SRV-001', name: 'Cambio de aceite y filtro', time: '1h', price: 45 },
  { code: 'SRV-002', name: 'Revisión de suspensión delantera', time: '2h', price: 80 },
  { code: 'SRV-003', name: 'Revisión sistema A/C', time: '1.5h', price: 60 },
  { code: 'SRV-004', name: 'Revisión y calibración de llantas', time: '0.5h', price: 20 },
  { code: 'SRV-005', name: 'Cambio de pastillas de freno', time: '1.5h', price: 150 },
  { code: 'SRV-006', name: 'Revisión general del vehículo', time: '1h', price: 80 },
  { code: 'SRV-007', name: 'Alineación y balanceo', time: '1h', price: 40 },
  { code: 'SRV-008', name: 'Diagnóstico computarizado', time: '0.5h', price: 35 },
];
