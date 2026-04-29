# ---------- Stage 1: build React (Vite) ----------
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
# In the combined image, Spring Boot serves the SPA and /api lives on the same origin.
RUN printf 'VITE_API_BASE_URL=/api\nVITE_APP_NAME=Indtrans Freight Solutions\n' > .env.production \
    && npm run build

# ---------- Stage 2: build Spring Boot jar ----------
FROM maven:3.9-eclipse-temurin-17 AS backend-build
WORKDIR /build
COPY backend/pom.xml ./
RUN mvn -q -B -DskipTests dependency:go-offline
COPY backend/ ./
# Drop the built SPA into Spring Boot's classpath:/static so the embedded
# server serves index.html at "/" and the app hits /api on same origin.
COPY --from=frontend-build /app/dist ./src/main/resources/static
RUN mvn -q -B -DskipTests package \
    && cp target/*.jar /app.jar

# ---------- Stage 3: minimal runtime ----------
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S indtrans && adduser -S indtrans -G indtrans \
    && mkdir -p /app/uploads && chown -R indtrans:indtrans /app
COPY --from=backend-build /app.jar /app/app.jar
USER indtrans
EXPOSE 8080
ENV JAVA_OPTS="-Xms256m -Xmx512m"
# Spring context-path is /api, so frontend is at http://host:8080/
#  - index.html:        http://host:8080/
#  - backend endpoints: http://host:8080/api/...
#  - uploaded files:    http://host:8080/api/uploads/...
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
