FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

# 1. Instalar compilador y herramientas
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. Directorio de trabajo raíz dentro del contenedor
WORKDIR /app

# 3. El comando de ejecución compila automáticamente el código 
# que viva dentro de la carpeta "backend" mapeada por el volumen
CMD ["bash", "-c", "cd backend && mkdir -p build && cd build && cmake .. && make && ./clinica_api"]