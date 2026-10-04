import mongoose from "mongoose";
import ResenasModel from "../Models/Resenas.js";
import CelularesModel from "../Models/Celulares.js";
import ClientesModel from "../Models/Clientes.js";
import PedidosModel from "../Models/Pedidos.js";
import { idValido, estaVacio } from "../utils/validaciones.js";

const ResenasController = {};

// Valida calificación (entero 1-5) y comentario (3-500 caracteres)
const validarResena = (calificacion, comentario) => {
    const cal = Number(calificacion);
    if (estaVacio(calificacion) || !Number.isInteger(cal) || cal < 1 || cal > 5) {
        return "La calificación debe ser un número entero entre 1 y 5";
    }
    if (estaVacio(comentario)) {
        return "El comentario no puede estar vacío";
    }
    const texto = String(comentario).trim();
    if (texto.length < 3 || texto.length > 500) {
        return "El comentario debe tener entre 3 y 500 caracteres";
    }
    return null;
};

// OBTENER RESEÑAS (filtrar por ?idCelular= o ?idCliente=)
ResenasController.getResenas = async (req, res) => {
    try {
        const { idCelular, idCliente } = req.query;
        const filtro = {};

        if (idCelular) {
            if (!idValido(idCelular)) {
                return res.status(400).json({ message: "ID de celular inválido" });
            }
            filtro.idCelular = idCelular;
        }
        if (idCliente) {
            if (!idValido(idCliente)) {
                return res.status(400).json({ message: "ID de cliente inválido" });
            }
            filtro.idCliente = idCliente;
        }

        const resenas = await ResenasModel.find(filtro)
            .populate("idCliente", "nombre Apellido fotoPerfil")
            .populate("idCelular", "nombre modelo imagen")
            .sort({ fechaResena: -1 });

        return res.status(200).json(resenas);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error Interno Del Servidor" });
    }
};

// RESUMEN DE VALORACIONES DE UN CELULAR (promedio y total)
ResenasController.getResumenCelular = async (req, res) => {
    try {
        const { idCelular } = req.params;

        if (!idValido(idCelular)) {
            return res.status(400).json({ message: "ID de celular inválido" });
        }

        const [resumen] = await ResenasModel.aggregate([
            { $match: { idCelular: new mongoose.Types.ObjectId(idCelular) } },
            {
                $group: {
                    _id: "$idCelular",
                    promedio: { $avg: "$calificacion" },
                    total: { $sum: 1 },
                },
            },
        ]);

        return res.status(200).json({
            idCelular,
            promedio: resumen ? Number(resumen.promedio.toFixed(1)) : 0,
            total: resumen ? resumen.total : 0,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error Interno Del Servidor" });
    }
};

// CREAR RESEÑA
ResenasController.insertResena = async (req, res) => {
    try {
        const { idCelular, idCliente, calificacion, comentario } = req.body;

        if (estaVacio(idCelular) || estaVacio(idCliente)) {
            return res.status(400).json({ message: "Faltan campos obligatorios (idCelular, idCliente)" });
        }
        if (!idValido(idCelular) || !idValido(idCliente)) {
            return res.status(400).json({ message: "ID de celular o cliente inválido" });
        }

        const error = validarResena(calificacion, comentario);
        if (error) {
            return res.status(400).json({ message: error });
        }

        const celular = await CelularesModel.findById(idCelular);
        if (!celular) {
            return res.status(404).json({ message: "Celular no encontrado" });
        }

        const cliente = await ClientesModel.findById(idCliente);
        if (!cliente) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }

        // Solo puede reseñar quien compró el celular (pedido no cancelado)
        const compro = await PedidosModel.exists({
            cliente: idCliente,
            estado: { $ne: "Cancelado" },
            "articulos.idCelular": idCelular,
        });
        if (!compro) {
            return res.status(403).json({ message: "Solo puedes valorar productos que hayas comprado" });
        }

        const existe = await ResenasModel.findOne({ idCelular, idCliente });
        if (existe) {
            return res.status(400).json({ message: "Ya valoraste este producto, puedes editar tu reseña" });
        }

        const nuevaResena = new ResenasModel({
            idCelular,
            idCliente,
            calificacion: Number(calificacion),
            comentario: String(comentario).trim(),
            fechaResena: new Date(),
        });

        await nuevaResena.save();

        return res.status(201).json({
            message: "Reseña guardada correctamente",
            resena: nuevaResena,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error Interno Del Servidor" });
    }
};

// ACTUALIZAR RESEÑA
ResenasController.updateResena = async (req, res) => {
    try {
        const { idCliente, calificacion, comentario } = req.body;

        if (!idValido(req.params.id)) {
            return res.status(400).json({ message: "ID de reseña inválido" });
        }

        const resena = await ResenasModel.findById(req.params.id);
        if (!resena) {
            return res.status(404).json({ message: "Reseña no encontrada" });
        }

        if (idCliente && String(resena.idCliente) !== String(idCliente)) {
            return res.status(403).json({ message: "No puedes editar la reseña de otro cliente" });
        }

        const error = validarResena(
            calificacion ?? resena.calificacion,
            comentario ?? resena.comentario
        );
        if (error) {
            return res.status(400).json({ message: error });
        }

        if (calificacion !== undefined) resena.calificacion = Number(calificacion);
        if (comentario !== undefined) resena.comentario = String(comentario).trim();
        await resena.save();

        return res.status(200).json({
            message: "Reseña actualizada correctamente",
            resena,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error Interno Del Servidor" });
    }
};

// ELIMINAR RESEÑA
ResenasController.deleteResena = async (req, res) => {
    try {
        if (!idValido(req.params.id)) {
            return res.status(400).json({ message: "ID de reseña inválido" });
        }

        const resena = await ResenasModel.findByIdAndDelete(req.params.id);
        if (!resena) {
            return res.status(404).json({ message: "Reseña no encontrada" });
        }

        return res.status(200).json({ message: "Reseña eliminada correctamente" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error Interno Del Servidor" });
    }
};

export default ResenasController;
