import express from 'express';
import { exportSystemBackup, importSystemBackup } from '../controllers/backupController.js';
import { protect, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only Admins or those with manage_database permission can export/import
router.get('/export', protect, requirePermission('manage_database'), exportSystemBackup);
router.post('/import', protect, requirePermission('manage_database'), importSystemBackup);

export default router;
