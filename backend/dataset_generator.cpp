#include <iostream>
#include <vector>
#include <cstdlib> 
#include <ctime>   
#include <fstream> 

#include "models/Paciente.h"
#include "models/Consulta.h"
#include "models/Diagnostico.h"

using namespace std;

int main() {
    srand(time(0));

    cout << "¡Iniciando el Generador de Datos de la Clinica!" << endl;
    cout << "-----------------------------------------------" << endl;

    int cantidadAGenerar;
    cout << "¿Cuantos pacientes deseas generar? (Ej. 500, 5000): ";
    cin >> cantidadAGenerar;

    cout << "Generando base de datos de pacientes, por favor espera..." << endl;

    vector<string> nombres = {"Juan", "Maria", "Carlos", "Ana", "Luis", "Laura", "Pedro", "Sofia", "David", "Byron"};
    vector<string> apellidos = {"Perez", "Gomez", "Rojas", "Salas", "Vargas", "Mora", "Castro", "Mendez", "Alfaro"};
    vector<string> sangres = {"O+", "O-", "A+", "A-", "B+", "AB+"};
    vector<string> diagnosticos = {"Hipertension", "Diabetes", "Migrana", "Gripe", "Fractura", "Asma"};

    vector<Paciente> listaPacientes;

    // 1. GENERAR PACIENTES
    for(int i = 0; i < cantidadAGenerar; i++) {
        string nombreCompleto = nombres[rand() % nombres.size()] + " " + apellidos[rand() % apellidos.size()];
        string cedula = to_string(100000000 + rand() % 900000000); 
        int edad = 1 + rand() % 99;
        int prioridad = 1 + rand() % 3;
        string sangre = sangres[rand() % sangres.size()];
        string diagnostico = diagnosticos[rand() % diagnosticos.size()];

        Paciente nuevoPaciente(cedula, nombreCompleto, edad, "2026-03-05", prioridad, sangre, diagnostico);
        listaPacientes.push_back(nuevoPaciente);
    }

    // Guardar Pacientes en CSV
    ofstream archivoPacientes("pacientes.csv");
    archivoPacientes << "Cedula,Nombre,Edad,FechaRegistro,Prioridad,TipoSangre,Diagnostico" << endl;
    for(int i = 0; i < listaPacientes.size(); i++) {
        archivoPacientes << listaPacientes[i].cedula << "," << listaPacientes[i].nombre << ","
                         << listaPacientes[i].edad << "," << listaPacientes[i].fechaRegistro << ","
                         << listaPacientes[i].prioridad << "," << listaPacientes[i].tipoSangre << ","
                         << listaPacientes[i].diagnosticoAsignado << endl;
    }
    archivoPacientes.close(); 
    cout << "¡Exito! Se guardaron " << cantidadAGenerar << " pacientes en 'pacientes.csv'." << endl;

    // =========================================================================
    // NUEVO: 2. GENERAR CONSULTAS (Usando las cédulas de los pacientes creados)
    // =========================================================================
    
    cout << "Generando historial de consultas medicas..." << endl;
    
    vector<Consulta> listaConsultas;
    vector<string> medicos = {"Dr. House", "Dra. Grey", "Dr. Perez", "Dra. Gomez", "Dr. Alfaro"};
    
    // Asumiremos que en promedio hay 2 consultas por cada paciente
    int cantidadConsultas = cantidadAGenerar * 2; 

    for(int i = 0; i < cantidadConsultas; i++) {
        string idConsulta = "C-" + to_string(10000 + i); // Ej. C-10001
        
        // ¡Magia aquí! Tomamos una cédula al azar de la lista de pacientes que ya existe
        string cedulaPaciente = listaPacientes[rand() % listaPacientes.size()].cedula;
        
        string fecha = "2026-03-0" + to_string(1 + rand() % 9); // Días del 1 al 9
        string medico = medicos[rand() % medicos.size()];
        string diagnostico = diagnosticos[rand() % diagnosticos.size()];
        
        int gravedad = 1 + rand() % 5; // Gravedad del 1 al 5 como pide el profe
        double costo = 15000.0 + (rand() % 40000); // Un costo entre 15mil y 55mil

        Consulta nuevaConsulta(idConsulta, cedulaPaciente, fecha, medico, diagnostico, gravedad, costo);
        listaConsultas.push_back(nuevaConsulta);
    }

    // Guardar Consultas en CSV
    ofstream archivoConsultas("consultas.csv");
    archivoConsultas << "ID_Consulta,Cedula_Paciente,Fecha,Medico,Diagnostico,Gravedad,Costo" << endl;
    for(int i = 0; i < listaConsultas.size(); i++) {
        archivoConsultas << listaConsultas[i].idConsulta << "," << listaConsultas[i].cedulaPaciente << ","
                         << listaConsultas[i].fecha << "," << listaConsultas[i].medicoTratante << ","
                         << listaConsultas[i].diagnostico << "," << listaConsultas[i].gravedad << ","
                         << listaConsultas[i].costo << endl;
    }
    archivoConsultas.close();
    cout << "¡Exito! Se guardaron " << cantidadConsultas << " consultas en 'consultas.csv'." << endl;
// =========================================================================
    // NUEVO: 3. GENERAR ÁRBOL DE DIAGNÓSTICOS
    // =========================================================================
    
    cout << "Generando jerarquia de diagnosticos..." << endl;

    vector<Diagnostico> listaDiagnosticos;
    
    // Datos maestros para la jerarquía
    struct AreaMedica {
        string nombre;
        vector<string> especialidades;
        vector<string> enfermedades;
    };

    vector<AreaMedica> catalogo = {
        {"Medicina Interna", {"Cardiologia", "Neumologia"}, {"Infarto", "Asma", "Arritmia"}},
        {"Cirugia", {"General", "Traumatologia"}, {"Apendicitis", "Fractura de Femur", "Hernia"}},
        {"Pediatria", {"Neonatologia", "Infantil"}, {"Ictericia", "Reflujo", "Varicela"}}
    };

    for(auto &area : catalogo) {
        for(auto &esp : area.especialidades) {
            for(auto &enfermedad : area.enfermedades) {
                string codigo = "D-" + to_string(100 + listaDiagnosticos.size());
                
                Diagnostico nuevoDiag(codigo, enfermedad, area.nombre, esp, "Descripcion detallada de " + enfermedad);
                listaDiagnosticos.push_back(nuevoDiag);
            }
        }
    }

    // Guardar Diagnósticos en CSV
    ofstream archivoDiag("diagnosticos.csv");
    archivoDiag << "Codigo,Nombre,Area,Especialidad,Descripcion" << endl;
    for(int i = 0; i < listaDiagnosticos.size(); i++) {
        archivoDiag << listaDiagnosticos[i].codigo << "," << listaDiagnosticos[i].nombre << ","
                    << listaDiagnosticos[i].categoria << "," << listaDiagnosticos[i].subcategoria << ","
                    << listaDiagnosticos[i].descripcion << endl;
    }
    archivoDiag.close();
    cout << "Exito! Se guardaron " << listaDiagnosticos.size() << " diagnosticos en 'diagnosticos.csv'." << endl;
    
    return 0;
}