import Pedidos from '../Models/Pedidos.js';
import Celulares from '../Models/Celulares.js';

// Generar número de orden único con prefijo SV- (ej. SV-98245)
const generarNumeroOrden = () => {
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `SV-${randomDigits}`;
};

// Generar ID de transacción bancaria (ej. TX-773910)
const generarTransaccionId = () => {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `TX-${randomDigits}`;
};

export const crearPedido = async (req, res) => {
  try {
    const {
      cliente,
      clienteNombre,
      clienteCorreo,
      clienteTelefono,
      direccionEntrega,
      articulos,
      metodoPago,
      totales,
    } = req.body;

    if (!articulos || !Array.isArray(articulos) || articulos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debes incluir al menos un artículo en el pedido.',
      });
    }

    if (!totales || typeof totales.total !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Los totales del pedido son requeridos.',
      });
    }

    // ─── SEGURIDAD / CUMPLIMIENTO LEGAL (PCI-DSS) ───────────────────────────────
    // Extraer solo los últimos 4 dígitos. Bajo NINGUNA circunstancia se almacena el CVV.
    let ultimos4 = '0000';
    if (metodoPago?.ultimos4) {
      ultimos4 = String(metodoPago.ultimos4).slice(-4);
    } else if (metodoPago?.numeroTarjeta) {
      const cleanNum = String(metodoPago.numeroTarjeta).replace(/\D/g, '');
      ultimos4 = cleanNum.slice(-4) || '0000';
    }

    const marcaTarjeta = metodoPago?.marcaTarjeta || (
      (metodoPago?.numeroTarjeta && String(metodoPago.numeroTarjeta).startsWith('4')) ? 'VISA' : 'MasterCard'
    );

    const transaccionId = metodoPago?.transaccionId || generarTransaccionId();

    const metodoPagoSeguro = {
      tipo: metodoPago?.tipo || 'Tarjeta de Débito',
      bancoRed: metodoPago?.bancoRed || 'Banco Agrícola, BAC Credomatic, Banco Cuscatlán y redes locales',
      ultimos4,
      marcaTarjeta,
      fechaExpiracion: metodoPago?.fechaExpiracion || '',
      transaccionId,
      estadoCobro: 'Cobro Aprobado',
      // CVV/CVC es explícitamente omitido
    };

    // Generar número de orden único
    let numeroOrden = generarNumeroOrden();
    let existeOrden = await Pedidos.findOne({ numeroOrden });
    while (existeOrden) {
      numeroOrden = generarNumeroOrden();
      existeOrden = await Pedidos.findOne({ numeroOrden });
    }

    // Mapear artículos con valores consistentes
    const articulosMapeados = articulos.map((item) => ({
      idCelular: item.idCelular || item._id || item.id || null,
      nombre: item.nombre || item.name || item.modelo || 'Celular Trustphone',
      modelo: item.modelo || item.name || '',
      precio: Number(item.precio || item.price || 0),
      cantidad: Number(item.cantidad || item.quantity || 1),
      imagen: item.imagen || item.imageUrl || item.foto || '',
      color: item.color || 'Estándar',
      condicion: item.condicion || item.estado || 'Excelente',
      garantia: item.garantia || 'Garantía 12 meses',
    }));

    const nuevoPedido = new Pedidos({
      numeroOrden,
      cliente: cliente || null,
      clienteNombre: clienteNombre || 'Cliente Trustphone',
      clienteCorreo: clienteCorreo || '',
      clienteTelefono: clienteTelefono || '',
      direccionEntrega: {
        titulo: direccionEntrega?.titulo || 'Colonia Escalón, San Salvador',
        direccion: direccionEntrega?.direccion || 'Avenida Masferrer Norte #340, San Salvador, El Salvador',
        departamento: direccionEntrega?.departamento || 'San Salvador',
        tipoEnvio: direccionEntrega?.tipoEnvio || 'Envío Express El Salvador',
      },
      articulos: articulosMapeados,
      metodoPago: metodoPagoSeguro,
      totales: {
        subtotal: Number(totales.subtotal || totales.total),
        costoEnvio: Number(totales.costoEnvio || 0),
        iva: Number(totales.iva || 0),
        total: Number(totales.total),
      },
      estado: 'Procesando',
      estadoMensaje: 'Estamos preparando tu pedido',
      fechaEstimada: '24 a 48 hrs hábiles',
      fechaOrden: new Date(),
    });

    const pedidoGuardado = await nuevoPedido.save();

    // Actualizar stock de celulares de forma reactiva si tienen ID
    for (const item of articulosMapeados) {
      if (item.idCelular) {
        try {
          await Celulares.findByIdAndUpdate(item.idCelular, {
            $inc: { stock: -item.cantidad }
          });
        } catch (e) {
          // Si el ID no es de Mongoose válido, se omite sin detener el flujo
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Pedido creado y procesado con éxito.',
      pedido: pedidoGuardado,
    });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar el pedido en el servidor.',
      error: error.message,
    });
  }
};

export const obtenerPedidos = async (req, res) => {
  try {
    const { clienteId, correo, estado } = req.query;
    const filtro = {};

    if (clienteId) {
      filtro.cliente = clienteId;
    }
    if (correo) {
      filtro.clienteCorreo = correo;
    }
    if (estado && estado !== 'Todos') {
      filtro.estado = estado;
    }

    // Ordenar de más reciente a más antiguo
    const pedidos = await Pedidos.find(filtro).sort({ fechaOrden: -1 });

    return res.status(200).json({
      success: true,
      count: pedidos.length,
      pedidos,
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de pedidos.',
      error: error.message,
    });
  }
};

export const obtenerPedidoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    let pedido = null;

    if (id.startsWith('SV-')) {
      pedido = await Pedidos.findOne({ numeroOrden: id });
    } else {
      pedido = await Pedidos.findById(id);
    }

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado.',
      });
    }

    return res.status(200).json({
      success: true,
      pedido,
    });
  } catch (error) {
    console.error('Error al obtener pedido por ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el pedido.',
      error: error.message,
    });
  }
};

export const cancelarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Pedidos.findById(id);

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado.',
      });
    }

    if (pedido.estado !== 'Procesando') {
      return res.status(400).json({
        success: false,
        message: `No se puede cancelar un pedido con estado "${pedido.estado}".`,
      });
    }

    pedido.estado = 'Cancelado';
    pedido.estadoMensaje = 'Pedido cancelado por el usuario';
    await pedido.save();

    return res.status(200).json({
      success: true,
      message: 'Pedido cancelado exitosamente.',
      pedido,
    });
  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cancelar el pedido.',
      error: error.message,
    });
  }
};

export const actualizarEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, estadoMensaje, fechaEstimada } = req.body;

    const pedido = await Pedidos.findById(id);
    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado.',
      });
    }

    if (estado) pedido.estado = estado;
    if (estadoMensaje) pedido.estadoMensaje = estadoMensaje;
    if (fechaEstimada) pedido.fechaEstimada = fechaEstimada;

    await pedido.save();

    return res.status(200).json({
      success: true,
      message: 'Estado del pedido actualizado.',
      pedido,
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del pedido.',
      error: error.message,
    });
  }
};
