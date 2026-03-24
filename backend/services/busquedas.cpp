#include "busquedas.h"

#include <algorithm>
#include <chrono>
#include <cctype>
#include <set>
#include <sstream>
#include <unordered_map>
#include <utility>
#include <vector>

namespace busquedas {
namespace {

struct PacienteIndexado {
    const Paciente* paciente = nullptr;
    std::string nombreNormalizado;
    std::vector<std::string> clavesNombre;
};

struct NombreIndexEntry {
    std::string key;
    std::size_t recordIndex = 0;
};

std::string trim(const std::string& value) {
    const auto start = value.find_first_not_of(" \t\r\n");
    if (start == std::string::npos) {
        return "";
    }
    const auto end = value.find_last_not_of(" \t\r\n");
    return value.substr(start, end - start + 1);
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

std::string normalizeName(const std::string& value) {
    std::string normalized;
    normalized.reserve(value.size());

    for (unsigned char ch : value) {
        if (std::isalnum(ch) != 0) {
            normalized.push_back(static_cast<char>(std::tolower(ch)));
        } else {
            normalized.push_back(' ');
        }
    }

    std::string compact;
    compact.reserve(normalized.size());
    bool previousSpace = true;

    for (unsigned char ch : normalized) {
        if (ch == ' ') {
            if (!previousSpace) {
                compact.push_back(' ');
            }
            previousSpace = true;
            continue;
        }

        compact.push_back(static_cast<char>(ch));
        previousSpace = false;
    }

    if (!compact.empty() && compact.back() == ' ') {
        compact.pop_back();
    }

    return compact;
}

std::vector<std::string> splitWords(const std::string& normalized) {
    std::stringstream stream(normalized);
    std::string token;
    std::vector<std::string> words;
    while (stream >> token) {
        if (!token.empty()) {
            words.push_back(token);
        }
    }
    return words;
}

bool startsWith(const std::string& value, const std::string& prefix) {
    return value.size() >= prefix.size() && value.compare(0, prefix.size(), prefix) == 0;
}

std::size_t resolveMaxResults(std::size_t maxResultados, std::size_t datasetSize) {
    if (maxResultados == 0) {
        return datasetSize;
    }
    return maxResultados;
}

std::string normalizeAlgorithm(const std::string& algoritmoPreferido) {
    const std::string lowered = toLower(trim(algoritmoPreferido));
    if (lowered == "binaria" || lowered == "ambos" || lowered == "lineal") {
        return lowered;
    }
    return "lineal";
}

int parseDateKey(const std::string& value) {
    if (value.size() < 10) {
        return -1;
    }

    const std::string date = value.substr(0, 10);
    if (date[4] != '-' || date[7] != '-') {
        return -1;
    }

    for (std::size_t index = 0; index < date.size(); ++index) {
        if (index == 4 || index == 7) {
            continue;
        }
        if (std::isdigit(static_cast<unsigned char>(date[index])) == 0) {
            return -1;
        }
    }

    const int year = std::stoi(date.substr(0, 4));
    const int month = std::stoi(date.substr(5, 2));
    const int day = std::stoi(date.substr(8, 2));

    if (month < 1 || month > 12 || day < 1 || day > 31) {
        return -1;
    }

    return year * 10000 + month * 100 + day;
}

bool hasActiveFilters(const BusquedaFiltros& filtros) {
    return !trim(filtros.fechaDesde).empty() || !trim(filtros.fechaHasta).empty() || filtros.gravedad > 0;
}

bool consultaMatchesFilters(
    const Consulta& consulta,
    int fromDateKey,
    int toDateKey,
    int gravedadFiltro
) {
    if (gravedadFiltro > 0 && consulta.gravedad != gravedadFiltro) {
        return false;
    }

    const int consultaDate = parseDateKey(consulta.fecha);
    if (fromDateKey != -1 && consultaDate != -1 && consultaDate < fromDateKey) {
        return false;
    }
    if (toDateKey != -1 && consultaDate != -1 && consultaDate > toDateKey) {
        return false;
    }

    if ((fromDateKey != -1 || toDateKey != -1) && consultaDate == -1) {
        return false;
    }

    return true;
}

std::unordered_map<std::string, std::vector<const Consulta*>> buildConsultasByCedula(
    const std::vector<Consulta>& consultas
) {
    std::unordered_map<std::string, std::vector<const Consulta*>> consultasByCedula;
    consultasByCedula.reserve(consultas.size());

    for (const auto& consulta : consultas) {
        consultasByCedula[consulta.cedulaPaciente].push_back(&consulta);
    }

    return consultasByCedula;
}

bool matchesConsultaFilters(
    const Paciente& paciente,
    const std::unordered_map<std::string, std::vector<const Consulta*>>& consultasByCedula,
    const BusquedaFiltros& filtros,
    bool filtrosActivos,
    int fromDateKey,
    int toDateKey
) {
    if (!filtrosActivos) {
        return true;
    }

    const auto it = consultasByCedula.find(paciente.cedula);
    if (it == consultasByCedula.end()) {
        return false;
    }

    for (const auto* consulta : it->second) {
        if (consulta != nullptr &&
            consultaMatchesFilters(*consulta, fromDateKey, toDateKey, filtros.gravedad)) {
            return true;
        }
    }

    return false;
}

std::vector<PacienteIndexado> buildPacientesIndexados(const std::vector<Paciente>& pacientes) {
    std::vector<PacienteIndexado> records;
    records.reserve(pacientes.size());

    for (const auto& paciente : pacientes) {
        PacienteIndexado record;
        record.paciente = &paciente;
        record.nombreNormalizado = normalizeName(paciente.nombre);

        std::set<std::string> keys;
        if (!record.nombreNormalizado.empty()) {
            keys.insert(record.nombreNormalizado);
        }

        for (const auto& word : splitWords(record.nombreNormalizado)) {
            keys.insert(word);
        }

        record.clavesNombre.assign(keys.begin(), keys.end());
        records.push_back(std::move(record));
    }

    return records;
}

std::vector<const Paciente*> sortPacientesByCedula(const std::vector<Paciente>& pacientes) {
    std::vector<const Paciente*> sorted;
    sorted.reserve(pacientes.size());
    for (const auto& paciente : pacientes) {
        sorted.push_back(&paciente);
    }

    std::sort(
        sorted.begin(),
        sorted.end(),
        [](const Paciente* a, const Paciente* b) { return a->cedula < b->cedula; }
    );
    return sorted;
}

std::vector<NombreIndexEntry> buildNombreIndex(const std::vector<PacienteIndexado>& records) {
    std::vector<NombreIndexEntry> entries;

    for (std::size_t index = 0; index < records.size(); ++index) {
        for (const auto& key : records[index].clavesNombre) {
            if (!key.empty()) {
                entries.push_back({key, index});
            }
        }
    }

    std::sort(
        entries.begin(),
        entries.end(),
        [](const NombreIndexEntry& a, const NombreIndexEntry& b) {
            if (a.key == b.key) {
                return a.recordIndex < b.recordIndex;
            }
            return a.key < b.key;
        }
    );

    return entries;
}

bool matchesNombrePrefix(const PacienteIndexado& record, const std::string& normalizedTerm) {
    if (normalizedTerm.empty()) {
        return false;
    }
    for (const auto& key : record.clavesNombre) {
        if (startsWith(key, normalizedTerm)) {
            return true;
        }
    }
    return false;
}

std::vector<Paciente> buscarCedulaLineal(
    const std::vector<Paciente>& pacientes,
    const std::string& cedula,
    const std::unordered_map<std::string, std::vector<const Consulta*>>& consultasByCedula,
    const BusquedaFiltros& filtros,
    bool filtrosActivos,
    int fromDateKey,
    int toDateKey,
    std::size_t maxResultados
) {
    std::vector<Paciente> matches;
    for (const auto& paciente : pacientes) {
        if (paciente.cedula != cedula) {
            continue;
        }

        if (!matchesConsultaFilters(
                paciente,
                consultasByCedula,
                filtros,
                filtrosActivos,
                fromDateKey,
                toDateKey
            )) {
            continue;
        }

        matches.push_back(paciente);
        if (matches.size() >= maxResultados) {
            break;
        }
    }

    return matches;
}

std::vector<Paciente> buscarCedulaBinaria(
    const std::vector<const Paciente*>& pacientesOrdenados,
    const std::string& cedula,
    const std::unordered_map<std::string, std::vector<const Consulta*>>& consultasByCedula,
    const BusquedaFiltros& filtros,
    bool filtrosActivos,
    int fromDateKey,
    int toDateKey,
    std::size_t maxResultados
) {
    std::vector<Paciente> matches;
    const auto it = std::lower_bound(
        pacientesOrdenados.begin(),
        pacientesOrdenados.end(),
        cedula,
        [](const Paciente* paciente, const std::string& target) { return paciente->cedula < target; }
    );

    if (it == pacientesOrdenados.end() || (*it)->cedula != cedula) {
        return matches;
    }

    const Paciente& paciente = *(*it);
    if (!matchesConsultaFilters(
            paciente,
            consultasByCedula,
            filtros,
            filtrosActivos,
            fromDateKey,
            toDateKey
        )) {
        return matches;
    }

    matches.push_back(paciente);
    if (matches.size() > maxResultados) {
        matches.resize(maxResultados);
    }
    return matches;
}

std::vector<Paciente> buscarNombreLineal(
    const std::vector<PacienteIndexado>& pacientesIndexados,
    const std::string& normalizedTerm,
    const std::unordered_map<std::string, std::vector<const Consulta*>>& consultasByCedula,
    const BusquedaFiltros& filtros,
    bool filtrosActivos,
    int fromDateKey,
    int toDateKey,
    std::size_t maxResultados
) {
    std::vector<Paciente> matches;
    matches.reserve(std::min(maxResultados, pacientesIndexados.size()));

    for (const auto& record : pacientesIndexados) {
        if (!matchesNombrePrefix(record, normalizedTerm)) {
            continue;
        }

        if (!matchesConsultaFilters(
                *record.paciente,
                consultasByCedula,
                filtros,
                filtrosActivos,
                fromDateKey,
                toDateKey
            )) {
            continue;
        }

        matches.push_back(*record.paciente);
        if (matches.size() >= maxResultados) {
            break;
        }
    }

    return matches;
}

std::vector<Paciente> buscarNombreBinaria(
    const std::vector<PacienteIndexado>& pacientesIndexados,
    const std::vector<NombreIndexEntry>& nombreIndex,
    const std::string& normalizedTerm,
    const std::unordered_map<std::string, std::vector<const Consulta*>>& consultasByCedula,
    const BusquedaFiltros& filtros,
    bool filtrosActivos,
    int fromDateKey,
    int toDateKey,
    std::size_t maxResultados
) {
    std::vector<Paciente> matches;
    matches.reserve(std::min(maxResultados, pacientesIndexados.size()));

    const auto lower = std::lower_bound(
        nombreIndex.begin(),
        nombreIndex.end(),
        normalizedTerm,
        [](const NombreIndexEntry& entry, const std::string& value) { return entry.key < value; }
    );

    std::set<std::size_t> seen;
    for (auto it = lower; it != nombreIndex.end(); ++it) {
        if (!startsWith(it->key, normalizedTerm)) {
            break;
        }

        if (!seen.insert(it->recordIndex).second) {
            continue;
        }

        const auto& record = pacientesIndexados[it->recordIndex];
        if (!matchesConsultaFilters(
                *record.paciente,
                consultasByCedula,
                filtros,
                filtrosActivos,
                fromDateKey,
                toDateKey
            )) {
            continue;
        }

        matches.push_back(*record.paciente);
        if (matches.size() >= maxResultados) {
            break;
        }
    }

    return matches;
}

std::vector<Paciente> buscarSoloPorFiltros(
    const std::vector<Paciente>& pacientes,
    const std::unordered_map<std::string, std::vector<const Consulta*>>& consultasByCedula,
    const BusquedaFiltros& filtros,
    bool filtrosActivos,
    int fromDateKey,
    int toDateKey,
    std::size_t maxResultados
) {
    std::vector<Paciente> matches;
    matches.reserve(std::min(maxResultados, pacientes.size()));

    for (const auto& paciente : pacientes) {
        if (!matchesConsultaFilters(
                paciente,
                consultasByCedula,
                filtros,
                filtrosActivos,
                fromDateKey,
                toDateKey
            )) {
            continue;
        }

        matches.push_back(paciente);
        if (matches.size() >= maxResultados) {
            break;
        }
    }

    return matches;
}

}  // namespace

BusquedaRespuesta buscarPacientes(
    const std::vector<Paciente>& pacientes,
    const std::vector<Consulta>& consultas,
    const std::string& cedula,
    const std::string& nombre,
    const BusquedaFiltros& filtros,
    const std::string& algoritmoPreferido,
    std::size_t maxResultados
) {
    BusquedaRespuesta response{};
    response.tiempoLinealMs = 0.0;
    response.tiempoBinariaMs = 0.0;
    response.filtrosAplicados = hasActiveFilters(filtros);
    response.totalResultadosLineal = 0;
    response.totalResultadosBinaria = 0;

    if (pacientes.empty()) {
        response.criterio = "sin_datos";
        response.algoritmo = normalizeAlgorithm(algoritmoPreferido);
        response.termino = cedula.empty() ? nombre : cedula;
        return response;
    }

    const std::size_t resultLimit = resolveMaxResults(maxResultados, pacientes.size());
    const auto consultasByCedula = buildConsultasByCedula(consultas);
    const auto pacientesIndexados = buildPacientesIndexados(pacientes);
    const auto cedulaOrdenada = sortPacientesByCedula(pacientes);
    const auto nombreIndex = buildNombreIndex(pacientesIndexados);
    const int fromDateKey = parseDateKey(trim(filtros.fechaDesde));
    const int toDateKey = parseDateKey(trim(filtros.fechaHasta));

    const std::string cedulaTerm = trim(cedula);
    const std::string nombreTerm = trim(nombre);
    const std::string normalizedNameTerm = normalizeName(nombreTerm);
    const std::string algoritmo = normalizeAlgorithm(algoritmoPreferido);

    const bool searchByCedula = !cedulaTerm.empty();
    const bool searchByNombre = !searchByCedula && !nombreTerm.empty();
    const bool onlyFilters = !searchByCedula && !searchByNombre;
    const bool binaryApplicable = searchByCedula || (searchByNombre && !normalizedNameTerm.empty());

    if (searchByCedula) {
        response.criterio = "cedula";
        response.termino = cedulaTerm;
    } else if (searchByNombre) {
        response.criterio = "nombre";
        response.termino = nombreTerm;
    } else {
        response.criterio = "filtros";
        response.termino = "*";
    }

    const auto linealStart = std::chrono::high_resolution_clock::now();
    if (searchByCedula) {
        response.resultadosLineal = buscarCedulaLineal(
            pacientes,
            cedulaTerm,
            consultasByCedula,
            filtros,
            response.filtrosAplicados,
            fromDateKey,
            toDateKey,
            resultLimit
        );
    } else if (searchByNombre && !normalizedNameTerm.empty()) {
        response.resultadosLineal = buscarNombreLineal(
            pacientesIndexados,
            normalizedNameTerm,
            consultasByCedula,
            filtros,
            response.filtrosAplicados,
            fromDateKey,
            toDateKey,
            resultLimit
        );
    } else if (onlyFilters) {
        response.resultadosLineal = buscarSoloPorFiltros(
            pacientes,
            consultasByCedula,
            filtros,
            response.filtrosAplicados,
            fromDateKey,
            toDateKey,
            resultLimit
        );
    }
    const auto linealEnd = std::chrono::high_resolution_clock::now();
    response.tiempoLinealMs =
        std::chrono::duration<double, std::milli>(linealEnd - linealStart).count();

    if (binaryApplicable) {
        const auto binariaStart = std::chrono::high_resolution_clock::now();
        if (searchByCedula) {
            response.resultadosBinaria = buscarCedulaBinaria(
                cedulaOrdenada,
                cedulaTerm,
                consultasByCedula,
                filtros,
                response.filtrosAplicados,
                fromDateKey,
                toDateKey,
                resultLimit
            );
        } else {
            response.resultadosBinaria = buscarNombreBinaria(
                pacientesIndexados,
                nombreIndex,
                normalizedNameTerm,
                consultasByCedula,
                filtros,
                response.filtrosAplicados,
                fromDateKey,
                toDateKey,
                resultLimit
            );
        }
        const auto binariaEnd = std::chrono::high_resolution_clock::now();
        response.tiempoBinariaMs =
            std::chrono::duration<double, std::milli>(binariaEnd - binariaStart).count();
    } else {
        response.resultadosBinaria = response.resultadosLineal;
        response.tiempoBinariaMs = 0.0;
    }

    std::string algoritmoFinal = algoritmo;
    if (algoritmoFinal == "binaria" && !binaryApplicable) {
        algoritmoFinal = "lineal";
    }

    response.algoritmo = algoritmoFinal;
    if (algoritmoFinal == "binaria") {
        response.resultados = response.resultadosBinaria;
    } else if (algoritmoFinal == "ambos") {
        response.resultados = response.resultadosLineal;
    } else {
        response.resultados = response.resultadosLineal;
    }

    response.totalResultadosLineal = response.resultadosLineal.size();
    response.totalResultadosBinaria = response.resultadosBinaria.size();

    return response;
}

BusquedaRespuesta buscarPacientes(
    const std::vector<Paciente>& pacientes,
    const std::string& cedula,
    const std::string& nombre,
    const std::string& algoritmoPreferido,
    std::size_t maxResultados
) {
    const std::vector<Consulta> consultasVacias;
    const BusquedaFiltros filtros;
    return buscarPacientes(
        pacientes,
        consultasVacias,
        cedula,
        nombre,
        filtros,
        algoritmoPreferido,
        maxResultados
    );
}

}  // namespace busquedas
