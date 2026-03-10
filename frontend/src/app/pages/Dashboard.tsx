import { TopBar } from "../components/TopBar";
import { PrimaryCard } from "../components/PrimaryCard";

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="p-8 bg-gray-50">
      <TopBar title="Mis Módulos" showFilters={true} />

      <div className="space-y-6 max-w-4xl">
        <PrimaryCard
          title="Atención (Cola con Prioridad)"
          description="Lista de espera en tiempo real organizada por nivel de prioridad del paciente."
          createdBy="Dr. Carlos Méndez"
          bgColor="bg-purple-100"
          buttonColor="bg-gradient-to-br from-purple-300 to-purple-400"
          onClick={() => onNavigate("registro")}
        />

        <PrimaryCard
          title="Expedientes y Búsquedas"
          description="Busca información de pacientes por cédula, nombre, fechas y gravedad; compara tiempos de búsqueda."
          createdBy="Dra. Ana García"
          bgColor="bg-red-100"
          buttonColor="bg-gradient-to-br from-red-300 to-red-400"
          onClick={() => onNavigate("busqueda")}
        />

        <PrimaryCard
          title="Árbol de Diagnósticos"
          description="Navega la jerarquía de diagnósticos: Área → Especialidad → Diagnóstico específico."
          createdBy="Dr. Roberto Silva"
          bgColor="bg-pink-100"
          buttonColor="bg-gradient-to-br from-pink-300 to-pink-400"
          onClick={() => onNavigate("diagnostico")}
        />

        <PrimaryCard
          title="Análisis de Rendimiento"
          description="Compara algoritmos de ordenamiento y búsqueda con datos de pacientes en tiempo real."
          createdBy="Ing. María López"
          bgColor="bg-blue-100"
          buttonColor="bg-gradient-to-br from-blue-300 to-blue-400"
          onClick={() => onNavigate("rendimiento")}
        />

        <PrimaryCard
          title="Historial de Consultas"
          description="Accede al registro completo de consultas médicas, tratamientos y seguimientos realizados."
          createdBy="Dr. Luis Hernández"
          bgColor="bg-green-100"
          buttonColor="bg-gradient-to-br from-green-300 to-green-400"
          onClick={() => onNavigate("consultar")}
        />
      </div>
    </div>
  );
}
