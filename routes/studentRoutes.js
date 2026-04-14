import express from 'express';
import { getStudents, updateStudent, createStudent, deleteStudent, migrateSemesters } from '../controllers/studentController.js';
import { protect, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getStudents);
router.post('/', protect, requirePermission('manage_faculty'), createStudent);
router.put('/:id', protect, requirePermission('manage_faculty'), updateStudent);
router.delete('/:id', protect, requirePermission('manage_faculty'), deleteStudent);
router.post('/migrate', protect, migrateSemesters);

export default router;
