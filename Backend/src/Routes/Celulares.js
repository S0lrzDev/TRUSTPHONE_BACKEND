import express from "express";
import celularesController from "../Controllers/CelularesController.js";
import upload from "../utils/CloudinaryConfig.js";

const router = express.Router();

router.route("/")
  .get(celularesController.getAllCelulares)
  .post(upload.single("imagen"),celularesController.insertCelular);

router.route("/:id")
  .get(celularesController.getCelularById)
  .put(upload.single("imagen"),celularesController.updateCelular)
  .delete(celularesController.deleteCelular);

export default router; 