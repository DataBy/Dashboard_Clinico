import {
  LayoutDashboard,
  UserPlus,
  Search,
  Stethoscope,
  FileSearch,
  FolderOpen,
  BarChart3,
  Settings,
  Users,
  MessageSquare,
  UserCheck,
  Calendar,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Tablero", icon: LayoutDashboard },
  { id: "registro", label: "Registro", icon: UserPlus },
  { id: "consultar", label: "Consultar", icon: Search },
  { id: "diagnostico", label: "Diagnóstico", icon: Stethoscope },
  { id: "busqueda", label: "Búsqueda", icon: FileSearch },
  { id: "expedientes", label: "Expedientes", icon: FolderOpen },
  { id: "rendimiento", label: "Rendimiento", icon: BarChart3 },
];

const bottomItems = [
  { id: "settings", label: "Configuración", icon: Settings },
  { id: "directory", label: "Directorio", icon: Users },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <div className="w-48 h-full bg-[#5b4ccc] text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-8">
        <h1 className="text-2xl font-semibold">eClínica</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 pr-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "w-full flex items-center gap-3 pl-4 pr-4 py-3 transition-all text-left relative",
              currentPage === item.id
                ? "text-white before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-3 before:h-8 before:bg-white before:rounded-r-full"
                : "text-white/70 hover:text-white hover:bg-white/10 rounded-xl ml-0"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-base">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom items */}
      <div className="pr-4 pb-6 space-y-2">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "w-full flex items-center gap-3 pl-4 pr-4 py-3 transition-all text-left relative",
              currentPage === item.id
                ? "text-white before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-3 before:h-8 before:bg-white before:rounded-r-full"
                : "text-white/70 hover:text-white hover:bg-white/10 rounded-xl ml-0"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-base">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
