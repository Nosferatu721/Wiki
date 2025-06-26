import { Router } from 'express';
import {
  getErrors,
  getErrorsPaginated,
  getErrorStats
} from '../controllers/error.controller';

const router = Router();

// Get all errors
router.get('/', getErrors);

// Get errors with pagination
router.get('/paginated', getErrorsPaginated);

// Get error statistics
router.get('/stats', getErrorStats);

export default router;
