import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { Badge } from "../components/Badge";
import { pacientes, consultas } from "../../data/mockData";
import { Search, User, FileText } from "lucide-react";

export function Consultar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaciente, setSelectedPaciente] = useState(pacientes[0]);
  
  const ultimaConsulta = consultas
    .filter((c) => c.cedulaPaciente === selectedPaciente.cedula)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];

  return (
    <div className="p-8 bg-gray-50">
      <TopBar title="Consultar Información" showFilters={false} />

      {/* Search bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cédula o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
          />
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
                  <p className="text-xs text-gray-600 mb-1">ID Consulta</p>
                  <p className="font-medium text-gray-900">{ultimaConsulta.id}</p>
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
                  <p className="text-2xl font-bold text-blue-700">
                    ${ultimaConsulta.costo.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:shadow-lg transition-all">
            Abrir expediente completo
          </button>
        </div>
      </div>

      {/* Quick search results */}
      <div className="mt-8 bg-white rounded-3xl p-8 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Seleccionar paciente</h3>
        <div className="grid grid-cols-4 gap-4">
          {pacientes.slice(0, 8).map((p) => (
            <button
              key={p.cedula}
              onClick={() => setSelectedPaciente(p)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedPaciente.cedula === p.cedula
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                  {p.nombre.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {p.nombre}
                  </p>
                  <p className="text-xs text-gray-500">{p.cedula}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
