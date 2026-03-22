import express from 'express';
import { exportSystemBackup, importSystemBackup, createCloudBackup, getCloudBackups, restoreCloudBackup, deleteCloudBackup, saveCloudBackup, getCloudBackupData } from '../controllers/backupController.js';
import { protect, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only Admins or those with manage_database permission can export/import
// System Backup Routes
router.get('/export', protect, requirePermission('manage_database'), exportSystemBackup);
router.post('/import', protect, requirePermission('manage_database'), importSystemBackup);

// Cloud Backup Routes
router.get('/cloud', protect, requirePermission('manage_database'), getCloudBackups);
router.post('/cloud/save', protect, requirePermission('manage_database'), saveCloudBackup);
router.get('/cloud/data', protect, requirePermission('manage_database'), getCloudBackupData);
router.post('/cloud', protect, requirePermission('manage_database'), createCloudBackup);
router.post('/cloud/restore', protect, requirePermission('manage_database'), restoreCloudBackup);
router.delete('/cloud/:filename', protect, requirePermission('manage_database'), deleteCloudBackup);

export default router;
