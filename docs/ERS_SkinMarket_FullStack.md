# Especificación de requisitos de SkinMarket Pro

Versión 3.2 - React, Spring Boot y MySQL. Fecha: 24 de noviembre de 2026.

## 1. Introducción

### 1.1 Propósito

Definir el comportamiento y las restricciones de una tienda académica de skins de Counter-Strike 2. Los destinatarios son desarrolladores, evaluadores y usuarios que verifican el proyecto. La organización sigue la estructura de introducción, descripción general y requisitos específicos de una ERS.

### 1.2 Alcance

SkinMarket permite consultar productos, crear cuentas, iniciar sesión, usar un carrito y adquirir skins con saldo virtual. Los administradores gestionan productos y usuarios y consultan estadísticas de pedidos. React presenta la interfaz, Spring Boot aplica las reglas y MySQL conserva los datos compartidos entre equipos. No se incluyen transacciones de dinero real, acceso a Steam, transferencia de objetos reales ni cotizaciones en vivo. USD/CLP utiliza una tasa de demostración.

### 1.3 Definiciones

Skin: apariencia digital de un objeto del juego. CRUD: crear, leer, actualizar y eliminar. API REST: interfaz HTTP orientada a recursos. JWT: token firmado que identifica una sesión de acceso. BCrypt: función de hash de contraseñas con coste configurable. DTO: objeto de entrada/salida validado. ADMIN y CLIENTE: roles del sistema. Inventario: vista de artículos adquiridos. Transacción: conjunto de operaciones que se confirman o revierten en conjunto.

### 1.4 Referencias

Rúbricas EP3 y EFT de DSY1104 suministradas para esta evaluación; guías docentes de integración React, REST y despliegue EC2; repositorios Fideito14/RestaurantEV2 y jesvargasf/dsy1104_microservicios como referencias de estructura; ByMykel/CSGO-API como origen de información e imágenes del catálogo. La implementación concreta se describe en Arquitectura_API.md y las verificaciones en Informe_Testing.md.

### 1.5 Organización

La sección 2 define actores, contexto y límites. La sección 3 especifica interfaces, funciones, reglas y atributos de calidad. Los anexos describen casos de uso y la trazabilidad de la evaluación.

## 2. Descripción general

### 2.1 Perspectiva

Aplicación web cliente-servidor. React y Bootstrap consumen tres aplicaciones Spring Boot: usuarios/autenticación, productos y pedidos. Comparten una base MySQL para confirmar compras de forma atómica. Esta es una simplificación académica y no corresponde a bases aisladas por microservicio. Un proxy mantiene la web y la API bajo el mismo origen.

### 2.2 Actores

Visitante: consulta catálogo y detalle, se registra e inicia sesión. CLIENTE: usa su carrito, recarga saldo virtual, compra, consulta su inventario e historial y puede postular a vendedor. VENDEDOR: consulta productos y órdenes en modo de solo lectura. ADMIN: dispone de las funciones de compra, administra productos y cuentas, revisa postulaciones y consulta pedidos agregados. El servidor comprueba roles y bloqueos en cada solicitud protegida.

### 2.3 Restricciones y dependencias

El servicio requiere conectividad con la API y MySQL; no existe modo de compra sin conexión. Docker Compose permite ejecución local. Para URL pública se requiere un servidor del laboratorio y configuración HTTPS. La disponibilidad depende del laboratorio, del servidor y de la base. Los recursos visuales locales se incluyen en la compilación. Java 21 se utiliza en backend; Node y npm compilan React.

### 2.4 Suposiciones y evolución

El administrador inicial se crea mediante configuración privada cuando no existe un ADMIN activo. Cada registro obtiene saldo virtual inicial para realizar pruebas. El usuario utiliza un navegador compatible con JavaScript y cookies. Son ampliaciones futuras: pagos reales, integración Steam, recuperación de contraseña, verificación de correo, paginación en servidor y separación de bases con coordinación distribuida.

## 3. Requisitos específicos

### 3.1 Interfaces

Interfaz de usuario: Home, Mercado, detalle, Acceso, Carrito, Inventario, Mis compras y Administración. Navegación accesible desde todas las vistas; adaptación móvil, tableta y escritorio; campos con etiqueta y errores visibles. Interfaz software: JSON mediante HTTP REST con prefijo /api/v1; Java/Spring Boot y JPA con MySQL. Comunicación: HTTPS en la nube, Bearer para acceso y cookie HttpOnly para renovación; orígenes CORS configurados. Hardware: equipo con navegador para clientes y servidor con recursos suficientes para tres JVM, MySQL y proxy.

### 3.2 Requisitos funcionales

