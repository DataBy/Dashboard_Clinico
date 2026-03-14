import { useEffect, useMemo, useState } from "react";
import { BarChart3, Cpu, TrendingUp, Zap } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { TopBar } from "../components/TopBar";
import { type ApiSystemMetrics, getSystemMetrics, runSortBenchmark } from "../../lib/api";

const defaultPerformanceData = [
  { name: "Bubble", tiempo: 245, color: "#ef4444" },
  { name: "Selection", tiempo: 178, color: "#f59e0b" },
  { name: "Insertion", tiempo: 156, color: "#10b981" },
  { name: "Quick", tiempo: 42, color: "#3b82f6" },
];

const defaultGrowthData = [
  { size: "500", bubble: 12, selection: 8, insertion: 7, quick: 2 },
  { size: "5K", bubble: 245, selection: 178, insertion: 156, quick: 42 },
  { size: "50K", bubble: 2450, selection: 1780, insertion: 1560, quick: 420 },
  { size: "200K", bubble: 9800, selection: 7120, insertion: 6240, quick: 1680 },
];

const algorithmColor: Record<string, string> = {
  Bubble: "#ef4444",
  Selection: "#f59e0b",
  Insertion: "#10b981",
  Quick: "#3b82f6",
};

const sizeFilters = [
  { value: "500", label: "500" },
  { value: "5000", label: "5k" },
  { value: "50000", label: "50k" },
  { value: "200000", label: "200k" },
];

const algorithmLabelByKey = {
  bubble: "Bubble",
  selection: "Selection",
  insertion: "Insertion",
  quick: "Quick",
} as const;

type AlgorithmKey = keyof typeof algorithmLabelByKey;

function formatNowTimestamp() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
}

function normalizeDatasetSize(sizeLabel: string) {
  const normalized = sizeLabel.replace(",", "").trim().toUpperCase();
  if (normalized.endsWith("K")) {
    return String(Number(normalized.slice(0, -1)) * 1000);
  }
  return normalized;
}

