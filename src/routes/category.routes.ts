import { Router } from 'express';
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoriesBySegmentation,
  getCategoriesByName,
  getCategoriesWithPagination,
} from '../controllers/category.controllers';

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
router.get('/filterSegmentation', getCategoriesBySegmentation);

// Route to get categories by name
router.get('/filterName', getCategoriesByName);

export default router;
