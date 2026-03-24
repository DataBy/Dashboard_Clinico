# Dashboard Clinico

Sistema de gestion clinica con backend en C++17 (API REST) y frontend en React + TypeScript (Vite).

## Requisitos

- Windows con `g++` (MinGW/MSYS2) para compilacion local.
- Node.js 18+ y `npm`.
- Docker + Docker Compose (opcional).
- `make` (opcional, para comandos del `Makefile`).

## Estructura del proyecto

- `backend/`: API REST y modulos de estructuras de datos.
- `frontend/`: interfaz de usuario React/Vite.
- `docker/`: Dockerfiles y configuraciones de despliegue.
- `compose.yml`: orquestacion de contenedores.
- `docs/`: decisiones tecnicas y matriz de cumplimiento.

Persistencia actual:

- `backend/pacientes.csv`
- `backend/consultas.csv`
- `backend/diagnosticos.csv`

## Ejecucion local (sin Docker)

### Backend

```powershell
g++ -std=c++17 -O2 -Ibackend -Ibackend/third_party `
  backend/main_backend.cpp `
  backend/algorithms/searching.cpp `
  backend/algorithms/sorting.cpp `
  backend/services/cola_pacientes.cpp `
  backend/services/busquedas.cpp `
  backend/services/arbol_diagnosticos.cpp `
  backend/performance/benchmark.cpp `
  -o backend/clinic_api.exe -lws2_32

.\backend\clinic_api.exe
```

API: `http://localhost:8080`

### Frontend

```powershell
cd frontend
npm ci
npm run dev
```

Frontend local: `http://localhost:5173`

Build de produccion:

```powershell
cd frontend
npm run build
```

## Ejecucion con Docker

### Desarrollo

```bash
make dev
```

### Produccion/evaluacion

```bash
make prod
```

### Detener / limpiar

```bash
make down
make clean
make stats
```

Acceso habitual con Docker:

- Frontend: `http://localhost`
- Backend API: `http://localhost:8080`

## Generacion programatica de datasets

Compilar generador:

```powershell
g++ -std=c++17 -O2 -Ibackend backend/dataset_generator.cpp -o backend/dataset_generator.exe
```

Generar datasets reproducibles de 500, 5000, 50000 y 200000 (semilla fija), dejando `size_5000` como dataset principal:

```powershell
.\backend\dataset_generator.exe `
  --sizes 500,5000,50000,200000 `
  --seed 20260315 `
  --output-dir .\backend `
  --main-size 5000
```

Resultado:

- `backend/size_500/pacientes.csv`, `consultas.csv`, `diagnosticos.csv`
- `backend/size_5000/...`
- `backend/size_50000/...`
- `backend/size_200000/...`
- `backend/pacientes.csv`, `backend/consultas.csv`, `backend/diagnosticos.csv` (dataset principal)

## Endpoints principales

- `GET /api/health`
- `GET /api/cola`
- `GET /api/busqueda?cedula=...&nombre=...&fechaDesde=YYYY-MM-DD&fechaHasta=YYYY-MM-DD&gravedad=1..5&algoritmo=lineal|binaria|ambos`
- `GET /api/diagnosticos/tree`
- `GET /api/diagnosticos/especialidad?nombre=Cardiologia`
- `GET /api/diagnosticos/busqueda?codigo=...&nombre=...`
- `POST /api/benchmark/sort`
- `POST /api/benchmark/search`
- `GET /api/system/metrics`

## Evidencia de cumplimiento del laboratorio

- [docs/DECISIONES_TECNICAS.md](docs/DECISIONES_TECNICAS.md)
- [docs/CUMPLIMIENTO_PDF.md](docs/CUMPLIMIENTO_PDF.md)
