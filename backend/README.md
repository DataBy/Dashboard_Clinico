# Backend API - Dashboard Clinico

## Compilar API

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
```

## Ejecutar

```powershell
.\backend\clinic_api.exe
```

Servidor por defecto: `http://localhost:8080`

## Endpoints

### Salud

- `GET /api/health`

### Pacientes

- `GET /api/pacientes`
- `POST /api/pacientes`
- `GET /api/pacientes/{cedula}`

### Consultas

- `GET /api/consultas`
- `POST /api/consultas`

### Diagnosticos

- `GET /api/diagnosticos`
- `GET /api/diagnosticos/tree`
- `GET /api/diagnosticos/busqueda?codigo=...&nombre=...`
- `GET /api/diagnosticos/especialidad?nombre=Cardiologia`
- `GET /api/diagnosticos/{codigo}`

### Cola de atencion

- `GET /api/cola`
- `POST /api/cola/registrar`
- `POST /api/cola/atender`
- `POST /api/cola/atender/{cedula}`

### Busquedas de expedientes

- `GET /api/busqueda?cedula=<valor>&algoritmo=lineal|binaria|ambos`
- `GET /api/busqueda?nombre=<prefijo>&algoritmo=lineal|binaria|ambos`
- `GET /api/busqueda?fechaDesde=YYYY-MM-DD&fechaHasta=YYYY-MM-DD&gravedad=1..5`
- Se pueden combinar filtros.

### Rendimiento

- `POST /api/benchmark/sort`
  - body:
    - `dataset: "pacientes" | "consultas"`
    - `campo: string`
    - `size: number`
    - `algoritmos: ["bubble","selection","insertion","quick"]` (opcional, tambien acepta `["all"]`)
- `POST /api/benchmark/search`
- `GET /api/system/metrics`

## Datos persistidos

- `backend/pacientes.csv`
- `backend/consultas.csv`
- `backend/diagnosticos.csv`

`POST /api/pacientes` y `POST /api/consultas` persisten cambios en CSV.
