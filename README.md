### Dashboard Clínico UTN

Sistema de Gestión de Clínica con Análisis de Rendimiento. Entorno dockerizado que ejecuta una API backend en C++ (compilada con CMake) y una interfaz gráfica frontend servida a través de Nginx.

Desarrollado para el curso de Estructuras de Datos

### Setup

#### 1. Configurar variables de entorno (Opcional)

Cada servicio lee su configuración de un archivo `.env` en su respectivo directorio `envs/`. El `Makefile` automatiza la creación de este archivo copiando las plantillas `.env.dev` o `.env.prod` según el comando que ejecutes.

Si necesitas ajustar los parámetros para el Módulo de Rendimiento (ej. cantidad de pacientes generados), edita los archivos base:

**`docker/backend/envs/.env.dev`**

```env
APP_ENV=development
PORT=8080
MAX_PACIENTES=500     # Modificar para pruebas de carga
DB_PATH=/app/backend/data/clinica_dev.db


2. Iniciar los servicios

# Para programar (Desarrollo)
make dev

# Para la revisión del profesor (Producción)
make prod

Esto compilará el código de C++ en vivo y levantará el servidor web. El sistema de base de datos (SQLite) se inicializará automáticamente en el volumen asignado.


3. Acceder al sistema
Abre http://localhost en tu navegador web para utilizar la interfaz gráfica.
Las peticiones internas se comunicarán con la API de C++ alojada en el puerto 8080.

Usage

# Iniciar el entorno de desarrollo (logs en vivo)
make dev

# Iniciar el entorno de evaluación (en segundo plano)
make prod

# Detener los contenedores (mantiene los datos generados)
make down

# Detener y borrar todos los datos (caché CMake y BD SQLite)
make clean

# Ver consumo de RAM y CPU en vivo (Ideal para el Módulo 4)
make stats


Project Structure

Dashboard_Clinico/
├── compose.yml
├── Makefile
├── docker/
│   ├── backend/
│   │   ├── compose.yml
│   │   ├── Dockerfile
│   │   └── envs/
│   │       ├── .env
│   │       ├── .env.dev
│   │       └── .env.prod
│   └── frontend/
│       └── compose.yml
├── backend/
│   ├── algorithms/
│   ├── data/
│   ├── models/
│   ├── performance/
│   ├── services/
│   └── CMakeLists.txt
└── frontend/
```
