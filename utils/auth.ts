import type { Role } from '../src/store';

const STORAGE_KEY = 'autoserv.auth';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const ROLE_BY_NAME: Record<string, Role> = {
  Administrador: 'admin',
  'Asesor de Servicio': 'asesor',
  'Técnico Mecánico': 'tecnico',
};

export interface AuthSession {
  token: string;
  role: Role;
  name: string;
  correo: string;
}

interface LoginResponse {
  token?: string;
  message?: string | string[];
  usuario?: {
    nombre: string;
    apellido: string;
    correo: string;
    rol: string;
  };
}

export async function login(correo: string, password: string): Promise<AuthSession> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }

  const body = (await response.json().catch(() => ({}))) as LoginResponse;
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message[0] : body.message;
    throw new Error(message || 'Credenciales incorrectas.');
  }

  const role = body.usuario ? ROLE_BY_NAME[body.usuario.rol] : undefined;
  if (!role || !body.token || !body.usuario) {
    throw new Error('El servidor no devolvió una sesión válida.');
  }

  const session: AuthSession = {
    token: body.token,
    role,
    name: `${body.usuario.nombre} ${body.usuario.apellido}`.trim(),
    correo: body.usuario.correo,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function readSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    const part = session.token.split('.')[1];
    if (!part) throw new Error('token');
    const payload = JSON.parse(
      atob(part.replace(/-/g, '+').replace(/_/g, '/')),
    ) as { exp?: number };
    if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export const STAFF_ROLES = [
  'Administrador',
  'Asesor de Servicio',
  'Técnico Mecánico',
] as const;

export type StaffRoleName = (typeof STAFF_ROLES)[number];

export interface StaffUser {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  activo: boolean;
}

function authHeaders() {
  const session = readSession();
  if (!session) throw new Error('La sesión expiró. Vuelve a ingresar.');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.token}`,
  };
}

async function parseAuth<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & {
    message?: string | string[];
  };
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message[0] : body.message;
    throw new Error(message || 'No se pudo completar la operación.');
  }
  return body;
}

export async function listarUsuarios() {
  const response = await fetch(`${API_URL}/auth/users`, {
    headers: authHeaders(),
  });
  return parseAuth<StaffUser[]>(response);
}

export async function crearUsuario(datos: {
  nombre: string;
  apellido: string;
  correo: string;
  password: string;
  rol: StaffRoleName;
}) {
  const response = await fetch(`${API_URL}/auth/users`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(datos),
  });
  return parseAuth<StaffUser>(response);
}
