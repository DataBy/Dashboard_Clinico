import { useEffect, useMemo, useRef, useState } from "react";
import { Search, TrendingDown, Zap } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { Badge } from "../components/Badge";
import { useGlassToast } from "../components/GlassToast";
import { type ApiConsulta, type ApiPaciente, getConsultas, getPacientes } from "../../lib/api";

type SearchType = "cedula" | "nombre";
type SearchControlAlgorithm = "lineal" | "binaria" | "ambos";

interface SearchSummary {
  criteriaLabel: string;
  algorithm: string;
  executionMs: number | null;
  datasetSize: string;
  total: number;
  searchType: SearchType;
  selectedAlgorithm: SearchControlAlgorithm;
  filtersActive: boolean;
}

interface SearchResultItem {
  key: string;
  patient: ApiPaciente;
  matchingConsultas: ApiConsulta[];
  latestConsulta: ApiConsulta | null;
}

interface SingleMetricCardData {
  label: string;
  timeMs: number | null;
  caption: string;
  panelClassName: string;
  iconClassName: string;
  barClassName: string;
}

interface BenchmarkRecord {
  patient: ApiPaciente;
  consultas: ApiConsulta[];
  normalizedName: string;
  nameKeys: string[];
}

interface NameIndexEntry {
  key: string;
  recordIndex: number;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatExecutionMs(value: number | null, digits = 3) {
  return value === null ? "Midiendo..." : `${value.toFixed(digits)} ms`;
}

function getMetricBarWidth(value: number | null) {
  if (value === null) {
    return "18%";
  }

  return `${Math.max(Math.min((value / 150) * 100, 100), 8)}%`;
}

function getSearchTypeLabel(searchType: SearchType) {
  return searchType === "cedula" ? "Cédula exacta" : "Nombre parcial";
}

function getAlgorithmLabel(algorithm: SearchControlAlgorithm) {
  if (algorithm === "binaria") {
    return "Búsqueda Binaria";
  }

  if (algorithm === "ambos") {
    return "Comparativa Lineal/Binaria";
  }

  return "Búsqueda Lineal";
}

function hasActiveFilters(dateFrom: string, dateTo: string, severityLevel: string) {
  return Boolean(dateFrom || dateTo || severityLevel !== "all");
}

function buildCriteriaLabel(
  searchType: SearchType,
  term: string,
  dateFrom: string,
  dateTo: string,
  severityLevel: string
) {
  const filters: string[] = [];

  if (dateFrom || dateTo) {
    filters.push(`fechas ${dateFrom || "inicio"} → ${dateTo || "fin"}`);
  }

  if (severityLevel !== "all") {
    filters.push(`gravedad ${severityLevel}`);
  }

  return filters.length
    ? `${getSearchTypeLabel(searchType)}: ${term} | ${filters.join(" | ")}`
    : `${getSearchTypeLabel(searchType)}: ${term}`;
}

function buildNameKeys(normalizedName: string) {
  const words = normalizedName.split(/\s+/).filter(Boolean);
  return Array.from(new Set([normalizedName, ...words]));
}

function buildExpandedDataset<T>(items: T[], size: number) {
  if (!items.length || size <= 0) {
    return [] as T[];
  }

  const expanded = new Array<T>(size);
  for (let index = 0; index < size; index += 1) {
    expanded[index] = items[index % items.length];
  }
  return expanded;
}

function buildCedulaBenchmarkRecords(
  records: BenchmarkRecord[],
  size: number,
  targetCedula: string
) {
  if (!records.length || size <= 0) {
    return [] as BenchmarkRecord[];
  }

  const normalizedTarget = targetCedula.trim();
  const actualMatch =
    records.find((record) => record.patient.cedula === normalizedTarget) ?? null;
  const targetIndex = Math.min(Math.max(Math.floor(size * 0.72), 0), size - 1);
  const benchmark = new Array<BenchmarkRecord>(size);

  for (let index = 0; index < size; index += 1) {
    const base = records[index % records.length];
    benchmark[index] = {
      ...base,
      patient: {
        ...base.patient,
        cedula: `BENCH-${String(index).padStart(9, "0")}`,
      },
    };
  }

  if (actualMatch) {
    benchmark[targetIndex] = actualMatch;
  }

  return benchmark;
}

function buildNameIndex(records: BenchmarkRecord[]) {
  const entries: NameIndexEntry[] = [];

  records.forEach((record, recordIndex) => {
    record.nameKeys.forEach((key) => {
      entries.push({ key, recordIndex });
    });
  });

  entries.sort((a, b) => a.key.localeCompare(b.key) || a.recordIndex - b.recordIndex);
  return entries;
}

function filterConsultasByCriteria(
  consultas: ApiConsulta[],
  dateFrom: string,
  dateTo: string,
  severityLevel: string
) {
  const startBoundary = dateFrom ? `${dateFrom} 00:00` : "";
  const endBoundary = dateTo ? `${dateTo} 23:59` : "";

  return consultas.filter((consulta) => {
    if (startBoundary && consulta.fecha < startBoundary) {
      return false;
    }

    if (endBoundary && consulta.fecha > endBoundary) {
      return false;
    }

    if (severityLevel !== "all" && String(consulta.gravedad) !== severityLevel) {
      return false;
    }

    return true;
  });
}

function buildVisibleResults(
  records: BenchmarkRecord[],
  searchType: SearchType,
  term: string,
  dateFrom: string,
  dateTo: string,
  severityLevel: string
) {
  const normalizedTerm = normalizeText(term);
  const filtersActive = hasActiveFilters(dateFrom, dateTo, severityLevel);

  return records
    .filter((record) =>
      searchType === "cedula"
        ? record.patient.cedula === term
        : record.normalizedName.includes(normalizedTerm)
    )
    .map((record) => {
      const matchingConsultas = filtersActive
        ? filterConsultasByCriteria(record.consultas, dateFrom, dateTo, severityLevel)
        : record.consultas;

      return {
        key: record.patient.cedula,
        patient: record.patient,
        matchingConsultas,
        latestConsulta: matchingConsultas[0] ?? null,
      };
    })
    .filter((item) => !filtersActive || item.matchingConsultas.length > 0);
}

function lowerBoundByValue<T>(
  items: T[],
  target: string,
  getValue: (item: T) => string
) {
  let left = 0;
  let right = items.length;

  while (left < right) {
    const middle = left + Math.floor((right - left) / 2);
    if (getValue(items[middle]) < target) {
      left = middle + 1;
    } else {
      right = middle;
    }
  }

  return left;
}

function linearSearchByCedula(
  records: BenchmarkRecord[],
  term: string,
  dateFrom: string,
  dateTo: string,
  severityLevel: string
) {
  for (const record of records) {
    if (record.patient.cedula !== term) {
      continue;
    }

    if (!hasActiveFilters(dateFrom, dateTo, severityLevel)) {
      return [record];
    }

    return filterConsultasByCriteria(record.consultas, dateFrom, dateTo, severityLevel).length
      ? [record]
      : [];
  }

  return [] as BenchmarkRecord[];
}

function binarySearchByCedula(
  records: BenchmarkRecord[],
  term: string,
  dateFrom: string,
  dateTo: string,
  severityLevel: string
) {
  let left = 0;
  let right = records.length - 1;

  while (left <= right) {
    const middle = left + Math.floor((right - left) / 2);
    const candidate = records[middle];

    if (candidate.patient.cedula === term) {
      if (!hasActiveFilters(dateFrom, dateTo, severityLevel)) {
        return [candidate];
      }

      return filterConsultasByCriteria(candidate.consultas, dateFrom, dateTo, severityLevel).length
        ? [candidate]
        : [];
    }

    if (candidate.patient.cedula < term) {
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  return [] as BenchmarkRecord[];
}

function linearSearchByNombre(
  records: BenchmarkRecord[],
  term: string,
  dateFrom: string,
  dateTo: string,
  severityLevel: string
) {
  const normalizedTerm = normalizeText(term);
  const matches: BenchmarkRecord[] = [];
  const filtersActive = hasActiveFilters(dateFrom, dateTo, severityLevel);

  for (const record of records) {
    if (!record.normalizedName.includes(normalizedTerm)) {
      continue;
    }

    if (!filtersActive) {
      matches.push(record);
      continue;
    }

    if (filterConsultasByCriteria(record.consultas, dateFrom, dateTo, severityLevel).length) {
      matches.push(record);
    }
  }

  return matches;
}

function binarySearchByNombre(
  nameIndex: NameIndexEntry[],
  records: BenchmarkRecord[],
  term: string,
  dateFrom: string,
  dateTo: string,
  severityLevel: string
) {
  const normalizedTerm = normalizeText(term);
  const left = lowerBoundByValue(nameIndex, normalizedTerm, (entry) => entry.key);
  const matchedRecords: BenchmarkRecord[] = [];
  const seen = new Set<number>();
  const filtersActive = hasActiveFilters(dateFrom, dateTo, severityLevel);

  for (let index = left; index < nameIndex.length; index += 1) {
    const entry = nameIndex[index];
    if (!entry.key.startsWith(normalizedTerm)) {
      break;
    }

    if (seen.has(entry.recordIndex)) {
      continue;
    }

    seen.add(entry.recordIndex);
    const record = records[entry.recordIndex];

    if (!filtersActive) {
      matchedRecords.push(record);
      continue;
    }

    if (filterConsultasByCriteria(record.consultas, dateFrom, dateTo, severityLevel).length) {
      matchedRecords.push(record);
    }
  }

  return matchedRecords;
}

function getSingleMetricCaption(summary: SearchSummary) {
  if (summary.searchType === "nombre") {
    return summary.selectedAlgorithm === "binaria"
      ? "Busca coincidencias por prefijo en un índice ordenado de nombres y apellidos, y luego valida los filtros opcionales."
      : "Recorre los nombres del historial y luego aplica los filtros opcionales de fecha y gravedad si fueron definidos.";
  }

  return summary.selectedAlgorithm === "binaria"
    ? "Ubica la cédula en datos ordenados y después valida los filtros opcionales sobre el historial del paciente."
    : "Recorre las cédulas disponibles y luego aplica los filtros opcionales de fecha y gravedad si están activos.";
}

function buildSingleMetricCard(
  summary: SearchSummary | null,
  performanceData: { lineal: number; binaria: number } | null
): SingleMetricCardData | null {
  if (!summary || summary.selectedAlgorithm === "ambos") {
    return null;
  }

  if (summary.selectedAlgorithm === "binaria") {
    return {
      label: "Búsqueda Binaria",
      timeMs: performanceData?.binaria ?? summary.executionMs,
      caption: getSingleMetricCaption(summary),
      panelClassName: "bg-emerald-50",
      iconClassName: "bg-emerald-100 text-emerald-600",
      barClassName: "from-emerald-400 to-green-500",
    };
  }

  return {
    label: "Búsqueda Lineal",
    timeMs: performanceData?.lineal ?? summary.executionMs,
    caption: getSingleMetricCaption(summary),
    panelClassName: "bg-amber-50",
    iconClassName: "bg-amber-100 text-amber-600",
    barClassName: "from-amber-400 to-orange-500",
  };
}

function getComparisonNarrative(searchType: SearchType) {
  if (searchType === "nombre") {
    return {
      intro:
        "Comparación sobre un índice alfabético de nombres. La búsqueda binaria usa nombres y apellidos ordenados para ubicar coincidencias por prefijo sin mezclar el costo del índice.",
      binaryWin:
        "La búsqueda binaria aprovechó el índice ordenado de nombres para reducir comparaciones.",
      linearWin:
        "En esta medición la búsqueda lineal resolvió antes las coincidencias parciales por nombre.",
      bestBinary:
        "Recomendada cuando los nombres ya están normalizados y preordenados para consultas frecuentes.",
      bestLinear:
        "Resultado puntual de esta medición; para términos muy cortos o muy comunes la lineal puede defenderse bien.",
    };
  }

  return {
    intro:
      "Comparación sobre cédulas ordenadas. La búsqueda binaria localiza la coincidencia exacta y luego valida los filtros opcionales del historial.",
    binaryWin:
      "La búsqueda binaria superó a la lineal sobre cédulas preordenadas.",
    linearWin:
      "En esta medición la búsqueda lineal terminó antes que la binaria.",
    bestBinary:
      "Recomendada cuando el padrón de pacientes ya está ordenado por cédula.",
    bestLinear:
      "Resultado puntual de esta medición; conviene revisar el tamaño y distribución del dataset usado.",
  };
}

function measureOperation<T>(operation: () => T) {
  const start = performance.now();
  const result = operation();
  const elapsedMs = Math.max(performance.now() - start, 0.01);
  return { result, elapsedMs };
}

export function Busqueda() {
  const liveSearchTimeoutRef = useRef<number | null>(null);
  const [pacientes, setPacientes] = useState<ApiPaciente[]>([]);
  const [consultas, setConsultas] = useState<ApiConsulta[]>([]);
  const [searchType, setSearchType] = useState<SearchType>("cedula");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [severityLevel, setSeverityLevel] = useState("all");
  const [datasetSize, setDatasetSize] = useState("5000");
  const [algorithm, setAlgorithm] = useState<SearchControlAlgorithm>("lineal");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [performanceData, setPerformanceData] = useState<{
    lineal: number;
    binaria: number;
  } | null>(null);
  const [summary, setSummary] = useState<SearchSummary | null>(null);
  const [history, setHistory] = useState<Array<{ size: string; time: string; type: string }>>([]);
  const { showToast } = useGlassToast();

  const datasetCount = Number(datasetSize);
  const consultasByCedula = useMemo(() => {
    const map = new Map<string, ApiConsulta[]>();

    for (const consulta of consultas) {
      const current = map.get(consulta.cedulaPaciente) ?? [];
      current.push(consulta);
      map.set(consulta.cedulaPaciente, current);
    }

    for (const [cedula, items] of map.entries()) {
      map.set(cedula, [...items].sort((a, b) => b.fecha.localeCompare(a.fecha)));
    }

    return map;
  }, [consultas]);
  const baseRecords = useMemo(() => {
    return pacientes.map((patient) => {
      const normalizedName = normalizeText(patient.nombre);
      return {
        patient,
        consultas: consultasByCedula.get(patient.cedula) ?? [],
        normalizedName,
        nameKeys: buildNameKeys(normalizedName),
      };
    });
  }, [consultasByCedula, pacientes]);
  const benchmarkNameRecords = useMemo(() => {
    return buildExpandedDataset(baseRecords, datasetCount);
  }, [baseRecords, datasetCount]);
  const benchmarkNameIndex = useMemo(() => {
    return buildNameIndex(benchmarkNameRecords);
  }, [benchmarkNameRecords]);
  const benchmarkCedulaRecords = useMemo(() => {
    return buildCedulaBenchmarkRecords(baseRecords, datasetCount, searchTerm);
  }, [baseRecords, datasetCount, searchTerm]);
  const benchmarkCedulaSorted = useMemo(() => {
    return [...benchmarkCedulaRecords].sort((a, b) => a.patient.cedula.localeCompare(b.patient.cedula));
  }, [benchmarkCedulaRecords]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [pacientesApi, consultasApi] = await Promise.all([getPacientes(), getConsultas()]);

        if (cancelled) {
          return;
        }

        setPacientes(pacientesApi);
        setConsultas(consultasApi);
        setSearchTerm((prev) => prev || pacientesApi[0]?.cedula || "");
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          showToast("No se pudo cargar la información del historial clínico.", 2600);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingData(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  useEffect(() => {
    if (!pacientes.length) {
      return;
    }

    if (searchType === "cedula") {
      setSearchTerm((prev) => {
        const trimmed = prev.trim();
        if (trimmed && /^[\d-]+$/.test(trimmed)) {
          return prev;
        }
        return pacientes[0]?.cedula ?? prev;
      });
      return;
    }

    setSearchTerm((prev) => {
      const trimmed = prev.trim();
      if (trimmed && !/^[\d-]+$/.test(trimmed)) {
        return prev;
      }
      return pacientes[0]?.nombre.split(" ")[0] ?? prev;
    });
  }, [pacientes, searchType]);

  const clearScheduledSearch = () => {
    if (liveSearchTimeoutRef.current !== null) {
      window.clearTimeout(liveSearchTimeoutRef.current);
      liveSearchTimeoutRef.current = null;
    }
  };

  const validateCurrentSearch = () => {
    if (isLoadingData) {
      return "El historial aún se está cargando.";
    }

    if (!searchTerm.trim()) {
      return "Ingrese una cédula o un nombre para buscar.";
    }

    if (dateFrom && dateTo && dateFrom > dateTo) {
      return "La fecha inicial no puede ser mayor que la fecha final.";
    }

    if (severityLevel !== "all") {
      const gravedad = Number(severityLevel);
      if (!Number.isFinite(gravedad) || gravedad < 1 || gravedad > 5) {
        return "Seleccione un nivel de gravedad entre 1 y 5.";
      }
    }

    return null;
  };

  const handleSearch = (options?: { live?: boolean }) => {
    const validationMessage = validateCurrentSearch();

    if (validationMessage) {
      if (!options?.live) {
        showToast(validationMessage, 2400);
      }

      if (!isLoadingData) {
        setResults([]);
        setSummary(null);
        setPerformanceData(null);
      }

      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const term = searchTerm.trim();
      const filtersActive = hasActiveFilters(dateFrom, dateTo, severityLevel);
      const visibleResults = buildVisibleResults(
        baseRecords,
        searchType,
        term,
        dateFrom,
        dateTo,
        severityLevel
      );

      const { elapsedMs: linealMs } = measureOperation(() =>
        searchType === "cedula"
          ? linearSearchByCedula(benchmarkCedulaRecords, term, dateFrom, dateTo, severityLevel)
          : linearSearchByNombre(benchmarkNameRecords, term, dateFrom, dateTo, severityLevel)
      );
      const { elapsedMs: binariaMs } = measureOperation(() =>
        searchType === "cedula"
          ? binarySearchByCedula(benchmarkCedulaSorted, term, dateFrom, dateTo, severityLevel)
          : binarySearchByNombre(benchmarkNameIndex, benchmarkNameRecords, term, dateFrom, dateTo, severityLevel)
      );
      const executionMs =
        algorithm === "binaria" ? binariaMs : algorithm === "ambos" ? Math.min(linealMs, binariaMs) : linealMs;
      const algorithmLabel = getAlgorithmLabel(algorithm);

      setResults(visibleResults);
      setPerformanceData({ lineal: linealMs, binaria: binariaMs });
      setSummary({
        criteriaLabel: buildCriteriaLabel(searchType, term, dateFrom, dateTo, severityLevel),
        algorithm: algorithmLabel,
        executionMs,
        datasetSize: datasetCount.toLocaleString(),
        total: visibleResults.length,
        searchType,
        selectedAlgorithm: algorithm,
        filtersActive,
      });
      setHistory((prev) =>
        [
          {
            size: datasetCount.toLocaleString(),
            time:
              algorithm === "ambos"
                ? `L ${linealMs.toFixed(2)} / B ${binariaMs.toFixed(2)} ms`
                : `${executionMs.toFixed(2)} ms`,
            type: `${getSearchTypeLabel(searchType)} / ${algorithmLabel}`,
          },
          ...prev,
        ].slice(0, 6)
      );
    } catch (error) {
      console.error(error);
      if (!options?.live) {
        showToast("No se pudo ejecutar la búsqueda.", 2500);
      }
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    clearScheduledSearch();

    if (isLoadingData) {
      return;
    }

    const validationMessage = validateCurrentSearch();
    if (validationMessage) {
      setResults([]);
      setSummary(null);
      setPerformanceData(null);
      setIsSearching(false);
      return;
    }

    liveSearchTimeoutRef.current = window.setTimeout(() => {
      handleSearch({ live: true });
    }, 320);

    return () => {
      clearScheduledSearch();
    };
  }, [algorithm, dateFrom, dateTo, datasetCount, isLoadingData, searchTerm, searchType, severityLevel]);

  const comparisonPerformanceData = summary?.selectedAlgorithm === "ambos" ? performanceData : null;
  const comparisonNarrative = getComparisonNarrative(summary?.searchType ?? "cedula");
  const singleMetricCard = buildSingleMetricCard(summary, performanceData);
  const binaryDeltaPct = comparisonPerformanceData
    ? (1 - comparisonPerformanceData.binaria / Math.max(comparisonPerformanceData.lineal, 0.0001)) * 100
    : 0;
  const benchmarkHasTie = comparisonPerformanceData
    ? Math.abs(comparisonPerformanceData.lineal - comparisonPerformanceData.binaria) < 0.01
    : false;
  const binaryIsFaster = comparisonPerformanceData
    ? comparisonPerformanceData.binaria < comparisonPerformanceData.lineal
    : false;
  const benchmarkHeadline = !comparisonPerformanceData
    ? ""
    : benchmarkHasTie
      ? "Rendimiento equivalente"
      : binaryIsFaster
        ? `${binaryDeltaPct.toFixed(1)}% más rápida`
        : `${Math.abs(binaryDeltaPct).toFixed(1)}% más lenta`;
  const benchmarkCaption = !comparisonPerformanceData
    ? ""
    : benchmarkHasTie
      ? "La medición quedó prácticamente empatada entre ambos métodos."
      : binaryIsFaster
        ? comparisonNarrative.binaryWin
        : comparisonNarrative.linearWin;
  const bestMethodLabel = !comparisonPerformanceData
    ? ""
    : benchmarkHasTie
      ? "Empate técnico"
      : binaryIsFaster
        ? "Búsqueda Binaria"
        : "Búsqueda Lineal";
  const bestMethodDescription = !comparisonPerformanceData
    ? ""
    : benchmarkHasTie
      ? "Los dos tiempos quedaron casi iguales en este benchmark."
      : binaryIsFaster
        ? comparisonNarrative.bestBinary
        : comparisonNarrative.bestLinear;
  const historialRender = history.length
    ? history
    : [
        { size: "5,000", time: "19.6 ms", type: "Nombre parcial / Búsqueda Lineal" },
        { size: "5,000", time: "7.4 ms", type: "Nombre parcial / Búsqueda Binaria" },
        { size: "5,000", time: "12.1 ms", type: "Cédula exacta / Comparativa Lineal/Binaria" },
      ];

  const runImmediateSearch = () => {
    clearScheduledSearch();
    handleSearch();
  };

  return (
    <div className="p-8 bg-gray-50">
      <TopBar title="Búsqueda Comparativa" showFilters={false} />

      <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.1fr_1.7fr_1fr_1fr_0.9fr_1fr_1fr_1.1fr] xl:items-end">
          <div>
            <label className="mb-2 block min-h-8 text-xs font-medium text-gray-700">Tipo de búsqueda</label>
            <select
              value={searchType}
              onChange={(event) => setSearchType(event.target.value as SearchType)}
              className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="cedula">Cédula exacta</option>
              <option value="nombre">Nombre parcial</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block min-h-8 text-xs font-medium text-gray-700">Término</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  runImmediateSearch();
                }
              }}
              placeholder={searchType === "cedula" ? "001-0000000-0" : "Nombre del paciente"}
              className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="mb-2 block min-h-8 text-xs font-medium text-gray-700">Fecha desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="mb-2 block min-h-8 text-xs font-medium text-gray-700">Fecha hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="mb-2 block min-h-8 text-xs font-medium text-gray-700">Gravedad</label>
            <select
              value={severityLevel}
              onChange={(event) => setSeverityLevel(event.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todas</option>
              <option value="1">Gravedad 1</option>
              <option value="2">Gravedad 2</option>
              <option value="3">Gravedad 3</option>
              <option value="4">Gravedad 4</option>
              <option value="5">Gravedad 5</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block min-h-8 text-xs font-medium text-gray-700">Tamaño del dataset</label>
            <select
              value={datasetSize}
              onChange={(event) => setDatasetSize(event.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="500">500 registros</option>
              <option value="5000">5,000 registros</option>
              <option value="50000">50,000 registros</option>
              <option value="200000">200,000 registros</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block min-h-8 text-xs font-medium text-gray-700">Algoritmo</label>
            <select
              value={algorithm}
              onChange={(event) => setAlgorithm(event.target.value as SearchControlAlgorithm)}
              className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="lineal">Búsqueda Lineal</option>
              <option value="binaria">Búsqueda Binaria</option>
              <option value="ambos">Comparar Ambos</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={runImmediateSearch}
              disabled={isSearching || isLoadingData}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 text-white transition-all hover:shadow-lg disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Ejecutar búsqueda
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Resultados</h2>

          {summary && (
            <div className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs md:grid-cols-2">
              <div>
                <p className="text-gray-500">Criterio aplicado</p>
                <p className="font-medium text-gray-900">{summary.criteriaLabel}</p>
              </div>
              <div>
                <p className="text-gray-500">Algoritmo usado</p>
                <p className="font-medium text-gray-900">{summary.algorithm}</p>
              </div>
              <div>
                <p className="text-gray-500">Tiempo de ejecución</p>
                <p className="font-medium text-gray-900">{formatExecutionMs(summary.executionMs)}</p>
              </div>
              <div>
                <p className="text-gray-500">Dataset</p>
                <p className="font-medium text-gray-900">
                  {summary.datasetSize} registros ({summary.total} resultado(s))
                </p>
              </div>
            </div>
          )}

          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((item) => (
                <div
                  key={item.key}
                  className="rounded-xl border border-gray-200 p-4 transition-colors hover:border-purple-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{item.patient.nombre}</p>
                      <p className="text-sm text-gray-600">{item.patient.cedula}</p>
                    </div>
                    <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700">
                      {item.patient.edad} años
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
                    <div>
                      <p className="text-gray-500">
                        {summary?.filtersActive ? "Última coincidencia" : "Última consulta"}
                      </p>
                      <p className="font-medium text-gray-900">
                        {item.latestConsulta?.fecha ?? "Sin historial"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">
                        {summary?.filtersActive ? "Consultas filtradas" : "Consultas registradas"}
                      </p>
                      <p className="font-medium text-gray-900">{item.matchingConsultas.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Gravedad reciente</p>
                      {item.latestConsulta ? (
                        <Badge variant="gravedad" value={item.latestConsulta.gravedad} className="mt-1" />
                      ) : (
                        <p className="font-medium text-gray-900">Sin registros</p>
                      )}
                    </div>
                  </div>

                  {item.latestConsulta && (
                    <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs">
                      <p className="text-gray-500">Diagnóstico asociado</p>
                      <p className="font-medium text-gray-900">{item.latestConsulta.diagnostico}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-gray-400">
              {isLoadingData ? "Cargando historial..." : isSearching ? "Buscando..." : "No hay resultados"}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {singleMetricCard && (
            <div className={`${singleMetricCard.panelClassName} rounded-3xl p-6 shadow-sm`}>
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${singleMetricCard.iconClassName}`}
                >
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Tiempo de ejecución</h2>
                  <p className="text-xs text-gray-600">{singleMetricCard.label}</p>
                </div>
              </div>

              <p className="mb-5 text-xs text-gray-600">{singleMetricCard.caption}</p>

              <div className="rounded-2xl bg-white/80 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-700">{singleMetricCard.label}</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatExecutionMs(singleMetricCard.timeMs)}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full bg-gradient-to-r ${singleMetricCard.barClassName} transition-all`}
                    style={{ width: getMetricBarWidth(singleMetricCard.timeMs) }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {comparisonPerformanceData && (
            <>
              <div className="rounded-3xl bg-green-50 p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                    <Zap className="h-5 w-5 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Comparativa de Tiempos</h2>
                </div>
                <p className="mb-4 text-xs text-gray-600">{comparisonNarrative.intro}</p>

                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex justify-between">
                      <span className="text-sm text-gray-700">Búsqueda Lineal</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {comparisonPerformanceData.lineal.toFixed(2)} ms
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                        style={{
                          width: `${Math.min((comparisonPerformanceData.lineal / 150) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between">
                      <span className="text-sm text-gray-700">Búsqueda Binaria</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {comparisonPerformanceData.binaria.toFixed(2)} ms
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                        style={{
                          width: `${Math.min((comparisonPerformanceData.binaria / 150) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-white/60 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">Resultado del benchmark</span>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      benchmarkHasTie ? "text-slate-700" : binaryIsFaster ? "text-green-700" : "text-orange-700"
                    }`}
                  >
                    {benchmarkHeadline}
                  </p>
                  <p className="mt-2 text-xs text-gray-600">{benchmarkCaption}</p>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="mb-3 font-semibold text-gray-900">Mejor método</h3>
                <div
                  className={`flex items-center gap-3 rounded-xl border p-4 ${
                    benchmarkHasTie
                      ? "border-slate-200 bg-gradient-to-r from-slate-100 to-gray-100"
                      : binaryIsFaster
                        ? "border-green-200 bg-gradient-to-r from-green-100 to-emerald-100"
                        : "border-orange-200 bg-gradient-to-r from-orange-100 to-amber-100"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      benchmarkHasTie ? "bg-slate-500" : binaryIsFaster ? "bg-green-500" : "bg-orange-500"
                    }`}
                  >
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{bestMethodLabel}</p>
                    <p className="text-xs text-gray-600">{bestMethodDescription}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">Historial de pruebas</h3>
            <div className="space-y-2 text-sm">
              {historialRender.map((item, index) => (
                <div
                  key={`${item.type}-${item.size}-${index}`}
                  className="flex justify-between gap-3 rounded-lg p-2 hover:bg-gray-50"
                >
                  <span className="truncate text-gray-700">
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
