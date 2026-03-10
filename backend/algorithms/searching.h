#ifndef SEARCHING_H
#define SEARCHING_H

#include <cstddef>
#include <string>
#include <vector>

#include "../models/Paciente.h"

namespace searching {

struct CedulaSearchResult {
    int index;
    double elapsedMs;
};

struct NameSearchResult {
    std::vector<Paciente> matches;
    double elapsedMs;
};

CedulaSearchResult linearSearchByCedula(const std::vector<Paciente>& pacientes, const std::string& cedula);
CedulaSearchResult binarySearchByCedula(std::vector<Paciente> pacientes, const std::string& cedula);
NameSearchResult linearSearchByNombre(
    const std::vector<Paciente>& pacientes,
    const std::string& term,
    std::size_t maxResults = 25
);

}  // namespace searching

#endif
