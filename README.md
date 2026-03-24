# Dashboard Clinico

Sistema de gestion clinica con backend en C++ (CMake + httplib) y frontend React + Vite.

El proyecto incluye modulos de:

- registro y consulta de pacientes,
- diagnosticos y cola de atencion,
- busqueda por cedula/nombre con comparativa lineal vs binaria,
- filtros por fecha y gravedad en el flujo de busqueda,
- panel de rendimiento y metricas del sistema.

## Arquitectura

- `backend/`: API REST en C++.
- `frontend/`: interfaz React/Vite.
- `compose.yml`: orquesta `api` (puerto 8080) y `web` (puerto 80).
- `docker/backend/Dockerfile`: compila y empaqueta el binario `clinica_api`.
- `docker/frontend/Dockerfile`: build de Vite y servido por Nginx.

Persistencia actual:

- `backend/pacientes.csv`
- `backend/consultas.csv`
- `backend/diagnosticos.csv`

## Requisitos

- Docker + Docker Compose
- `make` (opcional, recomendado)

Para desarrollo local sin Docker (frontend):

- Node.js 20+
- npm

## Ejecucion rapida (Docker)

### Desarrollo

```bash
make dev
```

- Copia `docker/backend/envs/.env.dev` a `docker/backend/envs/.env`.
- Levanta servicios con logs en vivo.

### Produccion/evaluacion

```bash
make prod
```

- Copia `docker/backend/envs/.env.prod` a `docker/backend/envs/.env`.
- Levanta servicios en segundo plano.

### Detener y limpiar

```bash
make down
make clean
make stats
```

- `down`: detiene contenedores.
- `clean`: detiene y limpia volumenes/cache definidos por el `Makefile`.
- `stats`: muestra consumo de recursos en vivo.

## Acceso

- Frontend: `http://localhost`
- Backend API: `http://localhost:8080`

## Variables de entorno backend

Plantillas:

- `docker/backend/envs/.env.dev`
- `docker/backend/envs/.env.prod`

Variables principales:

- `APP_ENV`
- `PORT`
- `MAX_PACIENTES`
- `DB_PATH` (legado de configuracion; la app actual trabaja con CSV)

## Ejecucion local (sin Docker)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

Ver instrucciones detalladas en `backend/README.md`.

## Endpoints principales

Ver detalle completo en `backend/README.md`. Resumen:

- `GET /api/health`
- `GET /api/pacientes`
- `GET /api/consultas`
- `GET /api/diagnosticos`
- `GET /api/cola`
- `GET /api/busqueda?nombre=<valor>`
- `GET /api/busqueda?cedula=<valor>&algoritmo=lineal|binaria|ambos`
- `POST /api/benchmark/sort`
- `POST /api/benchmark/search`
- `GET /api/system/metrics`

## Estructura del proyecto

```text
Dashboard_Clinico/
├── compose.yml
├── Makefile
├── backend/
│   ├── CMakeLists.txt
│   ├── main_backend.cpp
│   ├── algorithms/
│   ├── services/
│   ├── performance/
│   ├── models/
│   ├── third_party/
│   ├── pacientes.csv
│   ├── consultas.csv
│   └── diagnosticos.csv
├── frontend/
│   ├── package.json
│   ├── src/
│   └── vite.config.ts
└── docker/
	├── backend/
	│   ├── Dockerfile
	│   └── envs/
	└── frontend/
		├── Dockerfile
		└── nginx.conf
```

## Notas

- La pantalla de busqueda integra filtros por fecha y gravedad junto con comparativa de algoritmos.
- El frontend trabaja con navegacion interna por componentes (sin router tradicional para las vistas principales).
