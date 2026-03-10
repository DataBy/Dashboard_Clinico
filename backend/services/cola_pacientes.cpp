#include "cola_pacientes.h"

#include <algorithm>
#include <queue>

namespace cola_pacientes {
namespace {

struct QueueNode {
    int prioridad;
    std::string fechaRegistro;
    std::size_t indice;
};

struct QueueComparator {
    bool operator()(const QueueNode& a, const QueueNode& b) const {
        if (a.prioridad != b.prioridad) {
            return a.prioridad > b.prioridad;
        }
        if (a.fechaRegistro != b.fechaRegistro) {
            return a.fechaRegistro > b.fechaRegistro;
        }
        return a.indice > b.indice;
    }
};

std::string obtenerEstado(
    const std::unordered_map<std::string, std::string>& estadoPorCedula,
    const std::string& cedula
) {
    const auto it = estadoPorCedula.find(cedula);
    if (it == estadoPorCedula.end()) {
        return "En espera";
    }
    return it->second;
}

}  // namespace

std::vector<Paciente> obtenerColaOrdenada(
    const std::vector<Paciente>& pacientes,
    const std::unordered_map<std::string, std::string>& estadoPorCedula
) {
    std::priority_queue<QueueNode, std::vector<QueueNode>, QueueComparator> cola;

    for (std::size_t i = 0; i < pacientes.size(); ++i) {
        if (obtenerEstado(estadoPorCedula, pacientes[i].cedula) == "En espera") {
            cola.push({pacientes[i].prioridad, pacientes[i].fechaRegistro, i});
        }
    }

    std::vector<Paciente> ordenados;
    ordenados.reserve(cola.size());
    while (!cola.empty()) {
        ordenados.push_back(pacientes[cola.top().indice]);
        cola.pop();
    }

    return ordenados;
}

std::optional<Paciente> atenderSiguiente(
    const std::vector<Paciente>& pacientes,
    std::unordered_map<std::string, std::string>& estadoPorCedula
) {
    const auto cola = obtenerColaOrdenada(pacientes, estadoPorCedula);
    if (cola.empty()) {
        return std::nullopt;
    }

    const Paciente atendido = cola.front();
    estadoPorCedula[atendido.cedula] = "Atendido";
    return atendido;
}

std::optional<Paciente> atenderPacientePorCedula(
    const std::vector<Paciente>& pacientes,
    const std::string& cedula,
    std::unordered_map<std::string, std::string>& estadoPorCedula
) {
    if (cedula.empty()) {
        return std::nullopt;
    }

    auto match = std::find_if(
        pacientes.begin(),
        pacientes.end(),
        [&cedula](const Paciente& paciente) { return paciente.cedula == cedula; }
    );

    if (match == pacientes.end()) {
        return std::nullopt;
    }

    estadoPorCedula[cedula] = "Atendido";
    return *match;
}

bool registrarEnCola(const std::string& cedula, std::unordered_map<std::string, std::string>& estadoPorCedula) {
    if (cedula.empty()) {
        return false;
    }
    estadoPorCedula[cedula] = "En espera";
    return true;
}

}  // namespace cola_pacientes
