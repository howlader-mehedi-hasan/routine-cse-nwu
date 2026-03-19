import express from 'express';
const router = express.Router();
import * as batchController from '../controllers/batchController.js';
import { protect, requirePermission } from '../middleware/authMiddleware.js';

router.get('/', batchController.getAll);
router.get('/:id', batchController.getById);
router.post('/', protect, requirePermission('manage_batches'), batchController.create);
router.put('/:id', protect, requirePermission('manage_batches'), batchController.update);
router.delete('/:id', protect, requirePermission('manage_batches'), batchController.deleteBatch);

export default router;
