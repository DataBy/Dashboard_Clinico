import { useEffect, useMemo, useState } from "react";
import { FileText, Search, User } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { Badge } from "../components/Badge";
import { GlassModal } from "../components/GlassModal";
import { ExpedientePanel } from "../components/ExpedientePanel";
import { useGlassToast } from "../components/GlassToast";
import { type ApiConsulta, type ApiPaciente, getConsultas, getPacientes } from "../../lib/api";
import {
  buildExpedienteRecord,
  getLastExpediente,
  saveLastExpediente,
  type ExpedienteRecord,
} from "../../lib/expediente";

export function Consultar() {
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [pacientes, setPacientes] = useState<ApiPaciente[]>([]);
  const [consultas, setConsultas] = useState<ApiConsulta[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<ApiPaciente | null>(null);
  const [selectedExpediente, setSelectedExpediente] = useState<ExpedienteRecord | null>(null);
  const { showToast } = useGlassToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pacientesApi, consultasApi] = await Promise.all([getPacientes(), getConsultas()]);
        setPacientes(pacientesApi);
        setConsultas(consultasApi);

        const lastExpediente = getLastExpediente();
        const lastPaciente =
          lastExpediente &&
          pacientesApi.find((paciente) => paciente.cedula === lastExpediente.paciente.cedula);

        setSelectedPaciente((prev) => prev ?? lastPaciente ?? pacientesApi[0] ?? null);
      } catch (error) {
        console.error(error);
        showToast("No se pudo cargar la información del backend.", 2500);
      }
    };

    void loadData();
  }, []);

  const pacientesFiltrados = useMemo(() => {
    const term = appliedSearchTerm.trim().toLowerCase();
    if (!term) {
      return pacientes;
    }

    return pacientes.filter(
      (paciente) =>
        paciente.cedula.toLowerCase().includes(term) || paciente.nombre.toLowerCase().includes(term)
    );
  }, [appliedSearchTerm, pacientes]);

  useEffect(() => {
    if (!selectedPaciente && pacientesFiltrados.length > 0) {
      setSelectedPaciente(pacientesFiltrados[0]);
      return;
    }

    if (
      selectedPaciente &&
      !pacientesFiltrados.some((paciente) => paciente.cedula === selectedPaciente.cedula)
    ) {
      setSelectedPaciente(pacientesFiltrados[0] ?? null);
    }
  }, [pacientesFiltrados, selectedPaciente]);

  const ultimaConsulta = useMemo(() => {
    if (!selectedPaciente) {
      return null;
    }

    return [...consultas]
      .filter((consulta) => consulta.cedulaPaciente === selectedPaciente.cedula)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
  }, [consultas, selectedPaciente]);

  const quickList = pacientesFiltrados.slice(0, 8);

  const executeSearch = () => {
    setAppliedSearchTerm(searchInput.trim());
  };

  const handleOpenExpediente = () => {
    if (!selectedPaciente) {
      return;
    }

    const record = buildExpedienteRecord(
      selectedPaciente,
      consultas.filter((consulta) => consulta.cedulaPaciente === selectedPaciente.cedula)
    );
    saveLastExpediente(record);
    setSelectedExpediente(record);
  };

  return (
    <div className="p-8 bg-gray-50">
      <TopBar title="Consultar Información" showFilters={false} />

      {/* Search bar */}
      <div className="mb-8">
        <div className="max-w-2xl flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cédula o nombre..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  executeSearch();
                }
              }}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
            />
          </div>

          <button
            type="button"
            onClick={executeSearch}
            className="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:shadow-lg transition-all"
          >
            Buscar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Ficha del paciente */}
        <div className="bg-white rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Ficha del Paciente</h2>
          </div>

          {selectedPaciente ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold">
                  {selectedPaciente.nombre.charAt(0)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Nombre</p>
                  <p className="font-medium text-gray-900">{selectedPaciente.nombre}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Cédula</p>
                  <p className="font-medium text-gray-900">{selectedPaciente.cedula}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Edad</p>
                  <p className="font-medium text-gray-900">{selectedPaciente.edad} años</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tipo de sangre</p>
                  <p className="font-medium text-gray-900">{selectedPaciente.tipoSangre}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Prioridad</p>
                  <Badge variant="prioridad" value={selectedPaciente.prioridad} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Estado</p>
                  <Badge variant="estado" value={selectedPaciente.estado} />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Diagnóstico asignado</p>
                <p className="font-medium text-gray-900">{selectedPaciente.diagnosticoAsignado}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Fecha de registro</p>
                <p className="font-medium text-gray-900">{selectedPaciente.fechaRegistro}</p>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No hay paciente seleccionado
            </div>
          )}
        </div>

        {/* Última consulta */}
        <div className="space-y-6">
          {ultimaConsulta && (
            <div className="bg-blue-50 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Última Consulta</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">ID de consulta</p>
                  <p className="font-medium text-gray-900">{ultimaConsulta.idConsulta || ultimaConsulta.id}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Fecha</p>
                  <p className="font-medium text-gray-900">{ultimaConsulta.fecha}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Médico tratante</p>
                  <p className="font-medium text-gray-900">{ultimaConsulta.medicoTratante}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Diagnóstico</p>
                  <p className="font-medium text-gray-900">{ultimaConsulta.diagnostico}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Gravedad</p>
                  <Badge variant="gravedad" value={ultimaConsulta.gravedad} />
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Costo</p>
                  <p className="text-2xl font-bold text-blue-700">${ultimaConsulta.costo.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleOpenExpediente}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:shadow-lg transition-all"
          >
            Abrir expediente completo
          </button>
        </div>
      </div>

      {/* Quick search results */}
      <div className="mt-8 bg-white rounded-3xl p-8 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Seleccionar paciente</h3>
        <div className="grid grid-cols-4 gap-4">
          {quickList.map((paciente) => (
            <button
              key={paciente.cedula}
              onClick={() => setSelectedPaciente(paciente)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedPaciente?.cedula === paciente.cedula
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                  {paciente.nombre.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{paciente.nombre}</p>
                  <p className="text-xs text-gray-500">{paciente.cedula}</p>
                </div>
              </div>
            </button>
          ))}

          {quickList.length === 0 && (
            <div className="col-span-4 py-6 text-center text-sm text-gray-400">
              No hay pacientes para el término buscado.
            </div>
          )}
        </div>
      </div>

      <GlassModal
        open={Boolean(selectedExpediente)}
        onClose={() => setSelectedExpediente(null)}
        title={selectedExpediente ? `Expediente: ${selectedExpediente.paciente.nombre}` : "Expediente"}
      >
        {selectedExpediente && <ExpedientePanel record={selectedExpediente} />}
      </GlassModal>
    </div>
  );
}
