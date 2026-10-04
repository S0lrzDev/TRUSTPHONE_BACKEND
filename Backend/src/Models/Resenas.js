import mongoose, { Schema, model } from 'mongoose';

const ResenasSchema = new Schema({
    idCelular: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Celulares',
        required: true,
    },
    idCliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clientes',
        required: true,
    },
    calificacion: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comentario: {
        type: String,
        required: true,
        trim: true,
    },
    fechaResena: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Un cliente solo puede tener una reseña por celular
ResenasSchema.index({ idCelular: 1, idCliente: 1 }, { unique: true });

export default model('Resenas', ResenasSchema);
