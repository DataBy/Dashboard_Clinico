#include "benchmark.h"

#include <algorithm>
#include <cctype>
#include <cmath>
#include <cstddef>
#include <string>
#include <vector>

#include "../algorithms/searching.h"
#include "../algorithms/sorting.h"

namespace benchmark {
namespace {

constexpr std::size_t kDefaultSize = 5000;
constexpr std::size_t kSortSampleCap = 4000;

std::size_t normalizeSize(std::size_t size) {
    return size == 0 ? kDefaultSize : size;
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

double complexityScale(const std::string& algorithm, std::size_t targetSize, std::size_t sampleSize) {
    if (targetSize <= sampleSize || sampleSize == 0) {
        return 1.0;
    }

    if (algorithm == "quick") {
        const double n = static_cast<double>(targetSize);
        const double m = static_cast<double>(sampleSize);
        return (n * std::log2(std::max(2.0, n))) / (m * std::log2(std::max(2.0, m)));
    }

    const double n = static_cast<double>(targetSize);
    const double m = static_cast<double>(sampleSize);
    return (n * n) / (m * m);
}

nlohmann::json timingsToJson(
    const std::vector<sorting::SortTiming>& timings,
    std::size_t targetSize,
    std::size_t sampleSize
) {
    nlohmann::json data = nlohmann::json::array();

    for (const auto& timing : timings) {
        const double adjusted = timing.elapsedMs * complexityScale(timing.algorithm, targetSize, sampleSize);
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
            {"timeMs", adjusted},
        });
    }

    return data;
}

nlohmann::json benchmarkSortValues(const std::vector<double>& values) {
    if (values.empty()) {
        return {
            {"results", nlohmann::json::array()},
            {"sampleSize", 0},
        };
    }

    const std::size_t sampleSize = std::min(values.size(), kSortSampleCap);
    std::vector<double> sample(values.begin(), values.begin() + static_cast<std::ptrdiff_t>(sampleSize));
    const auto measured = sorting::benchmarkSortAlgorithms(sample);

    return {
        {"results", timingsToJson(measured, values.size(), sampleSize)},
        {"sampleSize", sampleSize},
    };
}

template <typename Extractor, typename T>
nlohmann::json buildSortBenchmark(
    const std::vector<T>& baseData,
    const std::string& campo,
    std::size_t size,
    const std::string& datasetName,
    Extractor extractor
) {
    const auto expanded = expandDataset(baseData, size);
    const auto values = extractor(expanded, campo);
    auto sortData = benchmarkSortValues(values);

    const std::vector<std::size_t> growthSizes = {500, 5000, 50000, 200000};
    nlohmann::json growth = nlohmann::json::array();

    for (const auto growthSize : growthSizes) {
        const auto expandedGrowth = expandDataset(baseData, growthSize);
        const auto growthValues = extractor(expandedGrowth, campo);
        auto growthBench = benchmarkSortValues(growthValues);

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
        {"size", normalizeSize(size)},
        {"results", sortData["results"]},
        {"growth", growth},
    };
}

}  // namespace

nlohmann::json benchmarkOrdenamientoPacientes(
    const std::vector<Paciente>& pacientes,
    const std::string& campo,
    std::size_t size
) {
    return buildSortBenchmark(
        pacientes,
        campo,
        size,
        "pacientes",
        [](const std::vector<Paciente>& data, const std::string& selectedField) {
            return extractPacienteValues(data, selectedField);
        }
    );
}

nlohmann::json benchmarkOrdenamientoConsultas(
    const std::vector<Consulta>& consultas,
    const std::string& campo,
    std::size_t size
) {
    return buildSortBenchmark(
        consultas,
        campo,
        size,
        "consultas",
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
            {"improvementPct", 0.0},
            {"found", false},
        };
    }

    const std::string targetCedula =
        cedula.empty() ? expanded[expanded.size() / 2].cedula : cedula;

    const auto lineal = searching::linearSearchByCedula(expanded, targetCedula);
    const auto binaria = searching::binarySearchByCedula(expanded, targetCedula);

    double improvementPct = 0.0;
    if (lineal.elapsedMs > 0.0) {
        improvementPct = (1.0 - (binaria.elapsedMs / lineal.elapsedMs)) * 100.0;
    }

    return {
        {"size", normalizeSize(size)},
        {"cedula", targetCedula},
        {"linealMs", lineal.elapsedMs},
        {"binariaMs", binaria.elapsedMs},
        {"improvementPct", improvementPct},
        {"found", lineal.index != -1},
    };
}

}  // namespace benchmark
