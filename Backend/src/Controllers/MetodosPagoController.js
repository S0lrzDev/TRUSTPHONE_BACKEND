import MetodosPagoModel from '../Models/MetodosPago.js';

const MetodosPagoController = {};

// CREAR NUEVO MÉTODO DE PAGO
MetodosPagoController.crearMetodoPago = async (req, res) => {
  try {
    const {
      cliente,
      tipo,
      titular,
      marca,
      ultimos4,
      fechaExpiracion,
      banco,
      esPredeterminado,
    } = req.body;

    if (!cliente || !titular || !ultimos4 || !fechaExpiracion) {
      return res.status(400).json({
        message: 'Faltan campos obligatorios (cliente, titular, ultimos4, fechaExpiracion).',
      });
    }

    // Si se marca como predeterminado, desmarcar los demás del cliente
    if (esPredeterminado) {
      await MetodosPagoModel.updateMany(
        { cliente, esPredeterminado: true },
        { esPredeterminado: false }
      );
    }

    // Si es el primer método del cliente, marcarlo predeterminado automáticamente
    const totalMetodos = await MetodosPagoModel.countDocuments({ cliente });
    const marcarPredeterminado = totalMetodos === 0 ? true : (esPredeterminado || false);

    const nuevoMetodo = new MetodosPagoModel({
      cliente,
      tipo: tipo || 'Tarjeta de Débito',
      titular: titular.trim(),
      marca: marca || 'VISA',
      ultimos4: String(ultimos4).slice(-4),
      fechaExpiracion: fechaExpiracion.trim(),
      banco: banco ? banco.trim() : '',
      esPredeterminado: marcarPredeterminado,
    });

    const metodoGuardado = await nuevoMetodo.save();

    return res.status(201).json({
      success: true,
      message: 'Método de pago guardado correctamente',
      metodoPago: metodoGuardado,
    });
  } catch (error) {
    console.error('Error al crear método de pago:', error);
    return res.status(500).json({
      message: 'Error Interno Del Servidor',
    });
  }
};

// OBTENER MÉTODOS DE PAGO DE UN CLIENTE
MetodosPagoController.obtenerMetodosPago = async (req, res) => {
  try {
    const { clienteId } = req.query;

    if (!clienteId) {
      return res.status(400).json({
        message: 'Se requiere el parámetro clienteId.',
      });
    }

    const metodos = await MetodosPagoModel.find({ cliente: clienteId })
      .sort({ esPredeterminado: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      metodosPago: metodos,
    });
  } catch (error) {
    console.error('Error al obtener métodos de pago:', error);
    return res.status(500).json({
      message: 'Error Interno Del Servidor',
    });
  }
};

// ACTUALIZAR MÉTODO DE PAGO
MetodosPagoController.actualizarMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipo,
      titular,
      marca,
      fechaExpiracion,
      banco,
      esPredeterminado,
    } = req.body;

    const metodoExistente = await MetodosPagoModel.findById(id);
    if (!metodoExistente) {
      return res.status(404).json({
        message: 'Método de pago no encontrado',
      });
    }

    if (esPredeterminado && !metodoExistente.esPredeterminado) {
      await MetodosPagoModel.updateMany(
        { cliente: metodoExistente.cliente, esPredeterminado: true },
        { esPredeterminado: false }
      );
    }

    const metodoActualizado = await MetodosPagoModel.findByIdAndUpdate(
      id,
      {
        tipo,
        titular,
        marca,
        fechaExpiracion,
        banco,
        esPredeterminado,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Método de pago actualizado correctamente',
      metodoPago: metodoActualizado,
    });
  } catch (error) {
    console.error('Error al actualizar método de pago:', error);
    return res.status(500).json({
      message: 'Error Interno Del Servidor',
    });
  }
};

// ELIMINAR MÉTODO DE PAGO
MetodosPagoController.eliminarMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;

    const metodo = await MetodosPagoModel.findById(id);
    if (!metodo) {
      return res.status(404).json({
        message: 'Método de pago no encontrado',
      });
    }

    const clienteId = metodo.cliente;
    const eraPredeterminado = metodo.esPredeterminado;

    await MetodosPagoModel.findByIdAndDelete(id);

    // Si se eliminó el predeterminado, asignar el más reciente restante
    if (eraPredeterminado) {
      const siguiente = await MetodosPagoModel.findOne({ cliente: clienteId })
        .sort({ createdAt: -1 });
      if (siguiente) {
        siguiente.esPredeterminado = true;
        await siguiente.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Método de pago eliminado correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar método de pago:', error);
    return res.status(500).json({
      message: 'Error Interno Del Servidor',
    });
  }
};

export default MetodosPagoController;
