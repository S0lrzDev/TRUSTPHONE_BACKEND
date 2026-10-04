import mongoose, { Schema, model } from 'mongoose';

const DireccionesSchema = new Schema({
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clientes',
        required: true,
    },
    titulo: {
        type: String,
        required: true,
        default: 'Casa',
    },
    nombreDestinatario: {
        type: String,
        required: true,
    },
    telefono: {
        type: String,
        required: true,
    },
    direccion: {
        type: String,
        required: true,
    },
    colonia: {
        type: String,
        default: '',
    },
    ciudad: {
        type: String,
        required: true,
    },
    departamento: {
        type: String,
        required: true,
    },
    codigoPostal: {
        type: String,
        default: '',
    },
    referencia: {
        type: String,
        default: '',
    },
    esPrincipal: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

export default model('Direcciones', DireccionesSchema);
