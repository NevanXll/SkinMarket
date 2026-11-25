# Manual de usuario de SkinMarket

## Acceso

Abre la dirección publicada o http://localhost:8080 en el equipo donde se ejecuta Docker. Inicio presenta las skins destacadas y Mercado muestra el catálogo. Puedes ordenar y filtrar por texto, tipo de arma, rareza, colección, exterior y precio. El selector USD/CLP aplica una tasa fija de demostración de 950 CLP por USD.

**Figura 1. Inicio y catálogo**

![Home y catálogo](screenshots/01-home.png)

Nota. Desde la portada se puede explorar el mercado y abrir el detalle de una skin.

### Cuentas de demostración local

Desde la raíz del repositorio completo, con Docker en ejecución, ejecuta `python scripts/demo-local.py`. Al arrancar la tienda se crean las tres cuentas en una base local. Abre http://127.0.0.1:8088 y selecciona **Acceder**.

| Correo | Rol | Contraseña de demostración |
| --- | --- | --- |
| cliente.demo@skinmarket.example | Cliente | DemoCliente!2026 |
| vendedor.demo@skinmarket.example | Vendedor | DemoVendedor!2026 |
| admin.demo@skinmarket.example | Administrador | DemoAdmin!2026 |

El vendedor empieza con una skin comprada. Para elegirla, abre **Publicaciones** en el panel de vendedor y pulsa **Publicar skin**.

## Registro e inicio de sesión

Seleccionar Acceder y Crear cuenta. Ingresar nombre de al menos tres caracteres, correo válido y contraseña de al menos seis caracteres, con máximo 72 bytes UTF-8. Los errores aparecen junto al campo. El servidor también revisa correo único. Al registrar, la cuenta recibe 12.500 USD virtuales y entra como CLIENTE. Para volver, usar correo y contraseña en Iniciar sesión.

**Figura 2. Validaciones del registro**

![Validaciones del registro](screenshots/02-validaciones.png)

Nota. Los mensajes indican cómo corregir cada campo antes de crear la cuenta.

La sesión se recupera al recargar mediante una cookie protegida y un token renovado. Las compras se guardan en MySQL y están disponibles al ingresar a la misma cuenta desde otro equipo. La preferencia de moneda pertenece al navegador.

## Compra e inventario

Pulsar Añadir al carrito en una skin con stock. Abrir el carrito, aumentar/reducir cantidades o quitar artículos. Revisar total y saldo antes de Confirmar compra. Si falta stock o saldo, no se permite completar la compra. La billetera permite recarga de saldo virtual; no realiza cargos reales.

**Figura 3. Carrito**

![Carrito](screenshots/03-carrito.png)

Nota. Revisa cantidades, saldo y total antes de confirmar.

Al confirmar, las skins aparecen en Inventario y el pedido en Mis compras. El servidor calcula el total y actualiza saldo y stock junto con el pedido. Los registros de compras conservan los datos de la skin aunque el administrador la retire después.

**Figura 4. Inventario tras una compra**

![Inventario tras una compra](screenshots/04-inventario.png)

Nota. La skin adquirida queda disponible en el inventario.

## Administración

Ingresar con una cuenta ADMIN. Las credenciales del administrador inicial se configuran de forma privada en el servidor. Administración contiene Resumen, Productos y Usuarios. Resumen muestra ventas, compras, unidades, stock y gráficos calculados a partir de pedidos guardados.

**Figura 5. Resumen administrativo**

![Resumen administrativo](screenshots/05-dashboard.png)

Nota. El panel calcula sus indicadores a partir de las compras guardadas.

En Productos, usar Nuevo producto, completar el formulario y guardar. Editar permite cambiar información, precio y stock; Eliminar pide confirmación y retira la skin del catálogo. Los precios no pueden ser negativos y el stock debe ser entero mayor o igual a cero.

En Usuarios, crear cuentas, buscar por nombre o correo, filtrar rol/estado, editar perfil y rol, bloquear/desbloquear o eliminar cuentas sin compras. No es posible eliminarse, bloquearse o quitarse el propio rol ADMIN. No se visualizan contraseñas.

**Figura 6. Gestión de usuarios**

![Gestión de usuarios](screenshots/06-usuarios.png)

