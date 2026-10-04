import DireccionesModel from "../Models/Direcciones.js";

const DireccionesController = {};

// CREAR NUEVA DIRECCIÓN
DireccionesController.crearDireccion = async (req, res) => {
    try {
        const {
            cliente,
            titulo,
            nombreDestinatario,
            telefono,
            direccion,
            colonia,
            ciudad,
            departamento,
            codigoPostal,
            referencia,
            esPrincipal,
        } = req.body;

        if (!cliente || !nombreDestinatario || !telefono || !direccion || !ciudad || !departamento) {
            return res.status(400).json({
                message: "Faltan campos obligatorios (cliente, nombreDestinatario, telefono, direccion, ciudad, departamento)."
            });
        }

        // Si la nueva dirección es principal, desmarcar las demás del mismo cliente
        if (esPrincipal) {
            await DireccionesModel.updateMany(
                { cliente, esPrincipal: true },
                { esPrincipal: false }
            );
        }

        // Si es la primera dirección del cliente, marcarla como principal automáticamente
        const totalDirecciones = await DireccionesModel.countDocuments({ cliente });
        const marcarPrincipal = totalDirecciones === 0 ? true : (esPrincipal || false);

        const nuevaDireccion = new DireccionesModel({
            cliente,
            titulo: titulo || 'Casa',
            nombreDestinatario,
            telefono,
            direccion,
            colonia: colonia || '',
            ciudad,
            departamento,
            codigoPostal: codigoPostal || '',
            referencia: referencia || '',
            esPrincipal: marcarPrincipal,
        });

        const direccionGuardada = await nuevaDireccion.save();

        return res.status(201).json({
            success: true,
            message: "Dirección creada correctamente",
            direccion: direccionGuardada,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error Interno Del Servidor"
        });
    }
};

// OBTENER DIRECCIONES DE UN CLIENTE
DireccionesController.obtenerDirecciones = async (req, res) => {
    try {
        const { clienteId } = req.query;

        if (!clienteId) {
            return res.status(400).json({
                message: "Se requiere el parámetro clienteId."
            });
        }

        const direcciones = await DireccionesModel.find({ cliente: clienteId })
            .sort({ esPrincipal: -1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            direcciones,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error Interno Del Servidor"
        });
    }
};

// ACTUALIZAR DIRECCIÓN
DireccionesController.actualizarDireccion = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            titulo,
            nombreDestinatario,
            telefono,
            direccion,
            colonia,
            ciudad,
            departamento,
            codigoPostal,
            referencia,
            esPrincipal,
        } = req.body;

        const direccionExistente = await DireccionesModel.findById(id);

        if (!direccionExistente) {
            return res.status(404).json({
                message: "Dirección no encontrada"
            });
        }

        // Si se marca como principal, desmarcar las demás del mismo cliente
        if (esPrincipal && !direccionExistente.esPrincipal) {
            await DireccionesModel.updateMany(
                { cliente: direccionExistente.cliente, esPrincipal: true },
                { esPrincipal: false }
            );
        }

        const direccionActualizada = await DireccionesModel.findByIdAndUpdate(
            id,
            {
                titulo,
                nombreDestinatario,
                telefono,
                direccion,
                colonia,
                ciudad,
                departamento,
                codigoPostal,
                referencia,
                esPrincipal,
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Dirección actualizada correctamente",
            direccion: direccionActualizada,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error Interno Del Servidor"
        });
    }
};

// ELIMINAR DIRECCIÓN
DireccionesController.eliminarDireccion = async (req, res) => {
    try {
        const { id } = req.params;

        const direccion = await DireccionesModel.findById(id);

        if (!direccion) {
            return res.status(404).json({
                message: "Dirección no encontrada"
            });
        }

        const clienteId = direccion.cliente;
        const eraPrincipal = direccion.esPrincipal;

        await DireccionesModel.findByIdAndDelete(id);

        // Si se eliminó la principal, asignar la más reciente como nueva principal
        if (eraPrincipal) {
            const siguiente = await DireccionesModel.findOne({ cliente: clienteId })
                .sort({ createdAt: -1 });
            if (siguiente) {
                siguiente.esPrincipal = true;
                await siguiente.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: "Dirección eliminada correctamente",
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error Interno Del Servidor"
        });
    }
};

export default DireccionesController;
