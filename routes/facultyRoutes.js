import express from 'express';
const router = express.Router();
import * as facultyController from '../controllers/facultyController.js';
import { protect, requirePermission } from '../middleware/authMiddleware.js';

router.get('/', facultyController.getAll);
router.get('/:id', facultyController.getById);
router.post('/', protect, requirePermission('manage_faculty'), facultyController.create);
router.put('/:id', protect, requirePermission('manage_faculty'), facultyController.update);
router.delete('/:id', protect, requirePermission('manage_faculty'), facultyController.remove);

export default router;
