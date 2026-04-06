import express from 'express';
import { getStudents, updateStudent } from '../controllers/studentController.js';
import { protect, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getStudents);
router.put('/:id', protect, requirePermission('manage_faculty'), updateStudent);

export default router;
