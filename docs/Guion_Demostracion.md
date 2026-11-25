# Demostración de SkinMarket

1. Abrir la web y mostrar Home, catálogo, filtros, selector USD/CLP y detalle de un producto.
2. Registrar un cliente nuevo; mostrar validación de correo, contraseña corta y campos vacíos antes del registro válido.
3. Cerrar sesión e ingresar con el mismo usuario. Recargar para mostrar la recuperación de sesión y los datos de MySQL.
4. Añadir una skin al carrito, cambiar cantidad y comprar. Mostrar saldo, stock, inventario e historial. Aclarar que los pagos son virtuales.
5. Entrar como ADMIN con las credenciales privadas configuradas. Crear, editar y eliminar un producto; crear, editar, bloquear y eliminar una cuenta sin compras. Mostrar dashboard.
6. Con un cliente, intentar abrir administración; explicar que Spring Security también rechaza los endpoints sin rol aunque se altere React.
7. Abrir Mi perfil desde el avatar, cambiar la foto y guardar. Seleccionar Ser vendedor, enviar la solicitud y aprobarla desde la cuenta administradora. Actualizar el estado con la cuenta solicitante para abrir el panel de vendedor.
8. En el panel, abrir Publicaciones y pulsar Publicar skin. Elegir una skin de la compra previa o comprar primero si el inventario está vacío. Ingresar un precio y una cantidad válida. Desde otra cuenta, abrir la publicación en Mercado y comprarla.
9. Volver a la cuenta vendedora. Mostrar el importe y el gráfico en Resumen, y comprobar el precio y la cantidad en Historial de ventas. En Administración, abrir Recargas para mostrar la edición del precio simulado de un paquete.
8. Ejecutar npm test, abrir coverage/index.html y explicar qué mide la cobertura. Mostrar Swagger, la colección Postman y el esquema MySQL.
9. Mostrar los controladores, servicios, repositorios y DTO. Explicar la transacción de compra y el refresh de sesión.

Para presentar en línea, abre https://44.200.240.238/ y comprueba el acceso mientras el laboratorio esté activo. Para una demostración local, inicia Docker Compose y abre http://localhost:8080.
