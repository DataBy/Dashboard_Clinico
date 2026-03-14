import type { ApiConsulta, ApiPaciente } from "./api";

const LAST_EXPEDIENTE_KEY = "eclinica_last_expediente";

export interface ExpedienteRecord {
  paciente: ApiPaciente;
  consultas: ApiConsulta[];
  diagnosticos: string[];
  historialBasico: string;
}

function parseDate(value: string) {
  const normalized = value.replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sortConsultasDesc(consultas: ApiConsulta[]) {
  return [...consultas].sort((a, b) => {
    const aDate = parseDate(a.fecha);
    const bDate = parseDate(b.fecha);

    if (!aDate && !bDate) {
      return 0;
    }
    if (!aDate) {
      return 1;
    }
    if (!bDate) {
      return -1;
    }
    return bDate.getTime() - aDate.getTime();
  });
}

function buildHistorialBasico(paciente: ApiPaciente, consultas: ApiConsulta[]) {
  if (consultas.length === 0) {
    return `Paciente sin consultas registradas. Diagnóstico asignado inicial: ${paciente.diagnosticoAsignado}.`;
  }

  const latest = consultas[0];
  return `Paciente con ${consultas.length} consulta(s) registrada(s). Última atención: ${latest.fecha} con diagnóstico "${latest.diagnostico}".`;
}

export function buildExpedienteRecord(
  paciente: ApiPaciente,
  consultasPaciente: ApiConsulta[]
): ExpedienteRecord {
  const consultas = sortConsultasDesc(consultasPaciente);
  const diagnosticos = Array.from(
    new Set([
      paciente.diagnosticoAsignado,
      ...consultas.map((consulta) => consulta.diagnostico),
    ])
  ).filter(Boolean);

  return {
    paciente,
    consultas,
    diagnosticos,
    historialBasico: buildHistorialBasico(paciente, consultas),
  };
}

export function saveLastExpediente(record: ExpedienteRecord) {
  try {
    localStorage.setItem(
      LAST_EXPEDIENTE_KEY,
      JSON.stringify({
        paciente: record.paciente,
        consultas: record.consultas,
        diagnosticos: record.diagnosticos,
        historialBasico: record.historialBasico,
      })
    );
  } catch {
    // Ignore storage errors in private mode and restricted environments.
  }
}

export function getLastExpediente(): ExpedienteRecord | null {
  try {
    const raw = localStorage.getItem(LAST_EXPEDIENTE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as ExpedienteRecord | null;
    if (!parsed?.paciente?.cedula) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
