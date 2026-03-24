#ifndef BUSQUEDAS_H
#define BUSQUEDAS_H

#include <cstddef>
#include <string>
#include <vector>

#include "../models/Consulta.h"
#include "../models/Paciente.h"

namespace busquedas {

struct BusquedaFiltros {
    std::string fechaDesde;
    std::string fechaHasta;
    int gravedad = 0;
};

struct BusquedaRespuesta {
    std::string criterio;
    std::string algoritmo;
    std::string termino;
    std::vector<Paciente> resultados;
    std::vector<Paciente> resultadosLineal;
    std::vector<Paciente> resultadosBinaria;
    double tiempoLinealMs;
    double tiempoBinariaMs;
    bool filtrosAplicados;
    std::size_t totalResultadosLineal;
    std::size_t totalResultadosBinaria;
};

BusquedaRespuesta buscarPacientes(
    const std::vector<Paciente>& pacientes,
    const std::vector<Consulta>& consultas,
    const std::string& cedula,
    const std::string& nombre,
    const BusquedaFiltros& filtros,
    const std::string& algoritmoPreferido,
    std::size_t maxResultados = 50
);

// Compatibilidad hacia atras: mantiene firma anterior sin filtros de consultas.
BusquedaRespuesta buscarPacientes(
    const std::vector<Paciente>& pacientes,
    const std::string& cedula,
    const std::string& nombre,
    const std::string& algoritmoPreferido,
    std::size_t maxResultados = 50
);

}  // namespace busquedas

#endif
