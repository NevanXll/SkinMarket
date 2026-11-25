import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';
import { MarketProvider } from '../src/context/MarketContext';
import { mockServer } from './server';
async function setup(path = '/', role = null, transform = () => {}) {
  const server = mockServer(role); transform(server);
  render(<MemoryRouter initialEntries={[path]}><MarketProvider><App /></MarketProvider></MemoryRouter>);
  await waitFor(() => { if(screen.queryByText('Conectando con SkinMarket…')) throw new Error('Cargando'); });
  return { server, user: userEvent.setup() };
}
describe('Interfaz React con API simulada', () => {
  it('abre Mi perfil desde el avatar y aplica la privacidad al guardar', async () => {
    const { user, server } = await setup('/productos', 'client');
    await user.click(screen.getByRole('link', { name: 'Mi perfil' }));
    expect(screen.getByRole('heading', { name: 'Mi perfil' })).toBeTruthy();
    expect(screen.queryByText(server.current.email)).toBeNull();
    const name = screen.getByLabelText('Nombre visible');
    await user.clear(name);
    await user.type(name, 'Cliente Personalizado');
    await user.click(screen.getByLabelText('Escudo'));
    await user.click(screen.getByLabelText('Mostrar mi correo en Mi perfil'));
    await user.click(screen.getByLabelText('Mostrar mi saldo en el encabezado'));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Perfil actualizado.')).toBeTruthy();
    expect(server.current.avatar).toBe('shield');
    expect(server.current.name).toBe('Cliente Personalizado');
    expect(screen.getByText(server.current.email)).toBeTruthy();
    expect(screen.getByLabelText('Recargar saldo virtual').querySelector('strong')).toBeNull();
  });
  it('permite postular y conserva el estado pendiente en pantalla', async () => {
    const { user, server } = await setup('/vender', 'client');
    await user.type(await screen.findByLabelText('Motivo para solicitar el rol'), 'Quiero obtener acceso al panel de vendedor.');
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }));
    expect(await screen.findByText('Estado: En revisión')).toBeTruthy();
    expect(server.applications[0].reason).toBe('Quiero obtener acceso al panel de vendedor.');
    expect(server.applications[0].skins).toBeUndefined();
  });
  it('permite a un administrador aprobar una solicitud', async () => {
    const { user, server } = await setup('/admin', 'admin', (s) => {
      s.applications.push({ userId: 'client-test', name: 'Cliente Prueba', email: 'cliente@example.com',
        reason: 'Quiero obtener acceso al panel de vendedor.', status: 'PENDIENTE' });
    });
    await user.click(screen.getByRole('button', { name: 'Solicitudes de vendedor' }));
    await user.click(await screen.findByRole('button', { name: 'Aprobar' }));
    expect(await screen.findByText('Estado: Aprobada')).toBeTruthy();
    expect(server.accounts[0].role).toBe('VENDEDOR');
  });
  it('muestra un panel de vendedor de solo lectura con detalle de órdenes', async () => {
    const { user } = await setup('/vendedor', 'seller', (s) => {
      s.orders.push({ id: 'purchase-1', date: '2026-11-24T12:00:00Z', total: 10, items: [{ id: 'p1', name: 'Skin de prueba', quantity: 1 }] });
    });
    expect(screen.queryByRole('button', { name: 'Añadir al carrito' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Administración' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Órdenes' }));
    await user.click(await screen.findByRole('link', { name: 'Ver detalle' }));
    expect(await screen.findByText('1 × Skin de prueba')).toBeTruthy();
  });
  it('muestra inicio, menú móvil y catálogo sin selector de juego', async () => { const { user } = await setup(); expect(screen.getByRole('heading', { name: /LAS MEJORES/ })).toBeTruthy(); expect(within(screen.getByRole('complementary', { name: 'Filtros del catálogo' })).queryByText('Juego')).toBeNull(); await user.click(screen.getByLabelText('Abrir menú')); await user.click(screen.getByRole('link', { name: 'Mercado' })); expect(screen.getByRole('heading', { name: /Encuentra tu próxima/ })).toBeTruthy(); await user.click(screen.getByRole('button', { name: 'Filtros', exact: true })); await user.click(screen.getByLabelText('Cerrar filtros')); });
  it('limpia caracteres extraños y permite restablecer filtros', async () => { const { user } = await setup('/productos'); await user.type(screen.getByLabelText('Buscar skin'), 'Dragon<'); expect(screen.getByText('Se eliminaron caracteres no permitidos.')).toBeTruthy(); await user.click(screen.getByRole('button', { name: 'Limpiar', exact: true })); await user.selectOptions(screen.getByLabelText('Tipo de arma'), 'Pistolas'); });
  it('rechaza un rango de precios invertido', async () => { await setup('/productos'); const numbers = screen.getAllByRole('spinbutton'); fireEvent.change(numbers[0], { target: { value: '100' } }); fireEvent.change(numbers[1], { target: { value: '1' } }); expect(screen.getByText('El mínimo no puede superar al máximo.')).toBeTruthy(); });
  it('muestra validaciones y credenciales erróneas', async () => { const { user } = await setup('/acceso'); await user.click(screen.getByRole('button', { name: 'Entrar a SkinMarket' })); expect(screen.getByText(/correo con @/)).toBeTruthy(); await user.type(screen.getByLabelText('Correo electrónico'), 'cliente@example.com'); await user.type(screen.getByLabelText('Contraseña'), 'Wrong123'); await user.click(screen.getByRole('button', { name: 'Entrar a SkinMarket' })); expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales incorrectas'); });
  it('inicia sesión y navega al mercado', async () => { const { user } = await setup('/acceso'); await user.type(screen.getByLabelText('Correo electrónico'), 'cliente@example.com'); await user.type(screen.getByLabelText('Contraseña'), 'Correct123'); await user.click(screen.getByRole('button', { name: 'Entrar a SkinMarket' })); expect(await screen.findByRole('heading', { name: /Encuentra tu próxima/ })).toBeTruthy(); });
  it('registra desde la pantalla de acceso', async () => { const { user } = await setup('/acceso'); await user.click(screen.getByRole('button', { name: 'Crear cuenta', exact: true })); await user.type(screen.getByLabelText('Nombre'), 'Nueva Persona'); await user.type(screen.getByLabelText('Correo electrónico'), 'nuevo@example.com'); await user.type(screen.getByLabelText('Contraseña'), 'Correct123'); await user.click(screen.getByRole('button', { name: /Crear mi cuenta/ })); expect(await screen.findByRole('heading', { name: /Encuentra tu próxima/ })).toBeTruthy(); });
  it('protege rutas de cliente y administrador', async () => { await setup('/admin', 'client'); expect(screen.getByRole('heading', { name: 'Acceso restringido' })).toBeTruthy(); });
  it('redirige carrito anónimo al login', async () => { await setup('/carrito'); expect(await screen.findByRole('button', { name: 'Entrar a SkinMarket' })).toBeTruthy(); });
  it('muestra carrito vacío', async () => { await setup('/carrito', 'client'); expect(screen.getByText('Tu carrito está esperando')).toBeTruthy(); });
  it('agrega, compra y muestra inventario', async () => { const { user } = await setup('/productos', 'client'); await user.click(screen.getAllByRole('button', { name: 'Añadir al carrito' })[0]); await user.click(screen.getByRole('link', { name: /Carrito, 1/ })); await user.click(screen.getByRole('button', { name: /Confirmar compra/ })); expect(await screen.findByRole('heading', { name: /inventario/i })).toBeTruthy(); });
  it('cambia cantidades y elimina líneas', async () => { const { user } = await setup('/carrito', 'client', (s) => { s.cart = [{ productId: s.products[0].id, quantity: 2 }]; }); await user.click(screen.getByLabelText(/^Reducir/)); await waitFor(() => expect(screen.getByRole('link', { name: /Carrito, 1/ })).toBeTruthy()); await user.click(screen.getByLabelText(/^Quitar/)); expect(await screen.findByText('Tu carrito está esperando')).toBeTruthy(); });
  it('muestra restricción de saldo y stock', async () => { await setup('/carrito', 'client', (s) => { s.current.balance = 0; s.cart = [{ productId: s.products[0].id, quantity: 99999 }]; }); expect(screen.getByRole('button', { name: /Confirmar compra/ })).toBeDisabled(); expect(screen.getByText(/Stock insuficiente. Reduce/)).toBeTruthy(); });
  it('recarga billetera y cambia moneda', async () => { const { user } = await setup('/productos', 'client'); await user.selectOptions(screen.getByLabelText('Moneda'), 'CLP'); await user.click(screen.getByLabelText('Recargar saldo virtual')); const dialog = within(screen.getByRole('dialog')); await user.click(dialog.getByRole('button', { name: 'Añadir saldo virtual' })); await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()); });
  it('muestra compras vacías y 404', async () => { await setup('/compras', 'client'); expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/compras/i); });
  it('muestra página inexistente', async () => { await setup('/inexistente'); expect(screen.getByText('404 · Fuera del mapa')).toBeTruthy(); });
  it('consulta detalle REST por identificador', async () => { const { server } = await setup(); const link = screen.getAllByRole('link').find((a) => a.getAttribute('href')?.includes(`/productos/${server.products[0].id}`)); fireEvent.click(link); expect(await screen.findByRole('heading', { level: 1, name: server.products[0].name })).toBeTruthy(); });
  it('muestra error 404 de detalle', async () => { await setup('/productos/no-existe'); expect(await screen.findByRole('alert')).toHaveTextContent('Producto no encontrado'); });
  it('muestra dashboard sin ventas inventadas', async () => { await setup('/admin', 'admin'); expect(screen.getByRole('heading', { name: /Administración/ })).toBeTruthy(); });
  it('edita producto y confirma su eliminación', async () => { const { user, server } = await setup('/admin', 'admin'); await user.click(screen.getByRole('button', { name: 'Productos', exact: true })); const name = server.products[0].name; await user.click(screen.getByLabelText(`Editar ${name}`)); const input = screen.getByLabelText('Precio base en USD'); fireEvent.change(input, { target: { value: '20' } }); await user.click(screen.getByRole('button', { name: 'Guardar producto' })); await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()); await user.click(screen.getByLabelText(`Eliminar ${name}`)); await user.click(screen.getByRole('button', { name: 'Confirmar', exact: true })); await waitFor(() => expect(screen.queryByLabelText(`Eliminar ${name}`)).toBeNull()); });
  it('valida producto nuevo antes de guardarlo', async () => { const { user } = await setup('/admin', 'admin'); await user.click(screen.getByRole('button', { name: 'Nuevo producto' })); await user.click(screen.getByRole('button', { name: 'Guardar producto' })); expect(screen.getByText(/Usa un nombre/)).toBeTruthy(); await user.click(screen.getByLabelText('Cerrar editor')); });
  it('edita, bloquea y elimina un usuario', async () => { const { user } = await setup('/admin', 'admin'); await user.click(screen.getByRole('button', { name: 'Usuarios', exact: true })); await user.click(screen.getByLabelText('Editar usuario Cliente Prueba')); fireEvent.change(screen.getByLabelText('Nombre del usuario'), { target: { value: 'Cliente Editado' } }); await user.click(screen.getByRole('button', { name: 'Guardar usuario' })); await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()); await user.click(screen.getByLabelText('Bloquear usuario Cliente Editado')); await user.click(screen.getByRole('button', { name: 'Confirmar bloqueo' })); await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()); await user.click(screen.getByLabelText('Eliminar usuario Cliente Editado')); await user.click(screen.getByRole('button', { name: 'Confirmar eliminación' })); await waitFor(() => expect(screen.queryByLabelText('Eliminar usuario Cliente Editado')).toBeNull()); });
  it('crea usuario desde administración', async () => { const { user } = await setup('/admin', 'admin'); await user.click(screen.getByRole('button', { name: 'Usuarios', exact: true })); await user.click(screen.getByRole('button', { name: 'Nuevo usuario' })); await user.type(screen.getByLabelText('Nombre del usuario'), 'Nuevo Usuario'); await user.type(screen.getByLabelText('Correo del usuario'), 'nuevo@example.com'); await user.type(screen.getByLabelText('Contraseña inicial'), 'Correct123'); await user.click(screen.getByRole('button', { name: 'Guardar usuario' })); await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()); expect(screen.getByText('Nuevo Usuario')).toBeTruthy(); });
});
