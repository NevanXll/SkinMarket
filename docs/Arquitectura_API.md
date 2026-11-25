# APIs e integración de SkinMarket

## Recorrido de una solicitud

React consume `/api/v1` mediante `src/services/api.js`. Nginx o el proxy de Vite envía autenticación/usuarios a ms-usuarios, productos a ms-productos y carrito/pedidos a ms-pedidos. Los controladores validan DTO, los servicios aplican reglas y los repositorios JPA acceden a MySQL. Una respuesta fallida se convierte en un aviso visible; el frontend no confirma una acción antes de recibir la respuesta.

La estructura toma como referencia las capas controller/service/repository/model de RestaurantEV2 y la separación entre productos y pedidos del ejemplo docente. El proxy HTTP dirige las rutas a tres aplicaciones Spring Boot que comparten MySQL.

En `ms-productos`, el paquete `controller` define los endpoints del catálogo, `dto/ProductInput` contiene los campos y validaciones de alta y edición, y `service/ProductService` aplica las reglas del catálogo. `Product` y su repositorio permanecen en `common` porque pedidos también los usa para validar y actualizar el stock al confirmar una compra.

## Seguridad

- Registro público crea exclusivamente CLIENTE; enviar un campo role no concede privilegios.
- BCrypt con coste 12; contraseña mínima de seis caracteres y máximo de 72 bytes UTF-8.
- JWT HS256 firmado con secreto de entorno, emisor skinmarket, expiración de 15 minutos y versión de autorización.
- Cookie sm_refresh HttpOnly, SameSite=Strict, ruta /api/v1/auth, siete días y Secure en producción. La BD conserva su hash, no el token original. Cada renovación consume la sesión anterior y crea otra.
- Cada petición autenticada consulta la cuenta para aplicar bloqueo, rol vigente y revocación por versión. Cambiar correo, rol o bloqueo invalida las sesiones anteriores.
- CORS permite orígenes configurados. Los POST de autenticación requieren cabecera no simple X-Requested-With: SkinMarket y Origin permitido. Las demás operaciones autenticadas usan Bearer, sin autorización por cookie.
- Cerrar sesión revoca el refresh. Un acceso ya emitido dura hasta su vencimiento de 15 minutos, salvo bloqueo o cambio de versión, que lo invalida antes.

## Endpoints

Prefijo `/api/v1`. Respuestas de error incluyen `message`; errores de campos incluyen `errors`. 400: entrada inválida; 401: sin sesión válida; 403: permisos; 404: recurso inexistente; 409: conflicto de stock, saldo, correo o integridad. 201 crea con Location; 204 elimina sin cuerpo.

| Método y ruta | Acceso | Respuesta |
| --- | --- | --- |
| POST /auth/register | Público | 201, usuario y accessToken; cookie refresh |
| POST /auth/login | Público | 200, usuario y accessToken; cookie refresh |
| POST /auth/refresh | Cookie y cabecera de seguridad | 200, token renovado |
| POST /auth/logout | Cookie y cabecera de seguridad | 204 |
| GET /me | Autenticado | 200, perfil sin contraseña |
| GET /products | Público | 200, catálogo activo |
| GET /products/{id} | Público | 200 o 404 |
| POST /products | ADMIN | 201 |
| PUT /products/{id} | ADMIN | 200 |
| DELETE /products/{id} | ADMIN | 204, baja lógica |
| GET/POST /admin/users | ADMIN | 200 lista / 201 creación |
| GET/PUT/DELETE /admin/users/{id} | ADMIN | 200 detalle/edición o 204 eliminación |
| GET /cart | Autenticado | 200, carrito propio |
| PUT /cart/{productId} | Autenticado | 200; quantity=0 elimina línea |
| POST /wallet/top-up | Autenticado | 200, recarga virtual entre 0,01 y 100.000 USD |
| POST /orders | Autenticado | 201, compra con requestKey |
| GET /orders | Autenticado | 200, compras propias |
| GET /orders/{id} | Dueño o ADMIN | 200; impide acceso a compras ajenas |
| GET /inventory | Autenticado | 200, skins adquiridas |
| GET /admin/orders | ADMIN | 200, pedidos para estadísticas |
| GET /seller-application | CLIENTE o VENDEDOR | 200, solicitud actual, o 204 si todavía no existe |
| POST /seller-application | CLIENTE | 201, solicitud pendiente. Otra solicitud pendiente devuelve 409 |
| GET /admin/seller-applications | ADMIN | 200, solicitudes para revisión |
| PUT /admin/seller-applications/{userId} | ADMIN | 200, aprobación o rechazo. El rechazo exige un motivo |
| GET /seller/orders | VENDEDOR o ADMIN | 200, lista de órdenes |
| GET /seller/orders/{id} | VENDEDOR o ADMIN | 200, detalle de la orden |

