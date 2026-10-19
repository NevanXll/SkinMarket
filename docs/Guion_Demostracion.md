# Demostración de SkinMarket Pro

Publicado en Amazon S3, región us-east-1, el 19 de octubre de 2026.

Enlace público HTTPS:
https://skinmarket-pro-benjamin-20261019-341108713030.s3.us-east-1.amazonaws.com/index.html

## Cuentas incluidas en cualquier navegador nuevo

| Cuenta | Correo | Contraseña de prueba |
| --- | --- | --- |
| Cliente | cliente@skinmarket.cl | Cliente123 |
| Administrador | admin@skinmarket.cl | Admin123 |

## Recorrido para presentar al profesor

1. Abrir el enlace público, sin ejecutar npm ni abrir localhost.
2. Filtrar el catálogo por arma, precio o rareza. Cambiar entre USD y CLP.
3. En Acceder, entrar a Crear cuenta e intentar enviar vacío: se muestran los errores por campo.
4. Registrar una cuenta con un correo de prueba único y clave de seis caracteres o más. Los correos no se envían a un servidor ni reciben mensajes.
5. Añadir una skin con stock al carrito. Ajustar cantidades y revisar el total.
6. Confirmar la compra: baja el saldo, disminuye el stock y aparece la skin en Inventario y el pedido en Mis compras.
7. Recargar la página: se conservan la sesión y los datos.
8. Cerrar sesión y volver a entrar con la cuenta registrada para demostrar el login.
9. Cerrar sesión y entrar con Administrador usando el botón de cuenta de demostración.
10. En Resumen, mostrar que la compra anterior se refleja en ventas, top skins y compras recientes.
11. En Productos, crear una skin de prueba, editar su precio/stock y eliminar exclusivamente ese producto confirmando la acción.
12. En Usuarios, buscar la cuenta creada, editar su nombre o rol, bloquearla y desbloquearla. El sistema impide bloquear la cuenta administrativa actual.

Para probar saldo insuficiente, agregar productos cuyo total supere el saldo. El botón Confirmar compra se deshabilita y aparece un aviso. Para probar stock, utilizar una skin agotada: no permite añadirla.

## Comprobaciones realizadas en la versión publicada

La interfaz utiliza Bootstrap y las pruebas se ejecutan con Jasmine/Karma. Se revisó la portada a 1536, 768 y 390 px, el acceso móvil, el menú, los filtros y el editor administrativo. La consola S3 confirmó tres archivos publicados sin errores.

Ajuste posterior: se eliminó el bloque «Juego / Counter-Strike 2» del panel de filtros por ser información redundante. Se mantienen búsqueda, tipo de arma, rareza, precio, colección y exterior.

- Envío de registro vacío: errores de nombre, correo y contraseña.
- Registro correcto y login posterior de una cuenta nueva.
- Compra de AWP Dragon Lore por 8.450 USD: saldo de 12.500 a 4.050 USD, inventario con una unidad y stock agotado.
- Persistencia comprobada recargando la ruta de inventario.
- Login administrativo, creación de producto de prueba, edición de 10 a 15 USD y eliminación de ese producto.
- Bloqueo y desbloqueo de la cuenta de prueba, con conservación de la compra.
- Dashboard con una compra, una unidad vendida y 8.450 USD de ventas.
- Sin errores de consola observados durante la comprobación; imágenes de la pantalla comprobada cargadas.

## Explicación técnica breve

“Es un frontend React publicado como archivos estáticos en S3. React Router gestiona las páginas; Context y useState comparten el estado; localStorage conserva usuarios, sesión, catálogo, carrito e historial. La autenticación y las compras son simuladas. Las reglas comprueban correo, contraseña, permisos, saldo y stock antes de actualizar el estado.”

Los datos son por navegador y origen: las pruebas realizadas en este Chrome no aparecerán en otro computador. Las cuentas de demostración y el catálogo inicial sí aparecen automáticamente en cada navegador nuevo.

La política pública del bucket permite únicamente s3:GetObject sobre index.html, assets/*, images/* y THIRD_PARTY_NOTICES.txt. No permite a los visitantes escribir, borrar ni listar objetos de S3. Los cambios del CRUD son locales al navegador, no modificaciones de los archivos de AWS.

El enlace depende de que la cuenta y los recursos del laboratorio AWS Academy se mantengan disponibles. Antes de presentar, abrirlo desde el equipo y la red que se usarán en la evaluación.