RF-01 Registro. El visitante ingresa nombre, email y contraseña. El sistema exige nombre de 3 a 100 caracteres, email válido y único, contraseña de 6 caracteres como mínimo y máximo 72 bytes UTF-8. Guarda hash BCrypt, rol CLIENTE y saldo virtual inicial; devuelve 201 e inicia sesión. Datos inválidos: 400 con errores; correo duplicado: 409. El cliente no puede asignarse rol ADMIN mediante registro.

RF-02 Autenticación. El sistema compara la contraseña recibida con BCrypt; no entrega hashes al frontend. Cuenta inexistente, contraseña incorrecta o bloqueo producen rechazo. Un acceso válido entrega JWT con vigencia de 15 minutos y cookie de renovación de siete días. La renovación rota el token opaco almacenado en forma de hash. El cierre revoca la renovación y elimina la sesión visible. Bloqueo o cambio de versión invalidan el acceso existente.

RF-03 Autorización. ADMIN gestiona usuarios, modifica productos y revisa postulaciones. Las compras y los recursos personales de la tienda se habilitan a CLIENTE y ADMIN. VENDEDOR consulta productos y órdenes en su panel de solo lectura. La API devuelve 401 cuando falta autenticación y 403 cuando el rol es insuficiente.

RF-04 Catálogo. El visitante lista y consulta el detalle de productos activos provenientes de MySQL. Puede filtrar por texto, categoría, rareza, colección, exterior y rango de precios y ordenar por precio o nombre. La búsqueda elimina caracteres no admitidos; precios de filtro no negativos y mínimo no mayor al máximo. Producto inexistente o retirado: 404. Si la API falla, se informa el error sin sustituirla por catálogo estático.

RF-05 Gestión de productos. ADMIN crea, consulta, edita y elimina productos. Se exige nombre válido, categoría, rareza, precio no negativo con hasta dos decimales, stock entero no negativo e imagen HTTPS o local válida. Crear: 201 y Location; editar: 200; eliminar: 204. La eliminación es lógica y retira líneas de carrito; el historial conserva los datos comprados.

RF-06 Gestión de usuarios. ADMIN crea, lista, consulta, edita y elimina cuentas. Al crear exige correo único, nombre válido, rol ADMIN o CLIENTE y contraseña válida. Su panel permite filtrar y gestionar las cuentas VENDEDOR. El rol VENDEDOR se concede al aprobar una solicitud. Las reglas de integridad protegen el historial y la última cuenta ADMIN activa.

RF-07 Carrito. Usuario autenticado añade productos y modifica cantidades enteras no negativas; cantidad cero elimina la línea. No acepta cantidades mayores al stock disponible. El carrito se guarda por cuenta en MySQL y se recupera desde otro equipo al iniciar sesión.

RF-08 Compra. El servidor recibe una clave de petición, valida cuenta, carrito, stock y saldo y calcula el total desde precios de la base. Usa BigDecimal y una transacción para crear pedido, descontar saldo y stock y vaciar carrito. Si falla una validación, no aplica cambios parciales. Una repetición con la misma clave devuelve la compra previa sin otro cargo. Concurrencia sobre la última unidad permite una compra ganadora; las demás reciben conflicto.

RF-09 Inventario e historial. El usuario consulta sus pedidos y artículos adquiridos persistidos. Cada compra conserva instantánea de productos, cantidades, fecha y total. La baja posterior de una skin no modifica el historial.

RF-10 Billetera y moneda. Permite recargas virtuales de 0,01 a 100.000 USD por operación. Muestra importes USD o CLP a tasa académica fija 950; MySQL conserva valores en USD. No realiza cargos bancarios. La preferencia de moneda es el único dato funcional guardado en localStorage.

RF-11 Dashboard. ADMIN consulta ventas totales, cantidad de pedidos, unidades, ticket promedio y cuentas bloqueadas; gráficos por día, stock por categoría y productos vendidos. Las recargas no se incluyen como ventas. Sin compras muestra estado vacío; no genera ventas ficticias.

RF-12 Errores y persistencia. Toda operación confirmada permanece tras recargar o reiniciar servicios conservando el volumen MySQL. La interfaz informa éxito, validación, falta de permisos, conflicto o desconexión. No almacena contraseñas, JWT de acceso ni bases de usuarios en localStorage.

RF-13 Solicitud del rol Vendedor. Un CLIENTE autenticado indica su motivo y puede añadir experiencia o contexto. El servidor persiste una solicitud activa por cliente. ADMIN decide aprobar o rechazar e indica el motivo del rechazo. La aprobación guarda la decisión y asigna VENDEDOR en una transacción. Un rechazo permite un nuevo envío.

RF-14 Panel de vendedor. El vendedor puede listar productos, consultar su detalle, listar órdenes y consultar su detalle. Las operaciones de compra y de administración se restringen en la interfaz y en el servidor.

RF-15 Perfil. Cada cuenta autenticada puede cambiar su nombre visible, avatar y biografía. El sistema conserva en MySQL las preferencias para mostrar el correo en el perfil y el saldo en el encabezado. Editar el perfil mantiene el rol de la cuenta.

