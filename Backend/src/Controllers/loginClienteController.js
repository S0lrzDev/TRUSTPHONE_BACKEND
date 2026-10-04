import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';

import ClienteModel from '../Models/Clientes.js';
import {config} from "../../config.js"

const loginClienteController = {}

loginClienteController.login = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        const userFound = await ClienteModel.findOne({ correo });
        
        if (!userFound) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }


        // Verificar si la cuenta está verificada
        if (!userFound.isVerified) {
            return res.status(403).json({ 
                message: 'Tu cuenta no ha sido verificada. Revisa tu correo electrónico.',
                needsVerification: true 
            });
        }

        if (userFound.timeOut && userFound.timeOut > Date.now()) {
            return res.status(403).json({ message: 'Cuenta bloqueada' });
        }

        const isMatch = await bcryptjs.compare(contrasena, userFound.contrasena);

        if (!isMatch) {
            userFound.loginAttemps = (userFound.loginAttemps || 0) + 1;

            if (userFound.loginAttemps >= 5) {
                userFound.timeOut = Date.now() + 15 * 60 * 1000;
                userFound.loginAttemps = 0;

                await userFound.save();

                return res.status(403).json({ message: 'Cuenta bloqueada' });
            }

            await userFound.save();
            return res.status(400).json({ message: 'contrasena incorrecta' });
        }

        // Reset login attempts on successful login
        userFound.loginAttemps = 0;
        userFound.timeOut = null;
        await userFound.save();

        const token = jsonwebtoken.sign(
            {id : userFound._id, userType: "cliente"},
            config.JWT.secret,
            {expiresIn: '30d'}
        )

        res.cookie("AuthCookie", token);

        return res.status(200).json({ 
            message: 'Login exitoso',
            cliente: {
                _id: userFound._id,
                nombre: userFound.nombre,
                Apellido: userFound.Apellido || '',
                apellido: userFound.Apellido || '',
                correo: userFound.correo,
                telefono: userFound.telefono || '',
                fecha_nacimiento: userFound.fecha_nacimiento || userFound.fechaNacimiento || '',
                fechaNacimiento: userFound.fecha_nacimiento || userFound.fechaNacimiento || '',
                fotoPerfil: userFound.fotoPerfil || '',
                isVerified: userFound.isVerified,
            }
        });

    } catch (error) {
        console.log("error" + error);
        return res.status(500).json({ message: 'Error Interno Del Servidor' });
    }
}

export default loginClienteController;

