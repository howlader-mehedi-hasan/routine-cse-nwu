import express from 'express';
const router = express.Router();
import * as routineController from '../controllers/routineController.js';
import { protect, requirePermission } from '../middleware/authMiddleware.js';

router.post('/add', protect, requirePermission(['edit_routine', 'edit_week_routine']), routineController.addRoutineEntry);
router.put('/:id', protect, requirePermission(['edit_routine', 'edit_week_routine']), routineController.updateRoutineEntry);
router.delete('/clear', protect, requirePermission(['edit_routine', 'edit_week_routine']), routineController.clearRoutine);
router.get('/export', protect, requirePermission(['edit_routine', 'edit_week_routine']), routineController.exportRoutine);
router.post('/import', protect, requirePermission(['edit_routine', 'edit_week_routine']), routineController.importRoutine);
router.delete('/:id', protect, requirePermission(['edit_routine', 'edit_week_routine']), routineController.deleteRoutineEntry);
router.get('/', routineController.getRoutine);

export default router;
