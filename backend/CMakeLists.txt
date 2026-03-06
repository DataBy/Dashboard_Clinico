cmake_minimum_required(VERSION 3.10)
project(ClinicaGestion)

set(CMAKE_CXX_STANDARD 17)

# 1. Le dice al compilador dónde buscar los archivos .h (Tu carpeta models)
include_directories(models)

# 2. Busca automáticamente todos los .cpp en tus subcarpetas
file(GLOB_RECURSE SOURCES
    "algorithms/*.cpp"
    "data/*.cpp"
    "performance/*.cpp"
    "services/*.cpp"
    "main_backend.cpp"
)

# 3. Compila el ejecutable uniendo todo lo que encontró
add_executable(clinica_api ${SOURCES})

# (Opcional por ahora) Vincular SQLite cuando lo necesiten
# find_package(SQLite3 REQUIRED)
# target_link_libraries(clinica_api SQLite3::SQLite3)