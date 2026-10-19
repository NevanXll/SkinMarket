const defaultSkins = [
  { id: 1, name: "Vandal // Neon Divide", game: "Valorant", rarity: "Legendaria", price: 129, stock: 4, theme: "orange", tag: "Destacada", code: "VDL-04 / NEO" },
  { id: 2, name: "Phantom // Violet Circuit", game: "Valorant", rarity: "Épica", price: 86, stock: 2, theme: "purple", tag: "Nueva", code: "PHT-12 / VIO" },
  { id: 3, name: "Striker // Arctic Pulse", game: "Strike Zone", rarity: "Rara", price: 42, stock: 8, theme: "blue", tag: "Destacada", code: "STK-08 / ARC" },
  { id: 4, name: "R-301 // Verdant Alloy", game: "Apex Arena", rarity: "Épica", price: 74, stock: 0, theme: "green", tag: "Nueva", code: "R31-19 / VRD" },
  { id: 5, name: "Spectre // Pink Noise", game: "Valorant", rarity: "Rara", price: 58, stock: 3, theme: "pink", tag: "Destacada", code: "SPC-27 / PNK" },
  { id: 6, name: "Guardian // Gold Vector", game: "Strike Zone", rarity: "Legendaria", price: 210, stock: 1, theme: "gold", tag: "Nueva", code: "GRD-01 / GLD" }
];

