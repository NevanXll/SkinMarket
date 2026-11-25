export const USD_TO_CLP = 950;
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