Nota. El administrador consulta y gestiona el estado de las cuentas.

## Postular a vendedor

Con una cuenta de cliente, abre **Mi perfil** desde el avatar del encabezado y selecciona **Ser vendedor**. Explica por qué quieres obtener el rol e indica si estudias, país, estado o región y ciudad. Añade experiencia, institución educativa o código postal si corresponde. Selecciona **Enviar solicitud**. Vuelve a la misma vista y selecciona **Actualizar estado** para consultar la decisión.

**Figura 7. Formulario de postulación**

![Formulario de postulación](screenshots/08-postulacion.png)

Nota. El formulario reúne el motivo, la información de estudios y la ubicación para la revisión administrativa.

Con una cuenta ADMIN, abre **Administración → Solicitudes de vendedor**. Revisa los datos y selecciona **Aprobar** o **Rechazar**. Si rechazas, indica el motivo. El cliente puede leerlo y volver a postular.

**Figura 8. Revisión administrativa**

![Revisión administrativa](screenshots/09-revision.png)

Nota. El administrador puede abrir el formulario y registrar su decisión.

Cuando la solicitud se apruebe, selecciona **Abrir panel de vendedor**. En **Resumen** verás el importe de tus ventas simuladas, pedidos, unidades vendidas, publicaciones activas y un gráfico de los últimos siete días.

**Figura 9. Resumen del vendedor**

![Resumen del vendedor](screenshots/10-vendedor.png)

El resumen se calcula con tus ventas confirmadas. Abre **Historial de ventas** y pulsa **Ver detalle** para ver tus skins y sus importes en la orden.

En **Publicaciones**, pulsa **Publicar skin** y selecciona una opción de **Skin de mi inventario**. Ingresa el precio unitario en USD y la cantidad. La lista muestra tus compras disponibles y puedes seguir comprando skins desde el mercado.

**Figura 9a. Selección de una skin para vender**

![Selector de skins del inventario](screenshots/13-publicacion.png)

Las publicaciones activas aparecen en el mercado. Para ajustar precio o unidades, abre tu publicación y guarda. Puedes pausarla y reactivarla mientras te queden unidades.

## Uso móvil y errores

En móvil, abrir el menú superior y usar Filtros para desplegar las opciones. Las tablas de administración permiten desplazamiento horizontal dentro de su contenedor. Si no hay conexión con la API, aparece un aviso con Reintentar conexión. Un fallo no equivale a una compra confirmada: revisar Mis compras antes de repetir una acción incierta.

**Figura 10. Catálogo móvil**

![Catálogo móvil](screenshots/07-movil.png)

Nota. Abre el menú y los filtros desde la barra superior.

## Mi perfil

Selecciona el avatar del encabezado para abrir Mi perfil. Pasa el mouse sobre el avatar de la sección Personalización o tócalo en el móvil para elegir una foto JPG, PNG o WebP de hasta 5 MB. También puedes elegir un avatar prediseñado. Edita tu nombre, biografía, fecha de nacimiento o ubicación y ajusta su visibilidad en pantalla. Selecciona **Guardar cambios** para conservar los ajustes.

**Figura 11. Personalización y privacidad**

![Mi perfil](screenshots/11-perfil.png)

Nota. Las preferencias se mantienen al volver a abrir la sesión.

## Recargar la billetera

Pulsa el botón de saldo en el encabezado. Cada opción indica el saldo virtual que recibirás y el precio simulado en USD y CLP. Elige un paquete y pulsa **Añadir saldo virtual**. Si el precio cambia mientras el modal está abierto, elige nuevamente con el precio actualizado.

**Figura 12. Opciones de recarga**

![Opciones de recarga](screenshots/12-recarga.png)

Cada paquete muestra el saldo que entrega y el precio simulado.

Abre **Recargas** en **Administración**, cambia el precio en USD de un paquete y pulsa **Guardar precio**. El cambio se guarda en MySQL. La cantidad de saldo del paquete se mantiene fija y la tienda usa la tasa de 950 CLP por USD para mostrar el equivalente.

## Alcance

Las compras y el saldo son simulados. El enlace público funciona mientras el servidor permanezca en ejecución y conserve su dirección IP.
