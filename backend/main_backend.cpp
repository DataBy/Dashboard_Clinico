#include <iostream>
#include <thread>
#include <chrono>

int main()
{
    std::cout << "==========================================" << std::endl;
    std::cout << "🏥 API de Clínica UTN Iniciada con Éxito" << std::endl;
    std::cout << "==========================================" << std::endl;

    // Mantiene el contenedor vivo para que podamos ver los stats
    while (true)
    {
        std::this_thread::sleep_for(std::chrono::seconds(10));
    }
    return 0;
}