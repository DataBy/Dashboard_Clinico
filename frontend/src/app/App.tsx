import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { RightPanel } from "./components/RightPanel";
import { Dashboard } from "./pages/Dashboard";
import { Registro } from "./pages/Registro";
import { Consultar } from "./pages/Consultar";
import { Diagnostico } from "./pages/Diagnostico";
import { Busqueda } from "./pages/Busqueda";
import { Expedientes } from "./pages/Expedientes";
import { Rendimiento } from "./pages/Rendimiento";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={setCurrentPage} />;
      case "registro":
        return <Registro />;
      case "consultar":
        return <Consultar />;
      case "diagnostico":
        return <Diagnostico />;
      case "busqueda":
        return <Busqueda />;
      case "expedientes":
        return <Expedientes />;
      case "rendimiento":
        return <Rendimiento />;
      case "settings":
        return (
          <div className="p-8 bg-gray-50">
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Configuración</h2>
              <p className="text-gray-600">Configuración del sistema</p>
            </div>
          </div>
        );
      case "directory":
        return (
          <div className="p-8 bg-gray-50">
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Directorio</h2>
              <p className="text-gray-600">Directorio de profesionales</p>
            </div>
          </div>
        );
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    // Purple background wrapper with padding
    <div className="w-screen h-screen p-3 flex gap-0">
      {/* Sidebar outside the white panel - fused with purple background */}
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* White app frame - only contains main content and right panel */}
      <div className="flex-1 h-full bg-white rounded-[32px] border-[0.5px] border-[#6A5AE0]/20 border-l-0 overflow-hidden shadow-[0_20px_60px_rgba(91,76,204,0.12)] flex">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {renderPage()}
        </div>

        {/* Right panel */}
        <RightPanel />
      </div>
    </div>
  );
}
