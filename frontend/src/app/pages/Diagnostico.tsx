import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search, Stethoscope } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { GlassModal } from "../components/GlassModal";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import {
  type ApiDiagnostico,
  type ApiDiagnosticoTreeNode,
  getDiagnosticosByEspecialidad,
  getDiagnosticosTree,
} from "../../lib/api";

function suggestTreatment(diagnostico: ApiDiagnostico) {
  if (diagnostico.tratamiento) {
    return diagnostico.tratamiento;
  }

  const lowered = `${diagnostico.nombre} ${diagnostico.categoria} ${diagnostico.subcategoria}`.toLowerCase();

  if (lowered.includes("infarto") || lowered.includes("cardio")) {
    return "Monitoreo cardiaco, antiagregantes y control estricto de signos vitales.";
  }
  if (lowered.includes("asma") || lowered.includes("neumo")) {
    return "Broncodilatadores de rescate y seguimiento respiratorio.";
  }
  if (lowered.includes("fractura") || lowered.includes("trauma")) {
    return "Inmovilizacion inicial, control del dolor y evaluacion quirurgica.";
  }
  if (lowered.includes("pedi")) {
    return "Tratamiento pediatrico ajustado por peso y seguimiento en consulta.";
  }

  return "Manejo clinico segun protocolo institucional.";
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function Diagnostico() {
  const [diagnosticosTree, setDiagnosticosTree] = useState<ApiDiagnosticoTreeNode[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [expandedEspecialidad, setExpandedEspecialidad] = useState<string | null>(null);
  const [selectedDiagnostico, setSelectedDiagnostico] = useState<ApiDiagnostico | null>(null);
  const [especialidadDiagnosticos, setEspecialidadDiagnosticos] = useState<ApiDiagnostico[]>([]);
  const [isLoadingEspecialidad, setIsLoadingEspecialidad] = useState(false);
  const [showEspecialidadModal, setShowEspecialidadModal] = useState(false);
  const debouncedSearchInput = useDebouncedValue(searchInput, 280);

  useEffect(() => {
    const loadTree = async () => {
      try {
        const tree = await getDiagnosticosTree();
        setDiagnosticosTree(tree);

        const firstArea = tree[0];
        const firstEspecialidad = firstArea?.especialidades[0];
        const firstDiagnostico = firstEspecialidad?.diagnosticos[0] ?? null;

        setExpandedArea(firstArea?.area ?? null);
        setExpandedEspecialidad(firstEspecialidad?.nombre ?? null);
        setSelectedDiagnostico(firstDiagnostico);
      } catch (error) {
        console.error(error);
      }
    };

    void loadTree();
  }, []);

  useEffect(() => {
    setSearchTerm(digitsOnly(debouncedSearchInput));
  }, [debouncedSearchInput]);

  const filteredTree = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return diagnosticosTree;
    }

    return diagnosticosTree
      .map((area) => ({
        ...area,
        especialidades: area.especialidades
          .map((especialidad) => ({
            ...especialidad,
            diagnosticos: especialidad.diagnosticos.filter(
              (diagnostico) => digitsOnly(diagnostico.codigo).includes(term)
            ),
          }))
          .filter((especialidad) => especialidad.diagnosticos.length > 0),
      }))
      .filter((area) => area.especialidades.length > 0);
  }, [diagnosticosTree, searchTerm]);

  useEffect(() => {
    if (!selectedDiagnostico && filteredTree.length > 0) {
      setSelectedDiagnostico(filteredTree[0].especialidades[0]?.diagnosticos[0] ?? null);
      return;
    }

    if (!selectedDiagnostico) {
      return;
    }

    const exists = filteredTree.some((area) =>
      area.especialidades.some((especialidad) =>
        especialidad.diagnosticos.some(
          (diagnostico) => diagnostico.codigo === selectedDiagnostico.codigo
        )
      )
    );

    if (!exists) {
      const first = filteredTree[0]?.especialidades[0]?.diagnosticos[0] ?? null;
      setSelectedDiagnostico(first);
      setExpandedArea(filteredTree[0]?.area ?? null);
      setExpandedEspecialidad(filteredTree[0]?.especialidades[0]?.nombre ?? null);
    }
  }, [filteredTree, selectedDiagnostico]);

  useEffect(() => {
    if (!searchTerm.trim() || filteredTree.length === 0) {
      return;
    }

    setExpandedArea(filteredTree[0]?.area ?? null);
    setExpandedEspecialidad(filteredTree[0]?.especialidades[0]?.nombre ?? null);
  }, [filteredTree, searchTerm]);

  const activeEspecialidad = selectedDiagnostico?.especialidad ?? expandedEspecialidad ?? "";

  useEffect(() => {
    if (!activeEspecialidad) {
      setEspecialidadDiagnosticos([]);
      return;
    }

    let cancelled = false;
    setIsLoadingEspecialidad(true);

    const loadEspecialidad = async () => {
      try {
        const payload = await getDiagnosticosByEspecialidad(activeEspecialidad);
        if (!cancelled) {
          setEspecialidadDiagnosticos(payload.diagnosticos);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setEspecialidadDiagnosticos([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingEspecialidad(false);
        }
      }
    };

    void loadEspecialidad();

    return () => {
      cancelled = true;
    };
  }, [activeEspecialidad]);

  return (
    <div className="p-8 bg-gray-50">
      <TopBar title="Diagnostico" showFilters={false} />

      <div className="mb-6">
        <div className="max-w-2xl flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={searchInput}
              onChange={(event) => setSearchInput(digitsOnly(event.target.value))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  setSearchTerm(digitsOnly(searchInput));
                  return;
                }

                if (event.ctrlKey || event.metaKey || event.altKey || event.key.length > 1) {
                  return;
                }

                if (!/^\d$/.test(event.key)) {
                  event.preventDefault();
                }
              }}
              onPaste={(event) => {
                const pastedValue = event.clipboardData.getData("text");

                if (/^\d+$/.test(pastedValue)) {
                  return;
                }

                event.preventDefault();

                const sanitizedValue = digitsOnly(pastedValue);
                const selectionStart = event.currentTarget.selectionStart ?? searchInput.length;
                const selectionEnd = event.currentTarget.selectionEnd ?? searchInput.length;
                const nextValue = `${searchInput.slice(0, selectionStart)}${sanitizedValue}${searchInput.slice(selectionEnd)}`;

                setSearchInput(nextValue);
              }}
              placeholder="Buscar por la parte numerica del codigo..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => setSearchTerm(digitsOnly(searchInput))}
            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:shadow-lg transition-all"
          >
            Buscar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm h-[600px] overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Arbol de Diagnosticos</h2>

          <div className="space-y-2">
            {filteredTree.map((area) => (
              <div key={area.area}>
                <button
                  onClick={() => setExpandedArea(expandedArea === area.area ? null : area.area)}
                  className="w-full flex items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {expandedArea === area.area ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                  <span className="font-medium text-gray-900">{area.area}</span>
                  <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    {area.especialidades.length}
                  </span>
                </button>

                {expandedArea === area.area && (
                  <div className="ml-6 mt-2 space-y-2">
                    {area.especialidades.map((especialidad) => (
                      <div key={especialidad.nombre}>
                        <button
                          onClick={() => {
                            setExpandedEspecialidad(
                              expandedEspecialidad === especialidad.nombre ? null : especialidad.nombre
                            );
                            if (especialidad.diagnosticos.length > 0) {
                              setSelectedDiagnostico(especialidad.diagnosticos[0]);
                            }
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {expandedEspecialidad === especialidad.nombre ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="text-sm text-gray-700">{especialidad.nombre}</span>
                          <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {especialidad.diagnosticos.length}
                          </span>
                        </button>

                        {expandedEspecialidad === especialidad.nombre && (
                          <div className="ml-6 mt-2 space-y-1">
                            {especialidad.diagnosticos.map((diag) => (
                              <button
                                key={diag.codigo}
                                onClick={() => setSelectedDiagnostico(diag)}
                                className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                                  selectedDiagnostico?.codigo === diag.codigo
                                    ? "bg-purple-100 text-purple-700 font-medium"
                                    : "text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                {diag.codigo} - {diag.nombre}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-purple-50 rounded-3xl p-8 shadow-sm h-[600px] overflow-y-auto">
          {selectedDiagnostico ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Detalle del Diagnostico</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Codigo</p>
                  <p className="text-2xl font-bold text-purple-700">{selectedDiagnostico.codigo}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Nombre</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedDiagnostico.nombre}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Area</p>
                    <p className="font-medium text-gray-900">{selectedDiagnostico.area}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Especialidad</p>
                    <p className="font-medium text-gray-900">{selectedDiagnostico.especialidad}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-2">Descripcion</p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-white/50 p-4 rounded-xl">
                    {selectedDiagnostico.descripcion}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEspecialidadModal(true)}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Ver todos los diagnosticos de {selectedDiagnostico.especialidad}
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Selecciona un diagnostico del arbol
            </div>
          )}
        </div>
      </div>

      <GlassModal
        open={showEspecialidadModal}
        onClose={() => setShowEspecialidadModal(false)}
        title={
          selectedDiagnostico
            ? `Diagnosticos de ${selectedDiagnostico.especialidad}`
            : "Diagnosticos por especialidad"
        }
      >
        <div className="space-y-3">
          {especialidadDiagnosticos.map((diagnostico) => (
            <div
              key={`${diagnostico.codigo}-${diagnostico.especialidad}`}
              className="rounded-2xl border border-white/50 bg-white/55 p-4"
            >
              <p className="text-sm font-semibold text-gray-900">
                {diagnostico.codigo} - {diagnostico.nombre}
              </p>
              <p className="mt-2 text-xs text-gray-600">{diagnostico.descripcion}</p>
              <p className="mt-2 text-xs font-medium text-emerald-700">
                Tratamiento: {suggestTreatment(diagnostico)}
              </p>
            </div>
          ))}

          {isLoadingEspecialidad && (
            <p className="text-sm text-gray-500">Cargando diagnosticos de la especialidad...</p>
          )}

          {!isLoadingEspecialidad && especialidadDiagnosticos.length === 0 && (
            <p className="text-sm text-gray-500">No hay diagnosticos disponibles para esta especialidad.</p>
          )}
        </div>
      </GlassModal>
    </div>
  );
}
