import { useEffect, useMemo, useState } from "react";
import { BarChart3, Check, Cpu, TrendingUp, Zap } from "lucide-react";
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
  Cell,
} from "recharts";
import { TopBar } from "../components/TopBar";
import { type ApiSearchBenchmarkResponse, type ApiSystemMetrics, getSystemMetrics, runSortBenchmark } from "../../lib/api";

type AlgorithmKey = "bubble" | "selection" | "insertion" | "quick";

interface PerformanceBarItem {
  name: string;
  algorithm: AlgorithmKey;
  tiempo: number;
  color: string;
}

interface GrowthItem {
  size: string;
  bubble: number;
  selection: number;
  insertion: number;
  quick: number;
}

const algorithmConfig: Array<{ key: AlgorithmKey; label: string; color: string }> = [
  { key: "bubble", label: "Bubble", color: "#ef4444" },
  { key: "selection", label: "Selection", color: "#f59e0b" },
  { key: "insertion", label: "Insertion", color: "#10b981" },
  { key: "quick", label: "Quick", color: "#3b82f6" },
];

const allAlgorithmKeys = algorithmConfig.map((item) => item.key);

const sizeFilters = [
  { value: "500", label: "500" },
  { value: "5000", label: "5k" },
  { value: "50000", label: "50k" },
  { value: "200000", label: "200k" },
];

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

function toGrowthLabel(size: string) {
  const numeric = Number(size);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return size;
  }
  return numeric >= 1000 ? `${Math.round(numeric / 1000)}K` : String(numeric);
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

