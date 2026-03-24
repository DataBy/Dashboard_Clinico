cmake_minimum_required(VERSION 3.10)
project(ClinicaGestion)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(models)

file(GLOB_RECURSE BACKEND_SOURCES
    "algorithms/*.cpp"
    "data/*.cpp"
    "performance/*.cpp"
    "services/*.cpp"
    "main_backend.cpp"
)

add_executable(clinica_api ${BACKEND_SOURCES})
add_executable(dataset_generator dataset_generator.cpp)
