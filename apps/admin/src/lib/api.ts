import type { IMedia } from '@raco/shared';

const BASE = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    // Sin JSON en la respuesta: la API está apagada (el proxy de Vite responde 500 vacío) o no se alcanzó
    const err = await res.json().catch(() => ({ message: 'No se pudo conectar con el servidor. Revisa que la API esté encendida.' }));
    throw new Error(err.message || `Error ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};

// Subida de archivos: multipart, sin el Content-Type JSON de request()
export async function uploadFile(file: File): Promise<IMedia> {
  const token = getToken();
  const body = new FormData();
  body.append('file', file);

  const res = await fetch(`${BASE}/media/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error al subir el archivo' }));
    throw new Error(err.message || `Error ${res.status}`);
  }

  return res.json();
}
