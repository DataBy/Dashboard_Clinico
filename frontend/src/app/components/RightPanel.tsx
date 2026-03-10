import { ChevronLeft, ChevronRight, Users, Clock, Stethoscope, Timer } from "lucide-react";
import { pacientes } from "../../data/mockData";

export function RightPanel() {
  const onlineUsers = pacientes.slice(0, 4);

  return (
    <div className="w-80 h-screen bg-white p-6 space-y-8 overflow-y-auto">
      {/* Usuario Admin */}
      <div className="flex items-center gap-3 justify-end">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">Usuario Admin</p>
          <p className="text-xs text-gray-500">Administrador</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
          <span className="text-white font-medium text-sm">A</span>
        </div>
      </div>

      {/* Calendar Widget */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-purple-600">Marzo 2026</h3>
          <div className="flex gap-2">
            <button className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day, i) => (
            <div key={i} className="text-xs text-gray-400 font-medium py-2">
              {day}
            </div>
          ))}
          {Array.from({ length: 35 }, (_, i) => {
            const day = i - 6;
            const isSelected = day === 9 || day === 13;
            
            if (day < 1 || day > 30) {
              return <div key={i} className="text-gray-300 text-sm py-2"></div>;
            }
            
            return (
              <div
                key={i}
                className={`text-sm py-2 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-purple-600 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actividad de Hoy Widget */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-5 border border-purple-100">
        <h3 className="text-base font-bold text-gray-800 mb-4">Actividad de Hoy</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm text-gray-600">Pacientes atendidos</span>
            </div>
            <span className="text-lg font-bold text-gray-900">8</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-sm text-gray-600">En espera</span>
            </div>
            <span className="text-lg font-bold text-gray-900">6</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Diagnósticos registrados</span>
            </div>
            <span className="text-lg font-bold text-gray-900">12</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                <Timer className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm text-gray-600">Tiempo promedio</span>
            </div>
            <span className="text-lg font-bold text-gray-900">24min</span>
          </div>
        </div>
      </div>

      {/* Pacientes en Espera Widget */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm">
        <h3 className="text-base font-bold text-gray-800 mb-4">Pacientes en Espera</h3>
        <div className="space-y-3">
          {pacientes
            .filter(p => p.estado === "En espera")
            .slice(0, 4)
            .map((paciente, index) => {
              const prioridadConfig = {
                1: { label: "Alta", color: "bg-red-100 text-red-700" },
                2: { label: "Media", color: "bg-yellow-100 text-yellow-700" },
                3: { label: "Baja", color: "bg-green-100 text-green-700" }
              };
              
              const config = prioridadConfig[paciente.prioridad];
              
              return (
                <div key={paciente.cedula} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                      {paciente.nombre.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{paciente.nombre}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${config.color}`}>
                    {config.label}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
      
    </div>
  );
}
