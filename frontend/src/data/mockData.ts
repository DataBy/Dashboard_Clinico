// Mock data for Clinic Management Dashboard

export interface Paciente {
  cedula: string;
  nombre: string;
  edad: number;
  fechaRegistro: string;
  prioridad: 1 | 2 | 3; // 1 = crítico, 2 = urgente, 3 = normal
  tipoSangre: string;
  diagnosticoAsignado: string;
  estado: "En espera" | "En atención" | "Atendido";
}

export interface Consulta {
  id: string;
  cedulaPaciente: string;
  fecha: string;
  medicoTratante: string;
  diagnostico: string;
  gravedad: 1 | 2 | 3 | 4 | 5;
  costo: number;
}

export interface Diagnostico {
  codigo: string;
  nombre: string;
  area: string;
  especialidad: string;
  categoria: string;
  subcategoria: string;
  descripcion: string;
}

// Pacientes (10-15)
export const pacientes: Paciente[] = [
  {
    cedula: "001-0912345-6",
    nombre: "María González",
    edad: 45,
    fechaRegistro: "2026-03-05 08:30",
    prioridad: 1,
    tipoSangre: "O+",
    diagnosticoAsignado: "INF-001",
    estado: "En espera"
  },
  {
    cedula: "001-0234567-8",
    nombre: "Juan Pérez",
    edad: 32,
    fechaRegistro: "2026-03-05 09:15",
    prioridad: 2,
    tipoSangre: "A+",
    diagnosticoAsignado: "CARD-005",
    estado: "En atención"
  },
  {
    cedula: "001-0345678-9",
    nombre: "Ana Martínez",
    edad: 28,
    fechaRegistro: "2026-03-05 09:45",
    prioridad: 3,
    tipoSangre: "B+",
    diagnosticoAsignado: "RESP-003",
    estado: "En espera"
  },
  {
    cedula: "001-0456789-0",
    nombre: "Carlos Rodríguez",
    edad: 56,
    fechaRegistro: "2026-03-04 14:20",
    prioridad: 1,
    tipoSangre: "AB+",
    diagnosticoAsignado: "CARD-002",
    estado: "Atendido"
  },
  {
    cedula: "001-0567890-1",
    nombre: "Laura Fernández",
    edad: 41,
    fechaRegistro: "2026-03-05 10:00",
    prioridad: 3,
    tipoSangre: "O-",
    diagnosticoAsignado: "DERM-001",
    estado: "En espera"
  },
  {
    cedula: "001-0678901-2",
    nombre: "Roberto Sánchez",
    edad: 67,
    fechaRegistro: "2026-03-05 07:30",
    prioridad: 2,
    tipoSangre: "A-",
    diagnosticoAsignado: "NEUR-004",
    estado: "En espera"
  },
  {
    cedula: "001-0789012-3",
    nombre: "Patricia López",
    edad: 35,
    fechaRegistro: "2026-03-04 16:45",
    prioridad: 3,
    tipoSangre: "B-",
    diagnosticoAsignado: "GAST-002",
    estado: "Atendido"
  },
  {
    cedula: "001-0890123-4",
    nombre: "Miguel Herrera",
    edad: 52,
    fechaRegistro: "2026-03-05 08:00",
    prioridad: 2,
    tipoSangre: "O+",
    diagnosticoAsignado: "RESP-001",
    estado: "En espera"
  },
  {
    cedula: "001-0901234-5",
    nombre: "Isabel Castro",
    edad: 29,
    fechaRegistro: "2026-03-05 11:20",
    prioridad: 3,
    tipoSangre: "A+",
    diagnosticoAsignado: "OFT-001",
    estado: "En espera"
  },
  {
    cedula: "001-1012345-6",
    nombre: "Francisco Díaz",
    edad: 44,
    fechaRegistro: "2026-03-04 13:30",
    prioridad: 1,
    tipoSangre: "AB-",
    diagnosticoAsignado: "TRAU-003",
    estado: "Atendido"
  },
  {
    cedula: "001-1123456-7",
    nombre: "Sofía Ramírez",
    edad: 38,
    fechaRegistro: "2026-03-05 09:00",
    prioridad: 2,
    tipoSangre: "B+",
    diagnosticoAsignado: "END-002",
    estado: "En espera"
  },
  {
    cedula: "001-1234567-8",
    nombre: "Diego Torres",
    edad: 61,
    fechaRegistro: "2026-03-05 10:30",
    prioridad: 3,
    tipoSangre: "O-",
    diagnosticoAsignado: "UROL-001",
    estado: "En espera"
  }
];

