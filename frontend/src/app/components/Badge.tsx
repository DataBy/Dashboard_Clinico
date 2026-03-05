import { cn } from "../../lib/utils";

interface BadgeProps {
  variant: "prioridad" | "gravedad" | "estado";
  value: number | string;
  className?: string;
}

export function Badge({ variant, value, className }: BadgeProps) {
  const getStyles = () => {
    if (variant === "prioridad") {
      const priority = value as 1 | 2 | 3;
      switch (priority) {
        case 1:
          return "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300";
        case 2:
          return "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300";
        case 3:
          return "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300";
      }
    }

    if (variant === "gravedad") {
      const severity = value as number;
      if (severity >= 4) {
        return "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300";
      } else if (severity === 3) {
        return "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300";
      } else {
        return "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300";
      }
    }

    if (variant === "estado") {
      const status = value as string;
      switch (status) {
        case "En espera":
          return "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300";
        case "En atención":
          return "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300";
        case "Atendido":
          return "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300";
      }
    }
  };

  const getLabel = () => {
    if (variant === "prioridad") {
      const labels = { 1: "Crítico", 2: "Urgente", 3: "Normal" };
      return labels[value as 1 | 2 | 3];
    }
    if (variant === "gravedad") {
      return `Gravedad ${value}`;
    }
    return value;
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs border",
        getStyles(),
        className
      )}
    >
      {getLabel()}
    </span>
  );
}
