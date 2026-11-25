const base = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
let token = null;
let renewal = null;
export const setAccessToken = (value) => { token = value; };
async function request(path, options = {}, retry = true) {
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options, credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'SkinMarket',
        ...(token && !path.startsWith('/auth/') ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch { throw new Error('No se pudo conectar con el servidor. Intenta nuevamente.'); }
  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    await restoreSession(); return request(path, options, false);
  }
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `La operación falló (${response.status}).`);
    error.status = response.status; error.fields = data.errors; throw error;
  }
  return data;
}
export function restoreSession() {
  if (!renewal) renewal = request('/auth/refresh', { method: 'POST' }, false)
    .then((session) => { token = session.accessToken; return session; })
    .catch((error) => { token = null; throw error; })
    .finally(() => { renewal = null; });
  return renewal;
}
export const api = request;
