import catalog from "../data/catalog.json";
import { createId } from './id';
export const STORAGE_KEY = "skinmarket-pro-v2";
export const USD_TO_CLP = 950;
export const DEMO_ACCOUNTS = [
  {
    id: "client-demo",
    name: "Alex",
    email: "cliente@skinmarket.cl",
    password: "Cliente123",
    role: "client",
    balance: 12500,
    cart: [],
    inventory: [],
    orders: [],
  },
  {
    id: "admin-demo",
    name: "Administrador",
    email: "admin@skinmarket.cl",
    password: "Admin123",
    role: "admin",
    balance: 12500,
    cart: [],
    inventory: [],
    orders: [],
  },
];
export const freshState = () => ({
  products: structuredClone(catalog),
  users: structuredClone(DEMO_ACCOUNTS),
  sessionId: null,
  currency: "USD",
});
export const normalizeEmail = (value) => value.trim().toLowerCase();
export const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const imageUrl = (value) =>
  /^https:\/\//.test(value) ? value : `${import.meta.env.BASE_URL}${value}`;
export function money(value, currency = "USD") {
  return new Intl.NumberFormat(currency === "CLP" ? "es-CL" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CLP" ? 0 : 2,
  }).format(currency === "CLP" ? value * USD_TO_CLP : value);
}
export function loadState(storage = localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY));
    if (
      !saved ||
      !Array.isArray(saved.products) ||
      !Array.isArray(saved.users) ||
      !saved.users.length
    )
      return freshState();
    if (
      !saved.users.every(
        (u) =>
          typeof u.id === "string" &&
          typeof u.email === "string" &&
          typeof u.password === "string" &&
          ["client", "admin"].includes(u.role) &&
          Number.isFinite(u.balance) &&
          u.balance >= 0 &&
          [u.cart, u.inventory, u.orders].every(Array.isArray),
      )
    )
      return freshState();
    if (
      !saved.products.every(
        (p) =>
          typeof p.id === "string" &&
          typeof p.name === "string" &&
          Number.isFinite(p.price) &&
          p.price >= 0 &&
          Number.isInteger(p.stock) &&
          p.stock >= 0,
      )
    )
      return freshState();
    return {
      ...saved,
      sessionId: saved.users.some((u) => u.id === saved.sessionId && !u.blocked)
        ? saved.sessionId
        : null,
      currency: saved.currency === "CLP" ? "CLP" : "USD",
    };
  } catch {
    return freshState();
  }
}
export function saveState(state, storage = localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
export function validateAuth(values, register = false) {
  const errors = {};
  if (register && values.name.trim().length < 3)
    errors.name = "El nombre debe tener al menos 3 caracteres.";
  if (!validEmail(normalizeEmail(values.email)))
    errors.email = "Ingresa un correo con @ y dominio válido.";
  if (values.password.length < 6)
    errors.password = "La contraseña debe tener al menos 6 caracteres.";
  return errors;
}
export function validateProduct(p) {
  const errors = {};
  if (p.name.trim().length < 3 || /[<>]/.test(p.name))
    errors.name = "Usa un nombre de al menos 3 caracteres, sin < ni >.";
  if (!p.category) errors.category = "Selecciona una categoría.";
  if (!p.rarity) errors.rarity = "Selecciona una rareza.";
  if (
    String(p.price).trim() === "" ||
    !Number.isFinite(Number(p.price)) ||
    Number(p.price) < 0
  )
    errors.price = "Ingresa un precio mayor o igual a cero.";
  if (
    String(p.stock).trim() === "" ||
    !Number.isInteger(Number(p.stock)) ||
    Number(p.stock) < 0
  )
    errors.stock = "El stock debe ser un entero mayor o igual a cero.";
  if (!/^(https:\/\/[^\s]+|images\/skins\/[a-zA-Z0-9_-]+\.png)$/.test(p.image))
    errors.image = "Usa una URL HTTPS o una imagen del catálogo.";
  return errors;
}
export function filterProducts(products, filters) {
  const term = filters.search.trim().toLowerCase();
  const filtered = products.filter(
    (p) =>
      `${p.name} ${p.collection}`.toLowerCase().includes(term) &&
      (!filters.category || p.category === filters.category) &&
      (!filters.rarities.length || filters.rarities.includes(p.rarity)) &&
      (!filters.collection || p.collection === filters.collection) &&
      (!filters.wear || p.wear === filters.wear) &&
      p.price >= Number(filters.min === "" ? 0 : filters.min) &&
      p.price <= Number(filters.max === "" ? Infinity : filters.max),
  );
  if (filters.sort === "low") filtered.sort((a, b) => a.price - b.price);
  if (filters.sort === "high") filtered.sort((a, b) => b.price - a.price);
  if (filters.sort === "name")
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  return filtered;
}
export function cartLines(state, user) {
  return user.cart.map((line) => ({
    ...line,
    product: state.products.find((p) => p.id === line.productId),
  }));
}
export function checkout(state, userId, now = new Date().toISOString()) {
  const user = state.users.find((u) => u.id === userId);
  if (!user) throw new Error("Inicia sesión para comprar.");
  if (user.blocked) throw new Error("Tu cuenta está bloqueada.");
  if (!user.cart.length) throw new Error("Tu carrito está vacío.");
  const lines = cartLines(state, user);
  if (
    lines.some(
      (l) =>
        !l.product ||
        !Number.isInteger(l.quantity) ||
        l.quantity <= 0 ||
        l.product.stock < l.quantity,
    )
  )
    throw new Error("Stock insuficiente. Revisa las cantidades del carrito.");
  const total =
    Math.round(
      lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0) * 100,
    ) / 100;
  if (total > user.balance)
    throw new Error(
      "Saldo insuficiente. Recarga saldo virtual para continuar.",
    );
  const order = {
    id: createId(),
    date: now,
    total,
    items: lines.map((l) => ({ ...l.product, quantity: l.quantity })),
  };
  return {
    ...state,
    products: state.products.map((p) => ({
      ...p,
      stock:
        p.stock - (user.cart.find((l) => l.productId === p.id)?.quantity || 0),
    })),
    users: state.users.map((u) =>
      u.id !== userId
        ? u
        : {
            ...u,
            balance: Math.round((u.balance - total) * 100) / 100,
            cart: [],
            orders: [order, ...u.orders],
            inventory: [
              ...order.items.map((p) => ({
                ...p,
                acquiredAt: now,
                orderId: order.id,
              })),
              ...u.inventory,
            ],
          },
    ),
  };
}
