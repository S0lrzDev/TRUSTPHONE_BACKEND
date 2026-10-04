import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";
import MarcasRoutes from './src/Routes/Marcas.js';
import CelularesRoutes from './src/Routes/Celulares.js';
import ClientesRouter from "./src/Routes/Clientes.js"
import RegistroClientes from "./src/Routes/RegistroCliente.js"
import loginClienteController from './src/Routes/LoginClientes.js';
import LogOutController from './src/Routes/LogOut.js';
import RecuperarContraseña from './src/Routes/RecuperarContraseña.js'
import UsuariosRoutes from './src/Routes/Usuarios.js'
import loginUsuarioRoutes from './src/Routes/LoginUsuarios.js';
import RegistroUsuarioRoutes from './src/Routes/registroUsuario.js';
import TecnicosRoutes from "./src/Routes/Tecnicos.js";
import RevisionCelularesRoutes from "./src/Routes/RevisionCelulares.js";
import PedidosRoutes from "./src/Routes/Pedidos.js";
import DireccionesRoutes from "./src/Routes/Direcciones.js";
import MetodosPagoRoutes from "./src/Routes/MetodosPago.js";

const app = express();

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(express.json());
app.use(cookieParser());

//ENDPOINTS
app.use('/api/marcas', MarcasRoutes);
app.use('/api/celulares', CelularesRoutes);
app.use('/api/clientes', ClientesRouter);
app.use('/api/registroClientes', RegistroClientes);
app.use('/api/loginClientes', loginClienteController);
app.use('/api/logout', LogOutController);
app.use('/api/RecuperarContrasena', RecuperarContraseña);
app.use('/api/usuarios', UsuariosRoutes);
app.use('/api/loginUsuarios', loginUsuarioRoutes);
app.use('/api/registroUsuarios', RegistroUsuarioRoutes);
app.use('/api/tecnicos', TecnicosRoutes);
app.use('/api/revisionCelulares', RevisionCelularesRoutes);
app.use('/api/pedidos', PedidosRoutes);
app.use('/api/direcciones', DireccionesRoutes);
app.use('/api/metodosPago', MetodosPagoRoutes);

export default app;
