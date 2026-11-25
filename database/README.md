# Respaldo para entrega

`skinmarket.sql` contiene el esquema de MySQL, los 24 productos base y el historial de Flyway hasta V5. Las tablas de cuentas, carritos, compras, renovaciones de sesión y solicitudes de vendedor quedan vacías. Al restaurar en una base nueva, el servidor crea el administrador inicial a partir de las variables de entorno.

El respaldo operativo de la aplicación es distinto: debe incluir todos los datos y guardarse de manera privada. La creación de un respaldo de entrega no modifica la base en uso.
