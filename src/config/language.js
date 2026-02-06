// Archivo: src/config/language.js

export const APP_MODE = 'EDIFICIO'; // O 'COLEGIO', lo que quieras probar

const DICTIONARY = {
    EDIFICIO: {
        appName: "YUME Edificios", // <--- ¡AQUÍ ESTÁ!
        persona: "Persona",
        personas: "Personas",
        unidad: "Departamento",
        unidades: "Departamentos",
        deuda: "Cuota",
        relacion: "Contrato",
        concepto: "Expensa",
        periodo: "Mes",
        identificador: "N° Depto"
    },
    COLEGIO: {
        appName: "YUME Escolar",   // <--- ¡AQUÍ TAMBIÉN!
        persona: "Tutor",
        personas: "Tutores",
        unidad: "Estudiante", 
        unidades: "Estudiantes",
        deuda: "Mensualidade",
        relacion: "Inscripción",
        concepto: "Pensión",
        periodo: "Mes",
        identificador: "Matrícula"
    },
    GENERICO: {
        appName: "YUME ERP",       // <--- UNIVERSAL
        persona: "Cliente",
        personas: "Clientes",
        unidad: "Cuenta",
        unidades: "Cuentas",
        deuda: "Cuota",
        relacion: "Contrato",
        concepto: "Concepto",
        periodo: "Periodo",
        identificador: "Código"
    }
};

export const LABELS = DICTIONARY[APP_MODE];