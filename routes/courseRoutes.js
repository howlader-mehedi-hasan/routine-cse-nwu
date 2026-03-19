import express from 'express';
const router = express.Router();
import * as courseController from '../controllers/courseController.js';
import { protect, requirePermission } from '../middleware/authMiddleware.js';

router.get('/', courseController.getAll);
router.get('/:id', courseController.getById);
router.post('/', protect, requirePermission('manage_courses'), courseController.create);
router.put('/:id', protect, requirePermission('manage_courses'), courseController.update);
router.delete('/:id', protect, requirePermission('manage_courses'), courseController.remove);

export default router;
