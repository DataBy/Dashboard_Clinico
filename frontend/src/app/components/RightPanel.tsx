import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Stethoscope,
  Timer,
  Users,
} from "lucide-react";
import {
  type ApiPaciente,
  getCola,
  getConsultas,
  getDiagnosticos,
  getPacientes,
} from "../../lib/api";

interface CalendarAppointment {
  id: string;
  date: string;
  time: string;
  title: string;
}

const APPOINTMENTS_STORAGE_KEY = "eclinica_calendar_appointments";
const monthFormatter = new Intl.DateTimeFormat("es-CR", {
  month: "long",
  year: "numeric",
});

function dateToKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function keyToDate(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatMonthTitle(date: Date) {
  const raw = monthFormatter.format(date);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function parseConsultaDate(value: string) {
  const parsed = parseDateTime(value);
  if (!parsed) {
    return { date: dateToKey(new Date()), time: "08:00" };
  }

  return {
    date: dateToKey(parsed),
    time: `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`,
  };
}

function parseDateTime(value: string) {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function toDateKey(value: string) {
  const parsed = parseDateTime(value);
  return parsed ? dateToKey(parsed) : null;
}

function computeAverageAttentionMinutes(
  pacientes: ApiPaciente[],
  consultas: Array<{ cedulaPaciente: string; fecha: string }>
) {
  const pacientesByCedula = new Map(pacientes.map((paciente) => [paciente.cedula, paciente]));
  const durations: number[] = [];

  consultas.forEach((consulta) => {
    const paciente = pacientesByCedula.get(consulta.cedulaPaciente);
    if (!paciente) {
      return;
    }

    const registro = parseDateTime(paciente.fechaRegistro);
    const atencion = parseDateTime(consulta.fecha);
    if (!registro || !atencion) {
      return;
    }

    const diffMinutes = (atencion.getTime() - registro.getTime()) / 60000;
    if (diffMinutes < 0) {
      return;
    }

    durations.push(diffMinutes);
  });

  if (durations.length === 0) {
    return null;
  }

  return Math.round(durations.reduce((sum, current) => sum + current, 0) / durations.length);
}

export function RightPanel() {
  const [pacientesEnEspera, setPacientesEnEspera] = useState<ApiPaciente[]>([]);
  const [stats, setStats] = useState({
    atendidos: 0,
    enEspera: 0,
    diagnosticos: 0,
    tiempoPromedioMin: null as number | null,
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => dateToKey(new Date()));
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);

  useEffect(() => {
    let disposed = false;

    const loadPanelData = async () => {
      try {
        const [pacientes, cola, diagnosticos, consultas] = await Promise.all([
          getPacientes(),
          getCola(),
          getDiagnosticos(),
          getConsultas(),
        ]);

        if (disposed) {
          return;
        }

        const todayKey = dateToKey(new Date());
        const consultasDeHoy = consultas.filter((consulta) => toDateKey(consulta.fecha) === todayKey);
        const promedio = computeAverageAttentionMinutes(pacientes, consultasDeHoy);

        setPacientesEnEspera(cola.slice(0, 4));
        setStats({
          atendidos: pacientes.filter((paciente) => paciente.estado === "Atendido").length,
          enEspera: cola.length,
          diagnosticos: diagnosticos.length,
          tiempoPromedioMin: promedio,
        });

        const appointmentsFromApi = consultas.map((consulta) => {
          const parsed = parseConsultaDate(consulta.fecha);
          return {
            id: `${consulta.idConsulta || consulta.id}-${parsed.date}`,
            date: parsed.date,
            time: parsed.time,
            title: `${consulta.medicoTratante} - ${consulta.diagnostico}`,
          };
        });

        const storedRaw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
        if (storedRaw) {
          const stored = JSON.parse(storedRaw) as CalendarAppointment[];
          setAppointments(stored);
          return;
        }

        setAppointments(appointmentsFromApi);
      } catch (error) {
        console.error(error);
      }
    };

    void loadPanelData();
    const interval = window.setInterval(() => {
      void loadPanelData();
    }, 3000);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
    } catch {
      // Ignore storage failures.
    }
  }, [appointments]);

  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalCells = Math.max(35, Math.ceil((firstWeekday + daysInMonth) / 7) * 7);

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - firstWeekday + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        return null;
      }

      const date = new Date(year, month, dayNumber);
      return {
        date,
        key: dateToKey(date),
        dayNumber,
      };
    });
  }, [currentMonth]);

  const appointmentDateKeys = useMemo(() => {
    return new Set(appointments.map((item) => item.date));
  }, [appointments]);

  const appointmentsForSelectedDay = useMemo(() => {
    return appointments
      .filter((item) => item.date === selectedDateKey)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDateKey]);

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + offset,
      1
    );
    setCurrentMonth(nextMonth);
    setSelectedDateKey(dateToKey(nextMonth));
  };

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
          <h3 className="text-lg font-bold text-purple-600">{formatMonthTitle(currentMonth)}</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day, index) => (
            <div key={index} className="text-xs text-gray-400 font-medium py-2">
              {day}
            </div>
          ))}

          {calendarCells.map((cell, index) => {
            if (!cell) {
              return <div key={`empty-${index}`} className="text-gray-300 text-sm py-2"></div>;
            }

            const isSelected = selectedDateKey === cell.key;
            const hasAppointments = appointmentDateKeys.has(cell.key);

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDateKey(cell.key)}
                className={`relative text-sm py-2 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-purple-600 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {cell.dayNumber}
                {hasAppointments && (
                  <span
                    className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                      isSelected ? "bg-white/90" : "bg-purple-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700">
              Anotaciones del {keyToDate(selectedDateKey).toLocaleDateString()}
            </p>
            <span className="text-xs text-gray-500">{appointmentsForSelectedDay.length}</span>
          </div>

          <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
            {appointmentsForSelectedDay.length > 0 ? (
              appointmentsForSelectedDay.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-lg bg-gray-50 px-2 py-1.5"
                >
                  <div className="min-w-0 flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-purple-700">{appointment.time}</p>
                      <p className="truncate text-xs text-gray-700">{appointment.title}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-2 text-center text-xs text-gray-400">Sin anotaciones para este día</p>
            )}
          </div>
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
            <span className="text-lg font-bold text-gray-900">{stats.atendidos}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-sm text-gray-600">En espera</span>
            </div>
            <span className="text-lg font-bold text-gray-900">{stats.enEspera}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Diagnósticos registrados</span>
            </div>
            <span className="text-lg font-bold text-gray-900">{stats.diagnosticos}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                <Timer className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm text-gray-600">Tiempo promedio</span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              {stats.tiempoPromedioMin === null ? "--" : `${stats.tiempoPromedioMin} min`}
            </span>
          </div>
        </div>
      </div>

      {/* Pacientes en Espera Widget */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm">
        <h3 className="text-base font-bold text-gray-800 mb-4">Pacientes en Espera</h3>
        <div className="space-y-3">
          {pacientesEnEspera.map((paciente) => {
            const prioridadConfig = {
              1: { label: "Crítico", color: "bg-red-100 text-red-700" },
              2: { label: "Urgente", color: "bg-orange-100 text-orange-700" },
              3: { label: "Normal", color: "bg-blue-100 text-blue-700" },
            };

            const config = prioridadConfig[paciente.prioridad];

            return (
              <div key={paciente.cedula} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {paciente.nombre
                      .split(" ")
                      .map((chunk) => chunk[0])
                      .join("")}
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
