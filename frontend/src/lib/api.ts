export interface ApiPaciente {
  cedula: string;
  nombre: string;
  edad: number;
  fechaRegistro: string;
  prioridad: 1 | 2 | 3;
  tipoSangre: string;
  diagnosticoAsignado: string;
  estado: "En espera" | "En atención" | "Atendido";
}

export interface ApiConsulta {
  id: string;
  idConsulta: string;
  cedulaPaciente: string;
  fecha: string;
  medicoTratante: string;
  diagnostico: string;
  gravedad: 1 | 2 | 3 | 4 | 5;
  costo: number;
}

export interface ApiDiagnostico {
  codigo: string;
  nombre: string;
  area: string;
  especialidad: string;
  categoria: string;
  subcategoria: string;
  descripcion: string;
  tratamiento?: string;
}

export interface ApiDiagnosticoTreeNode {
  area: string;
  especialidades: {
    nombre: string;
    diagnosticos: ApiDiagnostico[];
  }[];
}

export interface ApiBusquedaResponse {
  criterio: string;
  algoritmo: string;
  termino: string;
  tiempoMs: number;
  filtros?: {
    fechaDesde?: string;
    fechaHasta?: string;
    gravedad?: number;
  };
  filtrosAplicados?: boolean;
  comparativa: {
    linealMs: number;
    binariaMs: number;
  };
  linealMs?: number;
  binariaMs?: number;
  resultadosLineal?: number;
  resultadosBinaria?: number;
  resultados: ApiPaciente[];
}

export interface ApiSortBenchmarkResponse {
  dataset: string;
  campo: string;
  size: number;
  sampleSize?: number;
  selectedAlgorithms?: string[];
  results: Array<{
    name: string;
    algorithm: string;
    timeMs: number;
  }>;
  growth: Array<{
    size: string;
    bubble: number;
    selection: number;
    insertion: number;
    quick: number;
  }>;
  searchComparison?: ApiSearchBenchmarkResponse;
}

export interface ApiSearchBenchmarkResponse {
  size: number;
  cedula: string;
  linealMs: number;
  binariaMs: number;
  sortMs: number;
  binariaTotalMs: number;
  improvementPct: number;
  improvementWithoutSortPct?: number;
  improvementWithSortPct?: number;
  breakEvenQueries?: number | null;
  found: boolean;
}

export interface ApiSystemMetrics {
  ramUsagePct: number;
  ramUsedMb: number;
  ramTotalMb: number;
  cpuUsagePct: number;
  cpuTempC: number | null;
  cpuCores: number;
  systemLoad: number;
  collectedAt: string;
  machineName?: string;
  processId?: number;
  source?: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload?.error) {
        message = payload.error;
      }
    } catch {
      // Ignore parse errors and keep default message.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function getPacientes() {
  return request<ApiPaciente[]>("/api/pacientes");
}

export function getPacienteByCedula(cedula: string) {
  return request<ApiPaciente>(`/api/pacientes/${encodeURIComponent(cedula)}`);
}

export function createPaciente(payload: {
  cedula: string;
  nombre: string;
  edad: number;
  prioridad: number;
  tipoSangre: string;
  diagnosticoAsignado: string;
}) {
  return request<ApiPaciente>("/api/pacientes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getConsultas() {
  return request<ApiConsulta[]>("/api/consultas");
}

export function createConsulta(payload: {
  cedulaPaciente: string;
  medicoTratante: string;
  diagnostico: string;
  gravedad: number;
  costo: number;
  fecha?: string;
}) {
  return request<ApiConsulta>("/api/consultas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getDiagnosticos() {
  return request<ApiDiagnostico[]>("/api/diagnosticos");
}

export function getDiagnosticosTree() {
  return request<ApiDiagnosticoTreeNode[]>("/api/diagnosticos/tree");
}

export function searchDiagnosticos(params: { codigo?: string; nombre?: string }) {
  const query = new URLSearchParams();
  if (params.codigo) {
    query.set("codigo", params.codigo);
  }
  if (params.nombre) {
    query.set("nombre", params.nombre);
  }
  const suffix = query.toString();
  return request<{
    codigo: string;
    nombre: string;
    total: number;
    diagnosticos: ApiDiagnostico[];
  }>(`/api/diagnosticos/busqueda${suffix ? `?${suffix}` : ""}`);
}

export function getDiagnosticosByEspecialidad(especialidad: string) {
  const query = new URLSearchParams();
  query.set("nombre", especialidad);
  return request<{
    especialidad: string;
    total: number;
    diagnosticos: ApiDiagnostico[];
  }>(`/api/diagnosticos/especialidad?${query.toString()}`);
}

export function getCola() {
  return request<ApiPaciente[]>("/api/cola");
}

export function registrarEnCola(cedula: string) {
  return request<ApiPaciente>("/api/cola/registrar", {
    method: "POST",
    body: JSON.stringify({ cedula }),
  });
}

export function atenderSiguiente() {
  return request<{ mensaje: string; paciente: ApiPaciente }>("/api/cola/atender", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function atenderPaciente(cedula: string) {
  return request<{ mensaje: string; paciente: ApiPaciente }>(
    `/api/cola/atender/${encodeURIComponent(cedula)}`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  ).catch((error) => {
    const message = error instanceof Error ? error.message.toLowerCase() : "";

    // Backward compatibility: some deployed backends only expose /api/cola/atender.
    if (message.includes("endpoint no encontrado") || message.includes("http 404")) {
      return request<{ mensaje: string; paciente: ApiPaciente }>("/api/cola/atender", {
        method: "POST",
        body: JSON.stringify({}),
      });
    }

    throw error;
  });
}

export function buscarPacientes(params: {
  cedula?: string;
  nombre?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  gravedad?: number;
  algoritmo?: "lineal" | "binaria" | "ambos";
}) {
  const query = new URLSearchParams();
  if (params.cedula) {
    query.set("cedula", params.cedula);
  }
  if (params.nombre) {
    query.set("nombre", params.nombre);
  }
  if (params.fechaDesde) {
    query.set("fechaDesde", params.fechaDesde);
  }
  if (params.fechaHasta) {
    query.set("fechaHasta", params.fechaHasta);
  }
  if (params.gravedad && params.gravedad >= 1 && params.gravedad <= 5) {
    query.set("gravedad", String(params.gravedad));
  }
  if (params.algoritmo) {
    query.set("algoritmo", params.algoritmo);
  }
  const suffix = query.toString();
  return request<ApiBusquedaResponse>(`/api/busqueda${suffix ? `?${suffix}` : ""}`);
}

export function runSortBenchmark(payload: {
  dataset: "pacientes" | "consultas";
  campo: string;
  size: number;
  algoritmos?: Array<"bubble" | "selection" | "insertion" | "quick">;
}) {
  return request<ApiSortBenchmarkResponse>("/api/benchmark/sort", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function runSearchBenchmark(payload: { cedula?: string; size: number }) {
  return request<ApiSearchBenchmarkResponse>("/api/benchmark/search", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSystemMetrics() {
  return request<ApiSystemMetrics>("/api/system/metrics");
}
