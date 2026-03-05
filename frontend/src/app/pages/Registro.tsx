import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { Badge } from "../components/Badge";
import { pacientes, tiposSangre, diagnosticos } from "../../data/mockData";
import { UserPlus, Play } from "lucide-react";

export function Registro() {
  const [formData, setFormData] = useState({
    cedula: "",
    nombre: "",
    edad: "",
    prioridad: "3",
    tipoSangre: "O+",
    diagnostico: diagnosticos[0].codigo,
  });

  const colaOrdenada = [...pacientes]
    .filter((p) => p.estado === "En espera")
    .sort((a, b) => a.prioridad - b.prioridad);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Paciente registrado (demo)");
  };

  return (
    <div className="p-8 bg-gray-50">
      <TopBar title="Registro de Pacientes" showFilters={false} />

      {/* Form */}
      <div className="bg-white rounded-3xl p-8 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Nuevo Paciente</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cédula
            </label>
            <input
              type="text"
              placeholder="001-0000000-0"
              value={formData.cedula}
              onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre completo
            </label>
            <input
              type="text"
              placeholder="Nombre del paciente"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Edad
            </label>
            <input
              type="number"
              placeholder="0"
              value={formData.edad}
              onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prioridad
            </label>
            <select
              value={formData.prioridad}
              onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="1">1 - Crítico</option>
              <option value="2">2 - Urgente</option>
              <option value="3">3 - Normal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de sangre
            </label>
            <select
              value={formData.tipoSangre}
              onChange={(e) => setFormData({ ...formData, tipoSangre: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {tiposSangre.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnóstico asignado
            </label>
            <select
              value={formData.diagnostico}
              onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {diagnosticos.map((diag) => (
                <option key={diag.codigo} value={diag.codigo}>
                  {diag.codigo} - {diag.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-3">
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              Registrar Paciente
            </button>
          </div>
        </form>
      </div>

      {/* Cola de espera */}
      <div className="bg-white rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Lista de Espera</h2>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all">
            <Play className="w-4 h-4" />
            Atender siguiente
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Prioridad
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Cédula
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Nombre
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Edad
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Diagnóstico
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Registro
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {colaOrdenada.map((paciente, idx) => (
                <tr
                  key={paciente.cedula}
                  className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <td className="py-4 px-4">
                    <Badge variant="prioridad" value={paciente.prioridad} />
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700">
                    {paciente.cedula}
                  </td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-900">
                    {paciente.nombre}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700">
                    {paciente.edad}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700">
                    {paciente.diagnosticoAsignado}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700">
                    {paciente.fechaRegistro}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition-colors">
                        Atender
                      </button>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors">
                        Ver
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
