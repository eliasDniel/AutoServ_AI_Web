import { projectId, publicAnonKey } from './info';
import type { Appointment } from '../../src/store';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-2440270a/make-server-2440270a`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

export async function fetchRemoteAppointments(): Promise<Appointment[]> {
  try {
    const res = await fetch(`${BASE}/appointments`, { headers });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function saveRemoteAppointment(apt: Appointment): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(apt),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteRemoteAppointment(id: string): Promise<void> {
  try {
    await fetch(`${BASE}/appointments/${id}`, { method: 'DELETE', headers });
  } catch {
    // silencioso
  }
}
