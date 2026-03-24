# Matriz de Cumplimiento del PDF

## Checklist requisito -> implementacion

| Requisito textual del PDF | Estado | Evidencia (archivo/linea) | Nota de validacion |
|---|---|---|---|
| "Debe generar conjuntos de distintos tamanos programaticamente: 500, 5000, 50000 y 200000 registros" | Cumple | `backend/dataset_generator.cpp:22`, `backend/dataset_generator.cpp:63`, `backend/dataset_generator.cpp:350` | Generador reproducible por semilla y salidas por tamano en carpetas `size_*`. |
| "Modulo 1 - Estructura de atencion (cola con prioridad)" | Cumple | `backend/services/cola_pacientes.cpp:40`, `backend/main_backend.cpp:915` | Cola priorizada y endpoints para registrar/atender pacientes. |
| "Buscar por cedula exacta" (Modulo 2) | Cumple | `backend/main_backend.cpp:996`, `backend/services/busquedas.cpp:291` | Endpoint `/api/busqueda` soporta cedula exacta con lineal/binaria. |
| "Buscar por nombre (busqueda parcial)" (Modulo 2) | Cumple | `backend/services/busquedas.cpp:46`, `backend/services/busquedas.cpp:252`, `backend/services/busquedas.cpp:404` | Implementado por prefijo sobre nombre normalizado e indice ordenado. |
| "Buscar por rango de fechas" (Modulo 2) | Cumple | `backend/main_backend.cpp:999`, `backend/services/busquedas.cpp:130`, `backend/services/busquedas.cpp:185` | Filtros `fechaDesde` y `fechaHasta` aplicados sobre historial de consultas. |
| "Buscar por nivel de gravedad" (Modulo 2) | Cumple | `backend/main_backend.cpp:1003`, `backend/main_backend.cpp:1030`, `backend/services/busquedas.cpp:145` | Filtro `gravedad` validado (1..5) y aplicado sobre consultas del paciente. |
| "Implementar busqueda lineal y binaria donde aplique, y mostrar tiempos para comparar" (Modulo 2) | Cumple | `backend/services/busquedas.h:24`, `backend/services/busquedas.cpp:491`, `backend/main_backend.cpp:1074` | Respuesta incluye `comparativa.linealMs` y `comparativa.binariaMs` y seleccion por `algoritmo`. |
| "Arbol de diagnosticos jerarquico: Area -> Especialidad -> Diagnostico" (Modulo 3) | Cumple | `backend/services/arbol_diagnosticos.cpp:10`, `backend/services/arbol_diagnosticos.cpp:17`, `frontend/src/app/pages/Diagnostico.tsx:201` | Construccion jerarquica y navegacion explicita en UI. |
| "Buscar diagnostico por nombre o codigo" (Modulo 3) | Cumple | `backend/main_backend.cpp:830`, `frontend/src/app/pages/Diagnostico.tsx:185` | Backend dedicado (`/api/diagnosticos/busqueda`) y busqueda en interfaz por codigo/nombre. |
| "Mostrar todos los diagnosticos de una especialidad" (Modulo 3) | Cumple | `backend/main_backend.cpp:866`, `frontend/src/lib/api.ts:204`, `frontend/src/app/pages/Diagnostico.tsx:317` | Endpoint dedicado por especialidad y vista/modal directa en UI. |
| "Selecciona uno o varios algoritmos para comparaciones (Bubble, Selection, Insertion, Quick)" (Modulo 4) | Cumple | `backend/main_backend.cpp:157`, `backend/main_backend.cpp:1094`, `frontend/src/app/pages/Rendimiento.tsx:334` | Soporte de subconjuntos y opcion "Todos". |
| "Mostrar grafica de barras, curva de crecimiento y tabla historial" (Modulo 4) | Cumple | `frontend/src/app/pages/Rendimiento.tsx:480`, `frontend/src/app/pages/Rendimiento.tsx:518`, `frontend/src/app/pages/Rendimiento.tsx:541` | Bar chart, line chart y historial en la pantalla de rendimiento. |
| "Comparar busqueda lineal vs binaria sobre conjunto ordenado y evidenciar cuando vale ordenar primero" (Modulo 4) | Cumple | `backend/performance/benchmark.cpp:455`, `backend/performance/benchmark.cpp:486`, `backend/performance/benchmark.cpp:491`, `frontend/src/app/pages/Rendimiento.tsx:579` | Se reportan `linealMs`, `binariaMs`, `sortMs`, `binariaTotalMs`, mejoras y `breakEvenQueries`. |
| "Elegir estructura/algoritmos y justificar decisiones (incluyendo recorrido del arbol)" | Cumple | `docs/DECISIONES_TECNICAS.md` | Documento de justificacion tecnica con alternativas y complejidad. |

## Validacion ejecutada

Fecha de ejecucion: 2026-03-23 (America/Costa_Rica).

Backend:
- Compilacion OK (`g++`): `backend/clinic_api.exe`.
- Ejecucion OK: API escuchando en `http://localhost:8080`.

Frontend:
- Dependencias OK: `npm ci`.
- Build OK: `npm run build`.
- Levante verificado: `HTTP=200` sobre `http://127.0.0.1:5173`.

Pruebas de humo endpoints:
- `GET /api/cola`: PASS.
- `GET /api/busqueda`:
  - cedula + lineal: PASS.
  - cedula + binaria + gravedad: PASS.
  - nombre + ambos + rango fechas: PASS.
  - solo filtros (fecha/gravedad): PASS.
- `GET /api/diagnosticos/tree`: PASS.
- `GET /api/diagnosticos/especialidad`: PASS.
- `GET /api/diagnosticos/busqueda`: PASS.
- `POST /api/benchmark/sort` (subset algoritmos y all): PASS.
- `POST /api/benchmark/search`: PASS.
