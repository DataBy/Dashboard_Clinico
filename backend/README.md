# Backend API - Dashboard Clinico

## Ejecutar servidor

Compilar (Windows + MinGW):

```bash
g++ -std=c++17 -O2 -Ibackend -Ibackend/third_party backend/main_backend.cpp backend/algorithms/searching.cpp backend/algorithms/sorting.cpp backend/services/cola_pacientes.cpp backend/services/busquedas.cpp backend/services/arbol_diagnosticos.cpp backend/performance/benchmark.cpp -o backend/clinic_api.exe -lws2_32
```

Ejecutar:

```bash
backend/clinic_api.exe
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
- `GET /api/diagnosticos/{codigo}`

### Cola de atencion

- `GET /api/cola`
- `POST /api/cola/registrar`
- `POST /api/cola/atender`
- `POST /api/cola/atender/{cedula}`

### Busquedas

- `GET /api/busqueda?nombre=<valor>`
- `GET /api/busqueda?cedula=<valor>&algoritmo=lineal|binaria|ambos`

### Rendimiento

- `POST /api/benchmark/sort`
- `POST /api/benchmark/search`
- `GET /api/system/metrics`

## Datos persistidos

El backend usa CSV existentes en:

- `backend/pacientes.csv`
- `backend/consultas.csv`
- `backend/diagnosticos.csv`

`POST /api/pacientes` y `POST /api/consultas` persisten cambios en los CSV.
