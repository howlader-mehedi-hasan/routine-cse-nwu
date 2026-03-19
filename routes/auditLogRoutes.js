import express from 'express';
const router = express.Router();
import * as auditLogController from '../controllers/auditLogController.js';
import { protect, requirePermission } from '../middleware/authMiddleware.js';

router.get('/', protect, requirePermission('view_activity_logs'), auditLogController.getAuditLogs);
router.put('/:id', protect, requirePermission('view_activity_logs'), (req, res, next) => {
    // Extra check to ensure ONLY Super Admin can edit
    if (req.user.role !== 'Super Admin') {
        return res.status(403).json({ message: 'Only Super Admin can edit activity logs' });
    }
    next();
}, auditLogController.updateAuditLog);

router.post('/delete-multiple', protect, requirePermission('view_activity_logs'), (req, res, next) => {
    // Extra check for Super Admin
    if (req.user.role !== 'Super Admin') {
        return res.status(403).json({ message: 'Only Super Admin can delete activity logs' });
    }
    next();
}, auditLogController.deleteMultipleAuditLogs);

export default router;
