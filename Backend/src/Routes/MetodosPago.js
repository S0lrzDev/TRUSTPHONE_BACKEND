import express from 'express';
import MetodosPagoController from '../Controllers/MetodosPagoController.js';

const router = express.Router();

router.route('/')
  .get(MetodosPagoController.obtenerMetodosPago)
  .post(MetodosPagoController.crearMetodoPago);

router.route('/:id')
  .put(MetodosPagoController.actualizarMetodoPago)
  .delete(MetodosPagoController.eliminarMetodoPago);

export default router;
