import mongoose, { Schema, model } from 'mongoose';

const MetodosPagoSchema = new Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clientes',
    required: true,
  },
  tipo: {
    type: String,
    enum: ['Tarjeta de Débito', 'Tarjeta de Crédito'],
    default: 'Tarjeta de Débito',
    required: true,
  },
  titular: {
    type: String,
    required: true,
    trim: true,
  },
  marca: {
    type: String,
    enum: ['VISA', 'MasterCard', 'American Express', 'Otra'],
    default: 'VISA',
  },
  // AVISO LEGAL Y DE SEGURIDAD (PCI-DSS):
  // Solo se guardan los últimos 4 dígitos. NUNCA el número completo ni CVV/CVC.
  ultimos4: {
    type: String,
    required: true,
    trim: true,
  },
  fechaExpiracion: {
    type: String,
    required: true,
    trim: true,
  },
  banco: {
    type: String,
    default: '',
    trim: true,
  },
  esPredeterminado: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default model('MetodosPago', MetodosPagoSchema);
