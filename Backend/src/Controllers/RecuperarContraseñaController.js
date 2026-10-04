import jsonwebtoken from "jsonwebtoken"
import bcrypt from "bcrypt"
import crypto from "crypto"
import { sendEmail } from "../utils/sendMailMailjet.js"
import HTMLRecuperarCorreo from "../utils/enviarCorreoRecuperacion.js"

import { config } from "../../config.js"
import ClienteModel from "../Models/Clientes.js"

const RecuperarContraseñaController = {}

RecuperarContraseñaController.requestCode = async (req, res) =>{
    try {
        const {correo} = req.body

        const userFound  = await ClienteModel.findOne({ correo })

        if (!userFound) {
            return res.json({message: "Usuario no encontrado"})
        }

        const code = crypto.randomBytes(3).toString("hex")

        const token = jsonwebtoken.sign(
            {correo, code, userType: "Cliente", verified: false},

            config.JWT.secret,

            {expiresIn: "15m"}
        )

        res.cookie("recoveryCookie", token, {maxAge: 15* 60 * 1000})

        try {
            await sendEmail(correo, "Correo de recuperacion", HTMLRecuperarCorreo(code), "Usa este codigo para recuperar tu cuenta: " + code)
        } catch (error) {
            return res.status(500).json({message: "error al enviar el correo"})
        }

        return res.status(200).json({ message: "Correo Enviado"})

    } catch (error) {
        console.log("error" + error)
        return res.status(500).json({message: "Error Interno Del Servidor"})
    }
}

RecuperarContraseñaController.verifyCode = async(req, res) => {
    try {
        const {codeRequest} = req.body

        const token = req.cookies.recoveryCookie
        const decoded = jsonwebtoken.verify(token, config.JWT.secret)

        if (codeRequest !== decoded.code) {
            return res.status(400).json({message: "Invalid Code"})
        }

        const newToken = jsonwebtoken.sign(
            {correo: decoded.correo, userType: "cliente", verified: true},

            config.JWT.secret,
            {expiresIn: "15m"}
        )

        res.cookie("recoveryCookie", newToken, {maxAge: 15 * 60 * 1000})

        return res.status(200).json({message: "Codigo Verificado Correctamente"})
    } catch (error) {
        console.log("error" + error)
        return res.status(500).json({message: "Error Interno Del Servidor"})
    }
}

RecuperarContraseñaController.newPassword = async (req, res) => {
    try {
        const {newPassword, confirNewPassword} = req.body;

        if (newPassword !== confirNewPassword) {
            return res.status(400).json({message: "Las Contraseñas No Coinciden"})
        }

        const token = req.cookies.recoveryCookie;
        const decoded = jsonwebtoken.verify(token, config.JWT.secret)

        if (!decoded.verified) {
            return res.status(400).json({message: "Codigo No Verificado"})
        }

        const passwordHash = await bcrypt.hash(newPassword, 10)

        await ClienteModel.findOneAndUpdate(
            {correo: decoded.correo},
            {contrasena: passwordHash},
            {new: true},
        );

        res.clearCookie("recoveryCookie")

        return res.status(200).json({message: "Contraseña Actualizada"})
    } catch (error) {
        console.log("error" + error)
        return res.status(500).json({message: "Error Interno Del Servidor"})
    }
}

export default RecuperarContraseñaController
