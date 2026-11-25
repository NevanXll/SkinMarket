import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api, restoreSession, setAccessToken } from '../services/api';
import { validateAuth, validateProduct } from '../lib/market';
import { createId } from '../lib/id';
const MarketContext = createContext(null);
const roles = { ADMIN: 'admin', CLIENTE: 'client', VENDEDOR: 'seller' };
const accountView = (u) => ({ ...u, role: roles[u.role], cart: [], orders: [], inventory: [] });
function currencyPreference() { try { return localStorage.getItem('skinmarket-currency') === 'CLP' ? 'CLP' : 'USD'; } catch { return 'USD'; } }
export function MarketProvider({ children }) {
  const [state, setState] = useState(() => ({ products: [], users: [], sessionId: null, currency: currencyPreference() }));
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serviceError, setServiceError] = useState('');
  const current = useRef(state);
  const timer = useRef();
  const pendingPurchase = useRef(null);
  const queue = useRef(Promise.resolve());
  function commit(next) { current.current = next; setState(next); }
  function notify(text, type = 'success') {
    setNotice({ text, type }); clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 5000);
  }
  async function synchronize(authenticated = !!current.current.sessionId) {
    const products = await api('/products');
    if (!authenticated) { commit({ ...current.current, products, users: [], sessionId: null }); return; }
    const me = accountView(await api('/me'));
    if (me.role === 'seller') {
      commit({ ...current.current, products, users: [me], sessionId: me.id });
      return;
    }
    const [cart, orders, inventory] = await Promise.all([api('/cart'), api('/orders'), api('/inventory')]);
    let users = [me];
    if (me.role === 'admin') {
      const [accounts, purchases] = await Promise.all([api('/admin/users'), api('/admin/orders')]);
      users = accounts.map((u) => ({ ...accountView(u), orders: purchases.filter((o) => o.userId === u.id) }));
    }
    users = users.map((u) => u.id === me.id ? { ...me, cart, inventory, orders } : u);
    commit({ ...current.current, products, users, sessionId: me.id });
  }
  async function initialize() {
    setLoading(true); setServiceError('');
    try {
      let authenticated = false;
      try { await restoreSession(); authenticated = true; }
      catch (error) { if (error.status !== 401) throw error; }
      await synchronize(authenticated);
    } catch (error) { setServiceError(error.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { initialize(); return () => clearTimeout(timer.current); }, []);
  async function authenticate(values, register = false) {
    if (Object.keys(validateAuth(values, register)).length) throw new Error('Revisa los campos del formulario.');
    const session = await api(`/auth/${register ? 'register' : 'login'}`, { method: 'POST', body: values });
    setAccessToken(session.accessToken); await synchronize(true);
    notify(register ? 'Cuenta creada correctamente.' : `Bienvenido, ${session.user.name}.`);
    return accountView(session.user);
  }
  function mutate(operation, message) {
    const job = queue.current.catch(() => {}).then(async () => {
      await operation(); await synchronize(); if (message) notify(message);
    });
    queue.current = job; return job;
  }
  const getUser = () => current.current.users.find((u) => u.id === current.current.sessionId);
  const userInput = (u) => ({ ...u, role: Object.keys(roles).find((role) => roles[role] === u.role) });
  return <MarketContext.Provider value={{
    state, user: state.users.find((u) => u.id === state.sessionId) || null,
    notice, loading, serviceError, retry: initialize, refreshAccount: () => synchronize(true), notify,
    login: (v) => authenticate(v), register: (v) => authenticate(v, true),
    saveProfile: (profile) => mutate(() => api('/me/profile', { method: 'PUT', body: profile }), 'Perfil actualizado.'),
    logout: async () => {
      try { await api('/auth/logout', { method: 'POST' }); }
      catch (e) { notify(e.message, 'error'); return; }
      setAccessToken(null); pendingPurchase.current = null;
      commit({ ...current.current, sessionId: null, users: [] });
    },
    addToCart: (id) => mutate(async () => {
      const u = getUser(); if (!u) throw new Error('Inicia sesión para continuar.');
      const quantity = (u.cart.find((l) => l.productId === id)?.quantity || 0) + 1;
      await api(`/cart/${id}`, { method: 'PUT', body: { quantity } });
    }, 'Skin añadida al carrito.'),
    changeQuantity: (id, quantity) => mutate(() => api(`/cart/${id}`, { method: 'PUT', body: { quantity } })),
    buy: () => mutate(async () => {
      pendingPurchase.current ||= createId();
      await api('/orders', { method: 'POST', body: { requestKey: pendingPurchase.current } });
    }, 'Compra realizada con éxito. Revisa tu inventario.').then(() => { pendingPurchase.current = null; }),
    topUp: (option, requestKey) => mutate(() => api(`/wallet/packages/${option.id}/top-up`, {
      method: 'POST', body: { expectedPrice: option.priceUsd, requestKey },
    }), 'Saldo virtual recargado.'),
    saveProduct: (p) => {
      if (Object.keys(validateProduct(p)).length) return Promise.reject(new Error('Revisa los datos del producto.'));
      return mutate(() => api(`/products${p.id ? `/${p.id}` : ''}`, { method: p.id ? 'PUT' : 'POST', body: { ...p, price: Number(p.price), stock: Number(p.stock) } }), 'Producto guardado.');
    },
    deleteProduct: (id) => mutate(() => api(`/products/${id}`, { method: 'DELETE' }), 'Producto eliminado.'),
    saveUser: (id, changes) => mutate(() => {
      const target = current.current.users.find((u) => u.id === id);
      return api(`/admin/users/${id}`, { method: 'PUT', body: userInput({ ...target, ...changes }) });
    }, 'Usuario actualizado.'),
    createUser: (values) => mutate(() => api('/admin/users', { method: 'POST', body: userInput(values) }), 'Usuario creado.'),
    deleteUser: (id) => mutate(() => api(`/admin/users/${id}`, { method: 'DELETE' }), 'Usuario eliminado.'),
    setCurrency: (currency) => {
      currency = currency === 'CLP' ? 'CLP' : 'USD';
      try { localStorage.setItem('skinmarket-currency', currency); } catch { /* Preferencia opcional. */ }
      commit({ ...current.current, currency });
    },
  }}>{children}</MarketContext.Provider>;
}
export function useMarket() { return useContext(MarketContext); }
