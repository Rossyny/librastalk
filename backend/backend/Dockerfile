# Estágio de Build (Linux Ubuntu com JDK 25 EA e Maven)
FROM ubuntu:24.04 AS build
WORKDIR /app

# Instala dependências básicas, Maven e baixa o JDK 25 Early Access
RUN apt-get update && apt-get install -y curl maven openjdk-25-jdk-headless || \
    (apt-get install -y curl maven && \
     curl -sL https://download.java.net/java/GA/jdk25/latest/binaries/openjdk-25_linux-x64_bin.tar.gz | tar -xz -C /opt/ && \
     ln -s /opt/jdk-25/bin/* /usr/bin/)

COPY . .
RUN mvn clean package -DskipTests -Dmaven.compiler.release=25

# Estágio de Execução
FROM ubuntu:24.04
WORKDIR /app
RUN apt-get update && apt-get install -y openjdk-25-jre-headless || apt-get install -y openjdk-21-jre-headless
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]