function loadMarketState() {
  try {
    const stored = JSON.parse(localStorage.getItem("skinmarket-state"));
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

const savedMarket = loadMarketState();
let skins = Array.isArray(savedMarket.skins) ? savedMarket.skins : defaultSkins;
const savedCartIds = Array.isArray(savedMarket.cartIds) ? savedMarket.cartIds : [];
const state = {
  cart: savedCartIds.map((id) => skins.find((skin) => skin.id === id)).filter(Boolean),
  balance: Number.isFinite(savedMarket.balance) ? savedMarket.balance : 325,
  quickFilter: "Todas",
  registeredEmails: Array.isArray(savedMarket.registeredEmails) ? savedMarket.registeredEmails : ["alex@skinmarket.cl"],
  inventory: Array.isArray(savedMarket.inventory) ? savedMarket.inventory : [],
  transactions: Array.isArray(savedMarket.transactions) ? savedMarket.transactions : []
};

function saveMarketState() {
  try {
    localStorage.setItem("skinmarket-state", JSON.stringify({
      skins,
      cartIds: state.cart.map((skin) => skin.id),
      balance: state.balance,
      registeredEmails: state.registeredEmails,
      inventory: state.inventory,
      transactions: state.transactions
    }));
  } catch {
    // La maqueta sigue funcionando aunque el navegador no permita almacenamiento local.
  }
}
const grid = document.querySelector("#skin-grid");
const search = document.querySelector("#busqueda");
const priceRange = document.querySelector("#precio-max");
const priceOutput = document.querySelector("#precio-salida");
const sortSelect = document.querySelector("#ordenar");
const resultText = document.querySelector("#resultados");
const emptyState = document.querySelector("#sin-resultados");
const cartDialog = document.querySelector("#carrito-dialog");
const messageDialog = document.querySelector("#mensaje-dialog");

function formatPrice(value) { return `$${value.toFixed(2)}`; }

function setFieldError(input, message) {
  const error = document.querySelector(`#error-${input.id}`);
  input.classList.toggle("is-invalid", Boolean(message));
  input.setAttribute("aria-invalid", String(Boolean(message)));
  if (error) error.textContent = message;
  return !message;
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function selectedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function currentSkins() {
  const term = search.value.trim().toLocaleLowerCase("es");
  const rarities = selectedValues("rareza");
  const games = selectedValues("juego");
  const maximum = Number(priceRange.value);
  const sort = sortSelect.value;
  let filtered = skins.filter((skin) => {
    const matchesText = `${skin.name} ${skin.game} ${skin.rarity}`.toLocaleLowerCase("es").includes(term);
    const matchesRarity = !rarities.length || rarities.includes(skin.rarity);
    const matchesGame = !games.length || games.includes(skin.game);
    const matchesQuick = state.quickFilter === "Todas" || skin.tag === state.quickFilter;
    return matchesText && matchesRarity && matchesGame && skin.price <= maximum && matchesQuick;
  });
  if (sort === "low") filtered.sort((a, b) => a.price - b.price);
  if (sort === "high") filtered.sort((a, b) => b.price - a.price);
  return filtered;
}

function renderCatalogue() {
  const filtered = currentSkins();
  grid.innerHTML = filtered.map((skin) => `
    <article class="skin-card">
      <div class="skin-art theme-${skin.theme}">
        <div class="weapon" aria-hidden="true"><div class="weapon-stock"></div><div class="weapon-body"></div><div class="weapon-mag"></div><div class="weapon-barrel"></div><div class="weapon-sight"></div></div>
        <span class="art-code">${skin.code}</span>
      </div>
      <div class="card-body">
        <div class="card-meta"><span>${skin.game}</span><span class="rarity-name ${skin.rarity}">${skin.rarity}</span></div>
        <h3 class="card-title">${skin.name}</h3>
        <p class="stock-state ${skin.stock === 0 ? "out" : ""}">${skin.stock === 0 ? "Stock agotado" : `${skin.stock} en stock`}</p>
        <div class="card-bottom"><strong class="card-price">${formatPrice(skin.price)}</strong><button class="add-button" type="button" data-id="${skin.id}" aria-label="${skin.stock === 0 ? `${skin.name} sin stock` : `Agregar ${skin.name} al carro`}" ${skin.stock === 0 ? "disabled" : ""}>${skin.stock === 0 ? "—" : "+"}</button></div>
      </div>
    </article>`).join("");
  resultText.textContent = `${filtered.length} ${filtered.length === 1 ? "skin disponible" : "skins disponibles"}`;
  emptyState.hidden = filtered.length !== 0;
}

function updateHeader() {
  document.querySelector("#saldo-header").textContent = formatPrice(state.balance);
  document.querySelector("#contador-carro").textContent = state.cart.length;
  document.querySelector("#abrir-carrito").setAttribute("aria-label", `Abrir carro, ${state.cart.length} artículos`);
}

function renderCart() {
  const lines = document.querySelector("#lineas-carro");
  const empty = document.querySelector("#carro-vacio");
  const total = state.cart.reduce((sum, item) => sum + item.price, 0);
  lines.innerHTML = state.cart.map((skin) => `
    <div class="cart-line"><span class="cart-swatch theme-${skin.theme}"></span><div><p class="cart-name">${skin.name}</p><p class="cart-game">${skin.game}</p></div><div><strong class="cart-price">${formatPrice(skin.price)}</strong><button class="remove-item" type="button" data-remove="${skin.id}">Quitar</button></div></div>`).join("");
  empty.hidden = state.cart.length > 0;
  document.querySelector("#total-carro").textContent = formatPrice(total);
  const checkout = document.querySelector("#comprar");
  checkout.disabled = state.cart.length === 0;
  checkout.textContent = total > state.balance ? "Saldo insuficiente" : "Confirmar compra";
}

function renderInventory() {
  const lines = document.querySelector("#lineas-inventario");
  const history = document.querySelector("#lineas-historial");
  const emptyInventory = document.querySelector("#inventario-vacio");
  const emptyHistory = document.querySelector("#historial-vacio");
  lines.innerHTML = state.inventory.map((skin) => `
    <div class="inventory-line"><span class="cart-swatch theme-${skin.theme}"></span><div><p class="inventory-name">${skin.name}</p><p class="inventory-meta">${skin.game} · ${skin.rarity}</p></div><time class="inventory-date" datetime="${skin.acquiredAt}">${new Date(skin.acquiredAt).toLocaleDateString("es-CL")}</time></div>`).join("");
  history.innerHTML = state.transactions.map((transaction) => `
    <div class="history-line"><span>Compra de ${transaction.count} ${transaction.count === 1 ? "skin" : "skins"} · ${formatPrice(transaction.total)}</span><time datetime="${transaction.date}">${new Date(transaction.date).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}</time></div>`).join("");
  document.querySelector("#resumen-inventario").textContent = `${state.inventory.length} ${state.inventory.length === 1 ? "skin adquirida" : "skins adquiridas"}`;
  emptyInventory.hidden = state.inventory.length > 0;
  emptyHistory.hidden = state.transactions.length > 0;
}

function showMessage(title, content) {
  if (cartDialog.open) cartDialog.close();
  document.querySelector("#mensaje-title").textContent = title;
  document.querySelector("#mensaje-contenido").textContent = content;
  if (!messageDialog.open) messageDialog.showModal();
}

document.addEventListener("input", (event) => {
  if (event.target === search) {
    const sanitized = search.value.replace(/[^\p{L}\p{N}\s\-/]/gu, "");
    const removedCharacters = sanitized !== search.value;
    search.value = sanitized;
    document.querySelector("#error-busqueda").textContent = removedCharacters ? "Se eliminaron caracteres no permitidos en la búsqueda." : "";
    renderCatalogue();
  }
  if (event.target === priceRange) {
    const safePrice = Math.max(0, Number(priceRange.value) || 0);
    priceRange.value = safePrice;
    priceOutput.textContent = `$${safePrice}`;
    renderCatalogue();
  }
  if (event.target.matches('input[type="checkbox"]')) renderCatalogue();
});
sortSelect.addEventListener("change", renderCatalogue);

document.querySelectorAll("[data-quick-filter]").forEach((button) => button.addEventListener("click", () => {
  state.quickFilter = button.dataset.quickFilter;
  document.querySelectorAll("[data-quick-filter]").forEach((chip) => chip.classList.toggle("active", chip === button));
  renderCatalogue();
}));

document.querySelector("#limpiar-filtros").addEventListener("click", () => {
  search.value = ""; priceRange.value = 500; priceOutput.textContent = "$500"; sortSelect.value = "featured";
  document.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
  state.quickFilter = "Todas";
  document.querySelectorAll("[data-quick-filter]").forEach((chip) => chip.classList.toggle("active", chip.dataset.quickFilter === "Todas"));
  renderCatalogue();
});

grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-id]");
  if (!button) return;
  const skin = skins.find((item) => item.id === Number(button.dataset.id));
  if (skin.stock <= 0) return showMessage("Stock agotado", "Esta skin ya no está disponible. El botón se mantendrá bloqueado hasta que un administrador reponga stock.");
  if (state.cart.some((item) => item.id === skin.id)) return showMessage("Skin ya agregada", "Esta skin ya está en tu carro de compra simulado.");
  state.cart.push(skin); saveMarketState(); updateHeader(); renderCart();
  button.textContent = "✓"; button.setAttribute("aria-label", `${skin.name} agregada al carro`);
});

