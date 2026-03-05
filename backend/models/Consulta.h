#ifndef CONSULTA_H
#define CONSULTA_H

#include <string>

using namespace std;

class Consulta {
public:
    string idConsulta;
    string cedulaPaciente; // Esto funciona como una "llave foránea" para conectarlo con el Paciente
    string fecha;
    string medicoTratante;
    string diagnostico;
    int gravedad; // El profesor pide que sea de 1 a 5
    double costo; // Usamos double porque el costo puede tener decimales

    // Constructor con datos
    Consulta(string _idConsulta, string _cedulaPaciente, string _fecha, string _medicoTratante, string _diagnostico, int _gravedad, double _costo) {
        idConsulta = _idConsulta;
        cedulaPaciente = _cedulaPaciente;
        fecha = _fecha;
        medicoTratante = _medicoTratante;
        diagnostico = _diagnostico;
        gravedad = _gravedad;
        costo = _costo;
    }

    // Constructor vacío
    Consulta() {}
};

#endif