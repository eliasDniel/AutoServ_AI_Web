import type { Client, DiagnosisCard, OrderStatus, ServiceOrder, Vehicle } from '../src/store';
import { readSession } from './auth';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export interface RecepcionLista {
  clientes: Client[];
  vehiculos: Vehicle[];
  ordenes: ServiceOrder[];
}

interface ErrorBody {
  message?: string | string[];
}

function headers() {
  const session = readSession();
  if (!session) throw new Error('La sesión expiró. Vuelve a ingresar.');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.token}`,
  };
}

async function parse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & ErrorBody;
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message[0] : body.message;
    throw new Error(message || 'No se pudo guardar la recepción.');
  }
  return body;
}

export async function listarRecepcion(): Promise<RecepcionLista> {
  const response = await fetch(`${API_URL}/recepcion`, { headers: headers() });
  return parse<RecepcionLista>(response);
}

function idNumerico(id: string) {
  return /^\d+$/.test(id) ? Number(id) : undefined;
}

export async function guardarRecepcion(
  order: ServiceOrder,
  client: Client,
  vehicle: Vehicle,
) {
  const anio = Number.parseInt(vehicle.year, 10);
  const response = await fetch(`${API_URL}/recepcion`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      numeroOs: order.os.startsWith('OS-2024-') ? undefined : order.os,
      nombreAsesor: order.advisor,
      cliente: {
        id: idNumerico(client.id),
        nombre: client.name,
        telefono: client.phone,
        email: client.email,
        direccion: client.address,
        ciudad: client.city,
      },
      vehiculo: {
        id: idNumerico(vehicle.id),
        placa: vehicle.plate,
        marca: vehicle.brand,
        modelo: vehicle.model,
        anio: Number.isNaN(anio) ? new Date().getFullYear() : anio,
        color: vehicle.color,
        vin: vehicle.vin,
        motor: vehicle.engine,
        combustible: vehicle.fuel,
        transmision: vehicle.transmission,
        kilometraje: Number(vehicle.km) || 0,
      },
      nivelCombustible: order.fuelLevel,
      tieneLlaves: order.hasKey,
      tieneAlarma: order.hasAlarm,
      autorizacionFirmada: order.authSigned,
      garantiaVigente: order.warranty,
      tipoGarantia: order.warrantyType,
      numeroGarantia: order.warrantyNum,
      observacionesCliente: order.clientObservations,
      notasTecnico: order.techNotes,
      notasInspeccion: order.inspectionNotes,
      firmaDigital: order.signature,
      ...(order.diagnosis ? { diagnostico: JSON.stringify(order.diagnosis) } : {}),
      partes: Object.entries(order.parts).map(([zona, ok]) => ({ zona, ok })),
      servicios: order.services.map((linea) => ({
        codigo: linea.code,
        nombre: linea.name,
        tiempo: linea.time,
        precio: linea.price,
      })),
      repuestos: order.usedParts.map((linea) => ({
        codigo: linea.code,
        nombre: linea.name,
        cantidad: linea.qty,
        precio: linea.price,
        usado: linea.used,
      })),
    }),
  });
  return parse<{ cliente: Client; vehiculo: Vehicle; orden: ServiceOrder }>(response);
}

export async function diagnosticar(texto: string) {
  const response = await fetch(`${API_URL}/diagnostico`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ texto }),
  });
  return parse<{ resultados: DiagnosisCard[] }>(response);
}

export async function reiniciarDatos() {
  const response = await fetch(`${API_URL}/datos/reiniciar`, {
    method: 'POST',
    headers: headers(),
  });
  return parse<{ ok: boolean }>(response);
}

export async function cambiarEstado(numeroOs: string, estado: OrderStatus) {
  const response = await fetch(
    `${API_URL}/ordenes/${encodeURIComponent(numeroOs)}/estado`,
    {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ estado }),
    },
  );
  return parse<ServiceOrder>(response);
}
