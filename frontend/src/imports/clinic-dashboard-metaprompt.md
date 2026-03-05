## Metaprompt para Figma Make — UI idéntica a la referencia (Dashboard) adaptada a “Laboratorio 1 – Gestión de Clínica”

### OBJETIVO
Crea una interfaz **idéntica en diseño (layout, estilo visual, jerarquía, espaciados, radios, sombras y composición)** a la UI de referencia (sidebar izquierda + contenido central con cards + panel derecho con calendario y listas), pero con contenido y pantallas para **Laboratorio 1 – Gestión de Clínica con análisis de rendimiento**.

**IMPORTANTE**
- Clonar estética: bordes redondeados grandes, sombras suaves, tarjetas con gradientes pastel, tipografía sans moderna, iconos minimalistas, mucho espacio en blanco.
- Mantener estructura 3 columnas: **Sidebar fija** / **Contenido central** / **Panel derecho**.

---

## 1) FRAME PRINCIPAL
- Frame: **Desktop 1440×900**
- Grid: 8pt
- Fondo: blanco/gris muy claro con tinte frío
- Contenedor principal: esquinas muy redondeadas, sombra suave (igual a referencia)

### ESTRUCTURA EN 3 COLUMNAS (idéntica a referencia)
1) **Sidebar izquierda fija** (~260px)
2) **Columna central scroll** (cards grandes + tablas + formularios)
3) **Panel derecho** (~360px) con widgets (calendario + listas)

---

## 2) DESIGN TOKENS (estilo)
### TIPOGRAFÍA
- Sans moderna tipo **Inter/SF Pro**
- H1 (título): grande y bold
- H2: mediano semibold
- Body: regular
- Texto secundario: gris suave

### COLORES
- Sidebar: gradiente morado/índigo (igual a referencia)
- Cards: paletas pastel (lila, azul suave, rosa suave, verde suave) con gradientes leves
- Badges:
  - Prioridad 1 (crítico) = tono fuerte
  - Prioridad 2 (urgente) = tono medio
  - Prioridad 3 (normal) = tono suave
- Estados:
  - Sidebar active: pill/rect redondeado con contraste
  - Hover: leve brillo/opacity

### SOMBRAS Y RADIOS
- Radios grandes (2xl/3xl)
- Sombras suaves (sin bordes duros)
- Separación generosa entre secciones

---

## 3) COMPONENTES (crear como componentes + variantes)
1) **SidebarItem**: default / hover / active (icono + label)
2) **TopBar**: título + search + icons (noti/settings)
3) **FilterChip** (dropdown look)
4) **PrimaryCardLarge** (como “My Courses”):
   - icono/ilustración simple
   - título
   - descripción corta
   - CTA circular con flecha
5) **DataTable**:
   - header sticky
   - filas con zebra sutil
   - acciones por fila (ver/editar)
6) **FormInputs**:
   - text input
   - select
   - date picker
   - stepper / segmented control
7) **Badge**:
   - Prioridad (1/2/3)
   - Gravedad (1–5)
   - Estado (En espera / En atención / Atendido)
8) **RightPanelWidget**:
   - mini header
   - lista (avatar opcional / icono)
   - contador

---

## 4) NAVEGACIÓN (SIDEBAR) — NOMBRES ADAPTADOS
Crea sidebar con estos items (en este orden):
1. Dashboard
2. Registro de Pacientes
3. Consultar Información
4. Diagnóstico
5. Búsqueda
6. Expedientes
7. Rendimiento (Laboratorio)

Incluye abajo:
- Settings
- Directory (si aplica, como la referencia)

---

## 5) DATOS DEL DOMINIO (usar en forms/tablas)
### ENTIDADES
**Paciente**
- cédula
- nombre
- edad
- fecha de registro
- nivel de prioridad (1 crítico, 2 urgente, 3 normal)
- tipo de sangre
- diagnóstico asignado

**Consulta**
- ID consulta
- cédula paciente
- fecha
- médico tratante
- diagnóstico
- gravedad (1–5)
- costo

**Diagnóstico**
- código
- nombre
- categoría
- subcategoría
- descripción

### DATASET SIZES (selector laboratorio)
- 500
- 5000
- 50000
- 200000

---

## 6) PANTALLAS (mantén layout idéntico, cambia contenido)
Crea estas pantallas. Cada pantalla conserva:
- TopBar con título + búsqueda
- Chips de filtros (cuando aplique)
- Panel derecho fijo con widgets

---

### A) DASHBOARD (OVERVIEW)
#### Centro: 4 CARDS GRANDES (idénticas a referencia)
1) **Atención (Cola con Prioridad)**
- Texto: “Lista de espera en tiempo real por prioridad.”
- CTA: “Ver cola”

2) **Expedientes y Búsquedas**
- Texto: “Busca por cédula, nombre parcial, rango de fechas y gravedad; compara tiempos.”
- CTA: “Abrir”

3) **Árbol de Diagnósticos**
- Texto: “Navega Área → Especialidad → Diagnóstico; busca por nombre o código.”
- CTA: “Explorar”

