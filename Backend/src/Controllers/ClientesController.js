import ClientesModel from "../Models/Clientes.js";
import { v2 as cloudinary } from "cloudinary";

const ClientesController = {};

// OBTENER TODOS LOS CLIENTES
ClientesController.getAllClientes = async (req, res) => {
    try {

        const clientes = await ClientesModel.find();

        return res.status(200).json(clientes);

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Error Interno Del Servidor"
        });
    }
};

// ELIMINAR CLIENTE
ClientesController.deleleteCliente = async (req, res) => {
    try {

        const cliente = await ClientesModel.findById(req.params.id);

        if (!cliente) {
            return res.status(404).json({
                message: "Cliente no encontrado"
            });
        }

        // Eliminar imagen de Cloudinary si existe
        if (cliente.public_id) {
            await cloudinary.uploader.destroy(cliente.public_id);
        }

        await ClientesModel.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            message: "Cliente eliminado correctamente"
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Error Interno Del Servidor"
        });
    }
};

// OBTENER CLIENTE POR ID
ClientesController.getClienteById = async (req, res) => {
    try {
        const cliente = await ClientesModel.findById(req.params.id);

        if (!cliente) {
            return res.status(404).json({
                message: "Cliente no encontrado"
            });
        }

        return res.status(200).json(cliente);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error Interno Del Servidor"
        });
    }
};

// ACTUALIZAR CLIENTE
ClientesController.updateCliente = async (req, res) => {
    try {

        let {
            nombre,
            Apellido,
            apellido,
            fecha_nacimiento,
            fechaNacimiento,
            correo,
            contrasena,
            telefono,
            estado,
            fechaRegistro,
            isVerified,
            loginAttemps,
            timeOut
        } = req.body;

        nombre = nombre?.trim();
        correo = correo?.trim();

        if (nombre && (nombre.length < 2 || nombre.length > 50)) {
            return res.status(400).json({
                message: "Nombre inválido"
            });
        }

        const cliente = await ClientesModel.findById(req.params.id);

        if (!cliente) {
            return res.status(404).json({
                message: "Cliente no encontrado"
            });
        }

        let fotoPerfil = cliente.fotoPerfil;
        let public_id = cliente.public_id;

        // Si se envía una nueva imagen
        if (req.file) {

            // Eliminar imagen anterior de Cloudinary
            if (cliente.public_id) {
                await cloudinary.uploader.destroy(cliente.public_id);
            }

            fotoPerfil = req.file.path;
            public_id = req.file.filename;
        }

        const updateData = {};
        if (nombre !== undefined && nombre !== null) updateData.nombre = nombre;
        if (Apellido !== undefined && Apellido !== null) updateData.Apellido = Apellido;
        if (apellido !== undefined && apellido !== null && !updateData.Apellido) updateData.Apellido = apellido;
        if (correo !== undefined && correo !== null) updateData.correo = correo;
        if (contrasena) updateData.contrasena = contrasena;
        if (telefono !== undefined && telefono !== null) updateData.telefono = telefono;
        if (estado !== undefined && estado !== null) updateData.estado = estado;
        if (fecha_nacimiento !== undefined && fecha_nacimiento !== null) {
            updateData.fecha_nacimiento = fecha_nacimiento;
        }
        if (fechaNacimiento !== undefined && fechaNacimiento !== null) {
            updateData.fechaNacimiento = fechaNacimiento;
            if (!updateData.fecha_nacimiento) updateData.fecha_nacimiento = fechaNacimiento;
        }
        if (fotoPerfil !== undefined && fotoPerfil !== null) updateData.fotoPerfil = fotoPerfil;
        if (public_id !== undefined && public_id !== null) updateData.public_id = public_id;
        if (isVerified !== undefined && isVerified !== null) updateData.isVerified = isVerified;
        if (loginAttemps !== undefined && loginAttemps !== null) updateData.loginAttemps = loginAttemps;
        if (timeOut !== undefined) updateData.timeOut = timeOut;

        const updatedCliente = await ClientesModel.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true
            }
        );

        return res.status(200).json({
            message: "Cliente actualizado correctamente",
            cliente: updatedCliente
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Error Interno Del Servidor"
        });
    }
};

export default ClientesController;