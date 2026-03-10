#ifndef BENCHMARK_H
#define BENCHMARK_H

#include <cstddef>
#include <string>
#include <vector>

#include "../models/Consulta.h"
#include "../models/Paciente.h"
#include "../third_party/json.hpp"

namespace benchmark {

nlohmann::json benchmarkOrdenamientoPacientes(
    const std::vector<Paciente>& pacientes,
    const std::string& campo,
    std::size_t size
);

nlohmann::json benchmarkOrdenamientoConsultas(
    const std::vector<Consulta>& consultas,
    const std::string& campo,
    std::size_t size
);

nlohmann::json benchmarkBusquedaPacientes(
    const std::vector<Paciente>& pacientes,
    const std::string& cedula,
    std::size_t size
);

}  // namespace benchmark

#endif
