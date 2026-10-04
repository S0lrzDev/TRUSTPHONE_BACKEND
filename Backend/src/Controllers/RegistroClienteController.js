import { sendEmail } from "../utils/sendMailMailjet.js";
import HTMLVerificarCorreo from "../utils/enviarCorreoVerificacion.js";
import crypto from "crypto";
import jsonwebtoken from "jsonwebtoken";
import bcryptjs from "bcryptjs";

import ClienteModel from "../Models/Clientes.js";
import { config } from "../../config.js";
import { camposVacios, correoValido, validarEdad, telefonoValido } from "../utils/validaciones.js";

const RegistroClienteController = {};

// REGISTRAR CLIENTE
RegistroClienteController.registerCliente = async (req, res) => {
    try {

        const {
            nombre,
            Apellido,
            correo,
            contrasena,
            telefono,
            estado,
            loginAttemps,
            timeOut
        } = req.body;

        const fechaNacimiento = req.body.fechaNacimiento || req.body.fecha_nacimiento;

        // Validar campos vacíos
        const faltantes = camposVacios(
            { nombre, Apellido, correo, contrasena, telefono, fechaNacimiento },
            ["nombre", "Apellido", "correo", "contrasena", "telefono", "fechaNacimiento"]
        );
        if (faltantes.length > 0) {
            return res.status(400).json({
                message: "Faltan campos obligatorios: " + faltantes.join(", ")
            });
        }

        // Validar formato de correo
        if (!correoValido(correo)) {
            return res.status(400).json({
                message: "El formato del correo electrónico no es válido"
            });
        }

        // Validar edad
        const errorEdad = validarEdad(fechaNacimiento);
        if (errorEdad) {
            return res.status(400).json({
                message: errorEdad
            });
        }

        // Validar teléfono
        if (!telefonoValido(telefono)) {
            return res.status(400).json({
                message: "El teléfono debe tener entre 8 y 15 dígitos"
            });
        }

        // Validar contraseña
        if (String(contrasena).length < 8) {
            return res.status(400).json({
                message: "La contraseña debe tener al menos 8 caracteres"
            });
        }

        // Verificar si el correo ya existe
        const existCliente = await ClienteModel.findOne({ correo });

        if (existCliente) {
            return res.status(400).json({
                message: "El correo ya está registrado"
            });
        }

        // Encriptar contraseña
        const passwordHash = await bcryptjs.hash(contrasena, 10);

        // Generar código de verificación
        const verificationCode = crypto.randomBytes(3).toString("hex");

        // Datos de Cloudinary
        let fotoPerfil = "";
        let public_id = "";

        if (req.file) {
            fotoPerfil = req.file.path;
            public_id = req.file.filename;
        }

        // Crear token temporal
        const tokenCode = jsonwebtoken.sign(
            {
                nombre,
                Apellido,
                correo,
                contrasena: passwordHash,
                telefono,
                estado,
                fechaNacimiento,
                fotoPerfil,
                public_id,
                isVerified: false,
                loginAttemps: loginAttemps || 0,
                timeOut,
                verificationCode
            },
            config.JWT.secret,
            {
                expiresIn: "15m"
            }
        );

        // Guardar cookie
        res.cookie("VerificationToken", tokenCode, {
            maxAge: 15 * 60 * 1000,
            httpOnly: true
        });

        // Configurar correo
        try {
            await sendEmail(
                correo,
                "Código de Verificación",
                HTMLVerificarCorreo(verificationCode),
                "Para verificar tu cuenta utiliza este código: " +
                    verificationCode +
                    ". Expira en 15 minutos."
            );
        } catch (error) {
            return res.status(500).json({
                message: "Error al enviar el correo"
            });
        }

        return res.status(200).json({
            message: "Usuario registrado, verifica tu correo",
            token: tokenCode
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Error interno del servidor"
        });

    }
};

// VERIFICAR CÓDIGO
RegistroClienteController.verifyCode = async (req, res) => {

    try {

        const { verificationCodeRequest } = req.body;

        let token = req.cookies?.VerificationToken || req.body?.token;

        if (!token) {
            return res.status(400).json({
                message: "No se encontró el token de verificación"
            });
        }

        if (typeof token === 'string') {
            if (token.includes(',')) {
                token = token.split(',')[0].trim();
            }
            if (token.includes(';')) {
                token = token.split(';')[0].trim();
            }
            token = token.replace(/^VerificationToken=/, '').trim();
        }

        const decoded = jsonwebtoken.verify(
            token,
            config.JWT.secret
        );

        const {
            nombre,
            Apellido,
            correo,
            contrasena,
            telefono,
            estado,
            fechaNacimiento,
            fotoPerfil,
            public_id,
            loginAttemps,
            timeOut,
            verificationCode: storedCode
        } = decoded;

        // Validar que se haya enviado un código
        if (!verificationCodeRequest) {
            return res.status(400).json({
                message: "Debe ingresar el código de verificación"
            });
        }

        // Comparar códigos
        if (
            verificationCodeRequest.trim().toLowerCase() !==
            storedCode.toLowerCase()
        ) {
            return res.status(400).json({
                message: "Código de verificación inválido"
            });
        }

        // Crear cliente
        const newCliente = new ClienteModel({
            nombre,
            Apellido,
            correo,
            contrasena,
            telefono,
            estado,
            fechaNacimiento,
            fecha_nacimiento: fechaNacimiento,
            fotoPerfil,
            public_id,
            isVerified: true,
            loginAttemps,
            timeOut
        });

        await newCliente.save();

        // Eliminar cookie
        res.clearCookie("VerificationToken");

        return res.status(200).json({
            message: "Cuenta verificada correctamente"
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Error interno del servidor"
        });

    }
};

export default RegistroClienteController;