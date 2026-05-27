# ============================================
# Stage 1: Build Angular UI (browser bundle)
# ============================================
FROM node:20-alpine AS ui-build
WORKDIR /app/ui

# Copy package files first (Docker layer caching)
COPY angular/websocketsUI/package*.json ./
RUN npm ci

# Copy full Angular source and build
COPY angular/websocketsUI/ ./
RUN npm run build -- --configuration production

# ============================================
# Stage 2: Build Spring Boot Backend
# ============================================
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /app/backend

# Copy Maven wrapper and pom.xml first (Docker layer caching)
COPY websockets/websockets/pom.xml ./
COPY websockets/websockets/.mvn .mvn
COPY websockets/websockets/mvnw ./
RUN chmod +x mvnw

# Download dependencies first (cached layer)
RUN mvn dependency:go-offline -B

# Copy the Spring Boot source code
COPY websockets/websockets/src ./src

# Copy the Angular browser bundle into Spring Boot static resources
# Angular 17+ with SSR still outputs browser files to dist/<name>/browser/
COPY --from=ui-build /app/ui/dist/websocketsUI/browser/ ./src/main/resources/static/

# Package the Spring Boot application
RUN mvn clean package -DskipTests

# ============================================
# Stage 3: Minimal runtime image
# ============================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy only the compiled JAR
COPY --from=backend-build /app/backend/target/websockets-0.0.1-SNAPSHOT.jar app.jar

# Render injects PORT env var; Spring Boot reads it via application.properties
ENV PORT=8080
EXPOSE ${PORT}

ENTRYPOINT ["java", "-jar", "app.jar"]
