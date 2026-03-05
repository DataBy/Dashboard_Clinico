import { ArrowRight, LucideIcon, Monitor } from "lucide-react";
import { cn } from "../../lib/utils";

interface PrimaryCardProps {
  title: string;
  description: string;
  createdBy: string;
  onClick: () => void;
  bgColor: string;
  buttonColor: string;
}

export function PrimaryCard({
  title,
  description,
  createdBy,
  onClick,
  bgColor,
  buttonColor,
}: PrimaryCardProps) {
  return (
    <div
      className={cn(
        "relative p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group",
        bgColor
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-6">
        {/* Illustration */}
        <div className="flex-shrink-0">
          <div className="relative w-32 h-24">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-16 bg-white/40 rounded-lg border-4 border-gray-700 flex items-center justify-center">
                <div className="w-12 h-8 bg-gradient-to-br from-purple-500 to-pink-500"></div>
              </div>
              <div className="absolute -bottom-2 -left-2 w-12 h-10 bg-white/30 rounded border-2 border-gray-700"></div>
              <Monitor className="absolute -bottom-3 left-4 w-4 h-4 text-gray-600" />
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">{description}</p>
          
        </div>
        
        {/* Arrow button */}
        <div className="flex-shrink-0">
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg", buttonColor)}>
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
