import express from 'express';
import { getStudents } from '../controllers/studentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getStudents);

export default router;
