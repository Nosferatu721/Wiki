import { Request, Response } from 'express';
import { Like } from 'typeorm';
import { Category } from '../entities/Category';

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, groupId, rrhhId } = req.body;
    if (!name || groupId === undefined || rrhhId === undefined) {
      return res.status(400).json({ message: 'All fields (name, groupId, rrhhId) are required' });
    }
    const category = new Category();
    category.name = name;
    category.groupId = parseInt(groupId);
    category.rrhhId = rrhhId;
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

    if (!name === undefined) return res.status(400).json({ message: 'At least one field (name) is required' });

    const category = await Category.findOneBy({ id: parseInt(id) });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (name) category.name = name;
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
    const { groupId } = req.query;
    const where: any = {};
    if (groupId !== undefined && groupId !== null && groupId !== "") {
      const parsedGroupId = parseInt(groupId as string);
      if (!isNaN(parsedGroupId)) where.groupId = parsedGroupId;
    }
    const categories = await Category.find({ where });
    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { groupId } = req.query;
    const where: any = { id: parseInt(id) };
    if (groupId !== undefined && groupId !== null && groupId !== "") {
      const parsedGroupId = parseInt(groupId as string);
      if (!isNaN(parsedGroupId)) where.groupId = parsedGroupId;
    }
    const category = await Category.findOneBy(where);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    return res.status(200).json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getCategoriesBySegmentation = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.body;
    const query: any = {};
    if (groupId !== undefined) query.groupId = parseInt(groupId);
    const categories = await Category.findBy(query);
    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getCategoriesByName = async (req: Request, res: Response) => {
  try {
    const { name, rrhhId, groupId } = req.body;
    if (!name) return res.status(400).json({ message: 'Name query parameter is required' });

    const where: any = { name: Like(`%${name}%`) };
    if (rrhhId !== undefined) where.rrhhId = rrhhId;
    if (groupId !== undefined && groupId !== null && groupId !== "") {
      const parsedGroupId = parseInt(groupId);
      if (!isNaN(parsedGroupId)) where.groupId = parsedGroupId;
    }

    const categories = await Category.find({
      where,
    });
    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

// Obtener categorías con paginación
export const getCategoriesPaginated = async (req: Request, res: Response) => {
  try {
    let page = parseInt(req.query.page as string);
    let perPage = parseInt(req.query.perPage as string);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(perPage) || perPage < 1) perPage = 5;

    // Obtener filtros opcionales de req.body
    const { name, groupId } = req.body;
    const where: any = {};
    if (name && name.trim() !== "") where.name = Like(`%${name}%`);
    if (groupId !== undefined && groupId !== null && groupId !== "") {
      const parsedGroupId = parseInt(groupId);
      if (!isNaN(parsedGroupId)) where.groupId = parsedGroupId;
    }

    const [data, total] = await Category.findAndCount({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      order: { id: 'ASC' },
    });
    const lastPage = Math.ceil(total / perPage);
    const baseUrl = req.protocol + '://' + req.get('host') + req.baseUrl + req.path;
    const makePageUrl = (p: number) => `${baseUrl}?page=${p}&perPage=${perPage}`;
    res.json({
      current_page: page,
      data,
      first_page_url: makePageUrl(1),
      from: (page - 1) * perPage + 1,
      last_page: lastPage,
      last_page_url: makePageUrl(lastPage),
      next_page_url: page < lastPage ? makePageUrl(page + 1) : null,
      path: baseUrl,
      per_page: perPage,
      prev_page_url: page > 1 ? makePageUrl(page - 1) : null,
      to: Math.min(page * perPage, total),
      total,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};
