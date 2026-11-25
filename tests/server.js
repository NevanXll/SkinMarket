import catalogue from '../src/data/catalog.json';
import { setAccessToken } from '../src/services/api';
export function mockServer(role = null) {
  setAccessToken(null);
  const client = { id: 'client-test', name: 'Cliente Prueba', email: 'cliente@example.com', role: 'CLIENTE', balance: 12500 };
  const admin = { ...client, id: 'admin-test', name: 'Administrador', email: 'admin@example.com', role: 'ADMIN' };
  const seller = { ...client, id: 'seller-test', name: 'Vendedor Prueba', role: 'VENDEDOR' };
  const server = { products: structuredClone(catalogue), accounts: [client, admin], current: ({ admin, client, seller })[role] || null, cart: [], orders: [], inventory: [], applications: [], fail: '' };
  spyOn(window, 'fetch').and.callFake(async (url, options = {}) => {
    const path = url.replace('/api/v1', ''); const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : {};
    const reply = (data, status = 200) => ({ ok: status < 400, status, json: async () => structuredClone(data) });
    if(server.fail) return reply({ message: server.fail }, 503);
    if(path === '/auth/refresh') return server.current ? reply({ accessToken: 'test-token', user: server.current }) : reply({ message: 'Sin sesión' }, 401);
    if(path === '/auth/logout') { server.current = null; return reply(null, 204); }
    if(path === '/auth/login') { if(body.password !== 'Correct123') return reply({ message: 'Credenciales incorrectas' }, 401); server.current = server.accounts.find((a) => a.email === body.email) || client; return reply({ accessToken: 'test-token', user: server.current }); }
    if(path === '/auth/register') { server.current = { ...client, ...body, id: 'registered' }; delete server.current.password; server.accounts.push(server.current); return reply({ accessToken: 'test-token', user: server.current }, 201); }
    if(path === '/me') return reply(server.current);
    if(path === '/seller-application') {
      if (method === 'GET') {
        const application = server.applications.find((a) => a.userId === server.current.id);
        return application ? reply(application) : reply(null, 204);
      }
      const { id: userId, name, email } = server.current;
      const application = { ...body, userId, name, email, status: 'PENDIENTE' };
      server.applications.push(application);
      return reply(application, 201);
    }
    if (path === '/admin/seller-applications') return reply(server.applications);
    if (path.startsWith('/admin/seller-applications/')) {
      const userId = path.split('/').pop();
      const application = server.applications.find((row) => row.userId === userId);
      application.status = body.approved ? 'APROBADA' : 'RECHAZADA';
      application.reviewNote = body.note;
      if (body.approved) server.accounts.find((account) => account.id === userId).role = 'VENDEDOR';
      return reply(application);
    }
    if (path === '/seller/orders') return reply(server.orders);
    if (path.startsWith('/seller/orders/')) return reply(server.orders.find((order) => order.id === path.split('/').pop()));
    if(path === '/products' && method === 'GET') return reply(server.products);
    if(path === '/products' && method === 'POST') { const p = { ...body, id: 'new-product', weapon: body.name, finish: 'Nuevo' }; server.products.push(p); return reply(p, 201); }
    if(path.startsWith('/products/')) { const id = path.split('/').pop(); const p = server.products.find((p) => p.id === id); if(!p) return reply({ message: 'Producto no encontrado' }, 404); if(method === 'DELETE') { server.products = server.products.filter((p) => p.id !== id); return reply(null, 204); } if(method === 'PUT') Object.assign(p, body); return reply(p); }
    if(path === '/admin/users' && method === 'GET') return reply(server.accounts);
    if(path === '/admin/users' && method === 'POST') { const u = { ...client, ...body, id: 'new-user' }; server.accounts.push(u); return reply(u, 201); }
    if(path.startsWith('/admin/users/')) { const id = path.split('/').pop(); const u = server.accounts.find((a) => a.id === id); if(method === 'DELETE') { server.accounts = server.accounts.filter((a) => a.id !== id); return reply(null, 204); } Object.assign(u, body); return reply(u); }
    if(path === '/admin/orders') return reply(server.orders);
    if(path === '/cart') return reply(server.cart);
    if(path.startsWith('/cart/')) { const productId = path.split('/').pop(); server.cart = server.cart.filter((l) => l.productId !== productId); if(body.quantity) server.cart.push({ productId, quantity: body.quantity }); return reply(server.cart); }
    if(path === '/inventory') return reply(server.inventory);
    if(path === '/wallet/top-up') { server.current.balance += body.amount; return reply(server.current); }
    if(path === '/orders' && method === 'POST') {
      const items = server.cart.map((l) => ({ ...server.products.find((p) => p.id === l.productId), quantity: l.quantity }));
      const total = items.reduce((n, p) => n + p.price * p.quantity, 0);
      const order = { id: 'order-test', userId: server.current.id, date: new Date().toISOString(), total, items };
      server.orders.unshift(order); server.inventory = items.map((p) => ({ ...p, acquiredAt: order.date, orderId: order.id }));
      server.current.balance -= total; server.cart = []; return reply(order, 201);
    }
    if(path === '/orders') return reply(server.orders);
    return reply({ message: 'Ruta de prueba no configurada' }, 404);
  });
  return server;
}