// Consultas (20-30)
export const consultas: Consulta[] = [
  {
    id: "C-001",
    cedulaPaciente: "001-0912345-6",
    fecha: "2026-03-05 08:30",
    medicoTratante: "Dr. Ramón Gutiérrez",
    diagnostico: "Neumonía bacteriana",
    gravedad: 4,
    costo: 3500
  },
  {
    id: "C-002",
    cedulaPaciente: "001-0234567-8",
    fecha: "2026-03-05 09:15",
    medicoTratante: "Dra. Carmen Vega",
    diagnostico: "Hipertensión arterial",
    gravedad: 3,
    costo: 1200
  },
  {
    id: "C-003",
    cedulaPaciente: "001-0345678-9",
    fecha: "2026-03-05 09:45",
    medicoTratante: "Dr. Luis Morales",
    diagnostico: "Bronquitis aguda",
    gravedad: 2,
    costo: 850
  },
  {
    id: "C-004",
    cedulaPaciente: "001-0456789-0",
    fecha: "2026-03-04 14:20",
    medicoTratante: "Dra. Carmen Vega",
    diagnostico: "Infarto agudo de miocardio",
    gravedad: 5,
    costo: 12000
  },
  {
    id: "C-005",
    cedulaPaciente: "001-0567890-1",
    fecha: "2026-03-05 10:00",
    medicoTratante: "Dr. Alberto Núñez",
    diagnostico: "Dermatitis atópica",
    gravedad: 1,
    costo: 600
  },
  {
    id: "C-006",
    cedulaPaciente: "001-0678901-2",
    fecha: "2026-03-05 07:30",
    medicoTratante: "Dra. Elena Rojas",
    diagnostico: "Migraña crónica",
    gravedad: 3,
    costo: 950
  },
  {
    id: "C-007",
    cedulaPaciente: "001-0789012-3",
    fecha: "2026-03-04 16:45",
    medicoTratante: "Dr. José Mendoza",
    diagnostico: "Gastritis erosiva",
    gravedad: 2,
    costo: 780
  },
  {
    id: "C-008",
    cedulaPaciente: "001-0890123-4",
    fecha: "2026-03-05 08:00",
    medicoTratante: "Dr. Luis Morales",
    diagnostico: "Asma bronquial",
    gravedad: 3,
    costo: 1100
  },
  {
    id: "C-009",
    cedulaPaciente: "001-0901234-5",
    fecha: "2026-03-05 11:20",
    medicoTratante: "Dra. María Salazar",
    diagnostico: "Conjuntivitis alérgica",
    gravedad: 1,
    costo: 450
  },
  {
    id: "C-010",
    cedulaPaciente: "001-1012345-6",
    fecha: "2026-03-04 13:30",
    medicoTratante: "Dr. Pedro Castillo",
    diagnostico: "Fractura de tibia",
    gravedad: 4,
    costo: 4200
  },
  {
    id: "C-011",
    cedulaPaciente: "001-1123456-7",
    fecha: "2026-03-05 09:00",
    medicoTratante: "Dra. Gloria Arias",
    diagnostico: "Diabetes tipo 2",
    gravedad: 3,
    costo: 1500
  },
  {
    id: "C-012",
    cedulaPaciente: "001-1234567-8",
    fecha: "2026-03-05 10:30",
    medicoTratante: "Dr. Andrés Blanco",
    diagnostico: "Hiperplasia prostática",
    gravedad: 2,
    costo: 1350
  },
  {
    id: "C-013",
    cedulaPaciente: "001-0912345-6",
    fecha: "2026-03-01 10:00",
    medicoTratante: "Dr. Ramón Gutiérrez",
    diagnostico: "Gripe común",
    gravedad: 1,
    costo: 400
  },
  {
    id: "C-014",
    cedulaPaciente: "001-0234567-8",
    fecha: "2026-02-28 14:30",
    medicoTratante: "Dra. Carmen Vega",
    diagnostico: "Control cardiológico",
    gravedad: 2,
    costo: 800
  },
  {
    id: "C-015",
    cedulaPaciente: "001-0456789-0",
    fecha: "2026-02-20 09:00",
    medicoTratante: "Dra. Carmen Vega",
    diagnostico: "Angina de pecho",
    gravedad: 4,
    costo: 2500
  },
  {
    id: "C-016",
    cedulaPaciente: "001-0567890-1",
    fecha: "2026-02-15 11:00",
    medicoTratante: "Dr. Alberto Núñez",
    diagnostico: "Acné severo",
    gravedad: 2,
    costo: 650
  },
  {
    id: "C-017",
    cedulaPaciente: "001-0678901-2",
    fecha: "2026-02-25 16:00",
    medicoTratante: "Dra. Elena Rojas",
    diagnostico: "Cefalea tensional",
    gravedad: 2,
    costo: 550
  },
  {
    id: "C-018",
    cedulaPaciente: "001-0789012-3",
    fecha: "2026-02-18 10:30",
    medicoTratante: "Dr. José Mendoza",
    diagnostico: "Reflujo gastroesofágico",
    gravedad: 2,
    costo: 720
  },
  {
    id: "C-019",
    cedulaPaciente: "001-0890123-4",
    fecha: "2026-02-10 08:45",
    medicoTratante: "Dr. Luis Morales",
    diagnostico: "Rinitis alérgica",
    gravedad: 1,
    costo: 500
  },
  {
    id: "C-020",
    cedulaPaciente: "001-1012345-6",
    fecha: "2026-02-05 13:00",
    medicoTratante: "Dr. Pedro Castillo",
    diagnostico: "Esguince de tobillo",
    gravedad: 2,
    costo: 900
  },
  {
    id: "C-021",
    cedulaPaciente: "001-1123456-7",
    fecha: "2026-02-22 15:30",
    medicoTratante: "Dra. Gloria Arias",
    diagnostico: "Control diabético",
    gravedad: 2,
    costo: 700
  },
  {
    id: "C-022",
    cedulaPaciente: "001-0901234-5",
    fecha: "2026-02-12 09:15",
    medicoTratante: "Dra. María Salazar",
    diagnostico: "Revisión oftalmológica",
    gravedad: 1,
    costo: 350
  },
  {
    id: "C-023",
    cedulaPaciente: "001-1234567-8",
    fecha: "2026-01-30 11:45",
    medicoTratante: "Dr. Andrés Blanco",
    diagnostico: "Control urológico",
    gravedad: 1,
    costo: 800
  },
  {
    id: "C-024",
    cedulaPaciente: "001-0345678-9",
    fecha: "2026-02-08 14:00",
    medicoTratante: "Dr. Luis Morales",
    diagnostico: "Faringitis estreptocócica",
    gravedad: 2,
    costo: 650
  },
  {
    id: "C-025",
    cedulaPaciente: "001-0912345-6",
    fecha: "2026-01-20 10:30",
    medicoTratante: "Dr. Ramón Gutiérrez",
    diagnostico: "Amigdalitis aguda",
    gravedad: 2,
    costo: 700
  }
];

