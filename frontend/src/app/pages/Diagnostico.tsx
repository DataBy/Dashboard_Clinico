import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { diagnosticosTree, Diagnostico as DiagnosticoType } from "../../data/mockData";
import { ChevronRight, ChevronDown, Search, Stethoscope } from "lucide-react";

export function Diagnostico() {
  const [expandedArea, setExpandedArea] = useState<string | null>("Medicina Interna");
  const [expandedEspecialidad, setExpandedEspecialidad] = useState<string | null>(
    "Cardiología"
  );
  const [selectedDiagnostico, setSelectedDiagnostico] = useState<DiagnosticoType | null>(
    diagnosticosTree[0].especialidades[0].diagnosticos[0]
  );

  return (
    <div className="p-8 bg-gray-50">
      <TopBar title="Diagnóstico" showFilters={false} />

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código o nombre de diagnóstico..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Árbol jerárquico */}
        <div className="bg-white rounded-3xl p-6 shadow-sm h-[600px] overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Árbol de Diagnósticos
          </h2>

          <div className="space-y-2">
            {diagnosticosTree.map((area) => (
              <div key={area.area}>
                <button
                  onClick={() =>
                    setExpandedArea(expandedArea === area.area ? null : area.area)
                  }
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
                          onClick={() =>
                            setExpandedEspecialidad(
                              expandedEspecialidad === especialidad.nombre
                                ? null
                                : especialidad.nombre
                            )
                          }
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {expandedEspecialidad === especialidad.nombre ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="text-sm text-gray-700">
                            {especialidad.nombre}
                          </span>
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

        {/* Detalle del diagnóstico */}
        <div className="bg-purple-50 rounded-3xl p-8 shadow-sm h-[600px] overflow-y-auto">
          {selectedDiagnostico ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Detalle del Diagnóstico
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Código</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {selectedDiagnostico.codigo}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Nombre</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedDiagnostico.nombre}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Área</p>
                    <p className="font-medium text-gray-900">
                      {selectedDiagnostico.area}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Especialidad</p>
                    <p className="font-medium text-gray-900">
                      {selectedDiagnostico.especialidad}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Categoría</p>
                    <p className="font-medium text-gray-900">
                      {selectedDiagnostico.categoria}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Subcategoría</p>
                    <p className="font-medium text-gray-900">
                      {selectedDiagnostico.subcategoria}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-2">Descripción</p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-white/50 p-4 rounded-xl">
                    {selectedDiagnostico.descripcion}
                  </p>
                </div>

                <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all">
                  Mostrar diagnósticos de {selectedDiagnostico.especialidad}
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Selecciona un diagnóstico del árbol
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
