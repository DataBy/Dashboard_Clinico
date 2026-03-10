import { useEffect, useMemo, useState } from "react";
import { FileText, Filter, Plus, Search } from "lucide-react";
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

export function Expedientes() {
  const [consultas, setConsultas] = useState<ApiConsulta[]>([]);
  const [pacientes, setPacientes] = useState<ApiPaciente[]>([]);
  const [selectedConsulta, setSelectedConsulta] = useState<ApiConsulta | null>(null);
  const [selectedExpediente, setSelectedExpediente] = useState<ExpedienteRecord | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [gravedadFilter, setGravedadFilter] = useState("all");
  const { showToast } = useGlassToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [consultasApi, pacientesApi] = await Promise.all([getConsultas(), getPacientes()]);
        setConsultas(consultasApi);
        setPacientes(pacientesApi);

        const last = getLastExpediente();
        if (last) {
          const consultaFromLast = consultasApi.find(
            (consulta) => consulta.cedulaPaciente === last.paciente.cedula
          );
          setSelectedConsulta((prev) => prev ?? consultaFromLast ?? consultasApi[0] ?? null);
        } else {
          setSelectedConsulta((prev) => prev ?? consultasApi[0] ?? null);
        }
      } catch (error) {
        console.error(error);
        showToast("No se pudo cargar la informacion del backend.", 2500);
      }
    };

    void loadData();
  }, []);

  const pacientesByCedula = useMemo(() => {
    return new Map(pacientes.map((paciente) => [paciente.cedula, paciente]));
  }, [pacientes]);

  const consultasFiltradas = useMemo(() => {
    const lowered = searchTerm.trim().toLowerCase();

    return consultas.filter((consulta) => {
      const paciente = pacientesByCedula.get(consulta.cedulaPaciente);
      const matchesTerm =
        !lowered ||
        consulta.cedulaPaciente.toLowerCase().includes(lowered) ||
        (paciente?.nombre.toLowerCase().includes(lowered) ?? false);

      const matchesSeverity =
        gravedadFilter === "all" || String(consulta.gravedad) === gravedadFilter;

      return matchesTerm && matchesSeverity;
    });
  }, [consultas, gravedadFilter, pacientesByCedula, searchTerm]);

  useEffect(() => {
    if (!selectedConsulta && consultasFiltradas.length > 0) {
      setSelectedConsulta(consultasFiltradas[0]);
      return;
    }

    if (
      selectedConsulta &&
      !consultasFiltradas.some(
        (consulta) =>
          (consulta.idConsulta || consulta.id) ===
          (selectedConsulta.idConsulta || selectedConsulta.id)
      )
    ) {
      setSelectedConsulta(consultasFiltradas[0] ?? null);
    }
  }, [consultasFiltradas, selectedConsulta]);

  const paciente = useMemo(() => {
    if (!selectedConsulta) {
      return null;
    }
    return pacientesByCedula.get(selectedConsulta.cedulaPaciente) ?? null;
  }, [pacientesByCedula, selectedConsulta]);

  const costoPromedio = consultasFiltradas.length
    ? Math.round(
        consultasFiltradas.reduce((sum, consulta) => sum + consulta.costo, 0) /
          consultasFiltradas.length
      )
    : 0;

  const gravedadPromedio = consultasFiltradas.length
    ? (
        consultasFiltradas.reduce((sum, consulta) => sum + consulta.gravedad, 0) /
        consultasFiltradas.length
      ).toFixed(1)
    : "0.0";

  const executeSearch = () => {
    setSearchTerm(searchInput.trim());
  };

  const openExpediente = () => {
    if (!paciente) {
      return;
    }

    const record = buildExpedienteRecord(
      paciente,
      consultas.filter((consulta) => consulta.cedulaPaciente === paciente.cedula)
    );
    saveLastExpediente(record);
    setSelectedExpediente(record);
  };

  return (
    <div className="p-8 bg-gray-50">
      <TopBar title="Expedientes" showFilters={false} />

      {/* Search and filters */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    executeSearch();
                  }
                }}
                placeholder="Buscar por cedula o nombre..."
                className="w-full pl-10 pr-24 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={executeSearch}
                className="absolute right-1.5 top-1.5 rounded-lg bg-purple-600 px-3 py-1 text-xs text-white hover:bg-purple-700 transition-colors"
              >
                Buscar
              </button>
            </div>
          </div>
          <div>
            <select
              value={gravedadFilter}
              onChange={(event) => setGravedadFilter(event.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todas las gravedades</option>
              <option value="5">Gravedad 5</option>
              <option value="4">Gravedad 4</option>
              <option value="3">Gravedad 3</option>
              <option value="2">Gravedad 2</option>
              <option value="1">Gravedad 1</option>
            </select>
          </div>
          <div>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all">
              <Plus className="w-4 h-4" />
              Nueva consulta
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Tabla de consultas */}
        <div className="col-span-2 bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Historial de Consultas</h2>
            <button className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700">
              <Filter className="w-4 h-4" />
              Filtrar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-700">ID</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-700">Fecha</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-700">Medico</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-700">Diagnostico</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-700">Gravedad</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-700">Costo</th>
                </tr>
              </thead>
              <tbody>
                {consultasFiltradas.slice(0, 12).map((consulta, idx) => {
                  const consultaId = consulta.idConsulta || consulta.id;
                  const selectedId = selectedConsulta ? selectedConsulta.idConsulta || selectedConsulta.id : "";

                  return (
                    <tr
                      key={consultaId}
                      onClick={() => setSelectedConsulta(consulta)}
                      className={`cursor-pointer transition-colors ${
                        idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } ${selectedId === consultaId ? "bg-purple-50" : "hover:bg-gray-100"}`}
                    >
                      <td className="py-3 px-3 text-sm font-medium text-gray-900">{consultaId}</td>
                      <td className="py-3 px-3 text-sm text-gray-700">
                        {new Date(consulta.fecha).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-700">
                        {consulta.medicoTratante.replace("Dr. ", "").replace("Dra. ", "")}
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-700">
                        {consulta.diagnostico.length > 25
                          ? `${consulta.diagnostico.substring(0, 25)}...`
                          : consulta.diagnostico}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="gravedad" value={consulta.gravedad} />
                      </td>
                      <td className="py-3 px-3 text-sm font-medium text-gray-900">
                        ${consulta.costo.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel detalle */}
        <div className="space-y-6">
          {/* Resumen del paciente */}
          {paciente && (
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Resumen del Paciente</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-medium text-lg">
                  {paciente.nombre.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{paciente.nombre}</p>
                  <p className="text-sm text-gray-600">{paciente.cedula}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Edad</p>
                  <p className="font-medium text-gray-900">{paciente.edad} anos</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo de sangre</p>
                  <p className="font-medium text-gray-900">{paciente.tipoSangre}</p>
                </div>
              </div>
            </div>
          )}

          {/* Detalle de consulta */}
          {selectedConsulta && (
            <div className="bg-blue-50 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Detalle Completo</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">ID de consulta</p>
                  <p className="font-medium text-gray-900">{selectedConsulta.idConsulta || selectedConsulta.id}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Fecha y hora</p>
                  <p className="font-medium text-gray-900">{selectedConsulta.fecha}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Medico tratante</p>
                  <p className="font-medium text-gray-900">{selectedConsulta.medicoTratante}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Diagnostico</p>
                  <p className="font-medium text-gray-900 leading-relaxed">{selectedConsulta.diagnostico}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Nivel de gravedad</p>
                  <Badge variant="gravedad" value={selectedConsulta.gravedad} />
                </div>

                <div className="pt-4 border-t border-blue-200">
                  <p className="text-xs text-gray-600 mb-1">Costo de la consulta</p>
                  <p className="text-2xl font-bold text-blue-700">${selectedConsulta.costo.toLocaleString()}</p>
                </div>

                <button
                  type="button"
                  onClick={openExpediente}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm text-white hover:shadow-lg transition-all"
                >
                  Abrir expediente
                </button>
              </div>
            </div>
          )}

          {/* Estadisticas rapidas */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Estadisticas Rapidas</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total consultas</span>
                <span className="font-bold text-purple-600">{consultasFiltradas.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Costo promedio</span>
                <span className="font-bold text-blue-600">${costoPromedio.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Gravedad promedio</span>
                <span className="font-bold text-orange-600">{gravedadPromedio}</span>
              </div>
            </div>
          </div>
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
