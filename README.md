# SkinMarket Pro

Tienda de skins de CS2 con React, Bootstrap, tres servicios Spring Boot y MySQL. El servidor conserva las cuentas, el catálogo, los carritos, las compras y las postulaciones a vendedor. Las compras usan saldo virtual.

## Ejecutar todo con Docker

Requisitos: Docker Desktop o Docker Engine con Compose. Copia `.env.example` a `.env` y cambia las contraseñas y el secreto JWT (mínimo 32 bytes). El archivo `.env` queda fuera de Git.

```bash
docker compose up -d --build
```

Abre **http://localhost:8080**. El primer inicio descarga las imágenes, compila y crea la base mediante Flyway. El administrador inicial se crea con `BOOTSTRAP_ADMIN_EMAIL` y `BOOTSTRAP_ADMIN_PASSWORD` cuando no hay un administrador activo. Los clientes se registran desde la web; no hay cuentas ni contraseñas incorporadas al frontend.

```bash
docker compose ps
docker compose logs --tail 50 ms-usuarios
docker compose stop
```

MySQL conserva los datos en el volumen `mysql-data`. Detener o reconstruir los contenedores no borra ese volumen.

## Desarrollo React

Con el backend Docker funcionando, instala Node 22.18+ o 24.11+:

```bash
npm ci
npm run dev
```

Vite publica su URL en la terminal y redirige `/api/v1` a los servicios locales. `VITE_API_BASE_URL` permite configurar otro prefijo público de API. No colocar secretos en variables `VITE_*`. Para compilar: `npm run build`.

## Estructura

| Carpeta | Responsabilidad |
| --- | --- |
| `src/pages`, `src/components` | Vistas React y componentes Bootstrap |
| `src/services/api.js` | Fetch, mensajes HTTP y renovación de sesión |
| `src/context/MarketContext.jsx` | Estado React y operaciones asíncronas contra REST |
| `src/lib` | Validaciones visuales, filtros y estadísticas |
| `backend/ms-usuarios` | Registro, login, refresh y CRUD administrativo de usuarios; puerto 8081 |
| `backend/ms-productos` | CRUD de productos; puerto 8082 |
| `backend/ms-pedidos` | Carrito, billetera virtual, compra e inventario; puerto 8083 |
| `backend/common` | Entidades JPA, repositorios, seguridad, DTO y migraciones |
| `deploy` | Proxy Nginx y guía de despliegue |
| `tests` | Jasmine/Karma para reglas, HTTP, contexto e interfaz |
| `docs` | ERS, arquitectura, manual, colección Postman y pruebas |
| `legacy` | Maqueta HTML inicial de referencia |

Cada servicio organiza su código por controller y service. La biblioteca common concentra model, repository, dto, exception y security. Los servicios son aplicaciones independientes que comparten una base MySQL para confirmar saldo, stock y pedido en una transacción ACID. Es una simplificación académica; no son microservicios con bases aisladas.

## Seguridad y compras

BCrypt protege las contraseñas en MySQL. JWT de acceso dura 15 minutos y se mantiene en memoria. La renovación usa un token opaco rotativo de siete días en cookie HttpOnly, con hash SHA-256 en la BD. En producción requiere HTTPS y `COOKIE_SECURE=true`. Los endpoints de autenticación exigen `X-Requested-With: SkinMarket` y validan Origin; CORS usa una lista explícita. Spring Security comprueba el rol vigente y el estado de la cuenta en cada solicitud autenticada.

Un cliente puede postular desde **Vender skins**. El administrador revisa la solicitud en **Administración → Solicitudes de vendedor**. La aprobación habilita el rol VENDEDOR y su panel de consulta de productos y órdenes.

El servidor valida datos con Bean Validation, obtiene precios desde MySQL y comprueba saldo y stock. Bloquea las filas durante la compra y usa una clave de solicitud para impedir un doble cargo al reintentar. Los pedidos guardan una copia del producto comprado. Eliminar un producto lo retira del catálogo y conserva el historial. Las cuentas con compras no se eliminan; se pueden bloquear.

`localStorage` solo conserva la moneda preferida. 1 USD = 950 CLP es una tasa académica de presentación; precios y operaciones internas usan USD. No se procesan pagos reales ni intercambios con Steam.

## Pruebas y API

```bash
npm test
npm run test:coverage
cd backend
./mvnw test
```

En Windows, usa `mvnw.cmd test`. Se requiere JDK 21 para las pruebas Java. El informe frontend se genera en `coverage/index.html`; el umbral es 60% en líneas, sentencias, ramas y funciones. Las pruebas Java usan H2 solo en test. `python scripts/smoke-api.py` verifica las APIs reales con Docker/MySQL y genera datos QA identificados.

Swagger: http://localhost:8080/api/v1/usuarios/swagger-ui.html. Para productos y pedidos cambia `usuarios` por `productos` o `pedidos`. Importa `docs/postman/SkinMarket.postman_collection.json` y el entorno de ejemplo; introduce credenciales privadas en Postman.

## Documentación y entrega

- `docs/ERS_SkinMarket_FullStack.md`: requisitos actuales.
- `docs/Arquitectura_API.md`: componentes, tablas, endpoints y reglas.
- `docs/Manual_Usuario.md`: uso y demostración.
- `docs/Informe_Testing.md`: resultados y alcance de las pruebas.
- `deploy/README.md`: despliegue, configuración y respaldo.
- `database/skinmarket.sql`: respaldo de estructura y catálogo, sin cuentas ni sesiones privadas.

El despliegue de esta versión full stack debe ejecutarse en un servidor con Java/Docker y MySQL. El alojamiento S3 de la maqueta anterior no ejecuta estos servicios. La URL pública de esta versión queda pendiente hasta configurar el servidor de la nube.

Los DOCX y la ERS V2 conservados en el repositorio describen versiones anteriores; para esta entrega usa la documentación FullStack. Los datos iniciales del catálogo proceden de [ByMykel/CSGO-API](https://github.com/ByMykel/CSGO-API); las imágenes pertenecen a sus titulares. Precios y stock son ficticios. Referencias de estructura: [RestaurantEV2](https://github.com/Fideito14/RestaurantEV2) y [dsy1104_microservicios](https://github.com/jesvargasf/dsy1104_microservicios).
