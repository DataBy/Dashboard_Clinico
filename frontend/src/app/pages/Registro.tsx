import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, UserPlus } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { Badge } from "../components/Badge";
import { GlassModal } from "../components/GlassModal";
import { ExpedientePanel } from "../components/ExpedientePanel";
import { useGlassToast } from "../components/GlassToast";
import {
  type ApiConsulta,
  type ApiDiagnostico,
  type ApiPaciente,
  atenderPaciente,
  atenderSiguiente,
  createPaciente,
  getCola,
  getConsultas,
  getDiagnosticos,
} from "../../lib/api";
import {
  buildExpedienteRecord,
  saveLastExpediente,
  type ExpedienteRecord,
} from "../../lib/expediente";

const tiposSangre = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function Registro() {
  const [colaOrdenada, setColaOrdenada] = useState<ApiPaciente[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<ApiDiagnostico[]>([]);
  const [consultas, setConsultas] = useState<ApiConsulta[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAtendiendo, setIsAtendiendo] = useState(false);
  const [showAtencionConfirm, setShowAtencionConfirm] = useState(false);
  const [selectedExpediente, setSelectedExpediente] = useState<ExpedienteRecord | null>(null);
  const [formData, setFormData] = useState({
    cedula: "",
    nombre: "",
    edad: "",
    prioridad: "3",
    tipoSangre: "O+",
    diagnostico: "",
  });
  const { showToast } = useGlassToast();
  const attentionTimerRef = useRef<number | null>(null);

  const showAtencionMessage = () => {
    setShowAtencionConfirm(true);

    if (attentionTimerRef.current) {
      window.clearTimeout(attentionTimerRef.current);
    }

    attentionTimerRef.current = window.setTimeout(() => {
      setShowAtencionConfirm(false);
      attentionTimerRef.current = null;
    }, 2000);
  };

  const loadData = useCallback(async (showErrorToast = true) => {
    try {
      const [cola, diagnosticosApi, consultasApi] = await Promise.all([
        getCola(),
        getDiagnosticos(),
        getConsultas(),
      ]);
      setColaOrdenada(cola);
      setDiagnosticos(diagnosticosApi);
      setConsultas(consultasApi);
      setFormData((prev) => {
        if (prev.diagnostico || diagnosticosApi.length === 0) {
          return prev;
        }
        return { ...prev, diagnostico: diagnosticosApi[0].codigo };
      });
    } catch (error) {
      console.error(error);
      if (showErrorToast) {
        showToast("No se pudo cargar la información del backend.", 2500);
      }
    }
  }, [showToast]);

  useEffect(() => {
    let active = true;

    void loadData(true);
    const interval = window.setInterval(() => {
      if (!active) {
        return;
      }
      void loadData(false);
    }, 3000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [loadData]);

  useEffect(() => {
    return () => {
      if (attentionTimerRef.current) {
        window.clearTimeout(attentionTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const edad = Number(formData.edad);
    if (!Number.isFinite(edad) || edad <= 0) {
      showToast("La edad debe ser mayor que 0.", 2500);
      return;
    }

    setIsSubmitting(true);
    try {
      await createPaciente({
        cedula: formData.cedula.trim(),
        nombre: formData.nombre.trim(),
        edad,
        prioridad: Number(formData.prioridad),
        tipoSangre: formData.tipoSangre,
        diagnosticoAsignado: formData.diagnostico,
      });
      await loadData();

      setFormData((prev) => ({
        cedula: "",
        nombre: "",
        edad: "",
        prioridad: "3",
        tipoSangre: "O+",
        diagnostico: prev.diagnostico,
      }));

      showToast("Paciente añadido exitosamente", 2400);
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : "No se pudo registrar el paciente.", 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAtenderSiguiente = async () => {
    setIsAtendiendo(true);
    try {
      await atenderSiguiente();
      await loadData();
      showAtencionMessage();
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : "No se pudo atender al paciente.", 2500);
    } finally {
      setIsAtendiendo(false);
    }
  };

  const handleAtenderPaciente = async (cedula: string) => {
    setIsAtendiendo(true);
    try {
      await atenderPaciente(cedula);
      await loadData();
      showAtencionMessage();
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : "No se pudo atender al paciente.", 2500);
    } finally {
      setIsAtendiendo(false);
    }
  };

  const consultasByCedula = useMemo(() => {
    const map = new Map<string, ApiConsulta[]>();
    consultas.forEach((consulta) => {
      const existing = map.get(consulta.cedulaPaciente) ?? [];
      existing.push(consulta);
      map.set(consulta.cedulaPaciente, existing);
    });
    return map;
  }, [consultas]);

  const openExpediente = (paciente: ApiPaciente) => {
    const record = buildExpedienteRecord(
      paciente,
      consultasByCedula.get(paciente.cedula) ?? []
    );
    saveLastExpediente(record);
    setSelectedExpediente(record);
  };

  return (
    <div className="p-8 bg-gray-50">
      <TopBar title="Registro de Pacientes" showFilters={false} />

      {/* Form */}
      <div className="bg-white rounded-3xl p-8 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Nuevo Paciente</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cédula</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="00100000000"
              value={formData.cedula}
              onChange={(event) =>
                setFormData({ ...formData, cedula: digitsOnly(event.target.value) })
              }
              onKeyDown={(event) => {
                if (event.ctrlKey || event.metaKey || event.altKey || event.key.length > 1) {
                  return;
                }

                if (!/^\d$/.test(event.key)) {
                  event.preventDefault();
                }
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
            <input
              type="text"
              placeholder="Nombre del paciente"
              value={formData.nombre}
              onChange={(event) => setFormData({ ...formData, nombre: event.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Edad</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={formData.edad}
              onChange={(event) =>
                setFormData({ ...formData, edad: digitsOnly(event.target.value) })
              }
              onKeyDown={(event) => {
                if (event.ctrlKey || event.metaKey || event.altKey || event.key.length > 1) {
                  return;
                }

                if (!/^\d$/.test(event.key)) {
                  event.preventDefault();
                }
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
            <select
              value={formData.prioridad}
              onChange={(event) => setFormData({ ...formData, prioridad: event.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="1">1 - Crítico</option>
              <option value="2">2 - Urgente</option>
              <option value="3">3 - Normal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de sangre</label>
            <select
              value={formData.tipoSangre}
              onChange={(event) => setFormData({ ...formData, tipoSangre: event.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {tiposSangre.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Diagnóstico asignado</label>
            <select
              value={formData.diagnostico}
              onChange={(event) => setFormData({ ...formData, diagnostico: event.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {diagnosticos.map((diag) => (
                <option key={diag.codigo} value={diag.codigo}>
                  {diag.codigo} - {diag.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Registrando..." : "Registrar Paciente"}
            </button>
          </div>
        </form>
      </div>

      {/* Cola de espera */}
      <div className="bg-white rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Lista de Espera</h2>
          <button
            onClick={handleAtenderSiguiente}
            disabled={isAtendiendo}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {isAtendiendo ? "Atendiendo..." : "Atender siguiente"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Prioridad</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Cédula</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Nombre</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Edad</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Diagnóstico</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Registro</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {colaOrdenada.map((paciente, idx) => (
                <tr key={paciente.cedula} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="py-4 px-4">
                    <Badge variant="prioridad" value={paciente.prioridad} />
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700">{paciente.cedula}</td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-900">{paciente.nombre}</td>
                  <td className="py-4 px-4 text-sm text-gray-700">{paciente.edad}</td>
                  <td className="py-4 px-4 text-sm text-gray-700">{paciente.diagnosticoAsignado}</td>
                  <td className="py-4 px-4 text-sm text-gray-700">{paciente.fechaRegistro}</td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isAtendiendo}
                        onClick={() => void handleAtenderPaciente(paciente.cedula)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition-colors disabled:opacity-50"
                      >
                        Atender
                      </button>
                      <button
                        type="button"
                        onClick={() => openExpediente(paciente)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                      >
                        Ver
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <GlassModal
        open={Boolean(selectedExpediente)}
        onClose={() => setSelectedExpediente(null)}
        title={selectedExpediente ? `Paciente: ${selectedExpediente.paciente.nombre}` : "Paciente"}
      >
        {selectedExpediente && <ExpedientePanel record={selectedExpediente} />}
      </GlassModal>

      {showAtencionConfirm && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center pointer-events-none">
          <div className="rounded-3xl border border-white/45 bg-white/75 px-8 py-6 text-center shadow-[0_24px_60px_rgba(31,41,55,0.22)] backdrop-blur-2xl">
            <p className="text-2xl font-semibold text-emerald-700">✅</p>
            <p className="mt-2 text-base font-semibold text-gray-900">Paciente atendido</p>
          </div>
        </div>
      )}
    </div>
  );
}
