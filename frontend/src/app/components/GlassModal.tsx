import type { PropsWithChildren } from "react";
import { X } from "lucide-react";

interface GlassModalProps extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
  title: string;
  maxWidthClassName?: string;
}

export function GlassModal({
  open,
  onClose,
  title,
  maxWidthClassName = "max-w-4xl",
  children,
}: GlassModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className={`max-h-[90vh] w-full ${maxWidthClassName} overflow-hidden rounded-3xl border border-white/45 bg-white/75 shadow-[0_24px_60px_rgba(31,41,55,0.22)] backdrop-blur-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/45 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-600 transition-colors hover:bg-white/60 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-74px)] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
