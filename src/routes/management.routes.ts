import { Router } from 'express';
import {
  createManagement,
  updateManagement,
  getManagements,
  getManagementById,
  deleteManagement,
  addFileToManagement,
  deleteFilesFromManagement,
  getManagementsPaginated,
  updateFilesInManagement
} from '../controllers/management.controller';
import multer from 'multer';
import path from 'path';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/management/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Route to create a new management entry
router.post('/', upload.array('file', 5), createManagement);

// Route to update an existing management entry
router.put('/:id', upload.array('file', 5), updateManagement);

// Route to get all management entries
router.get('/', getManagements);

// Route to get a management entry by ID
router.get('/:id', getManagementById);

// Route to delete a management entry (soft delete)
router.delete('/:id', deleteManagement);

// Route to add files to an existing management entry
router.put('/addFile/:id', upload.array('file', 5), addFileToManagement);

// Route to delete a file from an existing management entry
router.put('/deleteFile/:id', deleteFilesFromManagement);

// Route to get paginated management entries
router.post('/pagination', getManagementsPaginated);

// Route to update files in an existing management entry
router.put('/updateFiles/:id', upload.array('file', 5), updateFilesInManagement);

export default router;
