/*
 * ============================================================
 *  Sistema de Gestión de Clínica — Módulo 1
 *  Estructura de atención: Cola con Prioridad (CONSOLA)
 * ============================================================
 *
 *  JUSTIFICACIÓN DE LA ESTRUCTURA ELEGIDA:
 *  Se utiliza una COLA CON PRIORIDAD (priority queue) implementada
 *  sobre un max-heap.
 *
 *  ¿Por qué no cola simple (queue)?
 *    Una cola simple atiende en orden de llegada (FIFO) sin importar
 *    la gravedad del paciente. En un entorno clínico esto es
 *    inaceptable: un paciente crítico podría esperar detrás de
 *    decenas de pacientes con prioridad normal.
 *
 *  ¿Por qué no cola doble (deque)?
 *    Un deque permite insertar/extraer por ambos extremos, pero no
 *    garantiza un orden basado en prioridad sin recorrer toda la
 *    estructura en O(n), lo que pierde eficiencia frente al heap.
 *
 *  ¿Por qué cola con prioridad (heap)?
 *    - Inserción en O(log n).
 *    - Extracción del paciente más urgente en O(log n).
 *    - Siempre se atiende al paciente con mayor prioridad (1=crítico).
 *    - Dentro del mismo nivel de prioridad se respeta el orden de
 *      llegada gracias al campo `orden_llegada` (desempate FIFO).
 *    Es la estructura óptima para este dominio clínico.
 *
 *  COMPILACIÓN:
 *    g++ cola_pacientes.cpp -o cola_pacientes
 *  EJECUCIÓN:
 *    ./cola_pacientes
 * ============================================================
 */

#include <iostream>
#include <string>
#include <vector>
#include <queue>
#include <iomanip>
#include <sstream>
#include <ctime>
#include <limits>

// ============================================================
//  COLORES ANSI
// ============================================================
#define RESET "\033[0m"
#define BOLD "\033[1m"
#define ROJO "\033[31m"
#define AMARILLO "\033[33m"
#define VERDE "\033[32m"
#define CYAN "\033[36m"
#define AZUL "\033[34m"
#define GRIS "\033[90m"
#define BLANCO "\033[97m"

// ============================================================
//  ESTRUCTURA PACIENTE
// ============================================================
struct Paciente
{
    std::string cedula;
    std::string nombre;
    int edad;
    std::string fecha_registro;
    int prioridad; // 1=crítico, 2=urgente, 3=normal
    std::string tipo_sangre;
    std::string diagnostico;
    int orden_llegada; // desempate FIFO dentro del mismo nivel

    /*
     * Comparador para el max-heap de std::priority_queue.
     * Queremos que prioridad 1 (crítico) salga primero, por eso invertimos:
     *   - Si prioridades distintas → menor número = más urgente = "mayor".
     *   - Si prioridades iguales   → menor orden_llegada = llegó antes = "mayor".
     */
    bool operator<(const Paciente &otro) const
    {
        if (prioridad != otro.prioridad)
            return prioridad > otro.prioridad;
        return orden_llegada > otro.orden_llegada;
    }
};

// ============================================================
//  COLA CON PRIORIDAD (wrapper sobre std::priority_queue / heap)
// ============================================================
class ColaPrioridad
{
private:
    std::priority_queue<Paciente> heap;
    int contador_llegada;

public:
    ColaPrioridad() : contador_llegada(0) {}

    void registrar(Paciente p)
    {
        p.orden_llegada = ++contador_llegada;
        heap.push(p);
    }

    Paciente atender()
    {
        Paciente p = heap.top();
        heap.pop();
        return p;
    }

    bool esta_vacia() const { return heap.empty(); }
    int tamano() const { return (int)heap.size(); }

    // Snapshot en orden de atención sin modificar el heap
    std::vector<Paciente> snapshot() const
    {
        std::priority_queue<Paciente> copia = heap;
        std::vector<Paciente> lista;
        while (!copia.empty())
        {
            lista.push_back(copia.top());
            copia.pop();
        }
        return lista;
    }
};

// ============================================================
//  UTILIDADES
// ============================================================

std::string timestamp_actual()
{
    std::time_t t = std::time(nullptr);
    std::tm *tm_info = std::localtime(&t);
    std::ostringstream oss;
    oss << std::setfill('0')
        << std::setw(2) << tm_info->tm_mday << "/"
        << std::setw(2) << (tm_info->tm_mon + 1) << "/"
        << (tm_info->tm_year + 1900) << " "
        << std::setw(2) << tm_info->tm_hour << ":"
        << std::setw(2) << tm_info->tm_min;
    return oss.str();
}

std::string prioridad_texto(int p)
{
    switch (p)
    {
    case 1:
        return "CRITICO";
    case 2:
        return "URGENTE";
    case 3:
        return "NORMAL ";
    default:
        return "???????";
    }
}

std::string prioridad_color(int p)
{
    switch (p)
    {
    case 1:
        return ROJO;
    case 2:
        return AMARILLO;
    case 3:
        return VERDE;
    default:
        return RESET;
    }
}

