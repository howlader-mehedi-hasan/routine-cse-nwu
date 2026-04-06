import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import * as bugReportController from '../controllers/bugReportController.js';

const router = express.Router();

// Memory storage for multer to get buffer for Supabase upload
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// All routes require authentication
router.use(protect);

router.post('/', bugReportController.createBugReport);
router.get('/', bugReportController.getBugReports);
router.patch('/:id/status', bugReportController.updateBugReportStatus);

router.get('/:reportId/messages', bugReportController.getMessages);
router.post('/:reportId/messages', upload.single('media'), bugReportController.addMessage);

export default router;
