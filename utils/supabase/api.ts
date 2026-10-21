import { projectId, publicAnonKey } from './info';
import type { Client, Vehicle, ServiceOrder, InventoryItem, Appointment } from '../../src/store';

// Supabase PostgREST API — no edge function needed
const BASE = `https://${projectId}.supabase.co/rest/v1`;

const H = {
  'Content-Type': 'application/json',
  'apikey': publicAnonKey,
  'Authorization': `Bearer ${publicAnonKey}`,
};

async function get<T>(table: string, params = ''): Promise<T[]> {
  try {
    const r = await fetch(`${BASE}/${table}?${params}`, { headers: H });
    if (!r.ok) return [];
    return await r.json();
  } catch { return []; }
}

async function upsert(table: string, body: unknown): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/${table}`, {
      method: 'POST',
      headers: { ...H, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(body),
    });
    return r.ok;
  } catch { return false; }
}

async function patch(table: string, id: string, body: unknown): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { ...H, 'Prefer': 'return=minimal' },
      body: JSON.stringify(body),
    });
    return r.ok;
  } catch { return false; }
}

async function del(table: string, id: string): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: H,
    });
    return r.ok;
  } catch { return false; }
}

// ─── Appointments ─────────────────────────────────────────────
type RawApt = { id: string; client_name: string; client_phone: string; plate: string; service: string; date: string; time: string; mechanic: string; notes: string; status: string };

function aptFromRow(r: RawApt): Appointment {
  return { id: r.id, clientName: r.client_name, clientPhone: r.client_phone, plate: r.plate, service: r.service, date: r.date, time: r.time, mechanic: r.mechanic, notes: r.notes, status: r.status as Appointment['status'] };
}

export const appointments = {
  list: async (): Promise<Appointment[]> => (await get<RawApt>('appointments', 'order=date,time')).map(aptFromRow),
  save: (a: Appointment) => upsert('appointments', {
    id: a.id, client_name: a.clientName, client_phone: a.clientPhone,
    plate: a.plate, service: a.service, date: a.date, time: a.time,
    mechanic: a.mechanic, notes: a.notes ?? '', status: a.status ?? 'pendiente',
  }),
  updateStatus: (id: string, status: string) => patch('appointments', id, { status }),
  remove: (id: string) => del('appointments', id),
};

// ─── Clients ──────────────────────────────────────────────────
export const clients = {
  list: (): Promise<Client[]> => get<Client>('clients', 'order=name'),
  save: (c: Client) => upsert('clients', { id: c.id, name: c.name, phone: c.phone ?? '', email: c.email ?? '', address: c.address ?? '', city: c.city ?? '' }),
  update: (c: Client) => patch('clients', c.id, { name: c.name, phone: c.phone, email: c.email, address: c.address, city: c.city }),
};

// ─── Vehicles ─────────────────────────────────────────────────
type RawVehicle = { id: string; client_id: string; plate: string; brand: string; model: string; year: string; color: string; vin: string; engine: string; fuel: string; transmission: string; km: number };

function vehicleFromRow(r: RawVehicle): Vehicle {
  return { id: r.id, clientId: r.client_id, plate: r.plate, brand: r.brand, model: r.model, year: r.year, color: r.color, vin: r.vin, engine: r.engine, fuel: r.fuel, transmission: r.transmission, km: r.km };
}

export const vehicles = {
  list: async (): Promise<Vehicle[]> => (await get<RawVehicle>('vehicles', 'order=plate')).map(vehicleFromRow),
  save: (v: Vehicle) => upsert('vehicles', { id: v.id, client_id: v.clientId, plate: v.plate, brand: v.brand ?? '', model: v.model ?? '', year: v.year ?? '', color: v.color ?? '', vin: v.vin ?? '', engine: v.engine ?? '', fuel: v.fuel ?? '', transmission: v.transmission ?? '', km: v.km ?? 0 }),
  update: (v: Vehicle) => patch('vehicles', v.id, { plate: v.plate, brand: v.brand, model: v.model, year: v.year, color: v.color, vin: v.vin, engine: v.engine, fuel: v.fuel, transmission: v.transmission, km: v.km }),
};

// ─── Service Orders ───────────────────────────────────────────
type RawOrder = { id: string; client_id: string; vehicle_id: string; advisor: string; date: string; status: string; fuel_level: number; has_key: boolean; has_alarm: boolean; auth_signed: boolean; warranty: boolean; warranty_type: string; warranty_num: string; client_observations: string; tech_notes: string; inspection_notes: string; parts_checklist: Record<string, boolean>; services: ServiceOrder['services']; used_parts: ServiceOrder['usedParts']; payment?: ServiceOrder['payment'] };

function orderFromRow(r: RawOrder): ServiceOrder {
  return { os: r.id, clientId: r.client_id, vehicleId: r.vehicle_id, advisor: r.advisor, date: r.date, status: r.status as ServiceOrder['status'], fuelLevel: r.fuel_level, hasKey: r.has_key, hasAlarm: r.has_alarm, authSigned: r.auth_signed, warranty: r.warranty, warrantyType: r.warranty_type, warrantyNum: r.warranty_num, clientObservations: r.client_observations, techNotes: r.tech_notes, inspectionNotes: r.inspection_notes, parts: r.parts_checklist ?? {}, services: r.services ?? [], usedParts: r.used_parts ?? [], payment: r.payment };
}

export const orders = {
  list: async (): Promise<ServiceOrder[]> => (await get<RawOrder>('service_orders', 'order=created_at.desc')).map(orderFromRow),
  save: (o: ServiceOrder) => upsert('service_orders', {
    id: o.os, client_id: o.clientId, vehicle_id: o.vehicleId, advisor: o.advisor,
    date: o.date, status: o.status, fuel_level: o.fuelLevel, has_key: o.hasKey,
    has_alarm: o.hasAlarm, auth_signed: o.authSigned, warranty: o.warranty,
    warranty_type: o.warrantyType, warranty_num: o.warrantyNum,
    client_observations: o.clientObservations, tech_notes: o.techNotes,
    inspection_notes: o.inspectionNotes, parts_checklist: o.parts,
    services: o.services, used_parts: o.usedParts, payment: o.payment ?? null,
  }),
  remove: (id: string) => del('service_orders', id),
};

// ─── Inventory ────────────────────────────────────────────────
type RawItem = { id: string; name: string; code: string; category: string; brand: string; price: number; stock: number; min_stock: number; rotation: string; location: string };

function itemFromRow(r: RawItem): InventoryItem {
  return { id: r.id, name: r.name, code: r.code, category: r.category, brand: r.brand, price: r.price, stock: r.stock, minStock: r.min_stock, rotation: r.rotation as InventoryItem['rotation'], location: r.location };
}

export const inventory = {
  list: async (): Promise<InventoryItem[]> => (await get<RawItem>('inventory', 'order=name')).map(itemFromRow),
  save: (i: InventoryItem) => upsert('inventory', { id: i.id, name: i.name, code: i.code, category: i.category, brand: i.brand ?? '', price: i.price, stock: i.stock, min_stock: i.minStock, rotation: i.rotation, location: i.location ?? '' }),
  update: (i: InventoryItem) => patch('inventory', i.id, { name: i.name, code: i.code, category: i.category, brand: i.brand, price: i.price, stock: i.stock, min_stock: i.minStock, rotation: i.rotation, location: i.location }),
  remove: (id: string) => del('inventory', id),
};