export function Rendimiento() {
  const [dataset, setDataset] = useState("pacientes");
  const [sortBy, setSortBy] = useState("nombre");
  const [dataSize, setDataSize] = useState("5000");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmKey | "all">("all");
  const [selectedSizeFilter, setSelectedSizeFilter] = useState("5000");
  const [lastRunSize, setLastRunSize] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [performanceData, setPerformanceData] = useState(defaultPerformanceData);
  const [growthData, setGrowthData] = useState(defaultGrowthData);
  const [searchComparison, setSearchComparison] = useState<{
    linealMs: number;
    binariaMs: number;
    improvementPct: number;
  } | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<ApiSystemMetrics | null>(null);
  const [metricsNotice, setMetricsNotice] = useState<string | null>(null);
  const [historial, setHistorial] = useState([
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
  ]);

  useEffect(() => {
    let disposed = false;

    const loadMetrics = async () => {
      try {
        const metrics = await getSystemMetrics();
        if (disposed) {
          return;
        }
        setSystemMetrics(metrics);
        setMetricsNotice(null);
      } catch (error) {
        if (disposed) {
          return;
        }
        console.error(error);
        setSystemMetrics(null);
        setMetricsNotice(
          "No se pudieron obtener las métricas del backend. Verifique que /api/system/metrics esté disponible."
        );
      }
    };

    void loadMetrics();
    const interval = window.setInterval(() => {
      void loadMetrics();
    }, 1000);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, []);

  const handleExecute = async () => {
    setIsRunning(true);
    try {
      const response = await runSortBenchmark({
        dataset: dataset as "pacientes" | "consultas",
        campo: sortBy,
        size: Number(dataSize),
      });

      if (response.results.length > 0) {
        setPerformanceData(
          response.results.map((result) => ({
            name: result.name,
            tiempo: Number(result.timeMs.toFixed(2)),
            color: algorithmColor[result.name] ?? "#6366f1",
          }))
        );
      }

      if (response.growth.length > 0) {
        setGrowthData(
          response.growth.map((item) => {
            const sizeNumeric = Number(item.size);
            const sizeLabel =
              sizeNumeric >= 1000 ? `${Math.round(sizeNumeric / 1000)}K` : String(sizeNumeric);

            return {
              size: sizeLabel,
              bubble: Number(item.bubble.toFixed(2)),
              selection: Number(item.selection.toFixed(2)),
              insertion: Number(item.insertion.toFixed(2)),
              quick: Number(item.quick.toFixed(2)),
            };
          })
        );
      }

      if (response.searchComparison) {
        setSearchComparison({
          linealMs: response.searchComparison.linealMs,
          binariaMs: response.searchComparison.binariaMs,
          improvementPct: response.searchComparison.improvementPct,
        });
      }

      const fastest = [...response.results].sort((a, b) => a.timeMs - b.timeMs)[0];
      const timestamp = formatNowTimestamp();
      const selectedResult =
        selectedAlgorithm === "all"
          ? fastest
          : response.results.find((result) => result.algorithm === selectedAlgorithm) ?? fastest;

      if (selectedResult) {
        setHistorial((prev) =>
          [
            {
              fecha: timestamp,
              dataset: dataset === "pacientes" ? "Pacientes" : "Consultas",
              campo: sortBy,
              size: Number(dataSize).toLocaleString(),
              algoritmo: selectedResult.name,
              tiempo: `${selectedResult.timeMs.toFixed(2)} ms`,
            },
            ...prev,
          ].slice(0, 8)
        );
      }

      setLastRunSize(dataSize);
      setSelectedSizeFilter(dataSize);
      setShowResults(true);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "No se pudo ejecutar el benchmark.");
    } finally {
      setIsRunning(false);
    }
  };

  const linealMs = searchComparison?.linealMs ?? 85.3;
  const binariaMs = searchComparison?.binariaMs ?? 12.4;
  const maxSearch = Math.max(linealMs, binariaMs, 1);
  const improvement =
    searchComparison?.improvementPct ?? (1 - binariaMs / Math.max(linealMs, 0.0001)) * 100;
  const speedUp = linealMs / Math.max(binariaMs, 0.0001);

  const orderedGrowthData = useMemo(() => {
    return [...growthData].sort(
      (a, b) => Number(normalizeDatasetSize(a.size)) - Number(normalizeDatasetSize(b.size))
    );
  }, [growthData]);

  const visibleGrowthData = useMemo(() => {
    const maxSize = Number(selectedSizeFilter);
    const filteredByRange = orderedGrowthData.filter(
      (item) => Number(normalizeDatasetSize(item.size)) <= maxSize
    );

    return [
      { size: "0", bubble: 0, selection: 0, insertion: 0, quick: 0 },
      ...filteredByRange,
    ];
  }, [orderedGrowthData, selectedSizeFilter]);

  const filteredPerformanceData = useMemo(() => {
    if (selectedAlgorithm === "all") {
      return performanceData;
    }
    const selectedLabel = algorithmLabelByKey[selectedAlgorithm];
    return performanceData.filter((item) => item.name === selectedLabel);
  }, [performanceData, selectedAlgorithm]);

  const filteredHistorial = useMemo(() => {
    return historial.filter((item) => {
      const matchesSize = normalizeDatasetSize(item.size) === selectedSizeFilter;
      const matchesAlgorithm =
        selectedAlgorithm === "all" ||
        item.algoritmo.toLowerCase() === algorithmLabelByKey[selectedAlgorithm].toLowerCase();
      return matchesSize && matchesAlgorithm;
    });
  }, [historial, selectedSizeFilter, selectedAlgorithm]);

  const currentRunMatchesFilter = !lastRunSize || lastRunSize === selectedSizeFilter;

  const ramUsage = systemMetrics?.ramUsagePct ?? 0;
  const cpuUsage = systemMetrics?.cpuUsagePct ?? 0;
  const cpuTemp =
    systemMetrics?.cpuTempC === null || systemMetrics?.cpuTempC === undefined
      ? "N/D"
      : `${systemMetrics.cpuTempC.toFixed(1)} C`;

  return (
    <div className="p-8 bg-gray-50">
      <TopBar title="Laboratorio de Rendimiento" showFilters={false} />

      {/* Controls */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Dataset</label>
            <select
              value={dataset}
              onChange={(event) => setDataset(event.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="pacientes">Pacientes</option>
              <option value="consultas">Consultas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Ordenar por</label>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {dataset === "pacientes" ? (
                <>
                  <option value="nombre">Nombre</option>
                  <option value="edad">Edad</option>
                  <option value="fecha">Fecha de registro</option>
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
            <label className="block text-xs font-medium text-gray-700 mb-2">Tamaño</label>
            <select
              value={dataSize}
              onChange={(event) => {
                setDataSize(event.target.value);
                setSelectedSizeFilter(event.target.value);
              }}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="500">500</option>
              <option value="5000">5,000</option>
              <option value="50000">50,000</option>
              <option value="200000">200,000</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Algoritmos</label>
            <select
              value={selectedAlgorithm}
              onChange={(event) =>
                setSelectedAlgorithm(event.target.value as AlgorithmKey | "all")
              }
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos</option>
              <option value="bubble">Bubble</option>
              <option value="selection">Selection</option>
              <option value="insertion">Insertion</option>
              <option value="quick">Quick</option>
            </select>
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

      {/* Dataset filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {sizeFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setSelectedSizeFilter(filter.value)}
            className={`rounded-xl px-4 py-2 text-sm transition-colors ${
              selectedSizeFilter === filter.value
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:border-purple-300"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Hardware monitoring */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Monitoreo de Hardware</h2>
        </div>

        {metricsNotice ? (
          <p className="mb-3 text-xs text-amber-700">{metricsNotice}</p>
        ) : null}

        {systemMetrics ? (
          <p className="mb-3 text-xs text-gray-500">
            Fuente: {systemMetrics.machineName ?? "backend"} (PID {systemMetrics.processId ?? "N/D"}) -{" "}
            {systemMetrics.collectedAt}
          </p>
        ) : null}

        {!systemMetrics ? (
          <p className="text-sm text-gray-500">Cargando métricas...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500 mb-2">RAM en uso</p>
              <p className="text-xl font-bold text-gray-900">{ramUsage.toFixed(1)}%</p>
              <p className="text-xs text-gray-600 mt-1">
                {systemMetrics?.ramUsedMb.toFixed(0) ?? "0"} MB / {systemMetrics?.ramTotalMb.toFixed(0) ?? "0"} MB
              </p>
              <div className="mt-3 h-2 rounded-full bg-white overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-indigo-500"
                  style={{ width: `${Math.min(ramUsage, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500 mb-2">CPU en uso</p>
              <p className="text-xl font-bold text-gray-900">{cpuUsage.toFixed(1)}%</p>
              <p className="text-xs text-gray-600 mt-1">Carga del sistema: {systemMetrics?.systemLoad.toFixed(2) ?? "0.00"}</p>
              <div className="mt-3 h-2 rounded-full bg-white overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-green-500"
                  style={{ width: `${Math.min(cpuUsage, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500 mb-1">Temperatura CPU</p>
              <p className="text-lg font-semibold text-gray-900">{cpuTemp}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500 mb-1">Núcleos CPU</p>
              <p className="text-lg font-semibold text-gray-900">{systemMetrics?.cpuCores ?? 0}</p>
            </div>
          </div>
        )}
      </div>

      {showResults && (
        <div className="grid grid-cols-2 gap-6">
          {/* Bar chart - Tiempos por algoritmo */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Tiempos por Algoritmo</h2>
            </div>

            {currentRunMatchesFilter ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" label={{ value: "ms", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Bar dataKey="tiempo" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  {filteredPerformanceData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                    >
                      <span className="text-sm text-gray-700">{item.name}</span>
                      <span className="font-semibold text-gray-900">{item.tiempo} ms</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-gray-500 rounded-2xl border border-dashed border-gray-300">
                Ejecute el benchmark para el filtro {sizeFilters.find((f) => f.value === selectedSizeFilter)?.label ?? selectedSizeFilter}.
              </div>
            )}
          </div>

          {/* Line chart - Curva de crecimiento */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Curva de Crecimiento</h2>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={visibleGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="size" stroke="#6b7280" />
                <YAxis stroke="#6b7280" label={{ value: "ms", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                {(selectedAlgorithm === "all" || selectedAlgorithm === "bubble") && (
                  <Line key="bubble-line" type="monotone" dataKey="bubble" stroke="#ef4444" strokeWidth={2} />
                )}
                {(selectedAlgorithm === "all" || selectedAlgorithm === "selection") && (
                  <Line key="selection-line" type="monotone" dataKey="selection" stroke="#f59e0b" strokeWidth={2} />
                )}
                {(selectedAlgorithm === "all" || selectedAlgorithm === "insertion") && (
                  <Line key="insertion-line" type="monotone" dataKey="insertion" stroke="#10b981" strokeWidth={2} />
                )}
                {(selectedAlgorithm === "all" || selectedAlgorithm === "quick") && (
                  <Line key="quick-line" type="monotone" dataKey="quick" stroke="#3b82f6" strokeWidth={2} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Historial de ejecuciones */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de Ejecuciones</h2>

            <div className="space-y-3">
              {(filteredHistorial.length ? filteredHistorial : historial).map((item, index) => (
                <div
                  key={`${item.fecha}-${index}`}
                  className="p-4 rounded-xl border border-gray-200 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.dataset} - {item.campo}
                      </p>
                      <p className="text-xs text-gray-500">{item.fecha}</p>
                    </div>
                    <span className="text-sm font-semibold text-purple-600">{item.tiempo}</span>
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
              <h2 className="text-lg font-semibold text-gray-900">Lineal vs Binaria</h2>
            </div>

            <p className="text-sm text-gray-700 mb-6">
              Comparación de búsquedas sobre datos ordenados con Quick Sort
            </p>

            <div className="space-y-4">
              <div className="bg-white/60 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-700">Búsqueda Lineal</span>
                  <span className="font-semibold text-gray-900">{linealMs.toFixed(2)} ms</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: `${(linealMs / maxSearch) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-white/60 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-700">Búsqueda Binaria</span>
                  <span className="font-semibold text-gray-900">{binariaMs.toFixed(2)} ms</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${(binariaMs / maxSearch) * 100}%` }}></div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-100 rounded-xl">
              <p className="text-sm font-medium text-green-900 mb-1">Conclusión</p>
              <p className="text-xs text-green-800">
                La búsqueda binaria es <strong>{speedUp.toFixed(1)}x más rápida</strong> en datasets ordenados ({improvement.toFixed(1)}% de mejora)
              </p>
            </div>
          </div>
        </div>
      )}

      {!showResults && (
        <div className="bg-white rounded-3xl p-12 shadow-sm">
          <div className="text-center text-gray-400">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Configure los parámetros y ejecute el experimento</p>
          </div>
        </div>
      )}
    </div>
  );
}
