import express from 'express';
import { getUsers, createUser, updateUser, deleteUser, getRoles } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/roles', authorize('Super Admin', 'Manager'), getRoles);
router.get('/', authorize('Super Admin', 'Manager'), getUsers);
router.post('/', authorize('Super Admin'), createUser);
router.patch('/:id', authorize('Super Admin'), updateUser);
router.delete('/:id', authorize('Super Admin'), deleteUser);

export default router;
