import {Schema, model} from 'mongoose';

const ClientesSchema = new Schema({
    nombre: {
        type: String
    },
    Apellido: {
        type: String
    },
    correo: {
        type: String
    },
    contrasena: {
        type: String
    },
    telefono: {
        type: String
    },
    estado: {
        type: String
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    },
    fecha_nacimiento: {
        type: String
    },
    fechaNacimiento: {
        type: String
    },
    fotoPerfil:{
        type: String
    },
    public_id: {
        type: String
    },
    isVerified: {
        type: Boolean,
    },
    loginAttemps: {
        type: Number,
    }, 
    timeOut: {
        type: Date,
    },
    verificationCode: {
        type: String,
    }
},{
    timestamps: true,
    strict: false
})

export default model('Clientes', ClientesSchema)