import express from "express";
import ClientesController from "../Controllers/ClientesController.js";
import upload from "../utils/CloudinaryConfig.js";

const router = express.Router();

router.route("/")
.get(ClientesController.getAllClientes);

router.route("/:id")
.get(ClientesController.getClienteById)
.delete(ClientesController.deleleteCliente)
.put(upload.single("fotoPerfil"),ClientesController.updateCliente);

export default router;