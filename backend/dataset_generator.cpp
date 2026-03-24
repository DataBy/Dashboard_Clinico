#include <algorithm>
#include <cstddef>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <random>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

#include "models/Consulta.h"
#include "models/Diagnostico.h"
#include "models/Paciente.h"

namespace fs = std::filesystem;

namespace {

struct GeneratorConfig {
    std::vector<std::size_t> sizes = {500, 5000, 50000, 200000};
    std::uint32_t seed = 20260315u;
    fs::path outputDir = ".";
    std::size_t mainSize = 0;
};

std::vector<std::string> split(const std::string& value, char delimiter) {
    std::vector<std::string> tokens;
    std::stringstream stream(value);
    std::string token;
    while (std::getline(stream, token, delimiter)) {
        if (!token.empty()) {
            tokens.push_back(token);
        }
    }
    return tokens;
}

std::string trim(const std::string& value) {
    const auto start = value.find_first_not_of(" \t\r\n");
    if (start == std::string::npos) {
        return "";
    }
    const auto end = value.find_last_not_of(" \t\r\n");
    return value.substr(start, end - start + 1);
}

std::size_t toSizeOrDefault(const std::string& value, std::size_t fallback) {
    try {
        return static_cast<std::size_t>(std::stoull(value));
    } catch (...) {
        return fallback;
    }
}

bool startsWith(const std::string& value, const std::string& prefix) {
    return value.rfind(prefix, 0) == 0;
}

void printUsage() {
    std::cout << "Uso:\n"
              << "  dataset_generator [--size N] [--sizes a,b,c] [--seed N] [--output-dir PATH]\n"
              << "                    [--main-size N]\n\n"
              << "Ejemplos:\n"
              << "  dataset_generator --sizes 500,5000,50000,200000 --seed 20260315 --output-dir ./generated\n"
              << "  dataset_generator --size 5000 --main-size 5000\n";
}

GeneratorConfig parseConfig(int argc, char** argv) {
    GeneratorConfig config;

    for (int index = 1; index < argc; ++index) {
        const std::string arg = argv[index];

        auto readNext = [&](const std::string& flag) -> std::string {
            if (index + 1 >= argc) {
                throw std::runtime_error("Falta valor para " + flag);
            }
            ++index;
            return std::string(argv[index]);
        };

        if (arg == "--help" || arg == "-h") {
            printUsage();
            std::exit(0);
        } else if (arg == "--size") {
            config.sizes = {toSizeOrDefault(readNext(arg), 0)};
        } else if (arg == "--sizes") {
            config.sizes.clear();
            for (const auto& token : split(readNext(arg), ',')) {
                const std::size_t parsed = toSizeOrDefault(trim(token), 0);
                if (parsed > 0) {
                    config.sizes.push_back(parsed);
                }
            }
        } else if (arg == "--seed") {
            config.seed = static_cast<std::uint32_t>(toSizeOrDefault(readNext(arg), config.seed));
        } else if (arg == "--output-dir") {
            config.outputDir = readNext(arg);
        } else if (arg == "--main-size") {
            config.mainSize = toSizeOrDefault(readNext(arg), 0);
        } else if (startsWith(arg, "--size=")) {
            config.sizes = {toSizeOrDefault(arg.substr(7), 0)};
        } else if (startsWith(arg, "--sizes=")) {
            config.sizes.clear();
            for (const auto& token : split(arg.substr(8), ',')) {
                const std::size_t parsed = toSizeOrDefault(trim(token), 0);
                if (parsed > 0) {
                    config.sizes.push_back(parsed);
                }
            }
        } else if (startsWith(arg, "--seed=")) {
            config.seed = static_cast<std::uint32_t>(toSizeOrDefault(arg.substr(7), config.seed));
        } else if (startsWith(arg, "--output-dir=")) {
            config.outputDir = arg.substr(13);
        } else if (startsWith(arg, "--main-size=")) {
            config.mainSize = toSizeOrDefault(arg.substr(12), 0);
        } else {
            throw std::runtime_error("Parametro no reconocido: " + arg);
        }
    }

    config.sizes.erase(
        std::remove_if(
            config.sizes.begin(),
            config.sizes.end(),
            [](std::size_t size) { return size == 0; }
        ),
        config.sizes.end()
    );

    std::sort(config.sizes.begin(), config.sizes.end());
    config.sizes.erase(std::unique(config.sizes.begin(), config.sizes.end()), config.sizes.end());

    if (config.sizes.empty()) {
        throw std::runtime_error("Debe indicar al menos un tamano valido.");
    }

    if (config.mainSize != 0 &&
        std::find(config.sizes.begin(), config.sizes.end(), config.mainSize) == config.sizes.end()) {
        throw std::runtime_error("--main-size debe estar incluido en --size/--sizes.");
    }

    return config;
}

std::string makeDate(int dayOffset) {
    const int baseYear = 2025;
    const int baseMonth = 1;
    const int baseDay = 1;

    int day = baseDay + (dayOffset % 28);
    int month = baseMonth + ((dayOffset / 28) % 12);
    int year = baseYear + (dayOffset / (28 * 12));

    if (month > 12) {
        month = ((month - 1) % 12) + 1;
        year += 1;
    }

    std::ostringstream out;
    out << year << "-" << std::setfill('0') << std::setw(2) << month << "-" << std::setw(2) << day;
    return out.str();
}

std::string makeDateTime(int dayOffset, int minuteOffset) {
    const int hour = (minuteOffset / 60) % 24;
    const int minute = minuteOffset % 60;
    std::ostringstream out;
    out << makeDate(dayOffset) << " " << std::setfill('0') << std::setw(2) << hour << ":" << std::setw(2)
        << minute;
    return out.str();
}

std::vector<Diagnostico> buildDiagnosticos() {
    struct AreaCatalog {
        std::string area;
        std::vector<std::string> especialidades;
        std::vector<std::string> enfermedades;
    };

    const std::vector<AreaCatalog> catalogo = {
        {"Medicina Interna", {"Cardiologia", "Neumologia"}, {"Infarto", "Asma", "Arritmia"}},
        {"Cirugia", {"General", "Traumatologia"}, {"Apendicitis", "Fractura de Femur", "Hernia"}},
        {"Pediatria", {"Neonatologia", "Infantil"}, {"Ictericia", "Reflujo", "Varicela"}},
    };

    std::vector<Diagnostico> diagnosticos;
    int codigo = 100;
    for (const auto& area : catalogo) {
        for (const auto& especialidad : area.especialidades) {
            for (const auto& enfermedad : area.enfermedades) {
                diagnosticos.emplace_back(
                    "D-" + std::to_string(codigo++),
                    enfermedad,
                    area.area,
                    especialidad,
                    "Descripcion detallada de " + enfermedad
                );
            }
        }
    }
    return diagnosticos;
}

std::vector<Paciente> buildPacientes(std::size_t count, std::mt19937& rng, const std::vector<Diagnostico>& diagnosticos) {
    const std::vector<std::string> nombres = {
        "Juan", "Maria", "Carlos", "Ana", "Luis", "Laura", "Pedro", "Sofia", "David", "Byron",
        "Camila", "Daniel", "Andrea", "Jose", "Valeria", "Miguel", "Lucia", "Jorge", "Paula", "Marco"
    };
    const std::vector<std::string> apellidos = {
        "Perez", "Gomez", "Rojas", "Salas", "Vargas", "Mora", "Castro", "Mendez", "Alfaro", "Soto"
    };
    const std::vector<std::string> sangres = {"O+", "O-", "A+", "A-", "B+", "AB+", "AB-"};

    std::uniform_int_distribution<int> nombreDist(0, static_cast<int>(nombres.size() - 1));
    std::uniform_int_distribution<int> apellidoDist(0, static_cast<int>(apellidos.size() - 1));
    std::uniform_int_distribution<int> edadDist(1, 99);
    std::uniform_int_distribution<int> prioridadDist(1, 3);
    std::uniform_int_distribution<int> sangreDist(0, static_cast<int>(sangres.size() - 1));
    std::uniform_int_distribution<int> diagDist(0, static_cast<int>(diagnosticos.size() - 1));
    std::uniform_int_distribution<int> dateDist(0, 420);

    std::vector<Paciente> pacientes;
    pacientes.reserve(count);

    for (std::size_t i = 0; i < count; ++i) {
        const std::string nombreCompleto =
            nombres[static_cast<std::size_t>(nombreDist(rng))] + " " +
            apellidos[static_cast<std::size_t>(apellidoDist(rng))];
        const std::string cedula = std::to_string(100000000 + static_cast<int>(i));

        const auto& diag = diagnosticos[static_cast<std::size_t>(diagDist(rng))];

        pacientes.emplace_back(
            cedula,
            nombreCompleto,
            edadDist(rng),
            makeDate(dateDist(rng)),
            prioridadDist(rng),
            sangres[static_cast<std::size_t>(sangreDist(rng))],
            diag.codigo
        );
    }

    return pacientes;
}

std::vector<Consulta> buildConsultas(std::size_t count, const std::vector<Paciente>& pacientes, std::mt19937& rng, const std::vector<Diagnostico>& diagnosticos) {
    if (pacientes.empty()) {
        return {};
    }

    const std::vector<std::string> medicos = {
        "Dr. House", "Dra. Grey", "Dr. Perez", "Dra. Gomez", "Dr. Alfaro", "Dr. Ruiz", "Dra. Solis"
    };

    std::uniform_int_distribution<int> pacienteDist(0, static_cast<int>(pacientes.size() - 1));
    std::uniform_int_distribution<int> medicoDist(0, static_cast<int>(medicos.size() - 1));
    std::uniform_int_distribution<int> gravedadDist(1, 5);
    std::uniform_int_distribution<int> costoDist(15000, 55000);
    std::uniform_int_distribution<int> dateDist(0, 420);
    std::uniform_int_distribution<int> minuteDist(0, 1439);
    std::uniform_int_distribution<int> diagDist(0, static_cast<int>(diagnosticos.size() - 1));

    std::vector<Consulta> consultas;
    consultas.reserve(count);

    for (std::size_t i = 0; i < count; ++i) {
        const auto& paciente = pacientes[static_cast<std::size_t>(pacienteDist(rng))];
        const auto& diag = diagnosticos[static_cast<std::size_t>(diagDist(rng))];

        consultas.emplace_back(
            "C-" + std::to_string(10000 + static_cast<int>(i)),
            paciente.cedula,
            makeDateTime(dateDist(rng), minuteDist(rng)),
            medicos[static_cast<std::size_t>(medicoDist(rng))],
            diag.nombre,
            gravedadDist(rng),
            static_cast<double>(costoDist(rng))
        );
    }

    return consultas;
}

void writePacientesCsv(const fs::path& path, const std::vector<Paciente>& pacientes) {
    std::ofstream output(path, std::ios::trunc);
    output << "Cedula,Nombre,Edad,FechaRegistro,Prioridad,TipoSangre,Diagnostico\n";
    for (const auto& paciente : pacientes) {
        output << paciente.cedula << "," << paciente.nombre << "," << paciente.edad << ","
               << paciente.fechaRegistro << "," << paciente.prioridad << "," << paciente.tipoSangre << ","
               << paciente.diagnosticoAsignado << "\n";
    }
}

void writeConsultasCsv(const fs::path& path, const std::vector<Consulta>& consultas) {
    std::ofstream output(path, std::ios::trunc);
    output << "ID_Consulta,Cedula_Paciente,Fecha,Medico,Diagnostico,Gravedad,Costo\n";
    for (const auto& consulta : consultas) {
        output << consulta.idConsulta << "," << consulta.cedulaPaciente << "," << consulta.fecha << ","
               << consulta.medicoTratante << "," << consulta.diagnostico << "," << consulta.gravedad << ","
               << consulta.costo << "\n";
    }
}

void writeDiagnosticosCsv(const fs::path& path, const std::vector<Diagnostico>& diagnosticos) {
    std::ofstream output(path, std::ios::trunc);
    output << "Codigo,Nombre,Area,Especialidad,Descripcion\n";
    for (const auto& diagnostico : diagnosticos) {
        output << diagnostico.codigo << "," << diagnostico.nombre << "," << diagnostico.categoria << ","
               << diagnostico.subcategoria << "," << diagnostico.descripcion << "\n";
    }
}

void copyAsMainDataset(const fs::path& sourceDir, const fs::path& outputDir) {
    fs::copy_file(sourceDir / "pacientes.csv", outputDir / "pacientes.csv", fs::copy_options::overwrite_existing);
    fs::copy_file(sourceDir / "consultas.csv", outputDir / "consultas.csv", fs::copy_options::overwrite_existing);
    fs::copy_file(
        sourceDir / "diagnosticos.csv",
        outputDir / "diagnosticos.csv",
        fs::copy_options::overwrite_existing
    );
}

}  // namespace

