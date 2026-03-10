import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { pacientes } from "../../data/mockData";
import { Search, Zap, TrendingDown } from "lucide-react";

export function Busqueda() {
  const [searchType, setSearchType] = useState("cedula");
  const [datasetSize, setDatasetSize] = useState("5000");
  const [algorithm, setAlgorithm] = useState("lineal");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<typeof pacientes>([]);
  const [performanceData, setPerformanceData] = useState<{
    lineal: number;
    binaria: number;
  } | null>(null);

  const handleSearch = () => {
    setIsSearching(true);
    
    // Simulate search
    setTimeout(() => {
      setResults(pacientes.slice(0, 5));
      setPerformanceData({
        lineal: Math.random() * 100 + 50,
        binaria: Math.random() * 20 + 5,
      });
      setIsSearching(false);
    }, 1000);
  };

  return (
    <div className="p-8 bg-gray-50">
      <TopBar title="Búsqueda Comparativa" showFilters={false} />

      {/* Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Tipo de búsqueda
            </label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="cedula">Cédula exacta</option>
              <option value="nombre">Nombre parcial</option>
              <option value="fecha">Rango de fechas</option>
              <option value="gravedad">Por gravedad</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Tamaño del dataset
            </label>
            <select
              value={datasetSize}
              onChange={(e) => setDatasetSize(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="500">500 registros</option>
              <option value="5000">5,000 registros</option>
              <option value="50000">50,000 registros</option>
              <option value="200000">200,000 registros</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Algoritmo
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="lineal">Búsqueda Lineal</option>
              <option value="binaria">Búsqueda Binaria</option>
              <option value="ambos">Comparar Ambos</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Ejecutar búsqueda
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Results table */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resultados</h2>
          
          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((paciente) => (
                <div
                  key={paciente.cedula}
                  className="p-4 rounded-xl border border-gray-200 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{paciente.nombre}</p>
                      <p className="text-sm text-gray-600">{paciente.cedula}</p>
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      {paciente.edad} años
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              {isSearching ? "Buscando..." : "No hay resultados"}
            </div>
          )}
        </div>

        {/* Performance comparison */}
        <div className="space-y-6">
          {performanceData && (
            <>
              <div className="bg-green-50 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Comparativa de Tiempos
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700">Búsqueda Lineal</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {performanceData.lineal.toFixed(2)} ms
                      </span>
                    </div>
                    <div className="h-3 bg-white rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                        style={{
                          width: `${(performanceData.lineal / 150) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700">Búsqueda Binaria</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {performanceData.binaria.toFixed(2)} ms
                      </span>
                    </div>
                    <div className="h-3 bg-white rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                        style={{
                          width: `${(performanceData.binaria / 150) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-white/60 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Mejora de rendimiento
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {((1 - performanceData.binaria / performanceData.lineal) * 100).toFixed(
                      1
                    )}
                    % más rápido
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">Mejor método</h3>
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border border-green-200">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Búsqueda Binaria</p>
                    <p className="text-xs text-gray-600">
                      Recomendado para datasets grandes
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Historial */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Historial de pruebas</h3>
            <div className="space-y-2 text-sm">
              {[
                { size: "5,000", time: "85.3 ms", type: "Lineal" },
                { size: "50,000", time: "742.1 ms", type: "Lineal" },
                { size: "5,000", time: "12.4 ms", type: "Binaria" },
                { size: "50,000", time: "18.9 ms", type: "Binaria" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between p-2 rounded-lg hover:bg-gray-50"
                >
                  <span className="text-gray-700">
                    {item.type} - {item.size}
                  </span>
                  <span className="font-medium text-gray-900">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
