#include "busquedas.h"

#include <algorithm>
#include <cctype>

#include "../algorithms/searching.h"

namespace busquedas {
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

}  // namespace

BusquedaRespuesta buscarPacientes(
    const std::vector<Paciente>& pacientes,
    const std::string& cedula,
    const std::string& nombre,
    const std::string& algoritmoPreferido,
    std::size_t maxResultados
) {
    BusquedaRespuesta response{};
    response.tiempoLinealMs = 0.0;
    response.tiempoBinariaMs = 0.0;

    if (!cedula.empty()) {
        response.criterio = "cedula";
        response.termino = cedula;

        const auto lineal = searching::linearSearchByCedula(pacientes, cedula);
        const auto binaria = searching::binarySearchByCedula(pacientes, cedula);
        response.tiempoLinealMs = lineal.elapsedMs;
        response.tiempoBinariaMs = binaria.elapsedMs;

        const std::string algo = toLower(algoritmoPreferido);
        if (algo == "binaria") {
            response.algoritmo = "binaria";
            if (binaria.index != -1) {
                auto match = std::find_if(
                    pacientes.begin(),
                    pacientes.end(),
                    [&cedula](const Paciente& paciente) { return paciente.cedula == cedula; }
                );
                if (match != pacientes.end()) {
                    response.resultados.push_back(*match);
                }
            }
            return response;
        }

        if (algo == "ambos") {
            response.algoritmo = "ambos";
            if (lineal.index != -1) {
                response.resultados.push_back(pacientes[static_cast<std::size_t>(lineal.index)]);
            }
            return response;
        }

        response.algoritmo = "lineal";
        if (lineal.index != -1) {
            response.resultados.push_back(pacientes[static_cast<std::size_t>(lineal.index)]);
        }
        return response;
    }

    response.criterio = "nombre";
    response.termino = nombre;
    response.algoritmo = "lineal";

    const auto matches = searching::linearSearchByNombre(pacientes, nombre, maxResultados);
    response.resultados = matches.matches;
    response.tiempoLinealMs = matches.elapsedMs;
    response.tiempoBinariaMs = 0.0;
    return response;
}

}  // namespace busquedas
