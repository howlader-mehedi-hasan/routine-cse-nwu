import express from 'express';
const router = express.Router();
import * as settingsController from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

router.get('/', settingsController.getSettings);
router.put('/', protect, authorize('Super Admin'), settingsController.updateSettings);

export default router;