4) **Laboratorio de Rendimiento**
- Texto: “Compara algoritmos de ordenamiento y búsquedas con gráficas e historial.”
- CTA: “Ir al lab”

#### Panel derecho (widgets)
- Calendario mensual (como referencia)
- Widget: “Pacientes en espera” (lista con badges de prioridad 1/2/3)
- Widget: “En atención / último atendido”
- Widget: “Actividad reciente” (últimas consultas)

---

### B) REGISTRO DE PACIENTES (incluye Cola en vivo)
#### Centro arriba: FORM “Nuevo paciente”
- cédula (input)
- nombre (input)
- edad (input number)
- prioridad (select 1/2/3)
- tipo sangre (select)
- diagnóstico asignado (select)
- fecha registro (auto)
- Botón primario: “Registrar”

#### Centro abajo: “Lista de espera”
- Lista/tabla ordenada por prioridad
- Columnas: prioridad (badge), cédula, nombre, edad, diagnóstico, fecha registro, acciones
- Acciones: “Atender”, “Ver expediente”
- Botón destacado: “Atender siguiente”

Panel derecho:
- Contador por prioridad
- “Tiempo promedio de espera” (mock)
- “Siguiente en cola” (card mini)

---

### C) CONSULTAR INFORMACIÓN (perfil rápido)
- Búsqueda global: cédula / nombre
- Card grande: “Ficha del paciente” (datos + badges)
- Card: “Última consulta” (médico, diagnóstico, gravedad, costo)
- CTA: “Abrir expediente completo”

Panel derecho:
- “Próximas atenciones” (mock)
- “Alertas” (prioridad 1)

---

### D) DIAGNÓSTICO (árbol jerárquico)
Centro dividido en 2:
- Izquierda: árbol navegable Área → Especialidad → Diagnóstico
- Derecha: detalle del diagnóstico (código, nombre, categoría, subcategoría, descripción)
- Search: por nombre o código
- Botón: “Mostrar diagnósticos de esta especialidad” (lista)

Panel derecho:
- “Más usados” (mock)
- “Recientes” (mock)

---

### E) BÚSQUEDA (comparativa de tiempos)
Arriba: chips/filtros
- Tipo de búsqueda: cédula exacta / nombre parcial / rango fechas / gravedad
- Dataset size: 500/5000/50000/200000
- Toggle: “Lineal” vs “Binaria” (cuando aplique)
- Botón: “Ejecutar búsqueda”

Centro:
- Tabla de resultados
- Card comparativa: Tiempo (ms) Lineal vs Binaria (barras horizontales)

Panel derecho:
- Historial corto de pruebas (mock)
- “Mejor método” (badge)

---

### F) EXPEDIENTES (historial de consultas)
- Search: cédula/nombre
- Filtros: rango fechas, gravedad
- Tabla principal: fecha, médico, diagnóstico, gravedad (badge), costo
- Panel detalle: al seleccionar fila, muestra detalle completo
- CTA: “Agregar consulta” (modal con form)

Panel derecho:
- Resumen del paciente (mini)
- Estadísticas rápidas (mock)

---

### G) RENDIMIENTO (LABORATORIO) — ordenamientos + gráficas
#### Controles arriba (chips como referencia)
- Dataset: Pacientes / Consultas
- Ordenar por:
  - Pacientes: nombre / edad / fecha registro / prioridad
  - Consultas: fecha / gravedad / costo
- Tamaño: 500/5000/50000/200000
- Algoritmos (multiselect): Bubble, Selection, Insertion, Quick
- Botón primario: “Ejecutar experimento”

#### Cards grandes centro (visualizaciones)
1) Card: “Tiempos por algoritmo” (gráfica barras)
2) Card: “Curva de crecimiento” (líneas por tamaño)
3) Card: “Historial de ejecuciones” (tabla)
4) Card: “Lineal vs Binaria (sobre ordenado)” (tiempos + conclusión badge)

Panel derecho:
- “Última ejecución”
- “Top algoritmo”
- “Notas” (mock)

---

## 7) MOCK DATA (obligatorio)
Genera datos realistas:
- 10–15 pacientes
- 20–30 consultas
- 15–25 diagnósticos con jerarquía (área/especialidad/diagnóstico)
Incluye:
- prioridad 1/2/3
- gravedad 1–5
- costos variados
- médicos con nombres realistas

---

## 8) PROTOTYPE (interacciones mínimas)
- Sidebar navega entre pantallas (Instant)
- Cards del Dashboard linkean a su sección
- Tablas: seleccionar fila → abre panel detalle
- Botones “Ejecutar”:
  - idle → running (spinner) → done (resultados visibles)
- Animaciones suaves tipo referencia (smart animate sutil)

---

## 9) REGLA DE FIDELIDAD VISUAL (NO NEGOCIABLE)
- Mantén **proporciones** de columnas, padding, radios, sombras, estilo de cards y panel derecho **idénticos** a la referencia.
- Mantén el calendario y listas del panel derecho con el mismo look.
- Mantén chips de filtros arriba con el mismo estilo.
- Mantén CTA circular con flecha en cards grandes.