import { sendEmail } from '../utils/sendMailMailjet.js';
import crypto from 'crypto';
import jsonwebtoken from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import UsersModel from '../Models/Usuarios.js';

import {config} from "../../config.js"
import HTMLVerificarCorreo from "../utils/enviarCorreoVerificacion.js"

const RegistroUsuariosController = {}

RegistroUsuariosController.registerUsuario = async (req, res) => {
    
    const {
        nombre,
        email,
        contraseña,
        rol,
        estado,
        fechaRegistro,
        isVerified,
        loginAttemps,
        timeOut
    } = req.body;

    try {
        const existUsuario = await UsersModel.findOne({ email });
        if (existUsuario) {
            return res.status(400).json({ message: 'El correo ya esta registrado' });
        }

        console.log(req.body);
        console.log("contraseña:", contraseña);

        const passwordHash = await bcrypt.hash(contraseña, 10);

        const verificationCode = crypto.randomBytes(3).toString('hex');

        const tokenCode = jsonwebtoken.sign(
            {
                nombre,
                email,
                verificationCode,
                passwordHash,
                rol,
                estado,
                fechaRegistro,
                isVerified,
                loginAttemps,
                timeOut
            },
            config.JWT.secret,

            {expiresIn: '15min'}
        );

        res.cookie("VerificationToken", tokenCode, {maxAge: 15 * 60 * 1000});

        try {
            await sendEmail(email, 'Codigo de Verificacion', HTMLVerificarCorreo(verificationCode));
        } catch (error) {
            return res.status(500).json({ message: 'Error' });
        }

        res
        .status(200)
        .json({message: "Usuario Registrado, verifica tu correo electronico"})
    } catch (error) {
        console.log("error" + error);
        return res.status(500).json({ message: 'Error Interno Del Servidor' });
    }
}

RegistroUsuariosController.verifyCode = async (req, res) => {
    try {
        const { verificationCodeRequest } = req.body;

        const token = req.cookies.VerificationToken;

        const decoded = jsonwebtoken.verify(token, config.JWT.secret);
        const {
            email,
            verificationCode: storedCode,
            nombre,
            passwordHash,
            rol,
            estado,
            fechaRegistro,
            isVerified,
            loginAttemps,
            timeOut
        } = decoded;

        if (verificationCodeRequest !== storedCode) {
            return res.status(400).json({ message: 'Codigo de Verificacion Invalido' });
        }

        const newUsuario = new UsersModel({
            nombre,
            email,
            contraseña: passwordHash,
            rol,
            estado,
            fechaRegistro,
            isVerified,
            loginAttemps,
            timeOut
        });

        await newUsuario.save();


        const usuario = await UsersModel.findOne({ email });
        usuario.isVerified = true;
        await usuario.save();

        res.clearCookie("VerificationToken");

        res.json({message: "Cuenta verificada correctamente"});

    } catch (error) {
        console.log("error" + error);
        return res.status(500).json({ message: 'Error Interno Del Servidor' });
    }
}

export default RegistroUsuariosController;