### 3.3 Diseño lógico de datos

accounts registra cuentas con email único, hash, rol, bloqueo, saldo y versión de autorización. products registra catálogo y baja lógica. cart_items relaciona una cuenta y producto con cantidad única por par. purchases referencia cuenta, fecha, total, clave idempotente e instantánea JSON. refresh_sessions referencia cuenta, hash, vencimiento y versión. seller_applications relaciona la cuenta postulante con su formulario y estado de revisión. Claves foráneas y restricciones CHECK/UNIQUE complementan las validaciones. Flyway versiona la estructura y carga el catálogo inicial.

### 3.4 Requisitos no funcionales

RNF-01 Seguridad: BCrypt coste 12; secreto JWT externo de al menos 32 bytes; cookies HttpOnly y SameSite; Secure en HTTPS; CORS restringido; autorización en servidor y protección CSRF de endpoints de sesión. Secretos y respaldos privados quedan fuera de Git.

RNF-02 Integridad: transacciones y bloqueos pesimistas protegen saldo y stock; claves idempotentes evitan cargos duplicados. Operaciones inválidas no deben alterar la compra; se verifica con pruebas de rollback y concurrencia.

RNF-03 Usabilidad: navegación consistente, avisos claros, formularios etiquetados, foco en diálogos y controles adaptados al tamaño de pantalla. La vista móvil debe permitir comprar sin desbordamiento horizontal de página.

RNF-04 Pruebas: mínimo diez pruebas significativas Jasmine/Karma con informe de cobertura y umbral de 60% en líneas, sentencias, funciones y ramas del frontend evaluable. Pruebas de backend y comprobaciones HTTP con MySQL complementan las unitarias.

RNF-05 Despliegue y operación: ejecución reproducible mediante Compose, health checks y datos persistidos en volumen. La URL pública debe permitir los flujos desde otro equipo una vez desplegada. No se establece un SLA de disponibilidad ni una carga concurrente garantizada para el laboratorio.

RNF-06 Mantenibilidad: separación de páginas/componentes/contexto/cliente HTTP en React y controller/service/repository/model/DTO/security en backend. Configuración por variables de entorno, OpenAPI, colección Postman y respaldo SQL importable.

## Anexo A Casos de uso

CU-01 Registrarse. Actor: visitante. Precondición: conexión disponible. Flujo: abre Acceso, selecciona registro, ingresa datos, revisa validaciones y confirma; servidor crea CLIENTE y sesión. Alternativas: campos inválidos o correo duplicado muestran error. Resultado: cuenta persistida y acceso al mercado.

CU-02 Comprar. Actor: CLIENTE o ADMIN. Precondición: sesión válida y carrito con artículos. Flujo: revisa cantidades y total, confirma, servidor bloquea registros, valida, confirma transacción y presenta inventario. Alternativas: saldo/stock insuficiente, cuenta bloqueada o desconexión; no se confirma una compra parcial. Resultado: pedido persistido con saldo y stock actualizados.

CU-03 Administrar producto. Actor: ADMIN. Flujo: abre Productos, crea o edita campos y guarda; para eliminar confirma la acción. Alternativas: entrada inválida devuelve errores; producto inexistente devuelve 404. Resultado: catálogo actualizado en MySQL y frontend.

CU-04 Administrar cuenta. Actor: ADMIN. Flujo: abre Usuarios, busca, crea o edita cuenta, asigna rol o bloqueo y confirma; puede eliminar una cuenta sin pedidos. Alternativas: email duplicado, autoeliminación o referencia de compra producen conflicto. Resultado: cuenta actualizada respetando historial y administrador activo.

CU-05 Recuperar sesión. Actor: usuario que recarga. Precondición: cookie válida. Flujo: React solicita refresh, servidor verifica hash/vencimiento/versión y rota cookie, React carga perfil, carrito e historial. Alternativa: sesión inválida lleva a acceso sin exponer datos privados.

CU-06 Solicitar rol Vendedor. El cliente abre Ser vendedor, completa el formulario y lo envía. El administrador abre Solicitudes de vendedor y registra su decisión. El cliente actualiza el estado. Una aprobación habilita el panel de productos y órdenes. Un rechazo muestra el comentario y permite enviar otra solicitud.

## Anexo B Trazabilidad de evaluación

Login y seguridad: RF-01, RF-02, RF-03 y RNF-01. CRUD REST de productos: RF-04 y RF-05. CRUD usuarios: RF-06. Integración React/API/MySQL: RF-07 a RF-12. Pruebas y cobertura: RNF-02 y RNF-04. Despliegue público: RNF-05, con configuración de nube pendiente de ejecutar. Documentación, OpenAPI, Postman y SQL: RNF-06. Los resultados efectivamente ejecutados se registran en Informe_Testing.md.
