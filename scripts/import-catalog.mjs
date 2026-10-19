import { mkdir, writeFile } from "node:fs/promises";

const source =
  "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json";
const response = await fetch(source);
if (!response.ok) throw new Error(`Catálogo: HTTP ${response.status}`);
const skins = await response.json();
const selection = [
  ["AWP | Dragon Lore", 8450],
  ["AK-47 | Fire Serpent", 3200],
  ["M4A4 | Howl", 6900],
  ["Karambit | Doppler", 5750],
  ["Desert Eagle | Printstream", 420],
  ["M4A1-S | Hyper Beast", 280],
  ["M4A1-S | Black Lotus", 235],
  ["Glock-18 | Gamma Doppler", 310],
  ["USP-S | Printstream", 290],
  ["AWP | Neo-Noir", 260],
  ["AK-47 | Ice Coaled", 175],
  ["MAC-10 | Neon Rider", 120],
  ["AK-47 | Asiimov", 180],
  ["AWP | Asiimov", 150],
  ["M4A4 | The Emperor", 95],
  ["AK-47 | Redline", 48],
  ["USP-S | Kill Confirmed", 125],
  ["Desert Eagle | Blaze", 750],
  ["Glock-18 | Water Elemental", 25],
  ["P90 | Asiimov", 35],
  ["SSG 08 | Dragonfire", 22],
  ["MP9 | Food Chain", 12],
  ["FAMAS | Commemoration", 18],
  ["Butterfly Knife | Fade", 2900],
];
const categoryName = (s) =>
  /knife|karambit|bayonet/i.test(s.weapon.name)
    ? "Cuchillos"
    : {
        Pistols: "Pistolas",
        Rifles: "Rifles",
        SMGs: "Subfusiles",
        Heavy: "Pesadas",
      }[s.category.name] || s.category.name;
await mkdir("src/data", { recursive: true });
await mkdir("public/images/skins", { recursive: true });
const products = [];
for (const [name, price] of selection) {
  const skin = skins.find((s) => s.name.replace("★ ", "") === name);
  if (!skin) throw new Error(`Skin no encontrada: ${name}`);
  const imageResponse = await fetch(skin.image);
  if (!imageResponse.ok) throw new Error(`Imagen: ${skin.name}`);
  const image = `images/skins/${skin.id}.png`;
  await writeFile(
    `public/${image}`,
    new Uint8Array(await imageResponse.arrayBuffer()),
  );
  products.push({
    id: skin.id,
    name: skin.name.replace("★ ", ""),
    weapon: skin.weapon.name,
    finish: skin.pattern?.name || name.split(" | ")[1],
    category: categoryName(skin),
    rarity: skin.rarity.name,
    color: skin.rarity.color,
    price,
    stock: products.length === 10 ? 0 : (products.length % 8) + 1,
    image,
    collection: skin.collections?.[0]?.name || "Colección especial",
    wear: "Factory New",
    featured: products.length < 6,
  });
}
await writeFile(
  "src/data/catalog.json",
  JSON.stringify(products, null, 2) + "\n",
);
await writeFile(
  "src/data/source.json",
  JSON.stringify(
    {
      source,
      importedAt: new Date().toISOString(),
      note: "Datos de ByMykel/CSGO-API. Imágenes de Counter-Strike, propiedad de sus respectivos titulares. Precios y stock ficticios.",
    },
    null,
    2,
  ) + "\n",
);
console.log(`Importadas ${products.length} skins con imágenes locales.`);