// Diagnósticos (15-25 con jerarquía)
export const diagnosticos: Diagnostico[] = [
  {
    codigo: "INF-001",
    nombre: "Neumonía bacteriana",
    area: "Medicina Interna",
    especialidad: "Neumología",
    categoria: "Infecciones respiratorias",
    subcategoria: "Infecciones pulmonares",
    descripcion: "Infección aguda del parénquima pulmonar causada por bacterias"
  },
  {
    codigo: "CARD-001",
    nombre: "Hipertensión arterial esencial",
    area: "Medicina Interna",
    especialidad: "Cardiología",
    categoria: "Enfermedades cardiovasculares",
    subcategoria: "Trastornos de presión arterial",
    descripcion: "Presión arterial elevada de causa desconocida"
  },
  {
    codigo: "CARD-002",
    nombre: "Infarto agudo de miocardio",
    area: "Medicina Interna",
    especialidad: "Cardiología",
    categoria: "Enfermedades cardiovasculares",
    subcategoria: "Cardiopatía isquémica",
    descripcion: "Necrosis del músculo cardíaco por obstrucción coronaria"
  },
  {
    codigo: "CARD-005",
    nombre: "Angina de pecho",
    area: "Medicina Interna",
    especialidad: "Cardiología",
    categoria: "Enfermedades cardiovasculares",
    subcategoria: "Cardiopatía isquémica",
    descripcion: "Dolor torácico por isquemia miocárdica transitoria"
  },
  {
    codigo: "RESP-001",
    nombre: "Asma bronquial",
    area: "Medicina Interna",
    especialidad: "Neumología",
    categoria: "Enfermedades obstructivas",
    subcategoria: "Asma y broncoespasmo",
    descripcion: "Enfermedad inflamatoria crónica de las vías respiratorias"
  },
  {
    codigo: "RESP-003",
    nombre: "Bronquitis aguda",
    area: "Medicina Interna",
    especialidad: "Neumología",
    categoria: "Infecciones respiratorias",
    subcategoria: "Infecciones bronquiales",
    descripcion: "Inflamación aguda de los bronquios"
  },
  {
    codigo: "DERM-001",
    nombre: "Dermatitis atópica",
    area: "Medicina Interna",
    especialidad: "Dermatología",
    categoria: "Enfermedades inflamatorias",
    subcategoria: "Eczemas",
    descripcion: "Inflamación crónica de la piel con prurito"
  },
  {
    codigo: "NEUR-004",
    nombre: "Migraña crónica",
    area: "Medicina Interna",
    especialidad: "Neurología",
    categoria: "Cefaleas primarias",
    subcategoria: "Migrañas",
    descripcion: "Cefalea recurrente unilateral con síntomas asociados"
  },
  {
    codigo: "GAST-002",
    nombre: "Gastritis erosiva",
    area: "Medicina Interna",
    especialidad: "Gastroenterología",
    categoria: "Enfermedades gastroduodenales",
    subcategoria: "Gastritis",
    descripcion: "Inflamación de la mucosa gástrica con erosiones"
  },
  {
    codigo: "OFT-001",
    nombre: "Conjuntivitis alérgica",
    area: "Cirugía",
    especialidad: "Oftalmología",
    categoria: "Enfermedades de superficie ocular",
    subcategoria: "Conjuntivitis",
    descripcion: "Inflamación alérgica de la conjuntiva"
  },
  {
    codigo: "TRAU-003",
    nombre: "Fractura de tibia",
    area: "Cirugía",
    especialidad: "Traumatología",
    categoria: "Fracturas de miembros inferiores",
    subcategoria: "Fracturas de pierna",
    descripcion: "Solución de continuidad del hueso tibial"
  },
  {
    codigo: "END-002",
    nombre: "Diabetes mellitus tipo 2",
    area: "Medicina Interna",
    especialidad: "Endocrinología",
    categoria: "Trastornos metabólicos",
    subcategoria: "Diabetes",
    descripcion: "Hiperglucemia crónica por resistencia a insulina"
  },
  {
    codigo: "UROL-001",
    nombre: "Hiperplasia prostática benigna",
    area: "Cirugía",
    especialidad: "Urología",
    categoria: "Enfermedades prostáticas",
    subcategoria: "Hiperplasia",
    descripcion: "Aumento benigno del tamaño de la próstata"
  },
  {
    codigo: "INF-002",
    nombre: "Gripe estacional",
    area: "Medicina Interna",
    especialidad: "Infectología",
    categoria: "Infecciones virales",
    subcategoria: "Influenza",
    descripcion: "Infección viral aguda del tracto respiratorio"
  },
  {
    codigo: "RESP-002",
    nombre: "Rinitis alérgica",
    area: "Medicina Interna",
    especialidad: "Alergología",
    categoria: "Enfermedades alérgicas",
    subcategoria: "Rinitis",
    descripcion: "Inflamación alérgica de la mucosa nasal"
  },
  {
    codigo: "DERM-002",
    nombre: "Acné vulgar",
    area: "Medicina Interna",
    especialidad: "Dermatología",
    categoria: "Enfermedades del folículo pilosebáceo",
    subcategoria: "Acné",
    descripcion: "Enfermedad inflamatoria crónica de las glándulas sebáceas"
  },
  {
    codigo: "NEUR-001",
    nombre: "Cefalea tensional",
    area: "Medicina Interna",
    especialidad: "Neurología",
    categoria: "Cefaleas primarias",
    subcategoria: "Cefaleas tipo tensión",
    descripcion: "Dolor de cabeza bilateral por tensión muscular"
  },
  {
    codigo: "GAST-001",
    nombre: "Reflujo gastroesofágico",
    area: "Medicina Interna",
    especialidad: "Gastroenterología",
    categoria: "Enfermedades esofágicas",
    subcategoria: "Reflujo",
    descripcion: "Regurgitación del contenido gástrico al esófago"
  },
  {
    codigo: "TRAU-001",
    nombre: "Esguince de tobillo",
    area: "Cirugía",
    especialidad: "Traumatología",
    categoria: "Lesiones ligamentosas",
    subcategoria: "Esguinces",
    descripcion: "Lesión de ligamentos del tobillo sin ruptura completa"
  },
  {
    codigo: "INF-003",
    nombre: "Amigdalitis aguda",
    area: "Medicina Interna",
    especialidad: "Otorrinolaringología",
    categoria: "Infecciones faríngeas",
    subcategoria: "Amigdalitis",
    descripcion: "Inflamación aguda de las amígdalas palatinas"
  },
  {
    codigo: "RESP-004",
    nombre: "Faringitis estreptocócica",
    area: "Medicina Interna",
    especialidad: "Otorrinolaringología",
    categoria: "Infecciones faríngeas",
    subcategoria: "Faringitis bacteriana",
    descripcion: "Infección bacteriana de la faringe por estreptococo"
  }
];