document.querySelector("#abrir-carrito").addEventListener("click", () => { renderCart(); cartDialog.showModal(); });
document.querySelector("#cerrar-carrito").addEventListener("click", () => cartDialog.close());
document.querySelector("#cerrar-mensaje").addEventListener("click", () => messageDialog.close());
document.querySelector("#lineas-carro").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]"); if (!button) return;
  state.cart = state.cart.filter((item) => item.id !== Number(button.dataset.remove)); saveMarketState(); updateHeader(); renderCart(); renderCatalogue();
});
document.querySelector("#comprar").addEventListener("click", () => {
  const total = state.cart.reduce((sum, item) => sum + item.price, 0);
  if (total > state.balance) return showMessage("Saldo insuficiente", "Reduce el contenido del carro o agrega saldo virtual para continuar.");
  if (state.cart.some((item) => item.stock <= 0)) return showMessage("Stock agotado", "Una de las skins del carro se agotó antes de confirmar. Actualiza el carro e inténtalo nuevamente.");
  const purchased = state.cart.map((item) => ({ id: item.id, name: item.name, game: item.game, rarity: item.rarity, price: item.price, theme: item.theme, acquiredAt: new Date().toISOString() }));
  state.cart.forEach((item) => { item.stock -= 1; });
  state.inventory.unshift(...purchased);
  state.transactions.unshift({ count: purchased.length, total, date: new Date().toISOString() });
  state.balance -= total; const count = state.cart.length; state.cart = []; saveMarketState(); updateHeader(); renderCart(); renderInventory(); cartDialog.close(); renderCatalogue();
  showMessage("Compra confirmada", `${count} ${count === 1 ? "skin fue agregada" : "skins fueron agregadas"} a tu inventario. Se descontó saldo virtual; no se realizó ningún pago real.`);
});
const inventoryDialog = document.querySelector("#inventario-dialog");
document.querySelector("#ver-inventario").addEventListener("click", () => { renderInventory(); inventoryDialog.showModal(); });
document.querySelector("#cerrar-inventario").addEventListener("click", () => inventoryDialog.close());

const accessDialog = document.querySelector("#acceso-dialog");
const adminDialog = document.querySelector("#admin-dialog");

