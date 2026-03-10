#ifndef BUSQUEDAS_H
#define BUSQUEDAS_H

#include <cstddef>
#include <string>
#include <vector>

#include "../models/Paciente.h"

namespace busquedas {

struct BusquedaRespuesta {
    std::string criterio;
    std::string algoritmo;
    std::string termino;
    std::vector<Paciente> resultados;
    double tiempoLinealMs;
    double tiempoBinariaMs;
};

BusquedaRespuesta buscarPacientes(
    const std::vector<Paciente>& pacientes,
    const std::string& cedula,
    const std::string& nombre,
    const std::string& algoritmoPreferido,
    std::size_t maxResultados = 25
);

}  // namespace busquedas

#endif
