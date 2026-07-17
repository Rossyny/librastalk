# Estágio de Build (Usa Maven com JDK 25)
FROM maven:3.9.9-eclipse-temurin-23-alpine AS build
WORKDIR /app
COPY . .
# Baixa o JDK 25 se necessário ou ajusta o target
RUN mvn clean package -DskipTests

# Estágio de Execução (Runtime do Java 25)
FROM eclipse-temurin:23-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]