document.querySelector("#abrir-acceso").addEventListener("click", () => accessDialog.showModal());
document.querySelector("#cerrar-acceso").addEventListener("click", () => accessDialog.close());
document.querySelector("#cerrar-admin").addEventListener("click", () => adminDialog.close());
document.querySelectorAll("[data-auth-tab]").forEach((tab) => tab.addEventListener("click", () => {
  const isLogin = tab.dataset.authTab === "login";
  document.querySelector("#form-login").hidden = !isLogin;
  document.querySelector("#form-registro").hidden = isLogin;
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    const active = button === tab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
}));

document.querySelector("#form-login").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.querySelector("#login-correo");
  const password = document.querySelector("#login-clave");
  const normalizedEmail = email.value.trim().toLocaleLowerCase("es");
  const emailOk = setFieldError(email, !normalizedEmail ? "El correo es obligatorio." : !validEmail(normalizedEmail) ? "Ingresa un correo con @ y dominio válido." : !state.registeredEmails.includes(normalizedEmail) ? "Correo no registrado. Crea una cuenta para continuar." : "");
  const passwordOk = setFieldError(password, !password.value ? "La contraseña es obligatoria." : password.value.length < 6 ? "La contraseña debe tener al menos 6 caracteres." : "");
  if (!emailOk || !passwordOk) return;
  accessDialog.close();
  showMessage("Sesión iniciada", "Acceso validado correctamente en esta maqueta. La autenticación real se implementaría en el servidor.");
});

document.querySelector("#form-registro").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#registro-nombre");
  const email = document.querySelector("#registro-correo");
  const password = document.querySelector("#registro-clave");
  const nameOk = setFieldError(name, !name.value.trim() ? "El nombre es obligatorio." : "");
  const normalizedEmail = email.value.trim().toLocaleLowerCase("es");
  const emailOk = setFieldError(email, !normalizedEmail ? "El correo es obligatorio." : !validEmail(normalizedEmail) ? "Ingresa un correo con @ y dominio válido." : state.registeredEmails.includes(normalizedEmail) ? "Correo ya registrado. Prueba iniciando sesión." : "");
  const passwordOk = setFieldError(password, !password.value ? "La contraseña es obligatoria." : password.value.length < 6 ? "La contraseña debe tener al menos 6 caracteres." : "");
  if (!nameOk || !emailOk || !passwordOk) return;
  state.registeredEmails.push(normalizedEmail); saveMarketState();
  event.currentTarget.reset(); accessDialog.close();
  showMessage("Cuenta creada", "Registro validado con éxito. Esta maqueta no almacena credenciales reales.");
});

document.querySelector("#abrir-admin").addEventListener("click", () => { accessDialog.close(); adminDialog.showModal(); });
document.querySelector("#form-admin").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#admin-nombre");
  const game = document.querySelector("#admin-juego");
  const rarity = document.querySelector("#admin-rareza");
  const price = document.querySelector("#admin-precio");
  const stock = document.querySelector("#admin-stock");
  const nameOk = setFieldError(name, !name.value.trim() ? "El nombre de la skin es obligatorio." : "");
  const gameOk = setFieldError(game, !game.value ? "Selecciona un juego." : "");
  const rarityOk = setFieldError(rarity, !rarity.value ? "Selecciona una rareza." : "");
  const priceNumber = Number(price.value);
  const stockNumber = Number(stock.value);
  const priceOk = setFieldError(price, price.value.trim() === "" ? "El precio es obligatorio." : !Number.isFinite(priceNumber) || priceNumber < 0 ? "Usa un precio numérico mayor o igual a cero." : "");
  const stockOk = setFieldError(stock, stock.value.trim() === "" ? "El stock es obligatorio." : !Number.isInteger(stockNumber) || stockNumber < 0 ? "Usa un stock entero mayor o igual a cero." : "");
  if (!nameOk || !gameOk || !rarityOk || !priceOk || !stockOk) return;
  const themes = ["orange", "purple", "blue", "green", "pink", "gold"];
  const nextId = Math.max(...skins.map((skin) => skin.id)) + 1;
  skins.push({ id: nextId, name: name.value.trim(), game: game.value, rarity: rarity.value, price: priceNumber, stock: stockNumber, theme: themes[nextId % themes.length], tag: "Nueva", code: `ADM-${String(nextId).padStart(2, "0")} / NEW` }); saveMarketState();
  event.currentTarget.reset(); adminDialog.close(); renderCatalogue();
  showMessage("Skin guardada", "La skin fue agregada al catálogo simulado con precio y stock válidos.");
});

renderCatalogue(); updateHeader(); renderCart(); renderInventory();
