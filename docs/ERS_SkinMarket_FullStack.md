# Especificación de requisitos de SkinMarket Pro

Versión 3.4 · React, Spring Boot y MySQL · 24 de noviembre de 2026.

## 1. Introducción

### 1.1 Propósito

Este documento define el comportamiento y las restricciones de SkinMarket Pro, una tienda de skins de Counter-Strike 2 con compras simuladas. Está dirigido a quienes desarrollan, mantienen o prueban la aplicación.

### 1.2 Alcance

SkinMarket permite consultar productos, crear cuentas, iniciar sesión, usar un carrito y adquirir skins con saldo virtual. Los administradores gestionan productos y usuarios y consultan estadísticas de pedidos. React presenta la interfaz, Spring Boot aplica las reglas y MySQL conserva los datos compartidos entre equipos. No se incluyen transacciones de dinero real, acceso a Steam, transferencia de objetos reales ni cotizaciones en vivo. USD/CLP utiliza una tasa de demostración.

### 1.3 Definiciones

Skin: apariencia digital de un objeto del juego. CRUD: crear, leer, actualizar y eliminar. API REST: interfaz HTTP orientada a recursos. JWT: token firmado que identifica una sesión de acceso. BCrypt: función de hash de contraseñas con coste configurable. DTO: objeto de entrada/salida validado. ADMIN y CLIENTE: roles del sistema. Inventario: vista de artículos adquiridos. Transacción: conjunto de operaciones que se confirman o revierten en conjunto.

### 1.4 Referencias

ByMykel/CSGO-API proporciona los datos e imágenes iniciales del catálogo. La arquitectura y los contratos REST se describen en Arquitectura_API.md. El informe Informe_Testing.md registra las pruebas realizadas.

### 1.5 Organización

La sección 2 define actores, contexto y límites. La sección 3 especifica interfaces, funciones, reglas y atributos de calidad. Los anexos describen los casos de uso y cómo verificar los requisitos.

## 2. Descripción general

### 2.1 Perspectiva

La interfaz web usa React y Bootstrap. Un proxy conecta la web con tres aplicaciones Spring Boot que manejan cuentas y sesiones, productos y pedidos. Estas comparten una base MySQL para confirmar compras de forma atómica. La web y la API usan el mismo origen.

### 2.2 Actores

Visitante: consulta catálogo y detalle, se registra e inicia sesión. CLIENTE: usa su carrito, recarga saldo virtual, compra, consulta su inventario e historial y puede postular a vendedor. VENDEDOR: conserva las funciones de compra y gestiona sus propias publicaciones y ventas. ADMIN: dispone de las funciones de compra, administra productos y cuentas, revisa postulaciones y consulta pedidos agregados. El servidor comprueba roles y bloqueos en cada solicitud protegida.

### 2.3 Restricciones y dependencias

El servicio requiere conectividad con la API y MySQL. Docker Compose permite ejecutarlo localmente. El acceso público requiere un servidor en ejecución y un proxy configurado con HTTPS. Los recursos visuales locales se incluyen en la compilación. El backend utiliza Java 21 y la compilación de React usa Node.js y npm.

### 2.4 Suposiciones y evolución

El administrador inicial se crea mediante configuración privada cuando no existe un ADMIN activo. Cada registro obtiene saldo virtual inicial para realizar pruebas. El usuario utiliza un navegador compatible con JavaScript y cookies. Son ampliaciones futuras: pagos reales, integración Steam, recuperación de contraseña, verificación de correo, paginación en servidor y separación de bases con coordinación distribuida.

## 3. Requisitos específicos

### 3.1 Interfaces

Interfaz de usuario: Home, Mercado, detalle, Acceso, Carrito, Inventario, Mis compras y Administración. Navegación accesible desde todas las vistas; adaptación móvil, tableta y escritorio; campos con etiqueta y errores visibles. Interfaz software: JSON mediante HTTP REST con prefijo /api/v1; Java/Spring Boot y JPA con MySQL. Comunicación: HTTPS en la nube, Bearer para acceso y cookie HttpOnly para renovación; orígenes CORS configurados. Hardware: equipo con navegador para clientes y servidor con recursos suficientes para tres JVM, MySQL y proxy.

### 3.2 Requisitos funcionales

RF-01 Registro. El visitante ingresa nombre, email y contraseña. El sistema exige nombre de 3 a 100 caracteres, email válido y único, contraseña de 6 caracteres como mínimo y máximo 72 bytes UTF-8. Guarda hash BCrypt, rol CLIENTE y saldo virtual inicial; devuelve 201 e inicia sesión. Datos inválidos: 400 con errores; correo duplicado: 409. El cliente no puede asignarse rol ADMIN mediante registro.

RF-02 Autenticación. El sistema compara la contraseña recibida con BCrypt; no entrega hashes al frontend. Cuenta inexistente, contraseña incorrecta o bloqueo producen rechazo. Un acceso válido entrega JWT con vigencia de 15 minutos y cookie de renovación de siete días. La renovación rota el token opaco almacenado en forma de hash. El cierre revoca la renovación y elimina la sesión visible. Bloqueo o cambio de versión invalidan el acceso existente.

