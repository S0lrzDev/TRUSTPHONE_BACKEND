import express from "express";
import DireccionesController from "../Controllers/DireccionesController.js";

const router = express.Router();

router.route("/")
    .get(DireccionesController.obtenerDirecciones)
    .post(DireccionesController.crearDireccion);

router.route("/:id")
    .put(DireccionesController.actualizarDireccion)
    .delete(DireccionesController.eliminarDireccion);

export default router;
