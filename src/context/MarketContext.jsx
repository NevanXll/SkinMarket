import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  checkout,
  freshState,
  loadState,
  normalizeEmail,
  saveState,
  validateAuth,
  validateProduct,
  STORAGE_KEY,
} from "../lib/market";
import { updateAccount } from "../lib/admin";
import { createId } from '../lib/id';
const MarketContext = createContext(null);
export function MarketProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [notice, setNotice] = useState(null);
  const [storageError, setStorageError] = useState(false);
  const current = useRef(state);
  const timer = useRef();
  const user =
    state.users.find((u) => u.id === state.sessionId && !u.blocked) || null;
  useEffect(() => {
    function sync(event) {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      const next = loadState();
      current.current = next;
      setState(next);
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function notify(text, type = "success") {
    setNotice({ text, type });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 5000);
  }
  useEffect(() => () => clearTimeout(timer.current), []);
  function commit(next) {
    current.current = next;
    setState(next);
    setStorageError(!saveState(next));
  }
  function updateUser(transform) {
    const s = current.current;
    if (!s.sessionId) throw new Error("Inicia sesión para continuar.");
    commit({
      ...s,
      users: s.users.map((u) => (u.id === s.sessionId ? transform(u) : u)),
    });
  }
  function login(values) {
    if (Object.keys(validateAuth(values)).length)
      throw new Error("Revisa el correo y la contraseña.");
    const account = current.current.users.find(
      (u) =>
        u.email === normalizeEmail(values.email) &&
        u.password === values.password,
    );
    if (!account) throw new Error("Correo o contraseña incorrectos.");
    if (account.blocked)
      throw new Error("Tu cuenta está bloqueada. Contacta al administrador.");
    commit({ ...current.current, sessionId: account.id });
    notify(`Bienvenido, ${account.name}.`);
    return account;
  }
  function register(values) {
    if (Object.keys(validateAuth(values, true)).length)
      throw new Error("Revisa los campos del registro.");
    const s = current.current;
    if (s.users.some((u) => u.email === normalizeEmail(values.email)))
      throw new Error("Este correo ya está registrado.");
    const account = {
      id: createId(),
      name: values.name.trim(),
      email: normalizeEmail(values.email),
      password: values.password,
      role: "client",
      balance: 12500,
      cart: [],
      inventory: [],
      orders: [],
    };
    commit({ ...s, users: [...s.users, account], sessionId: account.id });
    notify("Cuenta creada. Tienes saldo virtual para explorar.");
  }
  function addToCart(productId) {
    const s = current.current;
    const p = s.products.find((p) => p.id === productId);
    if (!p || !p.stock) throw new Error("Esta skin no tiene stock.");
    updateUser((u) => {
      const line = u.cart.find((l) => l.productId === productId);
      if ((line?.quantity || 0) >= p.stock)
        throw new Error("Ya agregaste todas las unidades disponibles.");
      return {
        ...u,
        cart: line
          ? u.cart.map((l) =>
              l.productId === productId
                ? { ...l, quantity: l.quantity + 1 }
                : l,
            )
          : [...u.cart, { productId, quantity: 1 }],
      };
    });
    notify("Skin añadida al carrito.");
  }
  function changeQuantity(id, quantity) {
    if (!Number.isInteger(quantity) || quantity < 0)
      throw new Error("Cantidad inválida.");
    const product = current.current.products.find((p) => p.id === id);
    if (quantity && (!product || quantity > product.stock))
      throw new Error("No hay suficiente stock.");
    updateUser((u) => ({
      ...u,
      cart:
        quantity === 0
          ? u.cart.filter((l) => l.productId !== id)
          : u.cart.map((l) => (l.productId === id ? { ...l, quantity } : l)),
    }));
  }
  function buy() {
    commit(checkout(current.current, current.current.sessionId));
    notify("Compra realizada con éxito. Tus skins ya están en el inventario.");
  }
  function topUp(amount) {
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000)
      throw new Error("Ingresa un monto entre 0,01 y 100.000 USD.");
    updateUser((u) => ({
      ...u,
      balance: Math.round((u.balance + amount) * 100) / 100,
    }));
    notify("Saldo virtual recargado.");
  }
  function requireAdmin() {
    if (
      current.current.users.find((u) => u.id === current.current.sessionId)
        ?.role !== "admin"
    )
      throw new Error("Acceso exclusivo para administradores.");
    if (
      current.current.users.find((u) => u.id === current.current.sessionId)
        ?.blocked
    )
      throw new Error("Tu cuenta está bloqueada.");
  }
  function saveUser(id, changes) {
    commit(
      updateAccount(current.current, current.current.sessionId, id, changes),
    );
    notify("Usuario actualizado.");
  }
  function saveProduct(product) {
    requireAdmin();
    if (Object.keys(validateProduct(product)).length)
      throw new Error("Revisa los datos del producto.");
    const s = current.current;
    const p = {
      ...product,
      id: product.id || createId(),
      price: Number(product.price),
      stock: Number(product.stock),
      name: product.name.trim(),
      weapon: product.name.split(" | ")[0],
      finish: product.name.split(" | ")[1] || "Edición especial",
    };
    commit({
      ...s,
      products: product.id
        ? s.products.map((old) => (old.id === p.id ? p : old))
        : [...s.products, p],
    });
    notify(product.id ? "Producto actualizado." : "Producto creado.");
  }
  function deleteProduct(id) {
    requireAdmin();
    const s = current.current;
    commit({
      ...s,
      products: s.products.filter((p) => p.id !== id),
      users: s.users.map((u) => ({
        ...u,
        cart: u.cart.filter((l) => l.productId !== id),
      })),
    });
    notify("Producto eliminado del catálogo.");
  }
  return (
    <MarketContext.Provider
      value={{
        state,
        user,
        notice,
        storageError,
        notify,
        login,
        register,
        addToCart,
        changeQuantity,
        buy,
        topUp,
        saveProduct,
        deleteProduct,
        saveUser,
        setCurrency: (currency) => commit({ ...current.current, currency }),
        logout: () => {
          commit({ ...current.current, sessionId: null });
          notify("Sesión cerrada.");
        },
        resetDemo: () => {
          requireAdmin();
          commit(freshState());
          notify("Datos de demostración restaurados.");
        },
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}
export const useMarket = () => useContext(MarketContext);
