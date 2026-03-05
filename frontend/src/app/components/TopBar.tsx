import { Search, Bell } from "lucide-react";

interface TopBarProps {
  title: string;
  showFilters?: boolean;
}

export function TopBar({ title, showFilters = false }: TopBarProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Sistema de Gestión Clínica Digital</h1>
        
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Search className="w-5 h-5 text-gray-500" />
          </button>
          
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="flex items-center gap-4 mt-6">
          
          {["Time", "Level", "Language", "Type"].map((filter) => (
            null
          ))}
        </div>
      )}
    </div>
  );
}
