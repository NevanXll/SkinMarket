import { act, renderHook } from "@testing-library/react";
import { MarketProvider, useMarket } from "../src/context/MarketContext";
import {
  DEMO_ACCOUNTS,
  freshState,
  loadState,
  STORAGE_KEY,
} from "../src/lib/market";
const wrapper = ({ children }) => <MarketProvider>{children}</MarketProvider>;
describe("Cuentas, permisos y estado compartido", () => {
  it("inicia, restaura y cierra sesión, exige credenciales correctas", () => {
    const { result, unmount } = renderHook(useMarket, { wrapper });
    expect(() =>
      act(() => result.current.login({ email: "x", password: "x" })),
    ).toThrowError(/Revisa/);
    expect(() =>
      act(() =>
        result.current.login({
          email: DEMO_ACCOUNTS[0].email,
          password: "incorrecta",
        }),
      ),
    ).toThrowError(/incorrectos/);
    act(() => result.current.login(DEMO_ACCOUNTS[0]));
    expect(result.current.user.role).toBe("client");
    act(() => result.current.setCurrency("CLP"));
    expect(loadState().currency).toBe("CLP");
    unmount();
    const restored = renderHook(useMarket, { wrapper });
    expect(restored.result.current.user.email).toBe(DEMO_ACCOUNTS[0].email);
    act(() => restored.result.current.logout());
    expect(restored.result.current.user).toBeNull();
  });
  it("registra cuentas únicas sin privilegios administrativos", () => {
    const { result } = renderHook(useMarket, { wrapper });
    expect(() =>
      act(() => result.current.register({ name: "", email: "", password: "" })),
    ).toThrowError(/Revisa/);
    const values = {
      name: "Nueva cuenta",
      email: "nuevo@example.cl",
      password: "123456",
    };
    act(() => result.current.register(values));
    expect(result.current.user.role).toBe("client");
    expect(() =>
      act(() =>
        result.current.register({ ...values, email: " NUEVO@example.cl " }),
      ),
    ).toThrowError(/registrado/);
    expect(() =>
      act(() => result.current.saveProduct(freshState().products[0])),
    ).toThrowError(/administradores/);
    expect(() => act(() => result.current.deleteProduct("x"))).toThrowError(/administradores/);
    expect(() => act(() => result.current.resetDemo())).toThrowError(/administradores/);
  });
  it("gestiona cantidades, stock, recargas y compras separadas por cuenta", () => {
    const { result } = renderHook(useMarket, { wrapper });
    const p = result.current.state.products[1];
    expect(() => act(() => result.current.addToCart(p.id))).toThrowError(/Inicia sesión/);
    act(() => result.current.login(DEMO_ACCOUNTS[0]));
    expect(() => act(() => result.current.addToCart("missing"))).toThrowError(/stock/);
    expect(() =>
      act(() => result.current.addToCart(result.current.state.products[10].id)),
    ).toThrowError(/stock/);
    act(() => result.current.addToCart(p.id));
    act(() => result.current.addToCart(p.id));
    expect(() => act(() => result.current.addToCart(p.id))).toThrowError(/disponibles/);
    expect(() => act(() => result.current.changeQuantity(p.id, -1))).toThrowError(/inválida/);
    expect(() =>
      act(() => result.current.changeQuantity("missing", 1)),
    ).toThrowError(/stock/);
    expect(() => act(() => result.current.changeQuantity(p.id, 99))).toThrowError(/stock/);
    act(() => result.current.changeQuantity(p.id, 1));
    act(() => result.current.changeQuantity(p.id, 0));
    expect(result.current.user.cart).toHaveLength(0);
    for (const amount of [0, -1, Infinity, 100001])
      expect(() => act(() => result.current.topUp(amount))).toThrowError(/monto/);
    act(() => result.current.topUp(500));
    expect(result.current.user.balance).toBe(13000);
    act(() => result.current.addToCart(p.id));
    act(() => result.current.buy());
    expect(result.current.user.inventory).toHaveLength(1);
    act(() => result.current.login(DEMO_ACCOUNTS[1]));
    expect(result.current.user.inventory).toHaveLength(0);
  });
  it("crea, edita y elimina productos y restaura la demostración", () => {
    const { result } = renderHook(useMarket, { wrapper });
    act(() => result.current.login(DEMO_ACCOUNTS[1]));
    expect(() =>
      act(() =>
        result.current.saveProduct({ ...freshState().products[0], price: -1 }),
      ),
    ).toThrowError(/Revisa/);
    const { id, ...p } = freshState().products[0];
    act(() =>
      result.current.saveProduct({
        ...p,
        name: "Nueva skin",
        price: "10",
        stock: "2",
      }),
    );
    let added = result.current.state.products.at(-1);
    expect(added.finish).toBe("Edición especial");
    act(() =>
      result.current.saveProduct({
        ...added,
        name: "AK-47 | Editada",
        price: "20",
      }),
    );
    added = result.current.state.products.at(-1);
    expect(added.price).toBe(20);
    act(() => result.current.addToCart(added.id));
    act(() => result.current.deleteProduct(added.id));
    expect(result.current.user.cart).toEqual([]);
    expect(result.current.state.products).toHaveLength(24);
    act(() => result.current.resetDemo());
    expect(result.current.user).toBeNull();
    expect(loadState().products).toHaveLength(24);
  });
});
