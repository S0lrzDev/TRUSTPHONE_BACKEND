import express from 'express';
import {
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  cancelarPedido,
  actualizarEstadoPedido,
} from '../Controllers/PedidosController.js';

const router = express.Router();

// Rutas de pedidos
router.post('/', crearPedido);
router.get('/', obtenerPedidos);
router.get('/:id', obtenerPedidoPorId);
router.put('/:id/cancelar', cancelarPedido);
router.patch('/:id/estado', actualizarEstadoPedido);

export default router;