## Postulación a vendedor

El cliente describe las skins que quiere vender y el motivo de la solicitud. El servidor registra la cuenta autenticada como titular, guarda la solicitud pendiente y permite consultarla. El administrador revisa el formulario desde Administración. La aprobación cambia el rol de la cuenta a VENDEDOR en la misma transacción que actualiza el estado de la solicitud. Si se rechaza, el cliente puede conocer el motivo y volver a postular.

Spring Security lee el rol vigente desde la cuenta en cada petición autenticada. Al actualizar el estado, React consulta el perfil y habilita el panel de solo lectura con productos y órdenes. La postulación registra la declaración de skins del usuario. La revisión decide el acceso al rol.

## Compra y consistencia

OrderService.checkout abre una transacción. Bloquea la cuenta y después los productos en orden de identificador. Comprueba si la requestKey ya tiene pedido y devuelve ese pedido sin cobrar otra vez. Si el carrito está vacío, falta producto, no hay stock o el saldo no alcanza, responde 409 sin modificar la compra. Calcula el total con BigDecimal desde precios de MySQL, descuenta stock y saldo, crea la compra y vacía el carrito. Un fallo revierte todo.

El historial guarda items_json con nombre, precio, imagen y cantidad de cada producto al comprar. El inventario se obtiene de esos pedidos. La baja de un producto elimina sus líneas de carrito y conserva los pedidos anteriores. La eliminación de una cuenta con pedidos se rechaza por integridad; el administrador puede bloquearla. No puede eliminarse ni retirarse su propio rol o bloquearse. Debe conservarse un ADMIN activo.

## Tablas

| Tabla | Datos principales y relaciones |
| --- | --- |
| accounts | id, nombre, email único, password_hash, rol, bloqueo, saldo, auth_version y version optimista |
| products | id, nombre, categoría, precio, stock, metadatos, imagen, deleted y version |
| cart_items | usuario y producto con FK, cantidad positiva, combinación única |
| purchases | FK usuario, fecha, total decimal, copia de artículos, request_key única por usuario |
| refresh_sessions | hash de token, FK usuario, expiración y versión de autorización |
| seller_applications | FK y clave por usuario, descripción de skins, motivo, estado y datos de revisión |
| flyway_schema_history | Migraciones SQL aplicadas |

Flyway V1 crea el esquema, V2 carga 24 productos iniciales y V3 incorpora el rol VENDEDOR y sus solicitudes. El catálogo visible en React proviene de la API REST. Los JSON de `src/data` sirven al importador y a las pruebas.

## Ubicación de validaciones

Validaciones visuales: `src/lib/market.js` (validateAuth y validateProduct), `src/lib/admin.js` (validateAccount), `src/pages/Catalogue.jsx` (búsqueda y rangos). Validaciones autoritativas: `backend/common/.../dto/Requests.java`, SecurityConfig, AuthService, UserService, ProductService y OrderService. Las restricciones CHECK, UNIQUE y FOREIGN KEY completan la integridad en MySQL.

## Pruebas de integración y resultados

El 24 de noviembre de 2026 se ejecutaron 58 comprobaciones HTTP desde el proxy local hacia los servicios Spring Boot y MySQL 8.4. El recorrido verificó autenticación, CRUD, renovación, compra, rechazo y aprobación de solicitudes, consulta de órdenes y restricciones por rol. La prueba de concurrencia confirmó que una sola petición compra la última unidad y el reintento con la misma clave devuelve el pedido ya guardado.

El recorrido en navegador comprobó que React recupera la sesión al recargar y muestra los datos guardados en MySQL al abrir el inventario. Tras aprobar la postulación, la sesión de vendedor muestra las vistas de productos y órdenes. El informe de pruebas detalla los comandos, sus resultados y el alcance local.

La versión publicada en EC2 está disponible en https://44.200.240.238/. El proxy Caddy recibe HTTPS, luego Nginx sirve React y dirige las peticiones REST a los servicios Spring Boot. MySQL permanece en la red interna de Compose. Se verificaron desde fuera de EC2 el catálogo, el flujo de compra, la renovación de sesión y la aprobación de vendedor.
