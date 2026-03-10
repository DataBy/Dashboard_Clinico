#ifndef DIAGNOSTICO_H
#define DIAGNOSTICO_H

#include <string>

using namespace std;

class Diagnostico {
public:
    string codigo;
    string nombre;
    string categoria;
    string subcategoria;
    string descripcion;

    // Constructor con datos
    Diagnostico(string _codigo, string _nombre, string _categoria, string _subcategoria, string _descripcion) {
        codigo = _codigo;
        nombre = _nombre;
        categoria = _categoria;
        subcategoria = _subcategoria;
        descripcion = _descripcion;
    }

    // Constructor vacío
    Diagnostico() {}
};

#endif