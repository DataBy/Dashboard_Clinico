#ifndef ARBOL_DIAGNOSTICOS_H
#define ARBOL_DIAGNOSTICOS_H

#include <vector>

#include "../models/Diagnostico.h"
#include "../third_party/json.hpp"

namespace arbol_diagnosticos {

nlohmann::json construirArbol(const std::vector<Diagnostico>& diagnosticos);

}  // namespace arbol_diagnosticos

#endif
