#ifndef PACIENTE_H
#define PACIENTE_H

#include <string>

using namespace std;

class Paciente {
public:
    string cedula;
    string nombre;
    int edad;
    string fechaRegistro;
    int prioridad; // 1-crítico, 2-urgente, 3-normal
    string tipoSangre;
    string diagnosticoAsignado;

    // Constructor: Es como la función que "crea" la fila cuando insertamos un paciente nuevo
    Paciente(string _cedula, string _nombre, int _edad, string _fechaRegistro, int _prioridad, string _tipoSangre, string _diagnosticoAsignado) {
        cedula = _cedula;
        nombre = _nombre;
        edad = _edad;
        fechaRegistro = _fechaRegistro;
        prioridad = _prioridad;
        tipoSangre = _tipoSangre;
        diagnosticoAsignado = _diagnosticoAsignado;
    }
    
    // Un constructor vacío por si necesitamos crear un paciente sin datos aún
    Paciente() {} 
};

#endif