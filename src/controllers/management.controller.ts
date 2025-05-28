import { Request, Response } from 'express';
import { Like, IsNull } from 'typeorm';
import { Management } from '../entities/Managements';
import { Category } from '../entities/Category';
import fs from 'fs';
import path from 'path';

export const createManagement = async (req: Request, res: Response) => {
  try {
    const { title, description, keywords, file, rrhhId, categoryId } = req.body;

    if (!title || !rrhhId || !categoryId) {
      return res.status(400).json({ message: 'Title, rrhhId, and categoryId are required fields' });
    }

    // Validate categoryId
    const category = await Category.findOneBy({ id: categoryId });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const management = new Management();
    management.title = title;
    management.description = description || null;
    management.rrhhId = rrhhId;
    management.category = categoryId;

    // Adapted: file as array (json)
    let fileArray = file;
    if (req.files && Array.isArray(req.files)) {
      fileArray = req.files.map((file: Express.Multer.File) => file.filename);
    } else if (typeof file === 'string') {
      try {
        fileArray = JSON.parse(file);
      } catch {
        fileArray = [file];
      }
    }
    if (!Array.isArray(fileArray)) {
      return res.status(400).json({ message: 'File must be an array or a valid string/JSON' });
    }
    management.file = fileArray;

    // Adapted: keywords as array (json)
    let keywordsArray = keywords;
    if (typeof keywords === 'string') {
      try {
        keywordsArray = JSON.parse(keywords);
      } catch {
        keywordsArray = [keywords];
      }
    }
    if (!Array.isArray(keywordsArray)) {
      return res.status(400).json({ message: 'Keywords must be an array or a valid string/JSON' });
    }
    management.keywords = keywordsArray;

    const savedManagement = await management.save();
    return res.status(201).json(savedManagement);
  } catch (error) {
    console.error('Error creating management:', error);
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateManagement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, categoryId, keywords, file } = req.body;

    if (!title || !categoryId) {
      return res.status(400).json({ message: 'Title, rrhhId, and categoryId are required fields' });
    }

    // Validate categoryId
    const category = await Category.findOneBy({ id: categoryId });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const management = await Management.findOneBy({ id: parseInt(id) });
    if (!management) {
      return res.status(404).json({ message: 'Management entry not found' });
    }

    management.title = title;
    management.description = description || null;
    management.category = categoryId;

    // Actualizar keywords si se envían
    if (typeof keywords !== 'undefined') {
      let keywordsArray = keywords;
      if (typeof keywords === 'string') {
        try {
          keywordsArray = JSON.parse(keywords);
        } catch {
          keywordsArray = [keywords];
        }
      }
      if (!Array.isArray(keywordsArray)) {
        return res
          .status(400)
          .json({ message: 'Keywords must be an array or a valid string/JSON' });
      }
      management.keywords = keywordsArray;
    }

    const updatedManagement = await management.save();
    return res.status(200).json(updatedManagement);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

// Add file a Management entry
export const addFileToManagement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const management = await Management.findOneBy({ id: parseInt(id) });
    if (!management) {
      return res.status(404).json({ message: 'Management entry not found' });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const filesArray = req.files.map((file: Express.Multer.File) => file.filename);
    management.file = Array.isArray(management.file)
      ? [...management.file, ...filesArray]
      : filesArray;

    const updatedManagement = await management.save();
    return res.status(200).json(updatedManagement);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

// Delete files from Management entry
export const deleteFilesFromManagement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const management = await Management.findOneBy({ id: parseInt(id) });
    if (!management) {
      return res.status(404).json({ message: 'Management entry not found' });
    }

    if (!req.body.files || !Array.isArray(req.body.files) || req.body.files.length === 0) {
      return res.status(400).json({ message: 'No files specified for deletion' });
    }

    const filesToDelete = req.body.files;
    const existingFiles = Array.isArray(management.file) ? management.file : [];

    // Delete files from filesystem
    for (const file of filesToDelete) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', 'management', file);
      console.log(`Deleting file: ${filePath}`);
      fs.unlink(filePath, (err) => {
        // Ignore error if file does not exist
      });
    }

    management.file = existingFiles.filter((file) => !filesToDelete.includes(file));

    const updatedManagement = await management.save();
    return res.status(200).json(updatedManagement);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

// Get all Management entries
export const getManagements = async (req: Request, res: Response) => {
  try {
    // Adapt keywords in response: always return as array
    const managements = await Management.find({
      relations: ['category'],
      where: { deletedAt: IsNull() },
    });
    const result = managements.map((m) => ({
      ...m,
      keywords: Array.isArray(m.keywords) ? m.keywords : [],
    }));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

// Obtener gestiones con paginación estilo Laravel
export const getManagementsPaginated = async (req: Request, res: Response) => {
  try {
    let page = parseInt(req.query.page as string);
    let perPage = parseInt(req.query.perPage as string);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(perPage) || perPage < 1) perPage = 5;

    const [data, total] = await Management.findAndCount({
      relations: ['category'],
      where: { deletedAt: IsNull() },
      skip: (page - 1) * perPage,
      take: perPage,
      order: { id: 'ASC' },
    });
    const lastPage = Math.ceil(total / perPage);
    const baseUrl = req.protocol + '://' + req.get('host') + req.baseUrl + req.path;
    const makePageUrl = (p: number) => `${baseUrl}?page=${p}&perPage=${perPage}`;
    // Adapt keywords in response: always return as array
    const result = data.map((m) => ({
      ...m,
      keywords: Array.isArray(m.keywords) ? m.keywords : [],
    }));
    res.json({
      current_page: page,
      data: result,
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

// Get Management entry by ID
export const getManagementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const management = await Management.findOne({
      where: { id: parseInt(id), deletedAt: IsNull() },
      relations: ['category'],
    });
    if (!management) {
      return res.status(404).json({ message: 'Management entry not found' });
    }
    // Adapt keywords in response: always return as array
    return res.status(200).json({
      ...management,
      keywords: Array.isArray(management.keywords) ? management.keywords : [],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

// Delete Management entry (soft delete)
export const deleteManagement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const management = await Management.findOneBy({ id: parseInt(id) });
    if (!management) {
      return res.status(404).json({ message: 'Management entry not found' });
    }

    management.deletedAt = new Date();
    await management.save();
    return res.status(200).send();
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};
