// Script de datos de prueba para la demostración de la app.
// Solo AGREGA datos (no borra nada) y se puede ejecutar varias veces sin duplicar.
// Uso: npm run seed
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import { config } from "./config.js";
import MarcasModel from "./src/Models/Marcas.js";
import CelularesModel from "./src/Models/Celulares.js";
import ClientesModel from "./src/Models/Clientes.js";
import PedidosModel from "./src/Models/Pedidos.js";
import ResenasModel from "./src/Models/Resenas.js";

// Contraseña de las cuentas demo (solo para pruebas)
const PASSWORD_DEMO = "Demo1234";

const marcas = ["Apple", "Samsung", "Xiaomi", "Motorola"];

const celulares = [
    { nombre: "iPhone 13", marca: "Apple", modelo: "A2633", almacenamiento: "128GB", color: "Azul", precio: 549, condicion: "Excelente", stock: 12, descripcion: "iPhone 13 reacondicionado, batería al 90%." },
    { nombre: "iPhone 12", marca: "Apple", modelo: "A2403", almacenamiento: "64GB", color: "Negro", precio: 399, condicion: "Muy bueno", stock: 8, descripcion: "iPhone 12 en muy buen estado, incluye cargador." },
    { nombre: "iPhone 15 Pro", marca: "Apple", modelo: "A3102", almacenamiento: "256GB", color: "Titanio natural", precio: 999, condicion: "Como nuevo", stock: 5, descripcion: "iPhone 15 Pro con garantía de 12 meses." },
    { nombre: "Galaxy S23", marca: "Samsung", modelo: "SM-S911B", almacenamiento: "256GB", color: "Crema", precio: 649, condicion: "Excelente", stock: 10, descripcion: "Samsung Galaxy S23 reacondicionado." },
    { nombre: "Galaxy A54", marca: "Samsung", modelo: "SM-A546E", almacenamiento: "128GB", color: "Violeta", precio: 279, condicion: "Muy bueno", stock: 15, descripcion: "Gama media con excelente cámara." },
    { nombre: "Redmi Note 13", marca: "Xiaomi", modelo: "23129RAA4G", almacenamiento: "256GB", color: "Negro", precio: 199, condicion: "Como nuevo", stock: 20, descripcion: "Gran batería y pantalla AMOLED." },
    { nombre: "Moto G84", marca: "Motorola", modelo: "XT2347", almacenamiento: "256GB", color: "Azul", precio: 229, condicion: "Excelente", stock: 7, descripcion: "Motorola Moto G84 5G." },
    // Producto agotado para demostrar el control de inventario
    { nombre: "Galaxy Z Flip 5", marca: "Samsung", modelo: "SM-F731B", almacenamiento: "256GB", color: "Menta", precio: 749, condicion: "Excelente", stock: 0, descripcion: "Plegable. Actualmente agotado." },
];

const clientes = [
    { nombre: "Ana", Apellido: "Martínez", correo: "ana.demo@trustphone.com", telefono: "7012-3456", fechaNacimiento: "1999-04-12" },
    { nombre: "Carlos", Apellido: "López", correo: "carlos.demo@trustphone.com", telefono: "7123-4567", fechaNacimiento: "1995-09-30" },
    { nombre: "María", Apellido: "Hernández", correo: "maria.demo@trustphone.com", telefono: "7234-5678", fechaNacimiento: "2001-01-20" },
];

// [cliente, [celulares], estado]
const pedidos = [
    ["ana.demo@trustphone.com", ["iPhone 13", "Redmi Note 13"], "Entregado"],
    ["ana.demo@trustphone.com", ["Galaxy A54"], "En camino"],
    ["carlos.demo@trustphone.com", ["Galaxy S23"], "Entregado"],
    ["carlos.demo@trustphone.com", ["iPhone 13", "Moto G84"], "Entregado"],
    ["maria.demo@trustphone.com", ["iPhone 15 Pro"], "Entregado"],
    ["maria.demo@trustphone.com", ["Redmi Note 13"], "Procesando"],
];

// [cliente, celular, calificación, comentario]
const resenas = [
    ["ana.demo@trustphone.com", "iPhone 13", 5, "Llegó como nuevo y la batería dura todo el día. Muy recomendado."],
    ["ana.demo@trustphone.com", "Redmi Note 13", 4, "Excelente relación calidad-precio, la pantalla se ve increíble."],
    ["carlos.demo@trustphone.com", "Galaxy S23", 5, "Rápido y la cámara es espectacular. Envío muy puntual."],
    ["carlos.demo@trustphone.com", "iPhone 13", 4, "Muy buen estado, solo tenía un pequeño rayón en el marco."],
    ["carlos.demo@trustphone.com", "Moto G84", 3, "Cumple bien, aunque esperaba un poco más de rendimiento."],
    ["maria.demo@trustphone.com", "iPhone 15 Pro", 5, "Impecable, parece nuevo. La garantía me dio mucha confianza."],
];

