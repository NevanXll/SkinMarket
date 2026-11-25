# Demostración de SkinMarket

1. Abrir la web y mostrar Home, catálogo, filtros, selector USD/CLP y detalle de un producto.
2. Registrar un cliente nuevo; mostrar validación de correo, contraseña corta y campos vacíos antes del registro válido.
3. Cerrar sesión e ingresar con el mismo usuario. Recargar para mostrar la recuperación de sesión y los datos de MySQL.
4. Añadir una skin al carrito, cambiar cantidad y comprar. Mostrar saldo, stock, inventario e historial. Aclarar que los pagos son virtuales.
5. Entrar como ADMIN con las credenciales privadas configuradas. Crear, editar y eliminar un producto; crear, editar, bloquear y eliminar una cuenta sin compras. Mostrar dashboard.
6. Con un cliente, intentar abrir administración; explicar que Spring Security también rechaza los endpoints sin rol aunque se altere React.
7. Ejecutar npm test, abrir coverage/index.html y explicar qué mide la cobertura. Mostrar la colección Postman y el esquema MySQL.
8. Mostrar los controladores, servicios, repositorios y DTO; explicar la transacción de compra y el refresh de sesión.

Antes de presentar: iniciar Docker, esperar servicios saludables y verificar acceso. Para presentar por URL pública hay que desplegar esta versión en el servidor del laboratorio; el enlace S3 anterior corresponde al frontend previo.
