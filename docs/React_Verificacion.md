# Verificación de SkinMarket Pro (React)

Fecha: 19 de octubre de 2026.

## Resultado

- `npm run test:coverage`: 29 pruebas aprobadas en seis archivos.
- Líneas: 95,9% (492/513).
- Sentencias: 95,98% (550/573).
- Funciones: 95,29% (223/234).
- Ramas: 95,85% (532/555).
- Mínimo configurado: 60% en cada métrica. Las páginas y componentes también se instrumentan.
- `npm run build`: compilación de producción correcta; archivos en `dist/`.
- Herramientas de pruebas: Jasmine + Karma, ejecutadas en Google Chrome Headless.
- `npm audit`: la cadena de herramientas de pruebas presenta 9 avisos (5 moderados y 4 altos), en dependencias transitivas de desarrollo. No se aplicó `--force` porque propone cambios incompatibles. Revisar con `npm audit`; estos paquetes no se incluyen en el sitio compilado.

La cobertura se calcula sobre `src/**/*.{js,jsx}`, excluyendo `src/main.jsx` (montaje) y `src/data/**` (datos estáticos). Se incluyen App, componentes, contexto, validadores, filtros y transacciones. Reporte reproducible: `npm run test:coverage`, luego abrir `coverage/index.html`.

## Qué comprueban las pruebas

1. Registro con correo único, nombre mínimo y contraseña de seis caracteres.
2. Login compara ambas credenciales; restaura y cierra la sesión.
3. Clientes no pueden ejecutar operaciones administrativas.
4. Filtros combinados, ordenamiento, búsquedas y límites de precio; máximo cero se respeta.
5. Carrito con cantidades, eliminación de líneas y control de stock.
6. Compra exitosa: actualiza stock/saldo y conserva inventario e historial por usuario.
7. Compra rechazada sin sesión, sin saldo, con carrito vacío o stock insuficiente.
8. CRUD completo, validación numérica, confirmación de eliminación y restauración de datos.
9. Persistencia y recuperación frente a JSON inválido o almacenamiento bloqueado.
10. Presentación de dinero en USD y CLP.
11. Navegación, rutas protegidas y vista 404.
12. Modales: foco atrapado, Escape, cierre y devolución de foco.
13. Agregación de ventas diarias, top skins, stock y estados sin datos.
14. Edición de nombre, correo y rol; correo duplicado, permisos y protección de la cuenta administrativa actual.
15. Bloqueo y desbloqueo persistente, rechazo de login/compra y sincronización entre pestañas.
16. Generación de identificadores compatible con el endpoint HTTP del alojamiento estático de S3.

## Comprobación en navegador

Se revisaron visualmente portada de escritorio y móvil. Se realizó login como cliente, se agregó una AWP Dragon Lore al carrito, se confirmó la compra y se verificó que apareciera en el inventario con el saldo actualizado. Al recargar, se conservó la sesión y el estado de la compra. La compra usó exclusivamente saldo virtual.

El sitio se publicó en Amazon S3 el 19 de octubre de 2026. La compilación usa rutas hash y recursos relativos. El enlace HTTPS y la comprobación de registro, login, compras y CRUD sobre el sitio publicado están documentados en `Guion_Demostracion.md`.

## Notas para la presentación

- `karma.conf.cjs` configura Jasmine, Chrome, transformación JSX con Webpack/Babel y cobertura Istanbul (mínimo 60% en cada métrica). `tests/entry.js` carga los módulos de aplicación y los seis archivos de pruebas.
- Los mocks usan `jasmine.createSpy` y `spyOn`; los matchers DOM se registran con `jasmine.addMatchers` en `tests/setup.js`. Testing Library se utiliza para renderizar componentes y simular interacción.
- Bootstrap se importa antes de los estilos propios en `src/main.jsx`. El catálogo usa `row`, `col` y `row-cols-*` para mostrar 2/3/4/6 columnas según el ancho. Acceso usa `col-12 col-lg-6` para apilar o dividir sus paneles. Los campos de acceso usan `form-control`, `is-invalid` e `invalid-feedback`.
- `src/bootstrap-theme.css` mantiene colores y tipografía sin reemplazar los anchos responsivos de Bootstrap. El resto de la interfaz conserva estilos propios.
- La actualización de Bootstrap fue publicada en S3 y comprobada en Chrome a 1536, 768 y 390 px. El menú, los filtros móviles y el editor administrativo fueron revisados. El informe completo está en `Informe_Testing.md` y `../output/pdf/SkinMarket_Informe_Testing.pdf`.
- El botón Cliente o Administrador completa credenciales; aún hay que pulsar Entrar.
- El catálogo y sus imágenes iniciales están incluidos localmente. No hace falta consultar la API para abrirlo.
- 1 USD equivale a 950 CLP como tasa fija de demostración, no como tipo de cambio de mercado.
- Cada navegador conserva sus propios usuarios y compras; no hay sincronización entre equipos.
- Autenticación y permisos locales son una simulación académica y no protecciones de servidor.
- Los DOCX anteriores corresponden a la versión HTML/JS de `legacy/`; consultar el README y el código React para esta versión.