RF-03 Autorización. ADMIN gestiona usuarios, modifica productos y revisa postulaciones. Las compras y los recursos personales de la tienda se habilitan a los roles con sesión activa. El panel de publicaciones y ventas propias se habilita a VENDEDOR. La API devuelve 401 cuando falta autenticación y 403 cuando el rol es insuficiente.

RF-04 Catálogo. El visitante lista y consulta el detalle de productos activos provenientes de MySQL. Puede filtrar por texto, categoría, rareza, colección, exterior y rango de precios y ordenar por precio o nombre. La búsqueda elimina caracteres no admitidos; precios de filtro no negativos y mínimo no mayor al máximo. Producto inexistente o retirado: 404. Si la API falla, se informa el error sin sustituirla por catálogo estático.

RF-05 Gestión de productos. ADMIN crea, consulta, edita y elimina productos. Se exige nombre válido, categoría, rareza, precio no negativo con hasta dos decimales, stock entero no negativo e imagen HTTPS o local válida. Crear: 201 y Location; editar: 200; eliminar: 204. La eliminación es lógica y retira líneas de carrito; el historial conserva los datos comprados.

RF-06 Gestión de usuarios. ADMIN crea, lista, consulta, edita y elimina cuentas. Al crear exige correo único, nombre válido, rol ADMIN o CLIENTE y contraseña válida. Su panel permite filtrar y gestionar las cuentas VENDEDOR. El rol VENDEDOR se concede al aprobar una solicitud. Las reglas de integridad protegen el historial y la última cuenta ADMIN activa.

RF-07 Carrito. Usuario autenticado añade productos y modifica cantidades enteras no negativas; cantidad cero elimina la línea. No acepta cantidades mayores al stock disponible. El carrito se guarda por cuenta en MySQL y se recupera desde otro equipo al iniciar sesión.

RF-08 Compra. El servidor recibe una clave de petición, valida cuenta, carrito, stock y saldo y calcula el total desde precios de la base. Usa BigDecimal y una transacción para crear pedido, descontar saldo y stock y vaciar carrito. Si falla una validación, no aplica cambios parciales. Una repetición con la misma clave devuelve la compra previa sin otro cargo. Concurrencia sobre la última unidad permite una compra ganadora; las demás reciben conflicto.

RF-09 Inventario e historial. El usuario consulta sus pedidos y artículos adquiridos persistidos. Cada compra conserva instantánea de productos, cantidades, fecha y total. La baja posterior de una skin no modifica el historial.

RF-10 Billetera y moneda. La web ofrece cuatro paquetes de saldo virtual. ADMIN puede modificar únicamente el precio simulado de cada paquete, entre 0,01 y 100.000 USD y con hasta dos decimales. MySQL guarda los precios en USD. La interfaz los muestra en USD y CLP a una tasa fija de 950. Si el precio cambia antes de confirmar, el usuario debe volver a seleccionar el paquete. Reintentar una solicitud confirmada con la misma clave no duplica la recarga. La operación no realiza cobros. La preferencia de moneda es el único dato funcional guardado en localStorage.

RF-11 Dashboard. ADMIN consulta ventas totales, cantidad de pedidos, unidades, ticket promedio y cuentas bloqueadas; gráficos por día, stock por categoría y productos vendidos. Las recargas no se incluyen como ventas. Sin compras muestra estado vacío; no genera ventas ficticias.

RF-12 Errores y persistencia. Toda operación confirmada permanece tras recargar o reiniciar servicios conservando el volumen MySQL. La interfaz informa éxito, validación, falta de permisos, conflicto o desconexión. No almacena contraseñas, JWT de acceso ni bases de usuarios en localStorage.

RF-13 Solicitud del rol Vendedor. Un CLIENTE autenticado indica su motivo, si estudia, país, estado o región y ciudad. Puede añadir experiencia, institución educativa y código postal según corresponda. El servidor persiste la solicitud visible para el titular y ADMIN. La aprobación registra la decisión y asigna VENDEDOR en una transacción. El rechazo exige una explicación y permite un nuevo envío.

RF-14 Publicaciones y ventas. VENDEDOR selecciona una skin adquirida con su cuenta, fija precio en USD y cantidad. Puede editar o pausar la publicación dentro de su disponibilidad. Una compra descuenta stock, acredita la skin en el inventario de la cuenta compradora y registra las líneas de venta correspondientes. El historial conserva su precio original. El panel muestra importe vendido, pedidos, unidades, publicaciones activas y ventas de siete días. Cada vendedor solo consulta sus propias líneas.

RF-15 Perfil. Cada cuenta autenticada puede cambiar su nombre visible, foto o avatar y biografía. La ubicación y fecha de nacimiento son opcionales. MySQL conserva los datos y las preferencias para mostrar el correo, fecha de nacimiento y ubicación en el resumen, y el nombre y saldo en el encabezado. El servicio valida la foto y la fecha. Editar el perfil mantiene el rol de la cuenta.

### 3.3 Diseño lógico de datos

