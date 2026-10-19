import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";
import { MarketProvider, useMarket } from "../src/context/MarketContext";
import {
  dashboardStats,
  updateAccount,
  validateAccount,
} from "../src/lib/admin";
import {
  checkout,
  DEMO_ACCOUNTS,
  freshState,
  loadState,
  STORAGE_KEY,
} from "../src/lib/market";

function seedOrders(s) {
  s.users[0].orders = [
    {
      id: "sale-1",
      date: "2026-10-19T12:00:00",
      total: 100,
      items: [{ ...s.products[1], price: 50, quantity: 2 }],
    },
    {
      id: "sale-2",
      date: "2026-10-18T12:00:00",
      total: 75,
      items: [{ ...s.products[0], price: 75, quantity: 1 }],
    },
    {
      id: "old",
      date: "2025-01-01T12:00:00",
      total: 50,
      items: [{ ...s.products[1], price: 50, quantity: 1 }],
    },
  ];
}
describe("Estadísticas y permisos de administración", () => {
  it("calcula ventas, top skins, días sin ventas y stock sin modificar datos", () => {
    const s = freshState();
    seedOrders(s);
    const stats = dashboardStats(s, new Date(2026, 9, 19, 15));
    expect(stats.revenue).toBe(225);
    expect(stats.orders).toBe(3);
    expect(stats.units).toBe(4);
    expect(stats.average).toBe(75);
    expect(stats.days).toHaveLength(7);
    expect(stats.days.at(-1).total).toBe(100);
    expect(stats.days.at(-2).total).toBe(75);
    expect(stats.days[0].total).toBe(0);
    expect(stats.bestSellers[0]).toMatchObject({
      name: s.products[1].name,
      quantity: 3,
      revenue: 150,
    });
    expect(stats.stock.reduce((sum, item) => sum + item.quantity, 0)).toBe(
      s.products.reduce((sum, p) => sum + p.stock, 0),
    );
    expect(stats.recent.map((order) => order.id)).toEqual([
      "sale-1",
      "sale-2",
      "old",
    ]);
    expect(s.users[0].orders[0].id).toBe("sale-1");
    const empty = dashboardStats(freshState());
    expect(empty.revenue).toBe(0);
    expect(empty.average).toBe(0);
    expect(empty.bestSellers).toEqual([]);
  });
  it("valida perfiles y conserva un administrador activo y los datos de compras", () => {
    const s = freshState();
    const admin = s.users[1];
    const client = s.users[0];
    expect(() => updateAccount(s, client.id, admin.id, {})).toThrowError(/administradores/);
    expect(() => updateAccount(s, "missing", client.id, {})).toThrowError(/administradores/);
    expect(() => updateAccount(s, admin.id, "missing", {})).toThrowError(/no existe/);
    expect(() =>
      updateAccount(s, admin.id, admin.id, { blocked: true }),
    ).toThrowError(/No puedes/);
    expect(() =>
      updateAccount(s, admin.id, admin.id, { role: "client" }),
    ).toThrowError(/No puedes/);
    expect(() =>
      updateAccount(s, admin.id, client.id, { blocked: "true" }),
    ).toThrowError(/Estado/);
    expect(
      validateAccount(
        { name: " ", email: "bad", role: "root" },
        s.users,
        client.id,
      ),
    ).toHaveProperty("role");
    expect(
      validateAccount({ ...client, email: admin.email }, s.users, client.id),
    ).toHaveProperty("email");
    expect(() =>
      updateAccount(s, admin.id, client.id, { email: "bad" }),
    ).toThrowError(/correo/);
    const next = updateAccount(s, admin.id, client.id, {
      name: "  Alex Editado ",
      email: " EDITADO@EXAMPLE.CL ",
      role: "admin",
      password: "hacked",
      balance: 0,
    });
    expect(next.users[0]).toMatchObject({
      name: "Alex Editado",
      email: "editado@example.cl",
      role: "admin",
      password: client.password,
      balance: client.balance,
    });
    const blocked = updateAccount(next, admin.id, client.id, { blocked: true });
    expect(blocked.users[0].blocked).toBe(true);
    expect(() => updateAccount(blocked, client.id, admin.id, {})).toThrowError(/administradores/);
    expect(client.blocked).toBeUndefined();
    expect(() => checkout(blocked, client.id)).toThrowError(/bloqueada/);
  });
  it("bloquea el login, persiste los cambios y sincroniza otras pestañas", () => {
    const wrapper = ({ children }) => (
      <MarketProvider>{children}</MarketProvider>
    );
    const { result } = renderHook(useMarket, { wrapper });
    act(() => result.current.login(DEMO_ACCOUNTS[1]));
    act(() => result.current.saveUser("client-demo", { blocked: true }));
    expect(loadState().users[0].blocked).toBe(true);
    expect(() => act(() => result.current.login(DEMO_ACCOUNTS[0]))).toThrowError(/bloqueada/);
    act(() => result.current.saveUser("client-demo", { blocked: false }));
    act(() => result.current.login(DEMO_ACCOUNTS[0]));
    expect(() =>
      act(() => result.current.saveUser("admin-demo", { name: "Hack" })),
    ).toThrowError(/administradores/);
    const other = loadState();
    other.users[0].blocked = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(other));
    act(() =>
      window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" })),
    );
    expect(result.current.user).not.toBeNull();
    act(() =>
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY })),
    );
    expect(result.current.user).toBeNull();
    expect(loadState().sessionId).toBeNull();
  });
});