int main(int argc, char** argv) {
    try {
        const GeneratorConfig config = parseConfig(argc, argv);
        fs::create_directories(config.outputDir);

        std::cout << "Generador de datasets de clinica\n";
        std::cout << "Salida: " << fs::absolute(config.outputDir) << "\n";
        std::cout << "Semilla: " << config.seed << "\n";

        const auto diagnosticos = buildDiagnosticos();

        std::size_t selectedMainSize = config.mainSize;
        if (selectedMainSize == 0) {
            selectedMainSize = config.sizes.front();
        }

        for (const auto size : config.sizes) {
            std::mt19937 rng(config.seed + static_cast<std::uint32_t>(size));
            const auto pacientes = buildPacientes(size, rng, diagnosticos);
            const auto consultas = buildConsultas(size * 2, pacientes, rng, diagnosticos);

            const fs::path sizeDir = config.outputDir / ("size_" + std::to_string(size));
            fs::create_directories(sizeDir);

            writePacientesCsv(sizeDir / "pacientes.csv", pacientes);
            writeConsultasCsv(sizeDir / "consultas.csv", consultas);
            writeDiagnosticosCsv(sizeDir / "diagnosticos.csv", diagnosticos);

            std::cout << " - size_" << size << ": pacientes=" << pacientes.size()
                      << " consultas=" << consultas.size() << "\n";
        }

        const fs::path mainSource = config.outputDir / ("size_" + std::to_string(selectedMainSize));
        if (fs::exists(mainSource / "pacientes.csv")) {
            copyAsMainDataset(mainSource, config.outputDir);
            std::cout << "Dataset principal actualizado con size_" << selectedMainSize
                      << " en " << fs::absolute(config.outputDir) << "\n";
        }

        std::cout << "Generacion finalizada.\n";
        return 0;
    } catch (const std::exception& error) {
        std::cerr << "Error: " << error.what() << "\n";
        return 1;
    }
}