export function Rendimiento() {
  const [dataset, setDataset] = useState("pacientes");
  const [sortBy, setSortBy] = useState("nombre");
  const [dataSize, setDataSize] = useState("5000");
  const [selectedSizeFilter, setSelectedSizeFilter] = useState("5000");
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<AlgorithmKey[]>(allAlgorithmKeys);
  const [lastRunAlgorithms, setLastRunAlgorithms] = useState<AlgorithmKey[]>(allAlgorithmKeys);
  const [lastRunSize, setLastRunSize] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceBarItem[]>([]);
  const [growthData, setGrowthData] = useState<GrowthItem[]>([]);
  const [searchComparison, setSearchComparison] = useState<ApiSearchBenchmarkResponse | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<ApiSystemMetrics | null>(null);
  const [metricsNotice, setMetricsNotice] = useState<string | null>(null);
  const [historial, setHistorial] = useState<
    Array<{
      fecha: string;
      dataset: string;
      campo: string;
      size: string;
      algoritmos: string;
      mejor: string;
      tiempo: string;
    }>
  >([]);

  const allSelected = selectedAlgorithms.length === allAlgorithmKeys.length;

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
          "No se pudieron obtener las metricas del backend. Verifique /api/system/metrics."
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

  const toggleAllAlgorithms = () => {
    setSelectedAlgorithms(allSelected ? ["quick"] : allAlgorithmKeys);
  };

  const toggleAlgorithm = (algorithm: AlgorithmKey) => {
    setSelectedAlgorithms((prev) => {
      if (prev.includes(algorithm)) {
        const updated = prev.filter((item) => item !== algorithm);
        return updated.length === 0 ? [algorithm] : updated;
      }
      return [...prev, algorithm];
    });
  };

  const handleExecute = async () => {
    setIsRunning(true);
    try {
      const response = await runSortBenchmark({
        dataset: dataset as "pacientes" | "consultas",
        campo: sortBy,
        size: Number(dataSize),
        algoritmos: selectedAlgorithms,
      });

      const configByLabel = new Map(algorithmConfig.map((item) => [item.label, item]));
      const normalizedPerformance = response.results.map((result) => {
        const config = configByLabel.get(result.name);
        return {
          name: result.name,
          algorithm: (config?.key ?? "quick") as AlgorithmKey,
          tiempo: Number(result.timeMs.toFixed(3)),
          color: config?.color ?? "#6366f1",
        };
      });

      const normalizedGrowth = response.growth.map((item) => ({
        size: toGrowthLabel(item.size),
        bubble: Number(item.bubble.toFixed(3)),
        selection: Number(item.selection.toFixed(3)),
        insertion: Number(item.insertion.toFixed(3)),
        quick: Number(item.quick.toFixed(3)),
      }));

      const selectedFromResponse = (
        response.selectedAlgorithms?.filter((value): value is AlgorithmKey =>
          allAlgorithmKeys.includes(value as AlgorithmKey)
        ) ?? selectedAlgorithms
      ) as AlgorithmKey[];

      setPerformanceData(normalizedPerformance);
      setGrowthData(normalizedGrowth);
      setSearchComparison(response.searchComparison ?? null);
      setLastRunAlgorithms(selectedFromResponse.length ? selectedFromResponse : selectedAlgorithms);
      setLastRunSize(dataSize);
      setSelectedSizeFilter(dataSize);
      setShowResults(true);

      const fastest = [...response.results].sort((a, b) => a.timeMs - b.timeMs)[0];
      if (fastest) {
        setHistorial((prev) =>
          [
            {
              fecha: formatNowTimestamp(),
              dataset: dataset === "pacientes" ? "Pacientes" : "Consultas",
              campo: sortBy,
              size: Number(dataSize).toLocaleString(),
              algoritmos: selectedFromResponse
                .map((key) => algorithmConfig.find((item) => item.key === key)?.label ?? key)
                .join(", "),
              mejor: fastest.name,
              tiempo: `${fastest.timeMs.toFixed(3)} ms`,
            },
            ...prev,
          ].slice(0, 10)
        );
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "No se pudo ejecutar el benchmark.");
    } finally {
      setIsRunning(false);
    }
  };

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

  const currentRunMatchesFilter = !lastRunSize || lastRunSize === selectedSizeFilter;
  const linealMs = searchComparison?.linealMs ?? 0;
  const binariaMs = searchComparison?.binariaMs ?? 0;
  const sortMs = searchComparison?.sortMs ?? 0;
  const binariaTotalMs = searchComparison?.binariaTotalMs ?? sortMs + binariaMs;
  const improvementWithoutSort =
    searchComparison?.improvementWithoutSortPct ?? searchComparison?.improvementPct ?? 0;
  const improvementWithSort = searchComparison?.improvementWithSortPct ?? 0;
  const breakEvenQueries = searchComparison?.breakEvenQueries ?? null;
  const maxSearch = Math.max(linealMs, binariaMs, binariaTotalMs, 1);

  const withoutSortTie = Math.abs(linealMs - binariaMs) < 0.01;
  const withSortTie = Math.abs(linealMs - binariaTotalMs) < 0.01;
  const binaryWinsWithoutSort = binariaMs < linealMs;
  const binaryWinsWithSort = binariaTotalMs < linealMs;

  const visibleAlgorithmSet = new Set(lastRunAlgorithms);
  const ramUsage = systemMetrics?.ramUsagePct ?? 0;
  const cpuUsage = systemMetrics?.cpuUsagePct ?? 0;
  const cpuTemp =
    systemMetrics?.cpuTempC === null || systemMetrics?.cpuTempC === undefined
      ? "N/D"
      : `${systemMetrics.cpuTempC.toFixed(1)} C`;

  return (
    <div className="p-8 bg-gray-50">
      <TopBar title="Laboratorio de Rendimiento" showFilters={false} />

      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
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
            <label className="block text-xs font-medium text-gray-700 mb-2">Tamano</label>
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

          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-2">Algoritmos</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleAllAlgorithms}
                className={`rounded-xl border px-3 py-2 text-xs transition-colors ${
                  allSelected
                    ? "border-purple-600 bg-purple-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-purple-300"
                }`}
              >
                {allSelected ? <Check className="inline h-3.5 w-3.5 mr-1" /> : null}
                Todos
              </button>

              {algorithmConfig.map((algorithm) => {
                const active = selectedAlgorithms.includes(algorithm.key);
                return (
                  <button
                    key={algorithm.key}
                    type="button"
                    onClick={() => toggleAlgorithm(algorithm.key)}
                    className={`rounded-xl border px-3 py-2 text-xs transition-colors ${
                      active
                        ? "border-purple-600 bg-purple-50 text-purple-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-purple-300"
                    }`}
                  >
                    {active ? <Check className="inline h-3.5 w-3.5 mr-1" /> : null}
                    {algorithm.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleExecute}
            disabled={isRunning}
            className="w-full max-w-xs flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Ejecutando...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                Ejecutar benchmark
              </>
            )}
          </button>
        </div>
      </div>

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

      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Monitoreo de Hardware</h2>
        </div>

        {metricsNotice ? <p className="mb-3 text-xs text-amber-700">{metricsNotice}</p> : null}

        {systemMetrics ? (
          <p className="mb-3 text-xs text-gray-500">
            Fuente: {systemMetrics.machineName ?? "backend"} (PID {systemMetrics.processId ?? "N/D"}) -{" "}
            {systemMetrics.collectedAt}
          </p>
        ) : null}

        {!systemMetrics ? (
          <p className="text-sm text-gray-500">Cargando metricas...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500 mb-2">RAM en uso</p>
              <p className="text-xl font-bold text-gray-900">{ramUsage.toFixed(1)}%</p>
              <p className="text-xs text-gray-600 mt-1">
                {systemMetrics.ramUsedMb.toFixed(0)} MB / {systemMetrics.ramTotalMb.toFixed(0)} MB
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
              <p className="text-xs text-gray-600 mt-1">
                Carga del sistema: {systemMetrics.systemLoad.toFixed(2)}
              </p>
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
              <p className="text-xs text-gray-500 mb-1">Nucleos CPU</p>
              <p className="text-lg font-semibold text-gray-900">{systemMetrics.cpuCores}</p>
            </div>
          </div>
        )}
      </div>

      {showResults ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Tiempos por algoritmo</h2>
            </div>

            {currentRunMatchesFilter ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" label={{ value: "ms", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Bar dataKey="tiempo" radius={[8, 8, 0, 0]}>
                      {performanceData.map((item) => (
                        <Cell key={`${item.name}-${item.algorithm}`} fill={item.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  {performanceData.map((item) => (
                    <div key={`${item.name}-summary`} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
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

          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Curva de crecimiento</h2>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={visibleGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="size" stroke="#6b7280" />
                <YAxis stroke="#6b7280" label={{ value: "ms", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                {visibleAlgorithmSet.has("bubble") && (
                  <Line key="bubble-line" type="monotone" dataKey="bubble" stroke="#ef4444" strokeWidth={2} />
                )}
                {visibleAlgorithmSet.has("selection") && (
                  <Line key="selection-line" type="monotone" dataKey="selection" stroke="#f59e0b" strokeWidth={2} />
                )}
                {visibleAlgorithmSet.has("insertion") && (
                  <Line key="insertion-line" type="monotone" dataKey="insertion" stroke="#10b981" strokeWidth={2} />
                )}
                {visibleAlgorithmSet.has("quick") && (
                  <Line key="quick-line" type="monotone" dataKey="quick" stroke="#3b82f6" strokeWidth={2} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de ejecuciones</h2>
            <div className="space-y-3">
              {historial.length === 0 && <p className="text-sm text-gray-500">Aun no hay ejecuciones registradas.</p>}
              {historial.map((item, index) => (
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
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {item.size} registros
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      Algoritmos: {item.algoritmos}
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                      Mejor: {item.mejor}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-50 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Lineal vs Binaria</h2>
            </div>

            <p className="text-sm text-gray-700 mb-6">
              Se reportan ambos escenarios: sin costo de ordenar y con costo de ordenar (sort + binaria).
            </p>

            <div className="space-y-4">
              <div className="bg-white/70 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-700">Busqueda Lineal</span>
                  <span className="font-semibold text-gray-900">{linealMs.toFixed(3)} ms</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: `${(linealMs / maxSearch) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-white/70 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-700">Busqueda Binaria (solo buscar)</span>
                  <span className="font-semibold text-gray-900">{binariaMs.toFixed(3)} ms</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${(binariaMs / maxSearch) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-white/70 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-700">Costo de ordenar (sortMs)</span>
                  <span className="font-semibold text-gray-900">{sortMs.toFixed(3)} ms</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${(sortMs / maxSearch) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-white/70 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-700">Binaria total (sort + search)</span>
                  <span className="font-semibold text-gray-900">{binariaTotalMs.toFixed(3)} ms</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-700"
                    style={{ width: `${(binariaTotalMs / maxSearch) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-white/75 p-4">
                <p className="text-xs font-medium text-gray-600">Mejora sin costo de ordenar</p>
                <p className="text-xl font-bold text-gray-900">{formatPercent(improvementWithoutSort)}</p>
                <p className="mt-1 text-xs text-gray-600">
                  {withoutSortTie
                    ? "Empate tecnico entre lineal y binaria."
                    : binaryWinsWithoutSort
                      ? "Binaria gana si el dataset ya esta ordenado."
                      : "Lineal gano en esta medicion puntual."}
                </p>
              </div>

              <div className="rounded-xl bg-white/75 p-4">
                <p className="text-xs font-medium text-gray-600">Mejora con costo de ordenar</p>
                <p className="text-xl font-bold text-gray-900">{formatPercent(improvementWithSort)}</p>
                <p className="mt-1 text-xs text-gray-600">
                  {withSortTie
                    ? "Empate tecnico al incluir el costo de ordenar."
                    : binaryWinsWithSort
                      ? "Incluso ordenando, binaria termina mejor en esta corrida."
                      : "Con una sola busqueda, lineal es mas conveniente."}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-white/75 p-4">
              <p className="text-xs font-medium text-gray-600">Break-even queries</p>
              <p className="text-xl font-bold text-gray-900">
                {breakEvenQueries === null ? "No aplica" : breakEvenQueries}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {breakEvenQueries === null
                  ? "Binaria no recupera el costo de ordenar porque no reduce el tiempo por consulta."
                  : `A partir de ${breakEvenQueries} busquedas, ordenar primero empieza a amortizarse.`}
              </p>
            </div>

            <div className="mt-4 rounded-xl bg-green-100 p-4">
              <p className="text-sm font-medium text-green-900 mb-1">Conclusion</p>
              <p className="text-xs text-green-800">
                {withSortTie
                  ? "El costo total de ambas estrategias quedo practicamente igual."
                  : binaryWinsWithSort
                    ? "Para este dataset, ordenar y luego usar binaria es la mejor estrategia total."
                    : "Para consultas aisladas, lineal es mejor; use break-even para decidir desde cuantas consultas conviene ordenar."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 shadow-sm">
          <div className="text-center text-gray-400">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Configure los parametros y ejecute el experimento.</p>
          </div>
        </div>
      )}
    </div>
  );
}