void separador(char c = '-', int ancho = 68)
{
    std::cout << GRIS;
    for (int i = 0; i < ancho; i++)
        std::cout << c;
    std::cout << RESET << "\n";
}

void limpiar_buffer()
{
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
}

std::string leer_linea(const std::string &prompt)
{
    std::string valor;
    while (true)
    {
        std::cout << CYAN << prompt << RESET;
        std::getline(std::cin, valor);
        if (!valor.empty())
            return valor;
        std::cout << ROJO << "  [!] Campo obligatorio. Intente de nuevo.\n"
                  << RESET;
    }
}

int leer_entero(const std::string &prompt, int min_val, int max_val)
{
    int valor;
    while (true)
    {
        std::cout << CYAN << prompt << RESET;
        if (std::cin >> valor && valor >= min_val && valor <= max_val)
        {
            limpiar_buffer();
            return valor;
        }
        std::cin.clear();
        limpiar_buffer();
        std::cout << ROJO << "  [!] Ingrese un numero entre "
                  << min_val << " y " << max_val << ".\n"
                  << RESET;
    }
}

// ============================================================
//  PRESENTACIÓN
// ============================================================

void imprimir_encabezado()
{
    separador('=');
    std::cout << BOLD << AZUL
              << "   SISTEMA DE GESTION DE CLINICA\n"
              << "   Modulo 1 — Estructura de Atencion: Cola con Prioridad\n"
              << RESET;
    separador('=');
    std::cout << GRIS
              << "  Justificacion: Se usa una cola con prioridad (max-heap)\n"
              << "  porque garantiza atender siempre al paciente mas urgente\n"
              << "  con insercion y extraccion en O(log n).\n"
              << "  Dentro del mismo nivel de prioridad se respeta FIFO.\n"
              << RESET << "\n";
}

void imprimir_menu()
{
    std::cout << "\n"
              << BOLD << BLANCO << "  MENU PRINCIPAL\n"
              << RESET;
    separador();
    std::cout << AZUL << "  [1]" << RESET << " Registrar nuevo paciente\n";
    std::cout << ROJO << "  [2]" << RESET << " Atender siguiente paciente\n";
    std::cout << VERDE << "  [3]" << RESET << " Ver lista de espera\n";
    std::cout << AMARILLO << "  [4]" << RESET << " Ver historial de atendidos\n";
    std::cout << CYAN << "  [5]" << RESET << " Cargar pacientes de prueba\n";
    std::cout << GRIS << "  [0]" << RESET << " Salir\n";
    separador();
    std::cout << BOLD << "  Opcion: " << RESET;
}

void imprimir_paciente(const Paciente &p, int posicion = -1)
{
    std::string color = prioridad_color(p.prioridad);
    std::string pri = prioridad_texto(p.prioridad);
    separador('-', 65);
    if (posicion > 0)
        std::cout << BOLD << "  Posicion #" << posicion << RESET << "\n";
    std::cout << "  " << BOLD << color << "[" << pri << "]" << RESET
              << "  " << BOLD << p.nombre << RESET << "\n";
    std::cout << "  Cedula     : " << p.cedula << "\n";
    std::cout << "  Edad       : " << p.edad << " anios\n";
    std::cout << "  Sangre     : " << p.tipo_sangre << "\n";
    std::cout << "  Diagnostico: " << p.diagnostico << "\n";
    std::cout << "  Registro   : " << p.fecha_registro << "\n";
}

// ============================================================
//  OPERACIONES DEL MENÚ
// ============================================================

void registrar_paciente(ColaPrioridad &cola)
{
    separador('=');
    std::cout << BOLD << AZUL << "  REGISTRAR NUEVO PACIENTE\n"
              << RESET;
    separador('=');

    Paciente p;
    p.cedula = leer_linea("  Cedula        : ");
    p.nombre = leer_linea("  Nombre        : ");
    p.edad = leer_entero("  Edad          : ", 0, 150);
    p.tipo_sangre = leer_linea("  Tipo de sangre: ");
    p.diagnostico = leer_linea("  Diagnostico   : ");

    std::cout << "\n  Nivel de prioridad:\n";
    std::cout << ROJO << "    [1] CRITICO\n"
              << RESET;
    std::cout << AMARILLO << "    [2] URGENTE\n"
              << RESET;
    std::cout << VERDE << "    [3] NORMAL\n"
              << RESET;
    p.prioridad = leer_entero("  Prioridad     : ", 1, 3);
    p.fecha_registro = timestamp_actual();

    cola.registrar(p);

    std::cout << "\n"
              << VERDE << BOLD
              << "  [OK] Paciente registrado correctamente.\n"
              << "  Pacientes en espera: " << cola.tamano()
              << RESET << "\n";
}

