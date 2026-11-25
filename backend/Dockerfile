FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /build
COPY backend/ .
RUN --mount=type=cache,target=/root/.m2,sharing=locked mvn -B package -DskipTests
ARG SERVICE
RUN cp ${SERVICE}/target/${SERVICE}-3.0.0.jar /app.jar
FROM eclipse-temurin:21-jre
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app.jar app.jar
USER 10001
ENTRYPOINT ["java","-XX:MaxRAMPercentage=65","-jar","app.jar"]