function setup(transform) {
  const s = freshState();
  s.sessionId = "admin-demo";
  transform?.(s);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  render(
    <MemoryRouter initialEntries={["/admin"]}>
      <MarketProvider>
        <App />
      </MarketProvider>
    </MemoryRouter>,
  );
}
describe("Dashboard y gestión visual de usuarios", () => {
  it("presenta los gráficos sin inventar compras y cambia de moneda", async () => {
    const user = userEvent.setup();
    setup();
    expect(
      screen.getByRole("heading", { name: "Ventas de los últimos 7 días" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Aún no hay ventas en este período/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Stock por categoría" }),
    ).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Moneda"), "CLP");
    expect(screen.getByText("VENTAS SIMULADAS · CLP")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Productos", exact: true }),
    );
    expect(
      screen.getByRole("columnheader", { name: "Producto" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Resumen", exact: true }),
    );
    expect(
      screen.getByRole("heading", { name: "Últimas compras" }),
    ).toBeInTheDocument();
  });
  it("muestra compras reales agregadas, incluso productos eliminados", () => {
    setup((s) => {
      seedOrders(s);
      s.products = [];
      s.users[0].blocked = true;
    });
    expect(screen.getByText("1 cuenta bloqueada")).toBeInTheDocument();
    expect(screen.getByText("3 unidades")).toBeInTheDocument();
    expect(
      screen.getByText("No hay productos en el catálogo."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Top 5 skins más vendidas" }),
    ).toBeInTheDocument();
  });
  it("busca y filtra usuarios, edita perfiles, bloquea y desbloquea sin borrar compras", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(
      screen.getByRole("button", { name: "Usuarios", exact: true }),
    );
    expect(
      screen.getByRole("button", { name: "Bloquear usuario Administrador" }),
    ).toBeDisabled();
    await user.type(screen.getByLabelText("Buscar usuario"), "nadie");
    expect(screen.getByText(/No encontramos usuarios/)).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Buscar usuario"));
    await user.selectOptions(
      screen.getByLabelText("Rol", { exact: true }),
      "client",
    );
    expect(
      screen.queryByRole("button", { name: "Editar usuario Administrador" }),
    ).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Rol", { exact: true }), "");
    await user.click(
      screen.getByRole("button", { name: "Editar usuario Alex" }),
    );
    const dialog = screen.getByRole("dialog");
    await user.clear(within(dialog).getByLabelText("Nombre del usuario"));
    await user.click(
      within(dialog).getByRole("button", { name: "Guardar usuario" }),
    );
    expect(screen.getByText(/nombre debe tener al menos/)).toBeInTheDocument();
    await user.type(
      within(dialog).getByLabelText("Nombre del usuario"),
      "Alex Nuevo",
    );
    await user.clear(within(dialog).getByLabelText("Correo del usuario"));
    await user.type(
      within(dialog).getByLabelText("Correo del usuario"),
      "admin@skinmarket.cl",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Guardar usuario" }),
    );
    expect(
      screen.getByText("Este correo ya está registrado."),
    ).toBeInTheDocument();
    await user.clear(within(dialog).getByLabelText("Correo del usuario"));
    await user.type(
      within(dialog).getByLabelText("Correo del usuario"),
      "alexnuevo@example.cl",
    );
    await user.selectOptions(
      within(dialog).getByLabelText("Rol del usuario"),
      "admin",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Guardar usuario" }),
    );
    expect(loadState().users[0]).toMatchObject({
      name: "Alex Nuevo",
      role: "admin",
    });
    await user.click(
      screen.getByRole("button", { name: "Bloquear usuario Alex Nuevo" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(loadState().users[0].blocked).toBe(false);
    await user.click(
      screen.getByRole("button", { name: "Bloquear usuario Alex Nuevo" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirmar bloqueo" }));
    expect(loadState().users[0].blocked).toBe(true);
    await user.selectOptions(
      screen.getByLabelText("Estado", { exact: true }),
      "blocked",
    );
    expect(
      screen.queryByRole("button", { name: "Editar usuario Administrador" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Desbloquear usuario Alex Nuevo" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar desbloqueo" }),
    );
    expect(loadState().users[0].blocked).toBe(false);
    await user.selectOptions(
      screen.getByLabelText("Estado", { exact: true }),
      "active",
    );
    await user.click(
      screen.getByRole("button", { name: "Editar usuario Administrador" }),
    );
    expect(screen.getByLabelText("Rol del usuario")).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(
      screen.getByRole("button", { name: "Editar usuario Alex Nuevo" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Cerrar edición de usuario" }),
    );
  }, 20000);
});
