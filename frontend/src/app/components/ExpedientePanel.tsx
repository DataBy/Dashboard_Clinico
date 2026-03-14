import { Badge } from "./Badge";
import type { ExpedienteRecord } from "../../lib/expediente";

interface ExpedientePanelProps {
  record: ExpedienteRecord;
}

export function ExpedientePanel({ record }: ExpedientePanelProps) {
  const { paciente, consultas, diagnosticos, historialBasico } = record;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/45 bg-white/55 p-4">
        <div>
          <p className="mb-1 text-xs text-gray-600">Paciente</p>
          <p className="font-semibold text-gray-900">{paciente.nombre}</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-gray-600">ID</p>
          <p className="font-medium text-gray-900">{paciente.cedula}</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-gray-600">Edad</p>
          <p className="font-medium text-gray-900">{paciente.edad} años</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-gray-600">Fecha de registro</p>
          <p className="font-medium text-gray-900">{paciente.fechaRegistro}</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-gray-600">Tipo de sangre</p>
          <p className="font-medium text-gray-900">{paciente.tipoSangre}</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-gray-600">Estado</p>
          <Badge variant="estado" value={paciente.estado} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/45 bg-white/55 p-4">
        <p className="mb-2 text-sm font-semibold text-gray-900">Historial médico</p>
        <p className="text-sm leading-relaxed text-gray-700">{historialBasico}</p>
      </div>

      <div className="rounded-2xl border border-white/45 bg-white/55 p-4">
        <p className="mb-2 text-sm font-semibold text-gray-900">Diagnósticos</p>
        <div className="flex flex-wrap gap-2">
          {diagnosticos.map((diagnostico) => (
            <span
              key={diagnostico}
              className="rounded-xl bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700"
            >
              {diagnostico}
            </span>
          ))}
          {diagnosticos.length === 0 && <span className="text-sm text-gray-500">Sin diagnósticos.</span>}
        </div>
      </div>

      <div className="rounded-2xl border border-white/45 bg-white/55 p-4">
        <p className="mb-3 text-sm font-semibold text-gray-900">Consultas</p>

        {consultas.length > 0 ? (
          <div className="space-y-3">
            {consultas.map((consulta) => (
              <div
                key={consulta.idConsulta || consulta.id}
                className="rounded-xl border border-gray-200 bg-white/70 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {consulta.idConsulta || consulta.id}
                  </p>
                  <Badge variant="gravedad" value={consulta.gravedad} />
                </div>
                <p className="text-xs text-gray-600">{consulta.fecha}</p>
                <p className="mt-2 text-sm text-gray-800">{consulta.diagnostico}</p>
                <p className="mt-1 text-xs text-gray-600">{consulta.medicoTratante}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-white/60 p-3 text-sm text-gray-500">
            No hay consultas registradas para este paciente.
          </div>
        )}
      </div>
    </div>
  );
}
