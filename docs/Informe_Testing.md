# Informe de pruebas de SkinMarket

Fecha de ejecución: 24 de noviembre de 2026. Versión 3.3 con foto personalizable y datos de postulación.

## Pruebas frontend

Comando: `npm test` o `npm run test:coverage`. Herramientas: Jasmine, Karma, Chrome Headless y Testing Library. Resultado: **66 pruebas aprobadas, cero fallos**.

| Métrica | Cubierto | Total | Porcentaje |
| --- | --- | --- | --- |
| Líneas | 539 | 622 | 86,65% |
| Sentencias | 645 | 740 | 87,16% |
| Funciones | 236 | 292 | 80,82% |
| Ramas | 583 | 679 | 85,86% |

El umbral configurado es 60% en cada métrica. Se incluye código de páginas, componentes, contexto, cliente HTTP y funciones reutilizables. Se excluyen el arranque main.jsx y los datos estáticos. No se redujo el alcance a una única función para alcanzar el porcentaje.

Se comprueban validaciones de registro y productos, filtros combinados, ordenación, moneda, estadísticas, cliente HTTP, errores, renovación de sesión, contexto asíncrono, carrito, compra, inventario, rutas por rol, formularios de administración y foco del modal. Las respuestas HTTP de estas pruebas se simulan; por eso se complementan con ejecución contra MySQL. La cobertura mide código ejecutado y no garantiza ausencia de errores.

Informe navegable: `coverage/index.html`. Datos: `coverage/coverage-summary.json`. Archivos de pruebas: `tests/*.spec.js` y `tests/*.spec.jsx`.

## Backend

Comando con Java 21: `backend/mvnw.cmd -f backend/pom.xml test` en Windows o `./mvnw test` desde backend en Linux. Pasaron **24 pruebas**. Quince corresponden a autenticación, permisos, perfil, aprobación de vendedor y acceso a Swagger, dos a la API de productos y siete a pedidos.

Las pruebas de integración Spring usan H2 en modo MySQL únicamente como entorno de prueba aislado. Verifican hash BCrypt sin exposición de contraseña, registro inválido, correo duplicado, renovación rotatoria, cierre, autorización ADMIN, protección de origen/cabecera, bloqueo, límite UTF-8 de contraseña, compra, rollback por saldo y stock, idempotencia y acceso a pedidos ajenos. La aplicación en ejecución utiliza MySQL, no H2.

Resultados detallados: `backend/ms-usuarios/target/surefire-reports` y `backend/ms-pedidos/target/surefire-reports`, generados por Maven.

## API con MySQL

Comando: `python scripts/smoke-api.py`, con Compose activo y `.env` privado. Resultado: **62 comprobaciones HTTP aprobadas**, además de aserciones sobre cuerpos y estado. Se comprobó que los ajustes del perfil se recuperen desde MySQL y que el endpoint preserve el rol de la cuenta.

Se comprobó que el cliente puede postular, consultar el rechazo, reenviar la solicitud y recibir el rol tras la aprobación administrativa. La API impide que un cliente revise solicitudes y que un vendedor acceda al carrito, a la gestión de cuentas o a la edición del catálogo. El vendedor aprobado puede consultar el listado y el detalle de órdenes.

Se verificaron registro, login, errores 400/401/403/404/409, CRUD de productos y usuarios, carrito, recarga virtual, compra, inventario, detalle de compra, cierre/renovación y las tres especificaciones OpenAPI. Dos usuarios intentaron comprar simultáneamente la última unidad: se confirmó una sola compra, el stock quedó en cero y el perdedor conservó su saldo. Repetir la clave de la compra ganadora mantuvo un único pedido. Un total enviado por el cliente no sustituyó el precio de MySQL. La baja de producto conservó la instantánea de la compra.

El script crea cuentas y productos QA identificados; se debe ejecutar en una base de pruebas. Esos datos no se incluyen en el respaldo público de entrega.

## Navegador

Se ejecutó `scripts/capture-ui.cjs` con Chrome y Playwright. Se comprobó el registro, la sesión al recargar, la compra, el inventario, la persistencia del perfil y su privacidad, la solicitud del rol, la aprobación y el detalle de orden como vendedor. El recorrido terminó sin errores JavaScript y el catálogo de 390 × 844 conservó el ancho de pantalla. Las capturas están en `docs/screenshots`.

## Compilación, contenedores y respaldo

La compilación de React y los tres servicios finalizó correctamente. Compose levantó MySQL 8.4, Spring Boot y Nginx. El respaldo `database/skinmarket.sql` se restauró en un esquema de verificación con 24 productos, cero cuentas, cero solicitudes y cinco migraciones Flyway.

## Verificación en AWS

La versión integrada se publicó en https://44.200.240.238/ sobre Amazon EC2 en us-east-1. Desde un equipo externo se verificaron el certificado público HTTPS, el catálogo, el registro, la compra, el inventario, la renovación de sesión, la aprobación de vendedor y la restricción de carrito y administración por rol. La cookie de sesión incluyó los atributos Secure y HttpOnly. Chrome mostró correctamente el catálogo público.

En la versión 3.3 se comprobó por HTTPS la carga, persistencia y eliminación de una foto, junto con la fecha de nacimiento, ubicación y preferencias de privacidad. También se comprobó que el cliente pueda enviar los datos de estudios y ubicación y que solo el administrador pueda revisar y aprobar la solicitud completa. La cuenta obtuvo acceso al panel después de la aprobación.
