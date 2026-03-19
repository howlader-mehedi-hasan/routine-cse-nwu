import express from 'express';
const router = express.Router();
import * as roomController from '../controllers/roomController.js';
import { protect, requirePermission } from '../middleware/authMiddleware.js';

router.get('/', roomController.getAll);
router.get('/:id', roomController.getById);
router.post('/', protect, requirePermission('manage_rooms'), roomController.create);
router.put('/:id', protect, requirePermission('manage_rooms'), roomController.update);
router.delete('/:id', protect, requirePermission('manage_rooms'), roomController.remove);

export default router;