`accounts` registra cuentas, credenciales protegidas, permisos y saldo. `products` registra el catálogo, las bajas lógicas y el lote de origen de cada publicación. `cart_items` mantiene una fila por par de cuenta y producto. `purchases` registra pedidos, claves idempotentes e instantáneas de los artículos. `seller_sales` almacena las líneas de venta por vendedor con el precio original. `seller_applications` conserva las solicitudes de rol y su estado. `wallet_packages` contiene los paquetes de saldo y su precio, y `wallet_top_ups` registra las claves para evitar recargas duplicadas. `refresh_sessions` registra las sesiones renovables. Las claves foráneas y restricciones de integridad complementan las validaciones. Flyway versiona el esquema y carga los datos iniciales.

### 3.4 Requisitos no funcionales

RNF-01 Seguridad: BCrypt coste 12; secreto JWT externo de al menos 32 bytes; cookies HttpOnly y SameSite; Secure en HTTPS; CORS restringido; autorización en servidor y protección CSRF de endpoints de sesión. Secretos y respaldos privados quedan fuera de Git.

RNF-02 Integridad: transacciones y bloqueos pesimistas protegen saldo y stock; claves idempotentes evitan cargos duplicados. Operaciones inválidas no deben alterar la compra; se verifica con pruebas de rollback y concurrencia.

RNF-03 Usabilidad: navegación consistente, avisos claros, formularios etiquetados, foco en diálogos y controles adaptados al tamaño de pantalla. La vista móvil debe permitir comprar sin desbordamiento horizontal de página.

RNF-04 Pruebas. La configuración de Jasmine/Karma exige al menos 60% de cobertura en líneas, sentencias, funciones y ramas del frontend. Las pruebas de backend y las comprobaciones HTTP con MySQL verifican las reglas de negocio y la persistencia.

RNF-05 Despliegue y operación. Docker Compose permite iniciar los servicios con comprobaciones de salud y persistencia mediante volúmenes. La URL pública permite ejecutar los flujos desde otro equipo mientras la instancia de Amazon EC2 permanezca activa.

RNF-06 Mantenibilidad: separación de páginas/componentes/contexto/cliente HTTP en React y controller/service/repository/model/DTO/security en backend. Configuración por variables de entorno, OpenAPI, colección Postman y respaldo SQL importable.

## Anexo A Casos de uso

CU-01 Registrarse. Actor: visitante. Precondición: conexión disponible. Flujo: abre Acceso, selecciona registro, ingresa datos, revisa validaciones y confirma; servidor crea CLIENTE y sesión. Alternativas: campos inválidos o correo duplicado muestran error. Resultado: cuenta persistida y acceso al mercado.

CU-02 Comprar. Actores disponibles: CLIENTE, VENDEDOR y ADMIN. Con una sesión válida y un carrito con artículos, el usuario revisa cantidades y total y confirma la compra. El servidor bloquea los registros, comprueba el saldo y el stock, guarda el pedido y actualiza el inventario. Si alguna regla falla, el servidor revierte la operación completa.

CU-03 Administrar producto. Actor: ADMIN. Flujo: abre Productos, crea o edita campos y guarda; para eliminar confirma la acción. Alternativas: entrada inválida devuelve errores; producto inexistente devuelve 404. Resultado: catálogo actualizado en MySQL y frontend.

CU-04 Administrar cuenta. Actor: ADMIN. Flujo: abre Usuarios, busca, crea o edita cuenta, asigna rol o bloqueo y confirma; puede eliminar una cuenta sin pedidos. Alternativas: email duplicado, autoeliminación o referencia de compra producen conflicto. Resultado: cuenta actualizada respetando historial y administrador activo.

CU-05 Recuperar sesión. Actor: usuario que recarga. Precondición: cookie válida. Flujo: React solicita refresh, servidor verifica hash/vencimiento/versión y rota cookie, React carga perfil, carrito e historial. Alternativa: sesión inválida lleva a acceso sin exponer datos privados.

CU-06 Solicitar rol Vendedor. El cliente abre Ser vendedor, completa el formulario y lo envía. El administrador abre Solicitudes de vendedor y registra su decisión. El cliente actualiza el estado. Una aprobación habilita el panel de publicaciones y ventas. Un rechazo muestra el comentario y permite enviar otra solicitud.

CU-07 Publicar skin. El vendedor abre Publicaciones, elige una skin de su inventario, ingresa precio y cantidad, y confirma. El servidor verifica titularidad y unidades. La publicación activa aparece en el catálogo. Si otra cuenta compra la skin, la venta aparece en el panel y en su historial.

## Anexo B Verificación de requisitos

Las pruebas de autenticación y permisos cubren RF-01 a RF-03 y RNF-01. Las pruebas de catálogo y cuentas cubren RF-04 a RF-06. Las comprobaciones HTTP y el recorrido desde el navegador cubren carrito, compras, inventario, recargas, ventas, perfil y persistencia (RF-07 a RF-15). El informe de pruebas recoge los resultados de cobertura, concurrencia y despliegue público (RNF-02 a RNF-05). Los contratos OpenAPI, la colección Postman y el respaldo SQL documentan las interfaces y los datos descritos en RNF-06.
