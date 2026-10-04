import mongoose, { Schema, model } from 'mongoose';

const ArticuloSchema = new Schema({
  idCelular: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Celulares',
  },
  nombre: {
    type: String,
    required: true,
  },
  modelo: {
    type: String,
  },
  precio: {
    type: Number,
    required: true,
  },
  cantidad: {
    type: Number,
    required: true,
    default: 1,
  },
  imagen: {
    type: String,
  },
  color: {
    type: String,
    default: 'Estándar',
  },
  condicion: {
    type: String,
    default: 'Excelente',
  },
  garantia: {
    type: String,
    default: 'Garantía 12 meses',
  },
}, { _id: false });

const PedidosSchema = new Schema({
  numeroOrden: {
    type: String,
    required: true,
    unique: true,
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clientes',
    required: false,
  },
  clienteNombre: {
    type: String,
    default: 'Cliente Trustphone',
  },
  clienteCorreo: {
    type: String,
    default: '',
  },
  clienteTelefono: {
    type: String,
    default: '',
  },
  direccionEntrega: {
    titulo: {
      type: String,
      default: 'Colonia Escalón, San Salvador',
    },
    direccion: {
      type: String,
      default: 'Avenida Masferrer Norte #340, San Salvador, El Salvador',
    },
    departamento: {
      type: String,
      default: 'San Salvador',
    },
    tipoEnvio: {
      type: String,
      default: 'Envío Express El Salvador',
    },
  },
  articulos: {
    type: [ArticuloSchema],
    required: true,
    validate: [arr => arr.length > 0, 'El pedido debe tener al menos un artículo.'],
  },
  metodoPago: {
    tipo: {
      type: String,
      enum: ['Tarjeta de Débito', 'Tarjeta de Crédito'],
      default: 'Tarjeta de Débito',
    },
    bancoRed: {
      type: String,
      default: 'Banco Agrícola, BAC Credomatic, Banco Cuscatlán y redes locales',
    },
    ultimos4: {
      type: String,
      required: true,
    },
    marcaTarjeta: {
      type: String,
      default: 'VISA',
    },
    fechaExpiracion: {
      type: String,
      default: '',
    },
    // AVISO LEGAL Y DE SEGURIDAD (PCI-DSS):
    // El CVV/CVC NO se almacena bajo ninguna circunstancia.
    transaccionId: {
      type: String,
      required: true,
    },
    estadoCobro: {
      type: String,
      default: 'Cobro Aprobado',
    },
  },
  totales: {
    subtotal: {
      type: Number,
      required: true,
    },
    costoEnvio: {
      type: Number,
      default: 0,
    },
    iva: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
  },
  estado: {
    type: String,
    enum: ['Procesando', 'En camino', 'Entregado', 'Cancelado'],
    default: 'Procesando',
  },
  estadoMensaje: {
    type: String,
    default: 'Estamos preparando tu pedido',
  },
  fechaEstimada: {
    type: String,
    default: '24 a 48 hrs hábiles',
  },
  fechaOrden: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default model('Pedidos', PedidosSchema);
