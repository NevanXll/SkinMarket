import { api, restoreSession, setAccessToken } from '../src/services/api';
describe('Cliente HTTP y renovación de sesión', () => {
  beforeEach(() => setAccessToken(null));
  const response = (status, data) => Promise.resolve({ ok: status < 400, status, json: async () => data });
  it('envía Bearer en memoria sin almacenarlo', async () => { const fetch = spyOn(window, 'fetch').and.returnValue(response(200, [])); setAccessToken('access'); await api('/products'); expect(fetch.calls.mostRecent().args[1].headers.Authorization).toBe('Bearer access'); expect(localStorage.length).toBe(0); });
  it('traduce fallos de red', async () => { spyOn(window, 'fetch').and.rejectWith(new Error()); await expectAsync(api('/products')).toBeRejectedWithError(/conectar/); });
  it('conserva mensaje y errores de validación', async () => { spyOn(window, 'fetch').and.returnValue(response(400, { message: 'Inválido', errors: { name: 'Requerido' } })); try { await api('/products', { method: 'POST', body: {} }); fail(); } catch(e) { expect(e.fields.name).toBe('Requerido'); expect(e.status).toBe(400); } });
  it('admite respuestas 204', async () => { spyOn(window, 'fetch').and.returnValue(response(204)); expect(await api('/products/x', { method: 'DELETE' })).toBeNull(); });
  it('informa error aunque no haya JSON válido', async () => { spyOn(window, 'fetch').and.resolveTo({ ok: false, status: 500, json: async () => { throw new Error(); } }); await expectAsync(api('/products')).toBeRejectedWithError(/500/); });
  it('deduplica renovaciones simultáneas', async () => { const fetch = spyOn(window, 'fetch').and.returnValue(response(200, { accessToken: 'new' })); await Promise.all([restoreSession(), restoreSession()]); expect(fetch).toHaveBeenCalledTimes(1); });
  it('renueva un 401 y reintenta una vez', async () => { const fetch = spyOn(window, 'fetch').and.returnValues(response(401, {}), response(200, { accessToken: 'new' }), response(200, [])); expect(await api('/orders')).toEqual([]); expect(fetch).toHaveBeenCalledTimes(3); });
  it('detiene la recuperación si refresh es rechazado', async () => { const fetch = spyOn(window, 'fetch').and.returnValue(response(401, { message: 'Sesión vencida' })); await expectAsync(api('/orders')).toBeRejectedWithError('Sesión vencida'); expect(fetch).toHaveBeenCalledTimes(2); });
});
