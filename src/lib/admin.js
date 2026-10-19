import { normalizeEmail, validEmail } from "./market";

// Agrega pedidos reales del navegador; las recargas no cuentan como ventas.
export function dashboardStats(state, now = new Date()) {
  const dateKey = (date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6 + i,
    );
    return {
      key: dateKey(date),
      label: date.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
      }),
      total: 0,
      orders: 0,
    };
  });
  const orders = state.users.flatMap((user) =>
    user.orders.map((order) => ({ ...order, customer: user.name })),
  );
  const sold = new Map();
  let units = 0;
  for (const order of orders) {
    const day = days.find((day) => day.key === dateKey(new Date(order.date)));
    if (day) {
      day.total += order.total;
      day.orders++;
    }
    for (const item of order.items) {
      const existing = sold.get(item.id) || {
        id: item.id,
        name: item.name,
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += item.price * item.quantity;
      sold.set(item.id, existing);
      units += item.quantity;
    }
  }
  const categories = new Map();
  for (const product of state.products)
    categories.set(
      product.category,
      (categories.get(product.category) || 0) + product.stock,
    );
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  return {
    revenue,
    orders: orders.length,
    units,
    average: orders.length ? revenue / orders.length : 0,
    users: state.users.length,
    blocked: state.users.filter((user) => user.blocked).length,
    days,
    bestSellers: [...sold.values()]
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, 5),
    stock: [...categories].map(([name, quantity]) => ({ name, quantity })),
    recent: orders
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5),
  };
}

export function validateAccount(values, users, id) {
  const errors = {};
  if (typeof values.name !== "string" || values.name.trim().length < 3)
    errors.name = "El nombre debe tener al menos 3 caracteres.";
  if (
    typeof values.email !== "string" ||
    !validEmail(normalizeEmail(values.email))
  )
    errors.email = "Ingresa un correo válido.";
  else if (
    users.some(
      (user) => user.id !== id && user.email === normalizeEmail(values.email),
    )
  )
    errors.email = "Este correo ya está registrado.";
  if (!["client", "admin"].includes(values.role))
    errors.role = "Selecciona un rol válido.";
  return errors;
}

export function updateAccount(state, actorId, targetId, changes) {
  const actor = state.users.find((user) => user.id === actorId);
  if (!actor || actor.blocked || actor.role !== "admin")
    throw new Error("Acceso exclusivo para administradores.");
  const target = state.users.find((user) => user.id === targetId);
  if (!target) throw new Error("El usuario ya no existe.");
  // Lista explícita: la edición de perfil no puede cambiar saldo, clave ni compras.
  const next = {
    ...target,
    name: changes.name ?? target.name,
    email: changes.email ?? target.email,
    role: changes.role ?? target.role,
    blocked: changes.blocked ?? !!target.blocked,
  };
  const errors = validateAccount(next, state.users, targetId);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  if (typeof next.blocked !== "boolean")
    throw new Error("Estado de usuario inválido.");
  if (actorId === targetId && (next.blocked || next.role !== "admin"))
    throw new Error(
      "No puedes bloquearte ni quitarte tu propio rol de administrador.",
    );
  const users = state.users.map((user) =>
    user.id === targetId
      ? { ...next, name: next.name.trim(), email: normalizeEmail(next.email) }
      : user,
  );
  if (!users.some((user) => user.role === "admin" && !user.blocked))
    throw new Error("Debe existir al menos un administrador activo.");
  return { ...state, users };
}
