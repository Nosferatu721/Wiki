import { Router } from 'express';
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoriesBySegmentation,
  getCategoriesByName,
  getCategoriesPaginated
} from '../controllers/category.controller';

const router = Router();

// Route to create a new category
router.post('/', createCategory);

// Route to get all categories
router.get('/', getCategories);

// Route to get a category by ID
router.get('/:id', getCategoryById);

// Route to update a category by ID
router.put('/:id', updateCategory);

// Route to delete a category by ID
router.delete('/:id', deleteCategory);

// Route to get categories by segmentation
router.post('/filterSegmentation', getCategoriesBySegmentation);

// Route to get categories by name
router.post('/filterName', getCategoriesByName);

// Route to get categories with pagination
router.post('/pagination', getCategoriesPaginated);

export default router;
