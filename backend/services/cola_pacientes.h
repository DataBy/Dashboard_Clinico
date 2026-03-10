#ifndef COLA_PACIENTES_H
#define COLA_PACIENTES_H

#include <optional>
#include <string>
#include <unordered_map>
#include <vector>

#include "../models/Paciente.h"

namespace cola_pacientes {

std::vector<Paciente> obtenerColaOrdenada(
    const std::vector<Paciente>& pacientes,
    const std::unordered_map<std::string, std::string>& estadoPorCedula
);

std::optional<Paciente> atenderSiguiente(
    const std::vector<Paciente>& pacientes,
    std::unordered_map<std::string, std::string>& estadoPorCedula
);

std::optional<Paciente> atenderPacientePorCedula(
    const std::vector<Paciente>& pacientes,
    const std::string& cedula,
    std::unordered_map<std::string, std::string>& estadoPorCedula
);

bool registrarEnCola(const std::string& cedula, std::unordered_map<std::string, std::string>& estadoPorCedula);

}  // namespace cola_pacientes

#endif
