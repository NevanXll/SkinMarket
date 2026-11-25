# Despliegue de SkinMarket

## Servidor

Usar una instancia Linux con Docker y Compose. Para tres JVM, MySQL y Nginx se recomienda al menos 4 GB de RAM y espacio suficiente para imágenes y respaldo.

1. Clonar el repositorio y crear `.env` desde `.env.example`.
2. Definir contraseñas únicas, un JWT_SECRET aleatorio de al menos 32 bytes y las credenciales iniciales del administrador.
3. Configurar `CORS_ORIGINS` con el origen HTTPS real, sin barra final, y `COOKIE_SECURE=true`.
4. Ejecutar `docker compose up -d --build` y revisar `docker compose ps`.
5. Publicar Nginx mediante un proxy HTTPS o balanceador con certificado. Configurar el proxy para conservar el host y protocolo original. La web y `/api/v1` deben compartir origen.
6. Permitir entrada a 80/443; restringir SSH a la IP del operador. Los puertos 8081-8083 están enlazados solo a loopback. MySQL no publica el puerto 3306.
7. Comprobar desde otro equipo registro, login, compra, inventario y restricciones ADMIN. Anotar la URL definitiva en el README.

El Compose expone 8080 para pruebas. Detrás de un proxy local se puede enlazar ese puerto a 127.0.0.1. Para HTTPS, el proxy frontal debe reenviar `X-Forwarded-Proto`; evitar sobrescribirlo con http en un segundo proxy. Configurar los proxies de confianza del entorno antes de usar encabezados reenviados en Internet.

## Respaldo

El archivo de entrega `database/skinmarket.sql` incluye estructura y catálogo. Se puede importar en una base vacía antes de iniciar los servicios; conserva el historial de migraciones Flyway incluido en el respaldo.

Para un respaldo operativo privado, usar mysqldump con `--single-transaction --no-tablespaces --set-gtid-purged=OFF`. Guardar las credenciales en un archivo de configuración protegido o en la variable MYSQL_PWD dentro del contenedor, evitando escribirlas en el comando compartido. No publicar dumps con cuentas, hashes, tokens, sesiones o datos personales. Verificar una restauración en una base independiente antes de depender del respaldo.

`docker compose down` conserva el volumen. No usar la opción `-v` salvo que se quiera eliminar toda la base.

## Comprobaciones

Cada servicio tiene `/actuator/health` accesible localmente. Las especificaciones están en `/api/v1/usuarios/openapi`, `/api/v1/productos/openapi` y `/api/v1/pedidos/openapi`. Revisar logs sin compartir secretos. En una actualización, hacer respaldo, ejecutar pruebas, reconstruir imágenes y validar los flujos con la BD persistida.

## Instancia de Amazon EC2

SkinMarket Pro se publicó en Amazon EC2, en la región us-east-1. Caddy gestiona el certificado público y reenvía el tráfico al puerto 8080 de Nginx en loopback. Los únicos puertos de entrada públicos son 80 y 443. La instancia se administra mediante AWS Systems Manager.

URL verificada: https://44.200.240.238/. El sitio está disponible mientras la instancia siga en ejecución con la misma IPv4 pública. Si la IP cambia, se deben actualizar el origen permitido, la configuración de Caddy y la URL del README.
