import express from "express";
import ResenasController from "../Controllers/ResenasController.js";

const router = express.Router();

router.route("/")
    .get(ResenasController.getResenas)
    .post(ResenasController.insertResena);

router.get("/resumen/:idCelular", ResenasController.getResumenCelular);

router.route("/:id")
    .put(ResenasController.updateResena)
    .delete(ResenasController.deleteResena);

export default router;
