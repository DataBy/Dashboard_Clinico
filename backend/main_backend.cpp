#include <algorithm>
#include <chrono>
#include <cctype>
#include <cstdint>
#include <cstdio>
#include <ctime>
#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <mutex>
#include <optional>
#include <sstream>
#include <string>
#include <thread>
#include <unordered_map>
#include <vector>

#include "third_party/httplib.h"
#include "third_party/json.hpp"

#include "models/Consulta.h"
#include "models/Diagnostico.h"
#include "models/Paciente.h"

#include "performance/benchmark.h"
#include "services/arbol_diagnosticos.h"
#include "services/busquedas.h"
#include "services/cola_pacientes.h"

#ifdef _WIN32
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>
#else
#include <unistd.h>
#endif

namespace {

using json = nlohmann::json;
namespace fs = std::filesystem;

#ifdef _WIN32
struct CpuSnapshotWin {
    std::uint64_t idle = 0;
    std::uint64_t kernel = 0;
    std::uint64_t user = 0;
    bool valid = false;
};
#else
struct CpuSnapshotLinux {
    std::uint64_t idle = 0;
    std::uint64_t total = 0;
    bool valid = false;
};
#endif

struct AppState {
    std::vector<Paciente> pacientes;
    std::vector<Consulta> consultas;
    std::vector<Diagnostico> diagnosticos;
    std::unordered_map<std::string, std::string> estadoPorCedula;
    fs::path pacientesPath;
    fs::path consultasPath;
    fs::path diagnosticosPath;
    std::mutex mutex;
#ifdef _WIN32
    std::optional<CpuSnapshotWin> previousCpuSnapshot;
#else
    std::optional<CpuSnapshotLinux> previousCpuSnapshot;
#endif
};

std::string nowTimestamp();

void respondJson(httplib::Response& res, const json& payload, int status = 200) {
    res.status = status;
    res.set_content(payload.dump(), "application/json; charset=utf-8");
}

std::string trim(const std::string& value) {
    const auto start = value.find_first_not_of(" \t\r\n");
    if (start == std::string::npos) {
        return "";
    }
    const auto end = value.find_last_not_of(" \t\r\n");
    return value.substr(start, end - start + 1);
}

std::vector<std::string> splitCsvLine(const std::string& line) {
    std::vector<std::string> values;
    std::stringstream ss(line);
    std::string item;

    while (std::getline(ss, item, ',')) {
        values.push_back(trim(item));
    }

    return values;
}

int toIntOrDefault(const std::string& value, int fallback) {
    try {
        return std::stoi(value);
    } catch (...) {
        return fallback;
    }
}

double toDoubleOrDefault(const std::string& value, double fallback) {
    try {
        return std::stod(value);
    } catch (...) {
        return fallback;
    }
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

std::string sugerirTratamiento(const Diagnostico& diagnostico) {
    const std::string lowered = toLower(
        diagnostico.nombre + " " + diagnostico.categoria + " " + diagnostico.subcategoria
    );

    if (lowered.find("infarto") != std::string::npos || lowered.find("cardio") != std::string::npos) {
        return "Monitoreo cardiaco, antiagregantes y control de signos vitales.";
    }
    if (lowered.find("asma") != std::string::npos || lowered.find("neumo") != std::string::npos) {
        return "Broncodilatadores y seguimiento respiratorio segun protocolo.";
    }
    if (lowered.find("fractura") != std::string::npos || lowered.find("trauma") != std::string::npos) {
        return "Inmovilizacion, analgesia y valoracion quirurgica.";
    }
    if (lowered.find("pedi") != std::string::npos) {
        return "Tratamiento ajustado por peso y control pediatrico.";
    }
    return "Manejo clinico por especialidad y seguimiento en consulta.";
}

#ifdef _WIN32
std::uint64_t fileTimeToUint64(const FILETIME& fileTime) {
    ULARGE_INTEGER value{};
    value.LowPart = fileTime.dwLowDateTime;
    value.HighPart = fileTime.dwHighDateTime;
    return value.QuadPart;
}

CpuSnapshotWin readCpuSnapshot() {
    FILETIME idle{};
    FILETIME kernel{};
    FILETIME user{};
    CpuSnapshotWin snapshot;
    if (GetSystemTimes(&idle, &kernel, &user) != 0) {
        snapshot.idle = fileTimeToUint64(idle);
        snapshot.kernel = fileTimeToUint64(kernel);
        snapshot.user = fileTimeToUint64(user);
        snapshot.valid = true;
    }
    return snapshot;
}

double computeCpuUsage(const CpuSnapshotWin& previous, const CpuSnapshotWin& current) {
    const auto idle = current.idle - previous.idle;
    const auto kernel = current.kernel - previous.kernel;
    const auto user = current.user - previous.user;
    const auto total = kernel + user;

    if (total == 0) {
        return 0.0;
    }

    const auto busy = total > idle ? total - idle : 0;
    return (static_cast<double>(busy) * 100.0) / static_cast<double>(total);
}
#else
CpuSnapshotLinux readCpuSnapshot() {
    CpuSnapshotLinux snapshot;
    std::ifstream statFile("/proc/stat");
    if (!statFile.is_open()) {
        return snapshot;
    }

    std::string cpuLabel;
    std::uint64_t user = 0;
    std::uint64_t nice = 0;
    std::uint64_t system = 0;
    std::uint64_t idle = 0;
    std::uint64_t iowait = 0;
    std::uint64_t irq = 0;
    std::uint64_t softirq = 0;
    std::uint64_t steal = 0;

    statFile >> cpuLabel >> user >> nice >> system >> idle >> iowait >> irq >> softirq >> steal;
    if (cpuLabel != "cpu") {
        return snapshot;
    }

    snapshot.idle = idle + iowait;
    snapshot.total = user + nice + system + idle + iowait + irq + softirq + steal;
    snapshot.valid = true;
    return snapshot;
}

double computeCpuUsage(const CpuSnapshotLinux& previous, const CpuSnapshotLinux& current) {
    const auto idle = current.idle - previous.idle;
    const auto total = current.total - previous.total;
    if (total == 0) {
        return 0.0;
    }

    const auto busy = total > idle ? total - idle : 0;
    return (static_cast<double>(busy) * 100.0) / static_cast<double>(total);
}
#endif

std::optional<double> readCpuTemperatureCelsius() {
#ifdef _WIN32
    const char* command =
        "powershell -NoProfile -Command \"$t=Get-CimInstance -Namespace root/wmi -ClassName "
        "MSAcpi_ThermalZoneTemperature -ErrorAction SilentlyContinue | Select-Object -First 1 "
        "-ExpandProperty CurrentTemperature; if($t){$t}\"";

    FILE* pipe = _popen(command, "r");
    if (pipe == nullptr) {
        return std::nullopt;
    }

    char buffer[128];
    std::string output;
    while (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
        output += buffer;
    }
    _pclose(pipe);

    const double rawValue = toDoubleOrDefault(trim(output), 0.0);
    if (rawValue <= 0.0) {
        return std::nullopt;
    }
    return rawValue / 10.0 - 273.15;
#else
    const fs::path thermalRoot("/sys/class/thermal");
    if (!fs::exists(thermalRoot)) {
        return std::nullopt;
    }

    for (const auto& entry : fs::directory_iterator(thermalRoot)) {
        if (!entry.is_directory()) {
            continue;
        }
        const auto tempPath = entry.path() / "temp";
        if (!fs::exists(tempPath)) {
            continue;
        }

        std::ifstream tempFile(tempPath);
        std::string raw;
        std::getline(tempFile, raw);
        const double value = toDoubleOrDefault(trim(raw), -1.0);
        if (value < 0.0) {
            continue;
        }
        if (value > 1000.0) {
            return value / 1000.0;
        }
        return value;
    }

    return std::nullopt;
#endif
}

std::string readMachineName() {
#ifdef _WIN32
    char buffer[MAX_COMPUTERNAME_LENGTH + 1];
    DWORD size = MAX_COMPUTERNAME_LENGTH + 1;
    if (GetComputerNameA(buffer, &size) != 0) {
        return std::string(buffer, size);
    }
    return "windows-host";
#else
    char buffer[256];
    if (gethostname(buffer, sizeof(buffer)) == 0) {
        buffer[sizeof(buffer) - 1] = '\0';
        return std::string(buffer);
    }
    return "linux-host";
#endif
}

int readProcessId() {
#ifdef _WIN32
    return static_cast<int>(GetCurrentProcessId());
#else
    return static_cast<int>(getpid());
#endif
}

json collectSystemMetrics(AppState& state) {
    double ramTotalMb = 0.0;
    double ramUsedMb = 0.0;
    double ramUsagePct = 0.0;

#ifdef _WIN32
    MEMORYSTATUSEX memoryStatus{};
    memoryStatus.dwLength = sizeof(memoryStatus);
    if (GlobalMemoryStatusEx(&memoryStatus) != 0) {
        ramTotalMb = static_cast<double>(memoryStatus.ullTotalPhys) / (1024.0 * 1024.0);
        const double ramAvailableMb = static_cast<double>(memoryStatus.ullAvailPhys) / (1024.0 * 1024.0);
        ramUsedMb = std::max(ramTotalMb - ramAvailableMb, 0.0);
    }
#else
    std::ifstream memInfo("/proc/meminfo");
    std::string line;
    double memTotalKb = 0.0;
    double memAvailableKb = 0.0;
    while (std::getline(memInfo, line)) {
        if (line.rfind("MemTotal:", 0) == 0) {
            memTotalKb = toDoubleOrDefault(trim(line.substr(9)), 0.0);
        } else if (line.rfind("MemAvailable:", 0) == 0) {
            memAvailableKb = toDoubleOrDefault(trim(line.substr(13)), 0.0);
        }
    }
    ramTotalMb = memTotalKb / 1024.0;
    ramUsedMb = std::max((memTotalKb - memAvailableKb) / 1024.0, 0.0);
#endif

    if (ramTotalMb > 0.0) {
        ramUsagePct = (ramUsedMb * 100.0) / ramTotalMb;
    }

    auto currentCpuSnapshot = readCpuSnapshot();
    double cpuUsagePct = 0.0;
    if (currentCpuSnapshot.valid && state.previousCpuSnapshot.has_value()) {
        cpuUsagePct = computeCpuUsage(*state.previousCpuSnapshot, currentCpuSnapshot);
    }
    if (currentCpuSnapshot.valid) {
        state.previousCpuSnapshot = currentCpuSnapshot;
    }
    cpuUsagePct = std::clamp(cpuUsagePct, 0.0, 100.0);

    const auto cpuTemp = readCpuTemperatureCelsius();
    const unsigned int cpuCores = std::max(1u, std::thread::hardware_concurrency());

    double systemLoad = (cpuUsagePct / 100.0) * static_cast<double>(cpuCores);
#ifndef _WIN32
    double loadAverage[1];
    if (getloadavg(loadAverage, 1) == 1) {
        systemLoad = loadAverage[0];
    }
#endif

    return {
        {"ramUsagePct", ramUsagePct},
        {"ramUsedMb", ramUsedMb},
        {"ramTotalMb", ramTotalMb},
        {"cpuUsagePct", cpuUsagePct},
        {"cpuTempC", cpuTemp.has_value() ? json(*cpuTemp) : json(nullptr)},
        {"cpuCores", cpuCores},
        {"systemLoad", systemLoad},
        {"machineName", readMachineName()},
        {"processId", readProcessId()},
        {"source", "backend-host"},
        {"collectedAt", nowTimestamp()},
    };
}

fs::path resolveDataFile(const std::string& filename) {
    const fs::path cwd = fs::current_path();
    std::vector<fs::path> candidates;
    candidates.push_back(cwd / filename);
    candidates.push_back(cwd / "backend" / filename);
    candidates.push_back(cwd.parent_path() / "backend" / filename);

    for (const auto& candidate : candidates) {
        if (fs::exists(candidate)) {
            return candidate;
        }
    }

    if (fs::exists(cwd / "backend")) {
        return cwd / "backend" / filename;
    }
    return cwd / filename;
}

std::vector<Paciente> loadPacientes(const fs::path& path) {
    std::vector<Paciente> pacientes;
    std::ifstream file(path);
    if (!file.is_open()) {
        return pacientes;
    }

    std::string line;
    std::getline(file, line);  // header
    while (std::getline(file, line)) {
        if (trim(line).empty()) {
            continue;
        }
        auto cols = splitCsvLine(line);
        if (cols.size() < 7) {
            continue;
        }
        pacientes.emplace_back(
            cols[0],
            cols[1],
            toIntOrDefault(cols[2], 0),
            cols[3],
            toIntOrDefault(cols[4], 3),
            cols[5],
            cols[6]
        );
    }
    return pacientes;
}

std::vector<Consulta> loadConsultas(const fs::path& path) {
    std::vector<Consulta> consultas;
    std::ifstream file(path);
    if (!file.is_open()) {
        return consultas;
    }

    std::string line;
    std::getline(file, line);  // header
    while (std::getline(file, line)) {
        if (trim(line).empty()) {
            continue;
        }
        auto cols = splitCsvLine(line);
        if (cols.size() < 7) {
            continue;
        }
        consultas.emplace_back(
            cols[0],
            cols[1],
            cols[2],
            cols[3],
            cols[4],
            toIntOrDefault(cols[5], 1),
            toDoubleOrDefault(cols[6], 0.0)
        );
    }
    return consultas;
}

std::vector<Diagnostico> loadDiagnosticos(const fs::path& path) {
    std::vector<Diagnostico> diagnosticos;
    std::ifstream file(path);
    if (!file.is_open()) {
        return diagnosticos;
    }

    std::string line;
    std::getline(file, line);  // header
    while (std::getline(file, line)) {
        if (trim(line).empty()) {
            continue;
        }
        auto cols = splitCsvLine(line);
        if (cols.size() < 5) {
            continue;
        }
        diagnosticos.emplace_back(cols[0], cols[1], cols[2], cols[3], cols[4]);
    }
    return diagnosticos;
}

void savePacientes(const fs::path& path, const std::vector<Paciente>& pacientes) {
    std::ofstream file(path, std::ios::trunc);
    file << "Cedula,Nombre,Edad,FechaRegistro,Prioridad,TipoSangre,Diagnostico\n";
    for (const auto& paciente : pacientes) {
        file << paciente.cedula << ',' << paciente.nombre << ',' << paciente.edad << ','
             << paciente.fechaRegistro << ',' << paciente.prioridad << ',' << paciente.tipoSangre
             << ',' << paciente.diagnosticoAsignado << '\n';
    }
}

void saveConsultas(const fs::path& path, const std::vector<Consulta>& consultas) {
    std::ofstream file(path, std::ios::trunc);
    file << "ID_Consulta,Cedula_Paciente,Fecha,Medico,Diagnostico,Gravedad,Costo\n";
    for (const auto& consulta : consultas) {
        file << consulta.idConsulta << ',' << consulta.cedulaPaciente << ',' << consulta.fecha << ','
             << consulta.medicoTratante << ',' << consulta.diagnostico << ',' << consulta.gravedad
             << ',' << consulta.costo << '\n';
    }
}

std::string nowTimestamp() {
    auto now = std::chrono::system_clock::now();
    std::time_t nowTime = std::chrono::system_clock::to_time_t(now);
    std::tm localTime{};
#ifdef _WIN32
    localtime_s(&localTime, &nowTime);
#else
    localtime_r(&nowTime, &localTime);
#endif
    std::ostringstream out;
    out << std::put_time(&localTime, "%Y-%m-%d %H:%M");
    return out.str();
}

std::optional<std::size_t> findPacienteIndexByCedula(
    const std::vector<Paciente>& pacientes,
    const std::string& cedula
) {
    for (std::size_t i = 0; i < pacientes.size(); ++i) {
        if (pacientes[i].cedula == cedula) {
            return i;
        }
    }
    return std::nullopt;
}

std::string generateConsultaId(const std::vector<Consulta>& consultas) {
    int maxId = 9999;
    for (const auto& consulta : consultas) {
        const auto pos = consulta.idConsulta.find('-');
        const std::string suffix =
            pos == std::string::npos ? consulta.idConsulta : consulta.idConsulta.substr(pos + 1);
        maxId = std::max(maxId, toIntOrDefault(suffix, maxId));
    }
    return "C-" + std::to_string(maxId + 1);
}

std::string getEstado(
    const std::unordered_map<std::string, std::string>& estadoPorCedula,
    const std::string& cedula
) {
    const auto it = estadoPorCedula.find(cedula);
    if (it == estadoPorCedula.end()) {
        return "En espera";
    }
    return it->second;
}

json pacienteToJson(
    const Paciente& paciente,
    const std::unordered_map<std::string, std::string>& estadoPorCedula
) {
    return {
        {"cedula", paciente.cedula},
        {"nombre", paciente.nombre},
        {"edad", paciente.edad},
        {"fechaRegistro", paciente.fechaRegistro},
        {"prioridad", paciente.prioridad},
        {"tipoSangre", paciente.tipoSangre},
        {"diagnosticoAsignado", paciente.diagnosticoAsignado},
        {"estado", getEstado(estadoPorCedula, paciente.cedula)},
    };
}

json consultaToJson(const Consulta& consulta) {
    return {
        {"id", consulta.idConsulta},
        {"idConsulta", consulta.idConsulta},
        {"cedulaPaciente", consulta.cedulaPaciente},
        {"fecha", consulta.fecha},
        {"medicoTratante", consulta.medicoTratante},
        {"diagnostico", consulta.diagnostico},
        {"gravedad", consulta.gravedad},
        {"costo", consulta.costo},
    };
}

json diagnosticoToJson(const Diagnostico& diagnostico) {
    return {
        {"codigo", diagnostico.codigo},
        {"nombre", diagnostico.nombre},
        {"area", diagnostico.categoria},
        {"especialidad", diagnostico.subcategoria},
        {"categoria", diagnostico.categoria},
        {"subcategoria", diagnostico.subcategoria},
        {"descripcion", diagnostico.descripcion},
        {"tratamiento", sugerirTratamiento(diagnostico)},
    };
}

void setCorsHeaders(httplib::Server& server) {
    server.set_default_headers({
        {"Access-Control-Allow-Origin", "*"},
        {"Access-Control-Allow-Methods", "GET, POST, OPTIONS"},
        {"Access-Control-Allow-Headers", "Content-Type, Authorization"},
    });
}

}  // namespace

int main() {
    AppState state;
    state.pacientesPath = resolveDataFile("pacientes.csv");
    state.consultasPath = resolveDataFile("consultas.csv");
    state.diagnosticosPath = resolveDataFile("diagnosticos.csv");

    state.pacientes = loadPacientes(state.pacientesPath);
    state.consultas = loadConsultas(state.consultasPath);
    state.diagnosticos = loadDiagnosticos(state.diagnosticosPath);

    for (const auto& paciente : state.pacientes) {
        state.estadoPorCedula[paciente.cedula] = "En espera";
    }

    httplib::Server server;
    setCorsHeaders(server);

    server.Options(R"(.*)", [](const httplib::Request&, httplib::Response& res) {
        res.status = 204;
    });

    server.Get("/api/health", [](const httplib::Request&, httplib::Response& res) {
        respondJson(
            res,
            {
                {"status", "ok"},
                {"service", "clinic-backend"},
            }
        );
    });

    server.Get("/api/pacientes", [&state](const httplib::Request&, httplib::Response& res) {
        std::lock_guard<std::mutex> lock(state.mutex);
        json payload = json::array();
        for (const auto& paciente : state.pacientes) {
            payload.push_back(pacienteToJson(paciente, state.estadoPorCedula));
        }
        respondJson(res, payload);
    });

    server.Post("/api/pacientes", [&state](const httplib::Request& req, httplib::Response& res) {
        const auto body = json::parse(req.body, nullptr, false);
        if (body.is_discarded()) {
            respondJson(res, {{"error", "JSON invalido"}}, 400);
            return;
        }

        const std::string cedula = trim(body.value("cedula", ""));
        const std::string nombre = trim(body.value("nombre", ""));
        const int edad = body.value("edad", 0);
        const int prioridad = body.value("prioridad", 3);
        const std::string tipoSangre = trim(body.value("tipoSangre", "O+"));
        const std::string diagnostico = trim(body.value("diagnosticoAsignado", ""));
        const std::string fechaRegistro =
            trim(body.value("fechaRegistro", "")) == "" ? nowTimestamp() : trim(body.value("fechaRegistro", ""));

        if (cedula.empty() || nombre.empty() || diagnostico.empty()) {
            respondJson(res, {{"error", "cedula, nombre y diagnosticoAsignado son obligatorios"}}, 400);
            return;
        }
        if (edad <= 0) {
            respondJson(res, {{"error", "edad debe ser mayor que 0"}}, 400);
            return;
        }
        if (prioridad < 1 || prioridad > 3) {
            respondJson(res, {{"error", "prioridad debe estar entre 1 y 3"}}, 400);
            return;
        }

        std::lock_guard<std::mutex> lock(state.mutex);
        if (findPacienteIndexByCedula(state.pacientes, cedula).has_value()) {
            respondJson(res, {{"error", "ya existe un paciente con esa cedula"}}, 409);
            return;
        }

        Paciente nuevo(cedula, nombre, edad, fechaRegistro, prioridad, tipoSangre, diagnostico);
        state.pacientes.push_back(nuevo);
        state.estadoPorCedula[cedula] = "En espera";
        savePacientes(state.pacientesPath, state.pacientes);

        respondJson(res, pacienteToJson(nuevo, state.estadoPorCedula), 201);
    });

    server.Get(R"(/api/pacientes/(.+))", [&state](const httplib::Request& req, httplib::Response& res) {
        if (req.matches.size() < 2) {
            respondJson(res, {{"error", "cedula invalida"}}, 400);
            return;
        }

        const std::string cedula = req.matches[1];
        std::lock_guard<std::mutex> lock(state.mutex);
        const auto index = findPacienteIndexByCedula(state.pacientes, cedula);
        if (!index.has_value()) {
            respondJson(res, {{"error", "paciente no encontrado"}}, 404);
            return;
        }
        respondJson(res, pacienteToJson(state.pacientes[*index], state.estadoPorCedula));
    });

    server.Get("/api/consultas", [&state](const httplib::Request&, httplib::Response& res) {
        std::lock_guard<std::mutex> lock(state.mutex);
        json payload = json::array();
        for (const auto& consulta : state.consultas) {
            payload.push_back(consultaToJson(consulta));
        }
        respondJson(res, payload);
    });

    server.Post("/api/consultas", [&state](const httplib::Request& req, httplib::Response& res) {
        const auto body = json::parse(req.body, nullptr, false);
        if (body.is_discarded()) {
            respondJson(res, {{"error", "JSON invalido"}}, 400);
            return;
        }

        const std::string cedulaPaciente = trim(body.value("cedulaPaciente", ""));
        const std::string medico = trim(body.value("medicoTratante", ""));
        const std::string diagnostico = trim(body.value("diagnostico", ""));
        const int gravedad = body.value("gravedad", 1);
        const double costo = body.value("costo", 0.0);
        const std::string fecha =
            trim(body.value("fecha", "")) == "" ? nowTimestamp() : trim(body.value("fecha", ""));

        if (cedulaPaciente.empty() || medico.empty() || diagnostico.empty()) {
            respondJson(res, {{"error", "cedulaPaciente, medicoTratante y diagnostico son obligatorios"}}, 400);
            return;
        }
        if (gravedad < 1 || gravedad > 5) {
            respondJson(res, {{"error", "gravedad debe estar entre 1 y 5"}}, 400);
            return;
        }

        std::lock_guard<std::mutex> lock(state.mutex);
        if (!findPacienteIndexByCedula(state.pacientes, cedulaPaciente).has_value()) {
            respondJson(res, {{"error", "paciente no encontrado"}}, 404);
            return;
        }

        std::string idConsulta = trim(body.value("idConsulta", ""));
        if (idConsulta.empty()) {
            idConsulta = generateConsultaId(state.consultas);
        }

        Consulta nueva(idConsulta, cedulaPaciente, fecha, medico, diagnostico, gravedad, costo);
        state.consultas.push_back(nueva);
        state.estadoPorCedula[cedulaPaciente] = "Atendido";
        saveConsultas(state.consultasPath, state.consultas);

        respondJson(res, consultaToJson(nueva), 201);
    });

    server.Get("/api/diagnosticos", [&state](const httplib::Request&, httplib::Response& res) {
        std::lock_guard<std::mutex> lock(state.mutex);
        json payload = json::array();
        for (const auto& diagnostico : state.diagnosticos) {
            payload.push_back(diagnosticoToJson(diagnostico));
        }
        respondJson(res, payload);
    });

    server.Get("/api/diagnosticos/tree", [&state](const httplib::Request&, httplib::Response& res) {
        std::lock_guard<std::mutex> lock(state.mutex);
        respondJson(res, arbol_diagnosticos::construirArbol(state.diagnosticos));
    });

    server.Get(R"(/api/diagnosticos/(.+))", [&state](const httplib::Request& req, httplib::Response& res) {
        if (req.matches.size() < 2) {
            respondJson(res, {{"error", "codigo invalido"}}, 400);
            return;
        }

        const std::string codigo = req.matches[1];
        std::lock_guard<std::mutex> lock(state.mutex);
        auto match = std::find_if(
            state.diagnosticos.begin(),
            state.diagnosticos.end(),
            [&codigo](const Diagnostico& diagnostico) { return diagnostico.codigo == codigo; }
        );
        if (match == state.diagnosticos.end()) {
            respondJson(res, {{"error", "diagnostico no encontrado"}}, 404);
            return;
        }
        respondJson(res, diagnosticoToJson(*match));
    });

    server.Get("/api/cola", [&state](const httplib::Request&, httplib::Response& res) {
        std::lock_guard<std::mutex> lock(state.mutex);
        const auto cola = cola_pacientes::obtenerColaOrdenada(state.pacientes, state.estadoPorCedula);

        json payload = json::array();
        for (const auto& paciente : cola) {
            payload.push_back(pacienteToJson(paciente, state.estadoPorCedula));
        }
        respondJson(res, payload);
    });

    server.Post("/api/cola/registrar", [&state](const httplib::Request& req, httplib::Response& res) {
        const auto body = json::parse(req.body, nullptr, false);
        if (body.is_discarded()) {
            respondJson(res, {{"error", "JSON invalido"}}, 400);
            return;
        }

        const std::string cedula = trim(body.value("cedula", ""));
        if (cedula.empty()) {
            respondJson(res, {{"error", "cedula es obligatoria"}}, 400);
            return;
        }

        std::lock_guard<std::mutex> lock(state.mutex);
        const auto index = findPacienteIndexByCedula(state.pacientes, cedula);
        if (!index.has_value()) {
            respondJson(res, {{"error", "paciente no encontrado"}}, 404);
            return;
        }

        cola_pacientes::registrarEnCola(cedula, state.estadoPorCedula);
        respondJson(res, pacienteToJson(state.pacientes[*index], state.estadoPorCedula));
    });

    server.Post("/api/cola/atender", [&state](const httplib::Request&, httplib::Response& res) {
        std::lock_guard<std::mutex> lock(state.mutex);
        const auto atendido = cola_pacientes::atenderSiguiente(state.pacientes, state.estadoPorCedula);
        if (!atendido.has_value()) {
            respondJson(res, {{"error", "no hay pacientes en espera"}}, 404);
            return;
        }
        respondJson(
            res,
            {
                {"mensaje", "paciente atendido"},
                {"paciente", pacienteToJson(*atendido, state.estadoPorCedula)},
            }
        );
    });

    server.Post(R"(/api/cola/atender/(.+))", [&state](const httplib::Request& req, httplib::Response& res) {
        if (req.matches.size() < 2) {
            respondJson(res, {{"error", "cedula invalida"}}, 400);
            return;
        }

        const std::string cedula = req.matches[1];
        std::lock_guard<std::mutex> lock(state.mutex);
        const auto atendido =
            cola_pacientes::atenderPacientePorCedula(state.pacientes, cedula, state.estadoPorCedula);

        if (!atendido.has_value()) {
            respondJson(res, {{"error", "paciente no encontrado"}}, 404);
            return;
        }

        respondJson(
            res,
            {
                {"mensaje", "paciente atendido"},
                {"paciente", pacienteToJson(*atendido, state.estadoPorCedula)},
            }
        );
    });

    server.Get("/api/system/metrics", [&state](const httplib::Request&, httplib::Response& res) {
        std::lock_guard<std::mutex> lock(state.mutex);
        respondJson(res, collectSystemMetrics(state));
    });

    server.Get("/api/busqueda", [&state](const httplib::Request& req, httplib::Response& res) {
        const std::string cedula = req.has_param("cedula") ? req.get_param_value("cedula") : "";
        const std::string nombre = req.has_param("nombre") ? req.get_param_value("nombre") : "";
        const std::string algoritmo = req.has_param("algoritmo") ? req.get_param_value("algoritmo") : "lineal";

        if (cedula.empty() && nombre.empty()) {
            respondJson(res, {{"error", "debe enviar cedula o nombre como query param"}}, 400);
            return;
        }

        std::lock_guard<std::mutex> lock(state.mutex);
        const auto resultado = busquedas::buscarPacientes(state.pacientes, cedula, nombre, algoritmo);

        json resultados = json::array();
        for (const auto& paciente : resultado.resultados) {
            resultados.push_back(pacienteToJson(paciente, state.estadoPorCedula));
        }

        respondJson(
            res,
            {
                {"criterio", resultado.criterio},
                {"algoritmo", resultado.algoritmo},
                {"termino", resultado.termino},
                {"tiempoMs", resultado.algoritmo == "binaria" ? resultado.tiempoBinariaMs : resultado.tiempoLinealMs},
                {"comparativa", {{"linealMs", resultado.tiempoLinealMs}, {"binariaMs", resultado.tiempoBinariaMs}}},
                {"resultados", resultados},
            }
        );
    });

    server.Post("/api/benchmark/sort", [&state](const httplib::Request& req, httplib::Response& res) {
        const auto body = json::parse(req.body, nullptr, false);
        if (body.is_discarded()) {
            respondJson(res, {{"error", "JSON invalido"}}, 400);
            return;
        }

        const std::string dataset = trim(body.value("dataset", "pacientes"));
        const std::string campo = trim(body.value("campo", "edad"));
        const std::size_t size = body.value("size", 5000);

        std::lock_guard<std::mutex> lock(state.mutex);

        json payload;
        if (dataset == "consultas") {
            payload = benchmark::benchmarkOrdenamientoConsultas(state.consultas, campo, size);
        } else {
            payload = benchmark::benchmarkOrdenamientoPacientes(state.pacientes, campo, size);
        }
        payload["searchComparison"] = benchmark::benchmarkBusquedaPacientes(state.pacientes, "", size);

        respondJson(res, payload);
    });

    server.Post("/api/benchmark/search", [&state](const httplib::Request& req, httplib::Response& res) {
        const auto body = json::parse(req.body, nullptr, false);
        if (body.is_discarded()) {
            respondJson(res, {{"error", "JSON invalido"}}, 400);
            return;
        }

        const std::string cedula = trim(body.value("cedula", ""));
        const std::size_t size = body.value("size", 5000);

        std::lock_guard<std::mutex> lock(state.mutex);
        respondJson(res, benchmark::benchmarkBusquedaPacientes(state.pacientes, cedula, size));
    });

    server.set_error_handler([](const httplib::Request&, httplib::Response& res) {
        if (res.status == 404) {
            respondJson(res, {{"error", "endpoint no encontrado"}}, 404);
            return;
        }
        respondJson(res, {{"error", "error interno del servidor"}}, 500);
    });

    int port = 8080;
    if (const char* envPort = std::getenv("PORT")) {
        port = toIntOrDefault(envPort, 8080);
    }

    std::cout << "Clinic API escuchando en http://localhost:" << port << std::endl;
    std::cout << "Pacientes: " << state.pacientes.size() << " | Consultas: " << state.consultas.size()
              << " | Diagnosticos: " << state.diagnosticos.size() << std::endl;

    server.listen("0.0.0.0", port);
    return 0;
}
