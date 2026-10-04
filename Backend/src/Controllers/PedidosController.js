import Pedidos from '../Models/Pedidos.js';
import Celulares from '../Models/Celulares.js';
import { esNumeroNoNegativo, esEnteroPositivo, idValido, correoValido } from '../utils/validaciones.js';

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

    // Ningún total puede ser negativo
    const camposTotales = ['subtotal', 'costoEnvio', 'iva', 'total'];
    for (const campo of camposTotales) {
      if (totales[campo] !== undefined && !esNumeroNoNegativo(totales[campo])) {
        return res.status(400).json({
          success: false,
          message: `El campo ${campo} no puede ser negativo.`,
        });
      }
    }

    if (clienteCorreo && !correoValido(clienteCorreo)) {
      return res.status(400).json({
        success: false,
        message: 'El correo del cliente no es válido.',
      });
    }

    // ─── CONTROL DE INVENTARIO ──────────────────────────────────────────────────
    // Se valida cada artículo ANTES de guardar: cantidad positiva y stock suficiente.
    const cantidadesPorCelular = {};
    for (const item of articulos) {
      const idCelular = item.idCelular || item._id || item.id;
      const cantidad = item.cantidad ?? item.quantity ?? 1;

      if (!esEnteroPositivo(cantidad)) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad de cada artículo debe ser un número entero mayor a 0.',
        });
      }
      if (!idCelular || !idValido(idCelular)) {
        return res.status(400).json({
          success: false,
          message: 'Cada artículo debe incluir un idCelular válido.',
        });
      }
      cantidadesPorCelular[idCelular] = (cantidadesPorCelular[idCelular] || 0) + Number(cantidad);
    }

    for (const [idCelular, cantidad] of Object.entries(cantidadesPorCelular)) {
      const celular = await Celulares.findById(idCelular);
      if (!celular) {
        return res.status(404).json({
          success: false,
          message: 'Uno de los productos del carrito ya no existe.',
        });
      }
      const stockDisponible = Number(celular.stock || 0);
      if (stockDisponible <= 0) {
        return res.status(400).json({
          success: false,
          message: `El producto "${celular.nombre}" está agotado.`,
        });
      }
      if (cantidad > stockDisponible) {
        return res.status(400).json({
          success: false,
          message: `Solo hay ${stockDisponible} unidad(es) disponibles de "${celular.nombre}".`,
        });
      }
    }

    // Descontar stock de forma atómica (solo si sigue habiendo suficiente)
    const descontados = [];
    for (const [idCelular, cantidad] of Object.entries(cantidadesPorCelular)) {
      const actualizado = await Celulares.findOneAndUpdate(
        { _id: idCelular, stock: { $gte: cantidad } },
        { $inc: { stock: -cantidad } }
      );
      if (!actualizado) {
        // Otro cliente compró al mismo tiempo: revertir lo ya descontado
        for (const d of descontados) {
          await Celulares.findByIdAndUpdate(d.idCelular, { $inc: { stock: d.cantidad } });
        }
        return res.status(400).json({
          success: false,
          message: 'Stock insuficiente para completar el pedido, intenta de nuevo.',
        });
      }
      descontados.push({ idCelular, cantidad });
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

    let pedidoGuardado;
    try {
      pedidoGuardado = await nuevoPedido.save();
    } catch (error) {
      // Si el pedido no se guardó, devolver el stock descontado
      for (const d of descontados) {
        await Celulares.findByIdAndUpdate(d.idCelular, { $inc: { stock: d.cantidad } });
      }
      throw error;
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

    // Devolver al inventario las unidades del pedido cancelado
    for (const item of pedido.articulos) {
      if (item.idCelular) {
        await Celulares.findByIdAndUpdate(item.idCelular, {
          $inc: { stock: item.cantidad }
        });
      }
    }

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

    const estadosValidos = ['Procesando', 'En camino', 'Entregado', 'Cancelado'];
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}.`,
      });
    }

    // Si se cancela desde aquí, devolver el stock (solo la primera vez)
    if (estado === 'Cancelado' && pedido.estado !== 'Cancelado') {
      for (const item of pedido.articulos) {
        if (item.idCelular) {
          await Celulares.findByIdAndUpdate(item.idCelular, {
            $inc: { stock: item.cantidad }
          });
        }
      }
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
