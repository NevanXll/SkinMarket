import {
  cartLines,
  checkout,
  filterProducts,
  freshState,
  imageUrl,
  loadState,
  money,
  saveState,
  STORAGE_KEY,
  validateAuth,
  validateProduct,
} from "../src/lib/market";
const filters = {
  search: "",
  category: "",
  rarities: [],
  collection: "",
  wear: "",
  min: "",
  max: "",
  sort: "featured",
};
describe("Validaciones y reglas de negocio", () => {
  it("valida registro, correo, contraseña y nombre", () => {
    expect(
      validateAuth({ name: " ", email: "a@b", password: "123" }, true),
    ).toHaveProperty("name");
    expect(
      validateAuth(
        { name: "Alex", email: "  ALEX@example.cl ", password: "123456" },
        true,
      ),
    ).toEqual({});
    expect(validateAuth({ email: "a", password: "" })).toHaveProperty(
      "password",
    );
  });
  it("rechaza precios inválidos y stock decimal o negativo", () => {
    const p = freshState().products[0];
    expect(validateProduct(p)).toEqual({});
    for (const price of ["", -1, "abc", Infinity])
      expect(validateProduct({ ...p, price })).toHaveProperty("price");
    for (const stock of ["", -1, 1.5, "abc"])
      expect(validateProduct({ ...p, stock })).toHaveProperty("stock");
    expect(
      validateProduct({
        ...p,
        name: "<>",
        category: "",
        rarity: "",
        image: "javascript:x",
      }),
    ).toMatchObject({
      name: jasmine.any(String),
      category: jasmine.any(String),
      rarity: jasmine.any(String),
      image: jasmine.any(String),
    });
    expect(
      validateProduct({
        ...p,
        price: 0,
        stock: 0,
        image: "https://example.com/a.png",
      }),
    ).toEqual({});
  });
  it("persiste, recupera y descarta datos corruptos", () => {
    expect(loadState().products).toHaveLength(24);
    const s = freshState();
    s.sessionId = s.users[0].id;
    s.currency = "CLP";
    expect(saveState(s)).toBe(true);
    expect(loadState()).toEqual(s);
    s.sessionId = "missing";
    s.currency = "invalid";
    saveState(s);
    expect(loadState()).toMatchObject({ sessionId: null, currency: "USD" });
    for (const bad of [
      "{",
      JSON.stringify({ products: [], users: [] }),
      JSON.stringify({ ...s, users: [{ id: 1 }] }),
      JSON.stringify({ ...s, products: [{ id: 1 }] }),
    ]) {
      localStorage.setItem(STORAGE_KEY, bad);
      expect(loadState().users).toHaveLength(2);
    }
    const blocked = {
      getItem() {
        throw Error("blocked");
      },
      setItem() {
        throw Error("blocked");
      },
    };
    expect(loadState(blocked).products).toHaveLength(24);
    expect(saveState(s, blocked)).toBe(false);
  });
  it("filtra por texto, categoría, colección, rareza, exterior y precio; ordena sin mutar", () => {
    const products = freshState().products;
    expect(filterProducts(products, { ...filters, max: 0 })).toHaveLength(0);
    expect(
      filterProducts(products, { ...filters, search: "dragon lore" }),
    ).toHaveLength(1);
    const p = products[0];
    expect(
      filterProducts(products, {
        ...filters,
        category: p.category,
        rarities: [p.rarity],
        collection: p.collection,
        wear: p.wear,
        min: 8000,
        max: 9000,
      }),
    ).toEqual([p]);
    expect(
      filterProducts(products, { ...filters, wear: "Battle-Scarred" }),
    ).toHaveLength(0);
    expect(filterProducts(products, { ...filters, sort: "low" })[0].price).toBe(
      12,
    );
    expect(filterProducts(products, { ...filters, sort: "high" })[0]).toEqual(
      p,
    );
    expect(
      filterProducts(products, { ...filters, sort: "name" })[0].name.startsWith(
        "AK",
      ),
    ).toBe(true);
    expect(products[0].name).toContain("Dragon Lore");
  });
  it("convierte presentación USD/CLP y rutas de imágenes", () => {
    expect(money(10, "USD")).toBe("$10.00");
    expect(money(10, "CLP")).toContain("9.500");
    expect(imageUrl("https://example.com/a.png")).toBe(
      "https://example.com/a.png",
    );
    expect(imageUrl("images/skins/a.png")).toBe("/images/skins/a.png");
  });
  it("compra atómicamente y conserva inventario e historial por usuario", () => {
    const s = freshState();
    const u = s.users[0];
    const p = s.products[1];
    u.cart = [{ productId: p.id, quantity: 2 }];
    expect(cartLines(s, u)[0].product).toEqual(p);
    const next = checkout(s, u.id, "2026-10-19T12:00:00Z");
    expect(next.users[0].balance).toBe(u.balance - p.price * 2);
    expect(next.users[0].cart).toEqual([]);
    expect(next.users[0].inventory[0].quantity).toBe(2);
    expect(next.users[0].orders[0].items[0].name).toBe(p.name);
    expect(next.products[1].stock).toBe(p.stock - 2);
    expect(next.users[1]).toEqual(s.users[1]);
    expect(u.cart).toHaveLength(1);
  });
  it("bloquea compras sin sesión, vacías, sin saldo o sin stock sin alterar el estado", () => {
    const s = freshState();
    const u = s.users[0];
    const p = s.products[0];
    expect(() => checkout(s, "missing")).toThrowError(/Inicia sesión/);
    expect(() => checkout(s, u.id)).toThrowError(/vacío/);
    for (const line of [
      { productId: "missing", quantity: 1 },
      { productId: p.id, quantity: 0 },
      { productId: p.id, quantity: 1.5 },
      { productId: p.id, quantity: p.stock + 1 },
    ]) {
      u.cart = [line];
      expect(() => checkout(s, u.id)).toThrowError(/Stock insuficiente/);
    }
    u.cart = [{ productId: p.id, quantity: 1 }];
    u.balance = 0;
    expect(() => checkout(s, u.id)).toThrowError(/Saldo insuficiente/);
    expect(p.stock).toBe(1);
  });
});
