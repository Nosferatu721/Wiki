import { Request, Response } from 'express';
import { Like } from 'typeorm';
import { Category } from '../entities/Category';

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, grupo, sub_grupo, skill, createdBy } = req.body;
    if (!name || !grupo || !sub_grupo || !skill || createdBy === undefined) {
      return res
        .status(400)
        .json({ message: 'All fields (name, grupo, sub_grupo, skill, createdBy) are required' });
    }
    const category = new Category();
    category.name = name;
    category.grupo = grupo;
    category.sub_grupo = sub_grupo;
    category.skill = skill;
    category.createdBy = createdBy;
    const savedCategory = await category.save();
    return res.status(201).json(savedCategory);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const category = await Category.findOneBy({ id: parseInt(id) });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    category.name = name;
    const updatedCategory = await category.save();
    return res.status(200).json(updatedCategory);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findOneBy({ id: parseInt(id) });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    category.deletedAt = new Date();
    await category.save();
    return res.status(200).send();
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find();
    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findOneBy({ id: parseInt(id) });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    return res.status(200).json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getCategoriesBySegmentation = async (req: Request, res: Response) => {
  try {
    const { grupo, sub_grupo, skill, createdBy } = req.body;

    const query: any = {};
    if (grupo) query.grupo = grupo;
    if (sub_grupo) query.sub_grupo = sub_grupo;
    if (skill) query.skill = skill;
    if (createdBy !== undefined) query.createdBy = createdBy;

    const categories = await Category.findBy(query);
    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getCategoriesByName = async (req: Request, res: Response) => {
  try {
    const { name, createdBy } = req.body;
    if (!name) return res.status(400).json({ message: 'Name query parameter is required' });

    const where: any = { name: Like(`%${name}%`) };
    if (createdBy !== undefined) where.createdBy = createdBy;

    const categories = await Category.find({
      where
    });
    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getCategoriesWithPagination = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.body;
    const skip = (Number(page) - 1) * Number(limit);
    const [categories, total] = await Category.findAndCount({
      skip: skip,
      take: Number(limit),
      order: {
        name: 'ASC',
      },
    });
    return res.status(200).json({
      data: categories,
      total: total,
      page: Number(page),
      lastPage: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};
