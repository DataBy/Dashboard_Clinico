# Decisiones Tecnicas

## Alcance

Este documento resume las decisiones de estructura de datos y algoritmos aplicadas para cumplir los modulos del PDF del laboratorio.

## Modulo 1 - Estructura de atencion

- Estructura elegida: cola por prioridad modelada sobre `vector<Paciente>` con ordenamiento por prioridad y estado.
- Implementacion: `backend/services/cola_pacientes.cpp`.
- Justificacion: permite registrar/atender y mantener compatibilidad con datos persistidos en CSV sin migrar modelo.
- Complejidad:
  - Obtener cola ordenada: `O(n log n)` por ordenamiento.
  - Registrar/actualizar estado: `O(1)` promedio sobre `unordered_map` de estados.

## Modulo 2 - Expedientes y busquedas

- Estructura elegida:
  - Datos base en `vector<Paciente>` y `vector<Consulta>`.
  - Indice auxiliar por historial: `unordered_map<cedula, vector<Consulta*>>`.
  - Busqueda binaria por cedula sobre vector ordenado por cedula.
  - Busqueda binaria por nombre parcial mediante indice ordenado por nombre normalizado y claves de prefijo.
- Implementacion principal:
  - `backend/services/busquedas.h` y `backend/services/busquedas.cpp`
  - Endpoint: `backend/main_backend.cpp` (`GET /api/busqueda`)
- Alternativas consideradas:
  - `unordered_map` solo por cedula: rapido para exactas, pero no resuelve nombre parcial por prefijo ni comparativa lineal/binaria.
  - Trie de nombres: excelente para prefijos, pero mayor complejidad de mantenimiento e integracion para este laboratorio.
- Decision final:
  - Mantener estructura simple (vectores) y construir indices ordenados por solicitud para comparar algoritmos en condiciones equivalentes.
- Complejidad:
  - Cedula lineal: `O(n)`.
  - Cedula binaria (sobre ordenado): `O(log n)` busqueda.
  - Nombre lineal por prefijo: `O(n * k)` (k = cantidad de claves por paciente).
  - Nombre binaria por prefijo: `O(log m + r)` (m = tamano del indice, r = coincidencias inspeccionadas).
  - Filtro por historial de consultas: `O(c_p)` por paciente candidato.
  - Espacio extra: `O(n + c)` por indices auxiliares.

## Modulo 3 - Arbol de diagnosticos

- Estructura elegida:
  - Jerarquia `Area -> Especialidad -> Diagnostico` generada por agrupacion en mapas y serializada a JSON.
  - Endpoints dedicados:
    - arbol completo
    - busqueda por codigo/nombre
    - listado directo por especialidad
- Implementacion:
  - `backend/services/arbol_diagnosticos.cpp`
  - `backend/main_backend.cpp` (`/api/diagnosticos/tree`, `/api/diagnosticos/busqueda`, `/api/diagnosticos/especialidad`)
  - UI explicita por especialidad: `frontend/src/app/pages/Diagnostico.tsx`
- Recorrido elegido y justificacion:
  - Recorrido jerarquico en preorden (`Area`, luego `Especialidades`, luego `Diagnosticos`) porque coincide con la navegacion natural de la interfaz y minimiza transformaciones en frontend.
- Complejidad:
  - Construccion de arbol: `O(d log d)` por agrupaciones/ordenamiento.
  - Busqueda por codigo/nombre: `O(d)` lineal.
  - Listado por especialidad (filtrado): `O(d)`.

## Modulo 4 - Laboratorio de rendimiento

- Estructura elegida:
  - Benchmark de ordenamiento configurable por subconjunto de algoritmos.
  - Benchmark de busqueda con dos escenarios:
    - sin costo de ordenar (`linealMs` vs `binariaMs`)
    - con costo de ordenar (`linealMs` vs `binariaTotalMs = sortMs + binariaMs`)
- Implementacion:
  - `backend/algorithms/sorting.cpp`
  - `backend/performance/benchmark.cpp`
  - `backend/main_backend.cpp` (`POST /api/benchmark/sort`, `POST /api/benchmark/search`)
  - `frontend/src/app/pages/Rendimiento.tsx`
- Formula de amortizacion:
  - `breakEvenQueries = ceil(sortMs / (linealMs - binariaMs))` cuando `linealMs > binariaMs`.
  - Si `linealMs <= binariaMs`, no hay punto de amortizacion.
- Complejidad:
  - Bubble/Selection/Insertion: `O(n^2)`.
  - Quick (promedio): `O(n log n)`.
  - Busqueda lineal: `O(n)`.
  - Busqueda binaria: `O(log n)` en ordenado.

## Generacion de datasets

- Enfoque: generacion programatica y reproducible por semilla fija.
- Implementacion: `backend/dataset_generator.cpp`.
- Salidas:
  - `size_500`, `size_5000`, `size_50000`, `size_200000`
  - opcion para copiar un tamano como dataset principal (`--main-size`).
- Razon: permite repetir experimentos y comparar resultados entre ejecuciones.

## Ambiguedades del PDF y decisiones aplicadas

- Ambiguedad: el PDF no define formato exacto de fechas en consultas.
  - Decision: aceptar fechas ISO con o sin hora, y filtrar por prefijo `YYYY-MM-DD`.
- Ambiguedad: "busqueda parcial por nombre" no fija si es `contains` o prefijo.
  - Decision: prefijo sobre nombre normalizado (cumpliendo explicitamente la parte de indice por prefijo).
- Ambiguedad: escenario de busqueda binaria respecto al costo de ordenar.
  - Decision: reportar ambos escenarios y una conclusion separada para cada uno.
