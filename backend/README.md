# Servicios Spring Boot

Java 21. Módulos: common, ms-usuarios, ms-productos y ms-pedidos. El Maven Wrapper descarga Maven 3.9.11; no hace falta instalar Maven globalmente.

Desde la carpeta backend:

```bash
./mvnw test
./mvnw package
```

En Windows usar `mvnw.cmd`. Seleccionar JAVA_HOME de Java 21 si hay más de un JDK instalado.

Para ejecutar solo el backend con el Compose de la raíz:

```bash
docker compose up -d --build mysql ms-usuarios ms-productos ms-pedidos
```

Crear antes `.env` desde `.env.example` con secretos propios. Usuarios ejecuta las migraciones y los demás servicios esperan su estado saludable. Swagger local: http://localhost:8081/api/v1/usuarios/swagger-ui.html, http://localhost:8082/api/v1/productos/swagger-ui.html y http://localhost:8083/api/v1/pedidos/swagger-ui.html.

Para ejecutar JAR sin Docker, configurar DB_URL, DB_USER, DB_PASSWORD y JWT_SECRET en el entorno; levantar usuarios primero y luego productos y pedidos. COOKIE_SECURE=false solo para pruebas HTTP locales. La URL JDBC predeterminada es jdbc:mysql://localhost:3306/skinmarket?connectionTimeZone=UTC; el Compose mantiene MySQL accesible únicamente dentro de su red.