const run = async () => {
    await mongoose.connect(config.db.URI);
    console.log("Conectado a la base de datos");

    // Marcas
    const marcaIds = {};
    for (const name of marcas) {
        const marca = await MarcasModel.findOneAndUpdate(
            { name },
            { $setOnInsert: { name } },
            { upsert: true, returnDocument: "after" }
        );
        marcaIds[name] = marca._id;
    }

    // Celulares
    const celularIds = {};
    const celularDocs = {};
    for (const c of celulares) {
        const { marca, ...datos } = c;
        const doc = await CelularesModel.findOneAndUpdate(
            { nombre: c.nombre, modelo: c.modelo },
            { $setOnInsert: { ...datos, idMarca: marcaIds[marca], estado: "Disponible", fechaAgregado: new Date(), imagen: "" } },
            { upsert: true, returnDocument: "after" }
        );
        celularIds[c.nombre] = doc._id;
        celularDocs[c.nombre] = doc;
    }

    // Clientes
    const passwordHash = await bcryptjs.hash(PASSWORD_DEMO, 10);
    const clienteDocs = {};
    for (const c of clientes) {
        const doc = await ClientesModel.findOneAndUpdate(
            { correo: c.correo },
            {
                $setOnInsert: {
                    ...c,
                    fecha_nacimiento: c.fechaNacimiento,
                    contrasena: passwordHash,
                    estado: "Activo",
                    isVerified: true,
                    loginAttemps: 0,
                    fotoPerfil: "",
                    public_id: "",
                },
            },
            { upsert: true, returnDocument: "after" }
        );
        clienteDocs[c.correo] = doc;
    }

    // Pedidos (solo si el cliente demo aún no tiene pedidos)
    let pedidosCreados = 0;
    for (const [correo, items, estado] of pedidos) {
        const cliente = clienteDocs[correo];
        const yaExiste = await PedidosModel.exists({
            cliente: cliente._id,
            "articulos.nombre": { $all: items },
            estado,
        });
        if (yaExiste) continue;

        const articulos = items.map((nombre) => {
            const cel = celularDocs[nombre];
            return {
                idCelular: cel._id,
                nombre: cel.nombre,
                modelo: cel.modelo,
                precio: cel.precio,
                cantidad: 1,
                imagen: cel.imagen || "",
                color: cel.color,
                condicion: cel.condicion,
            };
        });
        const subtotal = articulos.reduce((t, a) => t + a.precio * a.cantidad, 0);
        const iva = Number((subtotal * 0.13).toFixed(2));
        const mensajes = {
            Entregado: "Tu pedido fue entregado",
            "En camino": "Tu pedido va en camino",
            Procesando: "Estamos preparando tu pedido",
        };

        await PedidosModel.create({
            numeroOrden: `SV-${Math.floor(10000 + Math.random() * 90000)}`,
            cliente: cliente._id,
            clienteNombre: `${cliente.nombre} ${cliente.Apellido}`,
            clienteCorreo: cliente.correo,
            clienteTelefono: cliente.telefono,
            articulos,
            metodoPago: {
                tipo: "Tarjeta de Débito",
                ultimos4: "4242",
                marcaTarjeta: "VISA",
                fechaExpiracion: "12/29",
                transaccionId: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
            },
            totales: { subtotal, costoEnvio: 0, iva, total: Number((subtotal + iva).toFixed(2)) },
            estado,
            estadoMensaje: mensajes[estado],
            fechaEstimada: estado === "Entregado" ? "Entregado" : "24 a 48 hrs hábiles",
            fechaOrden: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
        });
        pedidosCreados++;
    }

    // Reseñas
    let resenasCreadas = 0;
    for (const [correo, nombreCel, calificacion, comentario] of resenas) {
        const r = await ResenasModel.updateOne(
            { idCelular: celularIds[nombreCel], idCliente: clienteDocs[correo]._id },
            { $setOnInsert: { calificacion, comentario, fechaResena: new Date() } },
            { upsert: true }
        );
        if (r.upsertedCount) resenasCreadas++;
    }

    console.log(`Marcas: ${marcas.length}, Celulares: ${celulares.length}, Clientes demo: ${clientes.length}`);
    console.log(`Pedidos nuevos: ${pedidosCreados}, Reseñas nuevas: ${resenasCreadas}`);
    console.log(`Cuentas demo: ${clientes.map((c) => c.correo).join(", ")} (contraseña en seed.js)`);

    await mongoose.disconnect();
};

run().catch(async (error) => {
    console.log("Error en el seed:", error);
    await mongoose.disconnect();
    process.exit(1);
});
