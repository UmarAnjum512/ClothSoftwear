import express from 'express';
import {
  getSettings,
  updateSettings,
  getAuditLogs,
  exportBackup
} from '../controllers/settingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getSettings);
router.patch('/', authorize('Super Admin'), updateSettings);
router.get('/audit-logs', authorize('Super Admin', 'Manager'), getAuditLogs);
router.get('/backup/export', authorize('Super Admin'), exportBackup);

export default router;
