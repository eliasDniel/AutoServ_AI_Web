export type OrderStatus = 'recepcion' | 'en_taller' | 'terminada';
export type Role = 'admin' | 'asesor' | 'tecnico';
export type View = 'dashboard' | 'reception' | 'orders' | 'workshop' | 'parts' | 'clients' | 'reports' | 'diagnosis' | 'inventory' | 'config' | 'dbschema' | 'agenda';
// `parts` se redirige a `inventory` en App; se mantiene por compatibilidad del menú antiguo.

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
  fuente?: 'local' | 'stub' | 'modelo' | string;
  movimientos?: { type: 'entrada' | 'salida'; qty: number; date: string; note: string }[];
}

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
