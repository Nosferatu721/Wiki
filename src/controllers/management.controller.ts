import { Request, Response } from 'express';
import { Like, IsNull } from 'typeorm';
import { Management } from '../entities/Managements';
import { Category } from '../entities/Category';
import fs from 'fs';
import path from 'path';

// @Entity()
// export class Management extends BaseEntity {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column()
//   title: string;

//   @Column({ type: 'text', nullable: true })
//   description: string;

//   @Column({ type: 'text', default: '' })
//   keywords: string;

//   @Column({ type: 'text', default: '' })
//   file: string;

//   @Column({ nullable: false })
//   createdBy: number;

//   @ManyToOne(() => Category, (category) => category.management, { nullable: false })
//   category: Category;

//   @CreateDateColumn({ precision: 0 })
//   createdAt: Date;

//   @UpdateDateColumn({ precision: 0 })
//   updatedAt: Date;

//   @DeleteDateColumn({ precision: 0 })
//   deletedAt: Date | null;
// }

export const createManagement = async (req: Request, res: Response) => {
  try {
    const { title, description, keywords, createdBy, categoryId } = req.body;

    if (!title || !createdBy || !categoryId) {
      return res
        .status(400)
        .json({ message: 'Title, createdBy, and categoryId are required fields' });
    }

    // Validate categoryId
    const category = await Category.findOneBy({ id: categoryId });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const management = new Management();
    management.title = title;
    management.description = description || null;
    management.createdBy = createdBy;
    management.category = categoryId;

    let filesName = '';
    if (req.files && Array.isArray(req.files)) {
      filesName = req.files.map((file: Express.Multer.File) => file.filename).join('|');
    }
    management.file = filesName;

    let keywordsArray = keywords;
    if (typeof keywords === 'string') {
      try {
        keywordsArray = JSON.parse(keywords);
      } catch {
        keywordsArray = [keywords];
      }
    }

    let keywordsString = '';
    if (Array.isArray(keywordsArray)) {
      keywordsString = keywordsArray.join('|');
    } else {
      return res.status(400).json({ message: 'Keywords must be an array or a valid string' });
    }
    management.keywords = keywordsString;

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
    const { title, description, categoryId } = req.body;

    if (!title || !categoryId) {
      return res
        .status(400)
        .json({ message: 'Title, createdBy, and categoryId are required fields' });
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

    const updatedManagement = await management.save();
    return res.status(200).json(updatedManagement);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

// Agregar Keywords a Management
export const addKeywordsToManagement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { keywords } = req.body;

    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ message: 'Keywords must be an array' });
    }

    const management = await Management.findOneBy({ id: parseInt(id) });
    if (!management) {
      return res.status(404).json({ message: 'Management entry not found' });
    }

    const existingKeywords = management.keywords ? management.keywords.split('|') : [];
    const newKeywords = keywords.filter((kw: string) => !existingKeywords.includes(kw));
    management.keywords = [...existingKeywords, ...newKeywords].join('|');
    const updatedManagement = await management.save();
    return res.status(200).json(updatedManagement);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

// Delete Keywords from Management
export const deleteKeywordsFromManagement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { keywords } = req.body;

    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ message: 'Keywords must be an array' });
    }

    const management = await Management.findOneBy({ id: parseInt(id) });
    if (!management) {
      return res.status(404).json({ message: 'Management entry not found' });
    }

    const existingKeywords = management.keywords ? management.keywords.split('|') : [];
    management.keywords = existingKeywords.filter((kw: string) => !keywords.includes(kw)).join('|');
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

    const filesName = req.files.map((file: Express.Multer.File) => file.filename).join('|');
    management.file = management.file ? `${management.file}|${filesName}` : filesName;

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
    const existingFiles = management.file ? management.file.split('|') : [];

    // Delete files from filesystem
    for (const file of filesToDelete) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', 'management', file);
      console.log(`Deleting file: ${filePath}`);
      fs.unlink(filePath, (err) => {
        // Ignore error if file does not exist
      });
    }

    management.file = existingFiles.filter((file) => !filesToDelete.includes(file)).join('|');

    const updatedManagement = await management.save();
    return res.status(200).json(updatedManagement);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

// Get all Management entries
export const getManagements = async (req: Request, res: Response) => {
  try {
    const managements = await Management.find({
      relations: ['category'],
      where: { deletedAt: IsNull() },
    });
    return res.status(200).json(managements);
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
    const makePageUrl = (p: number) => `${baseUrl}?page=${p}&per_page=${perPage}`;
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
    return res.status(200).json(management);
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
