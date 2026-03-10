#include "arbol_diagnosticos.h"

#include <algorithm>
#include <map>
#include <string>
#include <vector>

namespace arbol_diagnosticos {

nlohmann::json construirArbol(const std::vector<Diagnostico>& diagnosticos) {
    std::map<std::string, std::map<std::string, std::vector<nlohmann::json>>> agrupado;

    for (const auto& diagnostico : diagnosticos) {
        const std::string area = diagnostico.categoria;
        const std::string especialidad = diagnostico.subcategoria;

        agrupado[area][especialidad].push_back({
            {"codigo", diagnostico.codigo},
            {"nombre", diagnostico.nombre},
            {"area", area},
            {"especialidad", especialidad},
            {"categoria", area},
            {"subcategoria", especialidad},
            {"descripcion", diagnostico.descripcion},
        });
    }

    nlohmann::json arbol = nlohmann::json::array();
    for (auto& areaPair : agrupado) {
        nlohmann::json especialidades = nlohmann::json::array();

        for (auto& especialidadPair : areaPair.second) {
            auto& diagnosticosEspecialidad = especialidadPair.second;
            std::sort(
                diagnosticosEspecialidad.begin(),
                diagnosticosEspecialidad.end(),
                [](const nlohmann::json& a, const nlohmann::json& b) {
                    return a.value("codigo", "") < b.value("codigo", "");
                }
            );

            especialidades.push_back({
                {"nombre", especialidadPair.first},
                {"diagnosticos", diagnosticosEspecialidad},
            });
        }

        arbol.push_back({
            {"area", areaPair.first},
            {"especialidades", especialidades},
        });
    }

    return arbol;
}

}  // namespace arbol_diagnosticos