// Datos para el árbol de diagnósticos
export interface DiagnosticoTree {
  area: string;
  especialidades: {
    nombre: string;
    diagnosticos: Diagnostico[];
  }[];
}

export const diagnosticosTree: DiagnosticoTree[] = [
  {
    area: "Medicina Interna",
    especialidades: [
      {
        nombre: "Cardiología",
        diagnosticos: diagnosticos.filter(d => d.especialidad === "Cardiología")
      },
      {
        nombre: "Neumología",
        diagnosticos: diagnosticos.filter(d => d.especialidad === "Neumología")
      },
      {
        nombre: "Dermatología",
        diagnosticos: diagnosticos.filter(d => d.especialidad === "Dermatología")
      },
      {
        nombre: "Neurología",
        diagnosticos: diagnosticos.filter(d => d.especialidad === "Neurología")
      },
      {
        nombre: "Gastroenterología",
        diagnosticos: diagnosticos.filter(d => d.especialidad === "Gastroenterología")
      },
      {
        nombre: "Endocrinología",
        diagnosticos: diagnosticos.filter(d => d.especialidad === "Endocrinología")
      },
      {
        nombre: "Infectología",
        diagnosticos: diagnosticos.filter(d => d.especialidad === "Infectología")
      },
      {
        nombre: "Alergología",
        diagnosticos: diagnosticos.filter(d => d.especialidad === "Alergología")
      },
      {
        nombre: "Otorrinolaringología",
        diagnosticos: diagnosticos.filter(d => d.especialidad === "Otorrinolaringología")
      }
    ]
  },
  {
    area: "Cirugía",
    especialidades: [
      {
        nombre: "Traumatología",
        diagnosticos: diagnosticos.filter(d => d.especialidad === "Traumatología")
      },
      {
        nombre: "Oftalmología",
        diagnosticos: diagnosticos.filter(d => d.especialidad === "Oftalmología")
      },
      {
        nombre: "Urología",
        diagnosticos: diagnosticos.filter(d => d.especialidad === "Urología")
      }
    ]
  }
];

export const tiposSangre = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
