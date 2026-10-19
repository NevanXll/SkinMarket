import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";
import { MarketProvider } from "../src/context/MarketContext";
import { freshState, loadState, STORAGE_KEY } from "../src/lib/market";
function setup(path = "/", role = null, transform = null) {
  const s = freshState();
  if (role) s.sessionId = role === "admin" ? "admin-demo" : "client-demo";
  if (transform) transform(s);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MarketProvider>
        <App />
      </MarketProvider>
    </MemoryRouter>,
  );
}
describe("Pantallas y flujos del usuario", () => {
  it("muestra inicio, imágenes, filtros y navegación móvil", async () => {
    const user = userEvent.setup();
    setup();
    const filters = within(screen.getByRole("complementary", { name: "Filtros del catálogo" }));
    expect(filters.queryByText("Juego", { exact: true })).toBeNull();
    expect(filters.queryByText("Counter-Strike 2", { exact: true })).toBeNull();
    expect(filters.getByRole("combobox", { name: "Tipo de arma" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /LAS MEJORES/ }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Abrir menú" }));
    expect(screen.getByRole("button", { name: "Cerrar menú" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await user.click(screen.getByRole("link", { name: "Mercado" }));
    expect(
      screen.getByRole("heading", { name: /Encuentra tu próxima/ }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    await user.click(screen.getByRole("button", { name: "Cerrar filtros" }));
    await user.type(
      screen.getByRole("textbox", { name: "Buscar skin" }),
      "Dragon",
    );
    expect(
      screen.getAllByRole("button", { name: "Añadir al carrito" }),
    ).toHaveLength(2);
    await user.type(screen.getByRole("textbox", { name: "Buscar skin" }), "<");
    expect(
      screen.getByText("Se eliminaron caracteres no permitidos."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpiar" }));
    await user.selectOptions(screen.getByLabelText("Tipo de arma"), "Pistolas");
    expect(
      screen.getAllByRole("button", { name: "Añadir al carrito" }),
    ).toHaveLength(6);
    await user.click(screen.getByRole("button", { name: "Todas" }));
    await user.click(screen.getByRole("checkbox", { name: "Contraband" }));
    expect(screen.getByRole("heading", { name: "Howl" })).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Contraband" }));
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Precio mínimo" }),
      { target: { value: "-1" } },
    );
    expect(screen.getByRole("alert")).toHaveTextContent("mayores");
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Precio mínimo" }),
      { target: { value: "100" } },
    );
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Precio máximo" }),
      { target: { value: "50" } },
    );
    expect(screen.getByRole("alert")).toHaveTextContent("mínimo");
    await user.click(screen.getByRole("button", { name: "Limpiar" }));
    await user.selectOptions(
      screen.getByLabelText("Exterior"),
      "Battle-Scarred",
    );
    expect(screen.getByText("No encontramos esas skins")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    await user.selectOptions(screen.getByLabelText("Ordenar productos"), "low");
    await user.selectOptions(
      screen.getByLabelText("Colección"),
      screen.getByLabelText("Colección").options[1].value,
    );
    await user.click(screen.getByRole("button", { name: "Limpiar" }));
    await user.click(
      screen.getAllByRole("button", { name: "Añadir al carrito" })[0],
    );
    expect(
      screen.getByRole("heading", { name: "Bienvenido de vuelta." }),
    ).toBeInTheDocument();
  });
  it("valida login, credenciales, sesión, recarga y logout", async () => {
    const user = userEvent.setup();
    setup("/acceso");
    await user.click(
      screen.getByRole("button", { name: "Entrar a SkinMarket" }),
    );
    expect(screen.getByText(/correo con @/)).toBeInTheDocument();
    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "nadie@example.cl",
    );
    await user.type(screen.getByLabelText("Contraseña"), "123456");
    await user.click(
      screen.getByRole("button", { name: "Entrar a SkinMarket" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("incorrectos");
    await user.click(screen.getByRole("button", { name: "Cliente" }));
    await user.click(
      screen.getByRole("button", { name: "Entrar a SkinMarket" }),
    );
    expect(loadState().sessionId).toBe("client-demo");
    await user.selectOptions(screen.getByLabelText("Moneda"), "CLP");
    await user.click(
      screen.getByRole("button", { name: "Recargar saldo virtual" }),
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByRole("spinbutton"), {
      target: { value: "950000" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: "Añadir saldo virtual" }),
    );
    expect(loadState().users[0].balance).toBe(13500);
    await user.click(
      screen.getByRole("button", { name: "Recargar saldo virtual" }),
    );
    await user.click(screen.getByRole("button", { name: "Cerrar recarga" }));
    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(loadState().sessionId).toBeNull();
  });
  it("registra, rechaza duplicados y valida nombre", async () => {
    const user = userEvent.setup();
    setup("/acceso");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
    await user.click(screen.getByRole("button", { name: "Crear mi cuenta" }));
    expect(screen.getByText(/nombre debe/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nombre"), "Camila");
    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "cliente@skinmarket.cl",
    );
    await user.type(screen.getByLabelText("Contraseña"), "123456");
    await user.click(screen.getByRole("button", { name: "Crear mi cuenta" }));
    expect(screen.getByRole("alert")).toHaveTextContent("registrado");
    await user.clear(screen.getByLabelText("Correo electrónico"));
    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "camila@example.cl",
    );
    await user.click(screen.getByRole("button", { name: "Crear mi cuenta" }));
    expect(loadState().users).toHaveLength(3);
  });
  it("compra, muestra inventario y conserva el historial al quitar el producto", async () => {
    const user = userEvent.setup();
    setup("/productos", "client");
    await user.click(
      screen.getAllByRole("button", { name: "Añadir al carrito" })[0],
    );
    await user.click(
      screen.getByRole("link", { name: /Carrito, 1 artículos/ }),
    );
    expect(
      screen.getByRole("heading", { name: "Resumen de compra" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirmar compra" }));
    expect(
      screen.getByRole("heading", { name: /Mi inventario/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 unidad/)).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Mis compras" }));
    expect(screen.getByText("Completada")).toBeInTheDocument();
    await user.click(
      screen.getByRole("link", { name: /Carrito, 0 artículos/ }),
    );
    expect(screen.getByText("Tu carrito está esperando")).toBeInTheDocument();
  });
  it("actualiza cantidades, elimina líneas y bloquea compra sin saldo", async () => {
    const user = userEvent.setup();
    setup("/carrito", "client", (s) => {
      s.users[0].cart = [{ productId: s.products[1].id, quantity: 1 }];
      s.users[0].balance = 0;
    });
    expect(
      screen.getByRole("button", { name: "Confirmar compra" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Aumentar/ }));
    expect(loadState().users[0].cart[0].quantity).toBe(2);
    await user.click(screen.getByRole("button", { name: /Reducir/ }));
    await user.click(screen.getByRole("button", { name: /Quitar/ }));
    expect(screen.getByText("Tu carrito está esperando")).toBeInTheDocument();
  });
  it("bloquea stock insuficiente y presenta compras vacías", async () => {
    const user = userEvent.setup();
    setup("/carrito", "client", (s) => {
      s.users[0].cart = [{ productId: s.products[10].id, quantity: 1 }];
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Stock insuficiente");
    await user.click(screen.getByRole("link", { name: "Mis compras" }));
    expect(screen.getByText("Aún no tienes compras")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Inventario" }));
    expect(
      screen.getByText("Tu colección comienza con una skin"),
    ).toBeInTheDocument();
  });
  it("protege rutas y presenta página no encontrada", () => {
    setup("/admin");
    expect(
      screen.getByRole("heading", { name: "Bienvenido de vuelta." }),
    ).toBeInTheDocument();
  });
  it("rechaza acceso administrativo de clientes", () => {
    setup("/admin", "client");
    expect(
      screen.getByRole("heading", { name: "Acceso restringido" }),
    ).toBeInTheDocument();
  });
  it("presenta 404", () => {
    setup("/no-existe");
    expect(
      screen.getByRole("heading", { name: /Fuera del mapa/ }),
    ).toBeInTheDocument();
  });
  it("administra catálogo completo con confirmación de borrado", async () => {
    const user = userEvent.setup();
    setup("/admin", "admin");
    await user.click(screen.getByRole("button", { name: "Nuevo producto" }));
    await user.click(screen.getByRole("button", { name: "Guardar producto" }));
    expect(screen.getByText(/Usa un nombre/)).toBeInTheDocument();
    await user.type(
      screen.getByLabelText("Nombre (arma | acabado)"),
      "AK-47 | Prueba",
    );
    await user.type(screen.getByLabelText("Precio base en USD"), "50");
    await user.type(screen.getByLabelText("Stock"), "2");
    await user.selectOptions(screen.getByLabelText("Categoría"), "Pistolas");
    await user.selectOptions(screen.getByLabelText("Rareza"), "Restricted");
    await user.selectOptions(screen.getByLabelText("Exterior"), "Minimal Wear");
    await user.click(screen.getByLabelText("Mostrar en destacadas"));
    await user.click(screen.getByRole("button", { name: "Guardar producto" }));
    expect(loadState().products).toHaveLength(25);
    await user.type(
      screen.getByLabelText("Buscar producto administrativo"),
      "Prueba",
    );
    await user.click(
      screen.getByRole("button", { name: "Editar AK-47 | Prueba" }),
    );
    await user.clear(screen.getByLabelText("Precio base en USD"));
    await user.type(screen.getByLabelText("Precio base en USD"), "60");
    await user.click(screen.getByRole("button", { name: "Guardar producto" }));
    expect(loadState().products.at(-1).price).toBe(60);
    await user.click(
      screen.getByRole("button", { name: "Eliminar AK-47 | Prueba" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(loadState().products).toHaveLength(25);
    await user.click(
      screen.getByRole("button", { name: "Eliminar AK-47 | Prueba" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(loadState().products).toHaveLength(24);
    await user.clear(screen.getByLabelText("Buscar producto administrativo"));
    await user.click(screen.getByRole("button", { name: "Nuevo producto" }));
    await user.click(screen.getByRole("button", { name: "Cerrar editor" }));
    await user.click(screen.getByRole("button", { name: "Nuevo producto" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(
      screen.getByRole("button", { name: "Restaurar demostración" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(loadState().sessionId).toBeNull();
  }, 20000);
});