void atender_paciente(ColaPrioridad &cola, std::vector<Paciente> &historial)
{
    separador('=');
    std::cout << BOLD << ROJO << "  ATENDER SIGUIENTE PACIENTE\n"
              << RESET;
    separador('=');

    if (cola.esta_vacia())
    {
        std::cout << AMARILLO
                  << "  [!] No hay pacientes en la lista de espera.\n"
                  << RESET;
        return;
    }

    Paciente p = cola.atender();
    historial.push_back(p);

    std::cout << VERDE << BOLD << "  Atendiendo a:\n"
              << RESET;
    imprimir_paciente(p);
    separador('-', 65);
    std::cout << "\n"
              << VERDE
              << "  [OK] Paciente atendido y registrado en historial.\n"
              << "  Pacientes restantes: " << cola.tamano()
              << RESET << "\n";
}

void ver_lista_espera(const ColaPrioridad &cola)
{
    separador('=');
    std::cout << BOLD << VERDE
              << "  LISTA DE ESPERA (" << cola.tamano() << " pacientes)\n"
              << RESET;
    separador('=');

    if (cola.esta_vacia())
    {
        std::cout << GRIS << "  (Sin pacientes en espera)\n"
                  << RESET;
        return;
    }

    std::vector<Paciente> lista = cola.snapshot();
    for (int i = 0; i < (int)lista.size(); i++)
        imprimir_paciente(lista[i], i + 1);
    separador('-', 65);
}

void ver_historial(const std::vector<Paciente> &historial)
{
    separador('=');
    std::cout << BOLD << AMARILLO
              << "  HISTORIAL DE ATENDIDOS (" << historial.size() << " pacientes)\n"
              << RESET;
    separador('=');

    if (historial.empty())
    {
        std::cout << GRIS << "  (Ningun paciente atendido aun)\n"
                  << RESET;
        return;
    }

    // Mostrar del más reciente al más antiguo
    for (int i = (int)historial.size() - 1; i >= 0; i--)
    {
        imprimir_paciente(historial[i]);
        std::cout << GRIS << "  (Atendido en turno #" << (i + 1) << ")\n"
                  << RESET;
    }
    separador('-', 65);
}

void cargar_demo(ColaPrioridad &cola)
{
    separador('=');
    std::cout << BOLD << CYAN << "  CARGANDO PACIENTES DE PRUEBA\n"
              << RESET;
    separador('=');

    struct DatoDemo
    {
        std::string cedula, nombre, sangre, diagnostico;
        int edad, prioridad;
    };

    std::vector<DatoDemo> demos = {
        {"101110001", "Carlos Mendez", "O+", "Infarto agudo de miocardio", 58, 1},
        {"205330022", "Maria Solano", "A-", "Fractura de femur", 34, 2},
        {"303440033", "Luis Herrera", "B+", "Gripe comun", 22, 3},
        {"401550044", "Ana Rojas", "AB+", "Convulsiones repetidas", 45, 1},
        {"509660055", "Pedro Vargas", "O-", "Tension arterial elevada", 61, 2},
        {"607770066", "Sofia Castro", "A+", "Control rutinario", 28, 3},
        {"705880077", "Diego Mora", "B-", "Apendicitis aguda", 19, 1},
        {"803990088", "Elena Gutierrez", "O+", "Dolor abdominal leve", 37, 3},
    };

    for (auto &d : demos)
    {
        Paciente p;
        p.cedula = d.cedula;
        p.nombre = d.nombre;
        p.edad = d.edad;
        p.tipo_sangre = d.sangre;
        p.diagnostico = d.diagnostico;
        p.prioridad = d.prioridad;
        p.fecha_registro = timestamp_actual();
        cola.registrar(p);
        std::cout << GRIS << "  + " << d.nombre
                  << " [" << prioridad_texto(d.prioridad) << "]\n"
                  << RESET;
    }

    std::cout << "\n"
              << VERDE << BOLD
              << "  [OK] " << demos.size() << " pacientes cargados.\n"
              << "  Total en espera: " << cola.tamano()
              << RESET << "\n";
}

// ============================================================
//  MAIN
// ============================================================
int main()
{
    ColaPrioridad cola;
    std::vector<Paciente> historial;

    imprimir_encabezado();

    while (true)
    {
        imprimir_menu();

        int opcion;
        if (!(std::cin >> opcion))
        {
            std::cin.clear();
            limpiar_buffer();
            std::cout << ROJO << "  [!] Entrada invalida.\n"
                      << RESET;
            continue;
        }
        limpiar_buffer();
        std::cout << "\n";

        switch (opcion)
        {
        case 1:
            registrar_paciente(cola);
            break;
        case 2:
            atender_paciente(cola, historial);
            break;
        case 3:
            ver_lista_espera(cola);
            break;
        case 4:
            ver_historial(historial);
            break;
        case 5:
            cargar_demo(cola);
            break;
        case 0:
            separador('=');
            std::cout << BOLD << AZUL
                      << "  Sistema cerrado. Hasta luego.\n"
                      << RESET;
            separador('=');
            return 0;
        default:
            std::cout << ROJO
                      << "  [!] Opcion invalida. Intente de nuevo.\n"
                      << RESET;
        }
    }
}