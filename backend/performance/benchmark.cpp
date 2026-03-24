#include "benchmark.h"

#include <algorithm>
#include <chrono>
#include <cctype>
#include <cmath>
#include <cstddef>
#include <set>
#include <string>
#include <vector>

#include "../algorithms/sorting.h"

namespace benchmark {
namespace {

constexpr std::size_t kDefaultSize = 5000;

std::size_t normalizeSize(std::size_t size) {
    return size == 0 ? kDefaultSize : size;
}

double clampNonNegativeMs(double value) {
    return std::max(0.0, value);
}

std::vector<std::size_t> resolveGrowthSizes(std::size_t requestedSize) {
    const std::size_t normalized = normalizeSize(requestedSize);
    const std::vector<std::size_t> baseSizes = {500, 5000, 50000, 200000};
    std::vector<std::size_t> sizes;

    for (const auto candidate : baseSizes) {
        if (candidate <= normalized) {
            sizes.push_back(candidate);
        }
    }

    if (!sizes.empty() && sizes.back() == normalized) {
        return sizes;
    }

    sizes.push_back(normalized);
    std::sort(sizes.begin(), sizes.end());
    sizes.erase(std::unique(sizes.begin(), sizes.end()), sizes.end());
    return sizes;
}

double encodeString(const std::string& value) {
    double encoded = 0.0;
    for (unsigned char ch : value) {
        encoded = std::fmod(encoded * 131.0 + static_cast<double>(ch), 1000000000.0);
    }
    return encoded;
}

std::string toLower(const std::string& value) {
    std::string lowered = value;
    std::transform(
        lowered.begin(),
        lowered.end(),
        lowered.begin(),
        [](unsigned char ch) { return static_cast<char>(std::tolower(ch)); }
    );
    return lowered;
}

std::vector<std::string> normalizeSelectedAlgorithms(const std::vector<std::string>& algorithms) {
    static const std::vector<std::string> allAlgorithms = {"bubble", "selection", "insertion", "quick"};

    if (algorithms.empty()) {
        return allAlgorithms;
    }

    bool includeAll = false;
    for (const auto& algorithm : algorithms) {
        const std::string lowered = toLower(algorithm);
        if (lowered == "all" || lowered == "todos") {
            includeAll = true;
            break;
        }
    }
    if (includeAll) {
        return allAlgorithms;
    }

    std::set<std::string> selectedSet;
    for (const auto& algorithm : algorithms) {
        selectedSet.insert(toLower(algorithm));
    }

    std::vector<std::string> selected;
    for (const auto& candidate : allAlgorithms) {
        if (selectedSet.find(candidate) != selectedSet.end()) {
            selected.push_back(candidate);
        }
    }

    return selected.empty() ? allAlgorithms : selected;
}

template <typename T>
std::vector<T> expandDataset(const std::vector<T>& base, std::size_t size) {
    const std::size_t normalized = normalizeSize(size);
    if (base.empty()) {
        return {};
    }

    std::vector<T> expanded;
    expanded.reserve(normalized);
    for (std::size_t i = 0; i < normalized; ++i) {
        expanded.push_back(base[i % base.size()]);
    }
    return expanded;
}

std::vector<Paciente> sortPacientesByCedula(const std::vector<Paciente>& pacientes) {
    std::vector<Paciente> sorted = pacientes;
    std::sort(
        sorted.begin(),
        sorted.end(),
        [](const Paciente& a, const Paciente& b) { return a.cedula < b.cedula; }
    );
    return sorted;
}

int linearSearchIndexByCedula(const std::vector<Paciente>& pacientes, const std::string& cedula) {
    for (std::size_t i = 0; i < pacientes.size(); ++i) {
        if (pacientes[i].cedula == cedula) {
            return static_cast<int>(i);
        }
    }
    return -1;
}

int binarySearchIndexByCedula(const std::vector<Paciente>& pacientesOrdenados, const std::string& cedula) {
    int left = 0;
    int right = static_cast<int>(pacientesOrdenados.size()) - 1;

    while (left <= right) {
        const int middle = left + (right - left) / 2;
        const auto& candidate = pacientesOrdenados[static_cast<std::size_t>(middle)].cedula;
        if (candidate == cedula) {
            return middle;
        }
        if (candidate < cedula) {
            left = middle + 1;
        } else {
            right = middle - 1;
        }
    }
    return -1;
}

std::vector<std::string> buildCedulaSearchTargets(
    const std::vector<Paciente>& pacientes,
    const std::string& cedula
) {
    if (!cedula.empty()) {
        return {cedula};
    }
    if (pacientes.empty()) {
        return {};
    }

    return {pacientes[pacientes.size() / 2].cedula};
}

struct CedulaSearchBenchmarkResult {
    double linealMs = 0.0;
    double binariaMs = 0.0;
    bool found = false;
};

CedulaSearchBenchmarkResult benchmarkCedulaComparison(
    const std::vector<Paciente>& pacientes,
    const std::vector<Paciente>& pacientesOrdenados,
    const std::vector<std::string>& targets
) {
    if (pacientes.empty() || pacientesOrdenados.empty() || targets.empty()) {
        return {};
    }

    const std::size_t repetitions = 1;
    const double divisor = static_cast<double>(targets.size());
    bool found = false;

    volatile int linearGuard = 0;
    const auto linearStart = std::chrono::steady_clock::now();
    for (std::size_t repetition = 0; repetition < repetitions; ++repetition) {
        for (const auto& target : targets) {
            const int index = linearSearchIndexByCedula(pacientes, target);
            if (index != -1) {
                found = true;
            }
            linearGuard ^= index;
        }
    }
    const auto linearEnd = std::chrono::steady_clock::now();

    volatile int binaryGuard = linearGuard;
    const auto binaryStart = std::chrono::steady_clock::now();
    for (std::size_t repetition = 0; repetition < repetitions; ++repetition) {
        for (const auto& target : targets) {
            const int index = binarySearchIndexByCedula(pacientesOrdenados, target);
            binaryGuard ^= index;
        }
    }
    const auto binaryEnd = std::chrono::steady_clock::now();

    const double linearElapsed = clampNonNegativeMs(
        std::chrono::duration<double, std::milli>(linearEnd - linearStart).count() / divisor
    );
    const double binaryElapsed = clampNonNegativeMs(
        std::chrono::duration<double, std::milli>(binaryEnd - binaryStart).count() / divisor
    );

    (void)linearGuard;
    (void)binaryGuard;

    return {linearElapsed, binaryElapsed, found};
}

std::vector<double> extractPacienteValues(const std::vector<Paciente>& pacientes, const std::string& campo) {
    const std::string lowered = toLower(campo);
    std::vector<double> values;
    values.reserve(pacientes.size());

    for (const auto& paciente : pacientes) {
        if (lowered == "nombre") {
            values.push_back(encodeString(paciente.nombre));
        } else if (lowered == "edad") {
            values.push_back(static_cast<double>(paciente.edad));
        } else if (lowered == "prioridad") {
            values.push_back(static_cast<double>(paciente.prioridad));
        } else if (lowered == "fecha" || lowered == "fecharegistro") {
            values.push_back(encodeString(paciente.fechaRegistro));
        } else {
            values.push_back(static_cast<double>(paciente.edad));
        }
    }

    return values;
}

std::vector<double> extractConsultaValues(const std::vector<Consulta>& consultas, const std::string& campo) {
    const std::string lowered = toLower(campo);
    std::vector<double> values;
    values.reserve(consultas.size());

    for (const auto& consulta : consultas) {
        if (lowered == "fecha") {
            values.push_back(encodeString(consulta.fecha));
        } else if (lowered == "gravedad") {
            values.push_back(static_cast<double>(consulta.gravedad));
        } else if (lowered == "costo") {
            values.push_back(consulta.costo);
        } else if (lowered == "diagnostico") {
            values.push_back(encodeString(consulta.diagnostico));
        } else {
            values.push_back(consulta.costo);
        }
    }

    return values;
}

nlohmann::json timingsToJson(const std::vector<sorting::SortTiming>& timings) {
    nlohmann::json data = nlohmann::json::array();

    for (const auto& timing : timings) {
        std::string name = timing.algorithm;
        if (name == "bubble") {
            name = "Bubble";
        } else if (name == "selection") {
            name = "Selection";
        } else if (name == "insertion") {
            name = "Insertion";
        } else if (name == "quick") {
            name = "Quick";
        }

        data.push_back({
            {"name", name},
            {"algorithm", timing.algorithm},
            {"timeMs", clampNonNegativeMs(timing.elapsedMs)},
        });
    }

    return data;
}

nlohmann::json benchmarkSortValues(
    const std::vector<double>& values,
    const std::vector<std::string>& selectedAlgorithms
) {
    if (values.empty()) {
        return {
            {"results", nlohmann::json::array()},
            {"sampleSize", 0},
        };
    }

    const auto measured = sorting::benchmarkSortAlgorithms(values, selectedAlgorithms);

    return {
        {"results", timingsToJson(measured)},
        {"sampleSize", values.size()},
    };
}

template <typename Extractor, typename T>
nlohmann::json buildSortBenchmark(
    const std::vector<T>& baseData,
    const std::string& campo,
    std::size_t size,
    const std::string& datasetName,
    const std::vector<std::string>& algorithms,
    Extractor extractor
) {
    const auto selectedAlgorithms = normalizeSelectedAlgorithms(algorithms);
    const std::size_t normalizedSize = normalizeSize(size);
    const auto expanded = expandDataset(baseData, normalizedSize);
    const auto values = extractor(expanded, campo);
    auto sortData = benchmarkSortValues(values, selectedAlgorithms);

    const auto growthSizes = resolveGrowthSizes(normalizedSize);
    nlohmann::json growth = nlohmann::json::array();

    for (const auto growthSize : growthSizes) {
        const auto expandedGrowth = expandDataset(baseData, growthSize);
        const auto growthValues = extractor(expandedGrowth, campo);
        auto growthBench = benchmarkSortValues(growthValues, selectedAlgorithms);

        double bubble = 0.0;
        double selection = 0.0;
        double insertion = 0.0;
        double quick = 0.0;

        for (const auto& item : growthBench["results"]) {
            const std::string algorithm = item.value("algorithm", "");
            const double timeMs = item.value("timeMs", 0.0);
            if (algorithm == "bubble") {
                bubble = timeMs;
            } else if (algorithm == "selection") {
                selection = timeMs;
            } else if (algorithm == "insertion") {
                insertion = timeMs;
            } else if (algorithm == "quick") {
                quick = timeMs;
            }
        }

        growth.push_back({
            {"size", std::to_string(growthSize)},
            {"bubble", bubble},
            {"selection", selection},
            {"insertion", insertion},
            {"quick", quick},
        });
    }

    return {
        {"dataset", datasetName},
        {"campo", campo},
        {"size", normalizedSize},
        {"selectedAlgorithms", selectedAlgorithms},
        {"sampleSize", sortData["sampleSize"]},
        {"results", sortData["results"]},
        {"growth", growth},
    };
}

}  // namespace

nlohmann::json benchmarkOrdenamientoPacientes(
    const std::vector<Paciente>& pacientes,
    const std::string& campo,
    std::size_t size,
    const std::vector<std::string>& algorithms
) {
    return buildSortBenchmark(
        pacientes,
        campo,
        size,
        "pacientes",
        algorithms,
        [](const std::vector<Paciente>& data, const std::string& selectedField) {
            return extractPacienteValues(data, selectedField);
        }
    );
}

nlohmann::json benchmarkOrdenamientoConsultas(
    const std::vector<Consulta>& consultas,
    const std::string& campo,
    std::size_t size,
    const std::vector<std::string>& algorithms
) {
    return buildSortBenchmark(
        consultas,
        campo,
        size,
        "consultas",
        algorithms,
        [](const std::vector<Consulta>& data, const std::string& selectedField) {
            return extractConsultaValues(data, selectedField);
        }
    );
}

nlohmann::json benchmarkBusquedaPacientes(
    const std::vector<Paciente>& pacientes,
    const std::string& cedula,
    std::size_t size
) {
    const auto expanded = expandDataset(pacientes, size);
    if (expanded.empty()) {
        return {
            {"size", normalizeSize(size)},
            {"cedula", cedula},
            {"linealMs", 0.0},
            {"binariaMs", 0.0},
            {"sortMs", 0.0},
            {"binariaTotalMs", 0.0},
            {"improvementPct", 0.0},
            {"improvementWithoutSortPct", 0.0},
            {"improvementWithSortPct", 0.0},
            {"breakEvenQueries", nullptr},
            {"found", false},
        };
    }

    const auto sortStart = std::chrono::steady_clock::now();
    const auto pacientesOrdenados = sortPacientesByCedula(expanded);
    const auto sortEnd = std::chrono::steady_clock::now();
    const double sortMs =
        clampNonNegativeMs(std::chrono::duration<double, std::milli>(sortEnd - sortStart).count());

    const auto targets = buildCedulaSearchTargets(expanded, cedula);
    const std::string targetCedula =
        targets.empty() ? "" : (cedula.empty() ? targets[targets.size() / 2] : targets[0]);
    const auto comparison = benchmarkCedulaComparison(expanded, pacientesOrdenados, targets);

    const double binariaTotalMs = clampNonNegativeMs(sortMs + comparison.binariaMs);
    double improvementWithoutSortPct = 0.0;
    double improvementWithSortPct = 0.0;

    if (comparison.linealMs > 0.0) {
        improvementWithoutSortPct = std::clamp(
            (1.0 - (comparison.binariaMs / comparison.linealMs)) * 100.0,
            0.0,
            100.0
        );
        improvementWithSortPct = std::clamp(
            (1.0 - (binariaTotalMs / comparison.linealMs)) * 100.0,
            0.0,
            100.0
        );
    }

    nlohmann::json breakEvenQueries = nullptr;
    const double gainPerQuery = comparison.linealMs - comparison.binariaMs;
    if (gainPerQuery > 0.0) {
        if (sortMs <= 0.0) {
            breakEvenQueries = 0;
        } else {
            breakEvenQueries = static_cast<std::size_t>(std::ceil(sortMs / gainPerQuery));
        }
    }

    return {
        {"size", normalizeSize(size)},
        {"cedula", targetCedula},
        {"linealMs", comparison.linealMs},
        {"binariaMs", comparison.binariaMs},
        {"sortMs", sortMs},
        {"binariaTotalMs", binariaTotalMs},
        {"improvementPct", improvementWithoutSortPct},
        {"improvementWithoutSortPct", improvementWithoutSortPct},
        {"improvementWithSortPct", improvementWithSortPct},
        {"breakEvenQueries", breakEvenQueries},
        {"found", comparison.found},
    };
}

}  // namespace benchmark
