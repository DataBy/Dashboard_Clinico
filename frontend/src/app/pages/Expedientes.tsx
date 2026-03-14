import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Filter, Plus, Search } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { Badge } from "../components/Badge";
import { GlassModal } from "../components/GlassModal";
import { ExpedientePanel } from "../components/ExpedientePanel";
import { useGlassToast } from "../components/GlassToast";
import {
  createConsulta,
  type ApiConsulta,
  type ApiDiagnostico,
  type ApiPaciente,
  getDiagnosticos,
  getConsultas,
  getPacientes,
} from "../../lib/api";
import {
  buildExpedienteRecord,
  getLastExpediente,
  saveLastExpediente,
  type ExpedienteRecord,
} from "../../lib/expediente";

interface NuevaConsultaFormState {
  cedulaPaciente: string;
  medicoTratante: string;
  diagnostico: string;
  gravedad: string;
  costo: string;
  fecha: string;
}

const INITIAL_CONSULTA_FORM: NuevaConsultaFormState = {
  cedulaPaciente: "",
  medicoTratante: "",
  diagnostico: "",
  gravedad: "3",
  costo: "",
  fecha: "",
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeCedula(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function parseConsultaDateMs(value: string) {
  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function toDateTimeLocalValue(value: string) {
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const timezoneOffsetMs = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function nowDateTimeLocalValue() {
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

export function Expedientes() {
  const [consultas, setConsultas] = useState<ApiConsulta[]>([]);
  const [pacientes, setPacientes] = useState<ApiPaciente[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<ApiDiagnostico[]>([]);
  const [selectedConsulta, setSelectedConsulta] = useState<ApiConsulta | null>(null);
  const [selectedExpediente, setSelectedExpediente] = useState<ExpedienteRecord | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [gravedadFilter, setGravedadFilter] = useState("all");
  const [isNuevaConsultaOpen, setIsNuevaConsultaOpen] = useState(false);
  const [isSavingConsulta, setIsSavingConsulta] = useState(false);
  const [consultaPacienteSearch, setConsultaPacienteSearch] = useState("");
  const [consultaForm, setConsultaForm] = useState<NuevaConsultaFormState>(INITIAL_CONSULTA_FORM);
  const { showToast } = useGlassToast();

  const loadData = useCallback(
    async (showErrorToast = true) => {
      try {
        const [consultasApi, pacientesApi, diagnosticosApi] = await Promise.all([
          getConsultas(),
          getPacientes(),
          getDiagnosticos(),
        ]);
        setConsultas(consultasApi);
        setPacientes(pacientesApi);
        setDiagnosticos(diagnosticosApi);

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
        if (showErrorToast) {
          showToast("No se pudo cargar la informacion del backend.", 2500);
        }
      }
    },
    [showToast]
  );

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  const pacientesByCedula = useMemo(() => {
    return new Map(pacientes.map((paciente) => [paciente.cedula, paciente]));
  }, [pacientes]);

  const diagnosticosByCodigo = useMemo(() => {
    return new Map(diagnosticos.map((diagnostico) => [diagnostico.codigo, diagnostico]));
  }, [diagnosticos]);

  const medicosDisponibles = useMemo(() => {
    const medicos = Array.from(
      new Set(
        consultas
          .map((consulta) => consulta.medicoTratante.trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "es"));

    if (consultaForm.medicoTratante && !medicos.includes(consultaForm.medicoTratante)) {
      medicos.unshift(consultaForm.medicoTratante);
    }

    return medicos;
  }, [consultaForm.medicoTratante, consultas]);

  const diagnosticosDisponibles = useMemo(() => {
    const options = diagnosticos.map((diagnostico) => ({
      value: diagnostico.nombre,
      label: `${diagnostico.codigo} - ${diagnostico.nombre}`,
    }));

    if (consultaForm.diagnostico && !options.some((option) => option.value === consultaForm.diagnostico)) {
      options.unshift({
        value: consultaForm.diagnostico,
        label: consultaForm.diagnostico,
      });
    }

    return options;
  }, [consultaForm.diagnostico, diagnosticos]);

  const getLatestConsultaByCedula = useCallback(
    (cedula: string) => {
      return consultas
        .filter((consulta) => consulta.cedulaPaciente === cedula)
        .sort((a, b) => parseConsultaDateMs(b.fecha) - parseConsultaDateMs(a.fecha))[0];
    },
    [consultas]
  );

  const pacientesFiltradosParaFormulario = useMemo(() => {
    const term = consultaPacienteSearch.trim();
    const normalizedTerm = normalizeText(term);
    const normalizedCedulaTerm = normalizeCedula(term);

    return pacientes
      .filter((item) => {
      if (!term) {
        return true;
      }

      return (
        normalizeCedula(item.cedula).includes(normalizedCedulaTerm) ||
        normalizeText(item.nombre).includes(normalizedTerm)
      );
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [consultaPacienteSearch, pacientes]);

  const consultasFiltradas = useMemo(() => {
    const trimmedSearch = searchTerm.trim();
    const normalizedSearch = normalizeText(trimmedSearch);
    const normalizedSearchCedula = normalizeCedula(trimmedSearch);

    return consultas
      .filter((consulta) => {
        const paciente = pacientesByCedula.get(consulta.cedulaPaciente);
        const normalizedCedula = normalizeCedula(consulta.cedulaPaciente);
        const normalizedNombre = normalizeText(paciente?.nombre ?? "");

        const matchesTerm =
          !trimmedSearch ||
          normalizedCedula.includes(normalizedSearchCedula) ||
          normalizedNombre.includes(normalizedSearch);

        const matchesSeverity =
          gravedadFilter === "all" || String(consulta.gravedad) === gravedadFilter;

        return matchesTerm && matchesSeverity;
      })
      .sort((a, b) => parseConsultaDateMs(b.fecha) - parseConsultaDateMs(a.fecha));
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

  const openExpediente = useCallback(() => {
    if (!paciente) {
      return;
    }

    const record = buildExpedienteRecord(
      paciente,
      consultas.filter((consulta) => consulta.cedulaPaciente === paciente.cedula)
    );
    saveLastExpediente(record);
    setSelectedExpediente(record);
  }, [consultas, paciente]);

  const openNuevaConsulta = () => {
    const initialCedulaPaciente =
      paciente?.cedula ?? selectedConsulta?.cedulaPaciente ?? pacientes[0]?.cedula ?? "";
    const pacienteInicial = pacientesByCedula.get(initialCedulaPaciente);
    const consultaPacienteReciente =
      (initialCedulaPaciente && getLatestConsultaByCedula(initialCedulaPaciente)) ?? null;
    const diagnosticoPacienteAsignado =
      (pacienteInicial && diagnosticosByCodigo.get(pacienteInicial.diagnosticoAsignado)?.nombre) ?? "";

    setConsultaForm({
      cedulaPaciente: initialCedulaPaciente,
      medicoTratante:
        consultaPacienteReciente?.medicoTratante ||
        selectedConsulta?.medicoTratante ||
        medicosDisponibles[0] ||
        "",
      diagnostico:
        consultaPacienteReciente?.diagnostico ||
        selectedConsulta?.diagnostico ||
        diagnosticoPacienteAsignado ||
        diagnosticos[0]?.nombre ||
        "",
      gravedad: String(consultaPacienteReciente?.gravedad ?? selectedConsulta?.gravedad ?? 3),
      costo: String(consultaPacienteReciente?.costo ?? selectedConsulta?.costo ?? 0),
      fecha: consultaPacienteReciente?.fecha
        ? toDateTimeLocalValue(consultaPacienteReciente.fecha)
        : nowDateTimeLocalValue(),
    });
    setConsultaPacienteSearch(
      pacienteInicial ? `${pacienteInicial.cedula} - ${pacienteInicial.nombre}` : ""
    );
    setIsNuevaConsultaOpen(true);
  };

  const closeNuevaConsulta = () => {
    if (isSavingConsulta) {
      return;
    }
    setIsNuevaConsultaOpen(false);
    setConsultaPacienteSearch("");
    setConsultaForm(INITIAL_CONSULTA_FORM);
  };

  const handleConsultaFormChange = <K extends keyof NuevaConsultaFormState>(
    key: K,
    value: NuevaConsultaFormState[K]
  ) => {
    setConsultaForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePacienteSelection = useCallback(
    (cedulaPaciente: string) => {
      const selectedPaciente = pacientesByCedula.get(cedulaPaciente);
      const consultaPacienteReciente = getLatestConsultaByCedula(cedulaPaciente);
      const diagnosticoPacienteAsignado =
        (selectedPaciente &&
          diagnosticosByCodigo.get(selectedPaciente.diagnosticoAsignado)?.nombre) ??
        "";

      setConsultaForm((prev) => ({
        ...prev,
        cedulaPaciente,
        medicoTratante:
          consultaPacienteReciente?.medicoTratante || prev.medicoTratante || medicosDisponibles[0] || "",
        diagnostico:
          consultaPacienteReciente?.diagnostico ||
          diagnosticoPacienteAsignado ||
          prev.diagnostico ||
          diagnosticos[0]?.nombre ||
          "",
        gravedad: String(consultaPacienteReciente?.gravedad ?? Number(prev.gravedad || 3)),
        costo: String(consultaPacienteReciente?.costo ?? Number(prev.costo || 0)),
        fecha: consultaPacienteReciente?.fecha
          ? toDateTimeLocalValue(consultaPacienteReciente.fecha)
          : prev.fecha || nowDateTimeLocalValue(),
      }));
    },
    [
      diagnosticos,
      diagnosticosByCodigo,
      getLatestConsultaByCedula,
      medicosDisponibles,
      pacientesByCedula,
    ]
  );

  useEffect(() => {
    if (!isNuevaConsultaOpen) {
      return;
    }

    const term = consultaPacienteSearch.trim();
    if (!term) {
      return;
    }

    const firstMatch = pacientesFiltradosParaFormulario[0];
    if (!firstMatch) {
      setConsultaForm((prev) => ({
        ...prev,
        cedulaPaciente: "",
      }));
      return;
    }

    if (consultaForm.cedulaPaciente !== firstMatch.cedula) {
      handlePacienteSelection(firstMatch.cedula);
    }
  }, [
    consultaForm.cedulaPaciente,
    consultaPacienteSearch,
    handlePacienteSelection,
    isNuevaConsultaOpen,
    pacientesFiltradosParaFormulario,
  ]);

  const submitNuevaConsulta = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cedulaPaciente = consultaForm.cedulaPaciente.trim();
    const medicoTratante = consultaForm.medicoTratante.trim();
    const diagnostico = consultaForm.diagnostico.trim();
    const gravedad = Number(consultaForm.gravedad);
    const costo = Number(consultaForm.costo);

    if (!cedulaPaciente || !medicoTratante || !diagnostico) {
      showToast("Completa cedula, medico y diagnostico.", 2500);
      return;
    }

    if (!pacientesByCedula.has(cedulaPaciente)) {
      showToast("La cedula no corresponde a un paciente registrado.", 2600);
      return;
    }

    if (!Number.isFinite(gravedad) || gravedad < 1 || gravedad > 5) {
      showToast("La gravedad debe estar entre 1 y 5.", 2500);
      return;
    }

    if (!Number.isFinite(costo) || costo < 0) {
      showToast("El costo debe ser un numero valido.", 2500);
      return;
    }

    setIsSavingConsulta(true);
    try {
      const payload = {
        cedulaPaciente,
        medicoTratante,
        diagnostico,
        gravedad,
        costo,
      };

      const fecha = consultaForm.fecha.trim();
      const nuevaConsulta = await createConsulta(
        fecha
          ? {
              ...payload,
              fecha: fecha.replace("T", " "),
            }
          : payload
      );

      await loadData(false);
      setSelectedConsulta(nuevaConsulta);
      setSearchInput(cedulaPaciente);
      setSearchTerm(cedulaPaciente);
      setGravedadFilter("all");
      setIsNuevaConsultaOpen(false);
      setConsultaPacienteSearch("");
      setConsultaForm(INITIAL_CONSULTA_FORM);
      showToast("Nueva consulta registrada.", 2200);
    } catch (error) {
      console.error(error);
      showToast(
        error instanceof Error ? error.message : "No se pudo registrar la consulta.",
        2600
      );
    } finally {
      setIsSavingConsulta(false);
    }
  };

  const hasAppliedSearch = searchTerm.trim().length > 0;

  return (
    <div className="expedientes-page">
      <div className="expedientes-layout">
        <TopBar title="Expedientes" showFilters={false} />

        {/* Search and filters */}
        <div className="expedientes-toolbar">
          <div className="expedientes-toolbar-grid">
            <div className="expedientes-toolbar-search">
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

            <div className="expedientes-toolbar-action">
              <button
                type="button"
                onClick={openNuevaConsulta}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                Nueva consulta
              </button>
            </div>
          </div>

          {hasAppliedSearch && (
            <p className="mt-3 text-xs text-gray-600">
              {consultasFiltradas.length} resultado(s) para "{searchTerm}".
            </p>
          )}
        </div>

        <div className="expedientes-content-grid">
          {/* Tabla de consultas */}
          <section className="expedientes-main-column">
            <div className="expedientes-table-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Historial de Consultas</h2>
                <button className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700">
                  <Filter className="w-4 h-4" />
                  Filtrar
                </button>
              </div>

              <div className="expedientes-table-scroll">
                <table className="expedientes-table">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-700">ID</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-700">Paciente</th>
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
                      const selectedId = selectedConsulta
                        ? selectedConsulta.idConsulta || selectedConsulta.id
                        : "";
                      const pacienteConsulta = pacientesByCedula.get(consulta.cedulaPaciente);
                      const parsedFecha = new Date(consulta.fecha.replace(" ", "T"));
                      const fechaLabel = Number.isNaN(parsedFecha.getTime())
                        ? consulta.fecha
                        : parsedFecha.toLocaleDateString();

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
                            <p className="font-medium text-gray-900">
                              {pacienteConsulta?.nombre ?? "Paciente no encontrado"}
                            </p>
                            <p className="text-xs text-gray-500">{consulta.cedulaPaciente}</p>
                          </td>
                          <td className="py-3 px-3 text-sm text-gray-700">
                            {fechaLabel}
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

                    {consultasFiltradas.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-sm text-gray-500">
                          No hay consultas para los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Panel detalle */}
          <aside className="expedientes-side-column">
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
          </aside>
        </div>
      </div>

      <GlassModal
        open={Boolean(selectedExpediente)}
        onClose={() => setSelectedExpediente(null)}
        title={selectedExpediente ? `Expediente: ${selectedExpediente.paciente.nombre}` : "Expediente"}
      >
        {selectedExpediente && <ExpedientePanel record={selectedExpediente} />}
      </GlassModal>

      <GlassModal
        open={isNuevaConsultaOpen}
        onClose={closeNuevaConsulta}
        title="Nueva Consulta"
        maxWidthClassName="max-w-3xl"
      >
        <div className="rounded-2xl border border-white/55 bg-white/55 p-4 backdrop-blur-xl">
          <p className="text-sm font-medium text-gray-900">Registra los datos necesarios de la nueva consulta.</p>
          <p className="mt-1 text-xs text-gray-600">
            Puedes iniciar con el paciente seleccionado o elegir otro.
          </p>
        </div>

        <form onSubmit={submitNuevaConsulta} className="mt-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar paciente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={consultaPacienteSearch}
                  onChange={(event) => setConsultaPacienteSearch(event.target.value)}
                  placeholder="Buscar por cedula o nombre"
                  className="w-full rounded-xl border border-gray-200 bg-white/90 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {consultaPacienteSearch.trim().length > 0 && (
                <div className="mt-2 rounded-xl border border-gray-200 bg-white/80 p-2">
                  <p className="px-2 pb-2 text-xs text-gray-600">
                    {pacientesFiltradosParaFormulario.length} paciente(s) encontrado(s)
                  </p>
                  <div className="max-h-32 space-y-1 overflow-y-auto">
                    {pacientesFiltradosParaFormulario.map((item) => (
                      <button
                        key={`search-${item.cedula}`}
                        type="button"
                        onClick={() => handlePacienteSelection(item.cedula)}
                        className={`w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                          consultaForm.cedulaPaciente === item.cedula
                            ? "bg-purple-100 text-purple-800"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {item.cedula} - {item.nombre}
                      </button>
                    ))}

                    {pacientesFiltradosParaFormulario.length === 0 && (
                      <p className="px-2 py-1 text-sm text-gray-500">
                        No hay pacientes para esa busqueda.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Paciente</label>
              <select
                value={consultaForm.cedulaPaciente}
                onChange={(event) => handlePacienteSelection(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Selecciona un paciente</option>
                {pacientesFiltradosParaFormulario.map((item) => (
                  <option key={item.cedula} value={item.cedula}>
                    {item.cedula} - {item.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Medico tratante</label>
              <select
                value={consultaForm.medicoTratante}
                onChange={(event) => handleConsultaFormChange("medicoTratante", event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Selecciona un medico</option>
                {medicosDisponibles.map((medico) => (
                  <option key={medico} value={medico}>
                    {medico}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Diagnostico</label>
              <select
                value={consultaForm.diagnostico}
                onChange={(event) => handleConsultaFormChange("diagnostico", event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Selecciona un diagnostico</option>
                {diagnosticosDisponibles.map((diagnostico) => (
                  <option key={diagnostico.value} value={diagnostico.value}>
                    {diagnostico.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gravedad</label>
              <select
                value={consultaForm.gravedad}
                onChange={(event) => handleConsultaFormChange("gravedad", event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="1">1 - Baja</option>
                <option value="2">2 - Moderada</option>
                <option value="3">3 - Media</option>
                <option value="4">4 - Alta</option>
                <option value="5">5 - Critica</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Costo</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={consultaForm.costo}
                onChange={(event) => handleConsultaFormChange("costo", event.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha y hora (opcional)
              </label>
              <input
                type="datetime-local"
                value={consultaForm.fecha}
                onChange={(event) => handleConsultaFormChange("fecha", event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={isSavingConsulta}
              onClick={closeNuevaConsulta}
              className="rounded-xl border border-gray-200 bg-white/80 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-white disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSavingConsulta}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-sm text-white transition-all hover:shadow-lg disabled:opacity-50"
            >
              {isSavingConsulta ? "Guardando..." : "Guardar consulta"}
            </button>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}
