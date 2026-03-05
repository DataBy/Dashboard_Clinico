import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { BarChart3, TrendingUp, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

export function Rendimiento() {
  const [dataset, setDataset] = useState("pacientes");
  const [sortBy, setSortBy] = useState("nombre");
  const [dataSize, setDataSize] = useState("5000");
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleExecute = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setShowResults(true);
    }, 1500);
  };

  // Mock data for charts
  const performanceData = [
    { name: "Bubble", tiempo: 245, color: "#ef4444" },
    { name: "Selection", tiempo: 178, color: "#f59e0b" },
    { name: "Insertion", tiempo: 156, color: "#10b981" },
    { name: "Quick", tiempo: 42, color: "#3b82f6" },
  ];

  const growthData = [
    { size: "500", bubble: 12, selection: 8, insertion: 7, quick: 2 },
    { size: "5K", bubble: 245, selection: 178, insertion: 156, quick: 42 },
    { size: "50K", bubble: 2450, selection: 1780, insertion: 1560, quick: 420 },
    { size: "200K", bubble: 9800, selection: 7120, insertion: 6240, quick: 1680 },
  ];

  const historial = [
    {
      fecha: "2026-03-05 10:30",
      dataset: "Pacientes",
      campo: "Edad",
      size: "5,000",
      algoritmo: "Quick",
      tiempo: "42.3 ms",
    },
    {
      fecha: "2026-03-05 09:15",
      dataset: "Consultas",
      campo: "Fecha",
      size: "5,000",
      algoritmo: "Insertion",
      tiempo: "156.8 ms",
    },
    {
      fecha: "2026-03-04 16:45",
      dataset: "Pacientes",
      campo: "Nombre",
      size: "50,000",
      algoritmo: "Quick",
      tiempo: "420.1 ms",
    },
    {
      fecha: "2026-03-04 14:20",
      dataset: "Consultas",
      campo: "Gravedad",
      size: "5,000",
      algoritmo: "Selection",
      tiempo: "178.5 ms",
    },
  ];

  return (
    <div className="p-8 bg-gray-50">
      <TopBar title="Laboratorio de Rendimiento" showFilters={false} />

      {/* Controls */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Dataset
            </label>
            <select
              value={dataset}
              onChange={(e) => setDataset(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="pacientes">Pacientes</option>
              <option value="consultas">Consultas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {dataset === "pacientes" ? (
                <>
                  <option value="nombre">Nombre</option>
                  <option value="edad">Edad</option>
                  <option value="fecha">Fecha registro</option>
                  <option value="prioridad">Prioridad</option>
                </>
              ) : (
                <>
                  <option value="fecha">Fecha</option>
                  <option value="gravedad">Gravedad</option>
                  <option value="costo">Costo</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Tamaño
            </label>
            <select
              value={dataSize}
              onChange={(e) => setDataSize(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="500">500</option>
              <option value="5000">5,000</option>
              <option value="50000">50,000</option>
              <option value="200000">200,000</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Algoritmos
            </label>
            <div className="text-xs text-gray-600 bg-gray-50 rounded-xl px-4 py-2 border border-gray-200">
              Todos seleccionados
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleExecute}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Ejecutando...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Ejecutar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showResults && (
        <div className="grid grid-cols-2 gap-6">
          {/* Bar chart - Tiempos por algoritmo */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Tiempos por Algoritmo
              </h2>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="tiempo" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {performanceData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                >
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <span className="font-semibold text-gray-900">{item.tiempo} ms</span>
                </div>
              ))}
            </div>
          </div>

          {/* Line chart - Curva de crecimiento */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Curva de Crecimiento
              </h2>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="size" stroke="#6b7280" />
                <YAxis stroke="#6b7280" label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line key="bubble-line" type="monotone" dataKey="bubble" stroke="#ef4444" strokeWidth={2} />
                <Line key="selection-line" type="monotone" dataKey="selection" stroke="#f59e0b" strokeWidth={2} />
                <Line key="insertion-line" type="monotone" dataKey="insertion" stroke="#10b981" strokeWidth={2} />
                <Line key="quick-line" type="monotone" dataKey="quick" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Historial de ejecuciones */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Historial de Ejecuciones
            </h2>

            <div className="space-y-3">
              {historial.map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-gray-200 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.dataset} - {item.campo}
                      </p>
                      <p className="text-xs text-gray-500">{item.fecha}</p>
                    </div>
                    <span className="text-sm font-semibold text-purple-600">
                      {item.tiempo}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {item.algoritmo}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {item.size} registros
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Búsqueda sobre datos ordenados */}
          <div className="bg-green-50 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Lineal vs Binaria
              </h2>
            </div>

            <p className="text-sm text-gray-700 mb-6">
              Comparación de búsquedas sobre datos ordenados con Quick Sort
            </p>

            <div className="space-y-4">
              <div className="bg-white/60 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-700">Búsqueda Lineal</span>
                  <span className="font-semibold text-gray-900">85.3 ms</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 w-[70%]"></div>
                </div>
              </div>

              <div className="bg-white/60 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-700">Búsqueda Binaria</span>
                  <span className="font-semibold text-gray-900">12.4 ms</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[15%]"></div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-100 rounded-xl">
              <p className="text-sm font-medium text-green-900 mb-1">Conclusión</p>
              <p className="text-xs text-green-800">
                La búsqueda binaria es <strong>6.9x más rápida</strong> en datasets
                ordenados
              </p>
            </div>
          </div>
        </div>
      )}

      {!showResults && (
        <div className="bg-white rounded-3xl p-12 shadow-sm">
          <div className="text-center text-gray-400">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">
              Configure los parámetros y ejecute el experimento
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
