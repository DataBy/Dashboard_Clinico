import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { Badge } from "../components/Badge";
import { consultas, pacientes } from "../../data/mockData";
import { Search, Filter, Plus, FileText } from "lucide-react";

export function Expedientes() {
  const [selectedConsulta, setSelectedConsulta] = useState(consultas[0]);
  const paciente = pacientes.find(
    (p) => p.cedula === selectedConsulta.cedulaPaciente
  );

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
                placeholder="Buscar por cédula o nombre..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <select className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option>Todas las gravedades</option>
              <option>Gravedad 5</option>
              <option>Gravedad 4</option>
              <option>Gravedad 3</option>
              <option>Gravedad 2</option>
              <option>Gravedad 1</option>
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
            <h2 className="text-lg font-semibold text-gray-900">
              Historial de Consultas
            </h2>
            <button className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700">
              <Filter className="w-4 h-4" />
              Filtrar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-700">
                    ID
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-700">
                    Fecha
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-700">
                    Médico
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-700">
                    Diagnóstico
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-700">
                    Gravedad
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-700">
                    Costo
                  </th>
                </tr>
              </thead>
              <tbody>
                {consultas.slice(0, 12).map((consulta, idx) => (
                  <tr
                    key={consulta.id}
                    onClick={() => setSelectedConsulta(consulta)}
                    className={`cursor-pointer transition-colors ${
                      idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } ${
                      selectedConsulta.id === consulta.id
                        ? "bg-purple-50"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <td className="py-3 px-3 text-sm font-medium text-gray-900">
                      {consulta.id}
                    </td>
                    <td className="py-3 px-3 text-sm text-gray-700">
                      {new Date(consulta.fecha).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-sm text-gray-700">
                      {consulta.medicoTratante.replace("Dr. ", "").replace("Dra. ", "")}
                    </td>
                    <td className="py-3 px-3 text-sm text-gray-700">
                      {consulta.diagnostico.length > 25
                        ? consulta.diagnostico.substring(0, 25) + "..."
                        : consulta.diagnostico}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="gravedad" value={consulta.gravedad} />
                    </td>
                    <td className="py-3 px-3 text-sm font-medium text-gray-900">
                      ${consulta.costo.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel detalle */}
        <div className="space-y-6">
          {/* Resumen del paciente */}
          {paciente && (
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">
                Resumen del Paciente
              </h3>
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
                  <p className="font-medium text-gray-900">{paciente.edad} años</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo de sangre</p>
                  <p className="font-medium text-gray-900">{paciente.tipoSangre}</p>
                </div>
              </div>
            </div>
          )}

          {/* Detalle de consulta */}
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
                <p className="font-medium text-gray-900">{selectedConsulta.id}</p>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Fecha y hora</p>
                <p className="font-medium text-gray-900">{selectedConsulta.fecha}</p>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Médico tratante</p>
                <p className="font-medium text-gray-900">
                  {selectedConsulta.medicoTratante}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Diagnóstico</p>
                <p className="font-medium text-gray-900 leading-relaxed">
                  {selectedConsulta.diagnostico}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Nivel de gravedad</p>
                <Badge variant="gravedad" value={selectedConsulta.gravedad} />
              </div>

              <div className="pt-4 border-t border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Costo de la consulta</p>
                <p className="text-2xl font-bold text-blue-700">
                  ${selectedConsulta.costo.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">
              Estadísticas Rápidas
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total consultas</span>
                <span className="font-bold text-purple-600">{consultas.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Costo promedio</span>
                <span className="font-bold text-blue-600">
                  $
                  {Math.round(
                    consultas.reduce((sum, c) => sum + c.costo, 0) / consultas.length
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Gravedad promedio</span>
                <span className="font-bold text-orange-600">
                  {(
                    consultas.reduce((sum, c) => sum + c.gravedad, 0) /
                    consultas.length
                  ).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
