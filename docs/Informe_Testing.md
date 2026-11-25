# Informe de pruebas de SkinMarket

Fecha de ejecución: 24 de noviembre de 2026. Incluye perfil, postulación, recargas configurables y publicaciones del vendedor.

## Pruebas frontend

Comando: `npm test` o `npm run test:coverage`. Herramientas: Jasmine, Karma, Chrome Headless y Testing Library. Resultado: **70 pruebas aprobadas, cero fallos**.

| Métrica | Cubierto | Total | Porcentaje |
| --- | --- | --- | --- |
| Líneas | 641 | 726 | 88,29% |
| Sentencias | 758 | 860 | 88,13% |
| Funciones | 275 | 332 | 82,83% |
| Ramas | 650 | 764 | 85,07% |

El umbral configurado es 60% en cada métrica. Se incluye código de páginas, componentes, contexto, cliente HTTP y funciones reutilizables. Se excluyen el arranque main.jsx y los datos estáticos. No se redujo el alcance a una única función para alcanzar el porcentaje.

Se comprueban validaciones de registro y productos, filtros combinados, ordenación, moneda, estadísticas, cliente HTTP, errores, renovación de sesión, contexto asíncrono, carrito, compra, inventario, rutas por rol, formularios de administración y foco del modal. Las respuestas HTTP de estas pruebas se simulan; por eso se complementan con ejecución contra MySQL. La cobertura mide código ejecutado y no garantiza ausencia de errores.

Informe navegable: `coverage/index.html`. Datos: `coverage/coverage-summary.json`. Archivos de pruebas: `tests/*.spec.js` y `tests/*.spec.jsx`.

## Backend

Comando con Java 21: `backend/mvnw.cmd -f backend/pom.xml test` en Windows o `./mvnw test` desde backend en Linux. Pasaron **24 pruebas**. Quince corresponden a autenticación, permisos, perfil, aprobación de vendedor y acceso a Swagger, dos a la API de productos y siete a pedidos.

Las pruebas de integración Spring usan H2 en modo MySQL únicamente como entorno de prueba aislado. Verifican hash BCrypt sin exposición de contraseña, registro inválido, correo duplicado, renovación rotatoria, cierre, autorización ADMIN, protección de origen/cabecera, bloqueo, límite UTF-8 de contraseña, compra, rollback por saldo y stock, idempotencia y acceso a pedidos ajenos. La aplicación en ejecución utiliza MySQL, no H2.

Resultados detallados: `backend/ms-usuarios/target/surefire-reports` y `backend/ms-pedidos/target/surefire-reports`, generados por Maven.

## API con MySQL

Comando: `python scripts/smoke-api.py`, con Compose activo y `.env` privado. Resultado: **118 comprobaciones HTTP aprobadas**, además de aserciones sobre cuerpos y estado. Los ajustes del perfil se recuperan desde MySQL y el endpoint preserva el rol de la cuenta. Solo ADMIN puede editar el precio de una recarga. El servidor rechaza los precios obsoletos y evita acreditar dos veces una misma solicitud.

Se verificó la aprobación de vendedores y el límite de unidades adquirido por lote. Un vendedor no pudo publicar un lote ajeno, modificar publicaciones ajenas ni comprar su propia oferta. En una compra con dos vendedores, cada uno recibió solo sus líneas y su subtotal. La edición y el retiro de una publicación conservaron los importes históricos. Un vendedor pudo comprar en el catálogo y elegir esa skin para publicar.

Se verificaron registro, login, errores 400/401/403/404/409, CRUD de productos y usuarios, carrito, recarga virtual, compra, inventario, detalle de compra, cierre/renovación y las tres especificaciones OpenAPI. Dos usuarios intentaron comprar simultáneamente la última unidad: se confirmó una sola compra, el stock quedó en cero y el perdedor conservó su saldo. Repetir la clave de la compra ganadora mantuvo un único pedido. Un total enviado por el cliente no sustituyó el precio de MySQL. La baja de producto conservó la instantánea de la compra.

El script crea cuentas y productos QA identificados; se debe ejecutar en una base de pruebas. Esos datos no se incluyen en el respaldo público de entrega.

## Navegador

Se ejecutó `scripts/capture-ui.cjs` con Chrome y Playwright. Se comprobó el registro, la sesión al recargar, la compra, el perfil, la aprobación del vendedor, la selección de una skin de su inventario, su publicación, la compra desde otra cuenta y el detalle de la venta. El catálogo y el panel de vendedor se revisaron a 390 × 844. Las capturas están en `docs/screenshots`.

La prueba de interfaz comprobó que el modal presenta cuatro paquetes con precio en USD y CLP y acredita el saldo fijo del paquete elegido. El avatar abre el selector de imágenes y la solicitud a vendedor se alcanza desde Mi perfil. El perfil y la solicitud cargaron su fondo difuminado, quedaron centrados y no desbordaron a 390, 768 ni 1440 px.

## Compilación, contenedores y respaldo

La compilación de React y los tres servicios finalizó correctamente. Compose levantó MySQL 8.4, Spring Boot y Nginx. El respaldo `database/skinmarket.sql` se restauró en un esquema de verificación con 24 productos, cuatro paquetes, cero cuentas, cero ventas de reventa y siete migraciones Flyway.

## Verificación en AWS

La versión integrada se publicó en https://44.200.240.238/ sobre Amazon EC2 en us-east-1. El sitio usa HTTPS y una cookie de sesión con atributos Secure y HttpOnly.

En la versión 3.3 se comprobó por HTTPS la carga, persistencia y eliminación de una foto, junto con la fecha de nacimiento, ubicación y preferencias de privacidad. También se comprobó que el cliente pueda enviar los datos de estudios y ubicación y que solo el administrador pueda revisar y aprobar la solicitud completa. La cuenta obtuvo acceso al panel después de la aprobación.
