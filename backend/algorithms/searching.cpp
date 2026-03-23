#include "searching.h"

#include <algorithm>
#include <chrono>
#include <cctype>

namespace searching {
namespace {

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
        if (pacientesOrdenados[static_cast<std::size_t>(middle)].cedula == cedula) {
            return middle;
        }
        if (pacientesOrdenados[static_cast<std::size_t>(middle)].cedula < cedula) {
            left = middle + 1;
        } else {
            right = middle - 1;
        }
    }

    return -1;
}

}  // namespace

CedulaSearchResult linearSearchByCedula(const std::vector<Paciente>& pacientes, const std::string& cedula) {
    const auto start = std::chrono::high_resolution_clock::now();

    const int index = linearSearchIndexByCedula(pacientes, cedula);

    const auto end = std::chrono::high_resolution_clock::now();
    const auto elapsed = std::chrono::duration<double, std::milli>(end - start).count();
    return {index, elapsed};
}

CedulaSearchResult binarySearchByCedula(
    const std::vector<Paciente>& pacientesOrdenados,
    const std::string& cedula
) {
    const auto start = std::chrono::high_resolution_clock::now();

    const int found = binarySearchIndexByCedula(pacientesOrdenados, cedula);

    const auto end = std::chrono::high_resolution_clock::now();
    const auto elapsed = std::chrono::duration<double, std::milli>(end - start).count();
    return {found, elapsed};
}

NameSearchResult linearSearchByNombre(const std::vector<Paciente>& pacientes, const std::string& term, std::size_t maxResults) {
    const auto start = std::chrono::high_resolution_clock::now();

    std::vector<Paciente> matches;
    const std::string loweredTerm = toLower(term);

    if (loweredTerm.empty()) {
        const auto end = std::chrono::high_resolution_clock::now();
        const auto elapsed = std::chrono::duration<double, std::milli>(end - start).count();
        return {matches, elapsed};
    }

    matches.reserve(std::min(maxResults, pacientes.size()));
    for (const auto& paciente : pacientes) {
        if (toLower(paciente.nombre).find(loweredTerm) != std::string::npos) {
            matches.push_back(paciente);
            if (matches.size() >= maxResults) {
                break;
            }
        }
    }

    const auto end = std::chrono::high_resolution_clock::now();
    const auto elapsed = std::chrono::duration<double, std::milli>(end - start).count();
    return {matches, elapsed};
}

}  // namespace searching
