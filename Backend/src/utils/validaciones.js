import mongoose from "mongoose";

// Funciones de validación reutilizables en los controladores

export const correoValido = (correo) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(correo || "").trim());

export const estaVacio = (valor) =>
    valor === undefined || valor === null || String(valor).trim() === "";

// Devuelve la lista de campos vacíos de un objeto
export const camposVacios = (obj, campos) =>
    campos.filter((campo) => estaVacio(obj[campo]));

export const esNumeroNoNegativo = (valor) =>
    !estaVacio(valor) && !isNaN(Number(valor)) && Number(valor) >= 0;

export const esEnteroPositivo = (valor) =>
    Number.isInteger(Number(valor)) && Number(valor) > 0;

export const idValido = (id) => mongoose.Types.ObjectId.isValid(id);

// Calcula la edad a partir de una fecha (YYYY-MM-DD o DD/MM/YYYY)
export const calcularEdad = (fecha) => {
    if (estaVacio(fecha)) return null;
    let texto = String(fecha).trim();
    const dmy = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmy) texto = `${dmy[3]}-${dmy[2]}-${dmy[1]}`;

    const nacimiento = new Date(texto);
    if (isNaN(nacimiento.getTime())) return null;

    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
};

export const EDAD_MINIMA = 18;
export const EDAD_MAXIMA = 100;

// Devuelve un mensaje de error si la fecha de nacimiento no es válida, o null
export const validarEdad = (fecha) => {
    const edad = calcularEdad(fecha);
    if (edad === null) return "Fecha de nacimiento inválida";
    if (edad < EDAD_MINIMA) return `Debes tener al menos ${EDAD_MINIMA} años`;
    if (edad > EDAD_MAXIMA) return "Fecha de nacimiento inválida";
    return null;
};

export const telefonoValido = (telefono) =>
    /^[0-9+\-\s]{8,15}$/.test(String(telefono || "").trim());
