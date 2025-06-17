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

    let fileArray: { nombre: string; url: string }[] = [];
    if (req.files && Array.isArray(req.files)) {
      const serverUrl = req.protocol + '://' + req.get('host');
      fileArray = req.files.map((file: Express.Multer.File) => ({
        nombre: file.originalname,
        url: `${serverUrl}/uploads/management/${file.filename}`
      }));
    } else if (typeof file === 'string') {
      try {
        const parsed = JSON.parse(file);
        if (Array.isArray(parsed)) {
          fileArray = parsed.map((f: any) =>
            typeof f === 'object' && f.nombre && f.url
              ? { nombre: f.nombre, url: f.url }
              : { nombre: f, url: f }
          );
        } else {
          fileArray = [{ nombre: parsed, url: parsed }];
        }
      } catch {
        fileArray = [{ nombre: file, url: file }];
      }
    }

    if (!Array.isArray(fileArray)) {
      return res.status(400).json({ message: 'File must be an array or a valid string/JSON' });
    }
    management.file = fileArray;

    // Adapted: keywords as array (json) and lowercase
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
    management.keywords = keywordsArray.map((kw: string) =>
      typeof kw === 'string' ? kw.toLowerCase() : kw
    );

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
    const { title, description, categoryId, keywords } = req.body;

    // Validate categoryId if provided
    if (!categoryId) {
      const category = await Category.findOneBy({ id: categoryId });
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
    }

    const management = await Management.findOneBy({ id: parseInt(id) });
    if (!management) {
      return res.status(404).json({ message: 'Management entry not found' });
    }

    management.title = title;
    management.description = description;
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
      management.keywords = keywordsArray.map((kw: string) =>
        typeof kw === 'string' ? kw.toLowerCase() : kw
      );
    }

    // --- NUEVO: Manejo de archivos nuevos y archivos a eliminar desde formdata ---
    let filesToDelete = req.body.filesToDelete;
    if (typeof filesToDelete === 'string') {
      try {
        filesToDelete = JSON.parse(filesToDelete);
      } catch {
        filesToDelete = [filesToDelete];
      }
    }
    let currentFiles: { nombre: string; url: string }[] = Array.isArray(management.file) ? [...management.file] : [];
    // Eliminar archivos si se especifican
    if (filesToDelete && Array.isArray(filesToDelete) && filesToDelete.length > 0) {
      for (const fileObj of filesToDelete) {
        let fileName = typeof fileObj === 'object' && fileObj.url ? path.basename(fileObj.url) : fileObj;
        fileName = fileName.split('management/')[1];
        const filePath = path.join(__dirname, '..', '..', 'uploads', 'management', fileName);
        fs.unlink(filePath, (err) => {
          // Ignorar error si el archivo no existe
        });
      }
      currentFiles = currentFiles.filter((fileObj) =>
        !filesToDelete.some((del) =>
          (typeof del === 'object' && del.url && del.url === fileObj.url) ||
          (typeof del === 'string' && del === fileObj.url)
        )
      );
    }
    // Agregar archivos nuevos si se suben
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const serverUrl = req.protocol + '://' + req.get('host');
      const newFiles: { nombre: string; url: string }[] = req.files.map((file: Express.Multer.File) => ({
        nombre: file.originalname,
        url: `${serverUrl}/uploads/management/${file.filename}`
      }));
      currentFiles = [...currentFiles, ...newFiles];
    }
    management.file = currentFiles;
    // --- FIN ajuste archivos ---

    await management.save();
    return res.status(200).send();
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

    const serverUrl = req.protocol + '://' + req.get('host');
    const filesArray = req.files.map((file: Express.Multer.File) => ({
      nombre: file.originalname,
      url: `${serverUrl}/uploads/management/${file.filename}`
    }));
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
    const existingFiles: { nombre: string; url: string }[] = Array.isArray(management.file) ? management.file : [];

    // Delete files from filesystem
    for (const fileObj of filesToDelete) {
      const fileName = typeof fileObj === 'object' && fileObj.url ? path.basename(fileObj.url) : fileObj;
      const filePath = path.join(__dirname, '..', '..', 'uploads', 'management', fileName);
      console.log(`Deleting file: ${filePath}`);
      fs.unlink(filePath, (err) => {
        // Ignore error if file does not exist
      });
    }

    interface FileObject {
      nombre: string;
      url: string;
    }
    type FileToDelete = string | { url: string };

    management.file = existingFiles.filter((fileObj: FileObject) =>
      !filesToDelete.some((del: FileToDelete) =>
      (typeof del === 'object' && del.url && del.url === fileObj.url) ||
      (typeof del === 'string' && del === fileObj.url)
      )
    );

    const updatedManagement = await management.save();
    return res.status(200).json(updatedManagement);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

// Add and/or delete files from a Management entry in a single request
export const updateFilesInManagement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let filesToDelete = req.body.filesToDelete;

    // Pasar filesToDelete a un array si es una cadena
    if (typeof filesToDelete === 'string') {
      try {
        filesToDelete = JSON.parse(filesToDelete);
      } catch {
        filesToDelete = [filesToDelete];
      }
    }
    // Buscar el registro primero
    const management = await Management.findOneBy({ id: parseInt(id) });
    if (!management) {
      return res.status(404).json({ message: 'Management entry not found' });
    }
    let updatedFiles: { nombre: string; url: string }[] = Array.isArray(management.file) ? [...management.file] : [];

    // Eliminar archivos si se especifican
    if (filesToDelete && Array.isArray(filesToDelete) && filesToDelete.length > 0) {
      for (const file of filesToDelete) {
        const filePath = path.join(__dirname, '..', '..', 'uploads', 'management', file);
        fs.unlink(filePath, (err) => {
          // Ignore error if file does not exist
        });
      }
      updatedFiles = updatedFiles.filter((file) => !filesToDelete.includes(file));
    }

    // Agregar archivos si se suben
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const filesArray: { nombre: string; url: string }[] = req.files.map((file: Express.Multer.File) => ({
        nombre: file.originalname,
        url: file.path.replace(/\\/g, '/')
      }));
      updatedFiles = [...updatedFiles, ...filesArray];
    }

    management.file = updatedFiles;
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

// Obtener gestiones con paginación
export const getManagementsPaginated = async (req: Request, res: Response) => {
  try {
    let page = parseInt(req.query.page as string);
    let perPage = parseInt(req.query.perPage as string);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(perPage) || perPage < 1) perPage = 5;

    // Filtros opcionales desde req.body
    const { categoryId, title, description, keywords } = req.body || {};
    const where: any = { deletedAt: IsNull() };
    if (categoryId) where.category = { id: categoryId };
    if (title) where.title = Like(`%${title}%`);
    if (description) where.description = Like(`%${description}%`);

    let data: Management[] = [];
    let total = 0;
    if (keywords && Array.isArray(keywords) && keywords.length > 0) {
      // Convertir keywords a minúsculas
      const lowerKeywords = keywords.map((kw: string) => kw.toLowerCase());
      // QueryBuilder para filtrar por keywords
      const qb = Management.createQueryBuilder('management')
        .leftJoinAndSelect('management.category', 'category')
        .where(where);
      qb.andWhere(
        lowerKeywords
          .map((_, i) => `JSON_CONTAINS(LOWER(JSON_EXTRACT(management.keywords, '$[*]')), :kw${i})`)
          .join(' OR '),
        Object.fromEntries(lowerKeywords.map((kw, i) => [`kw${i}`, `\"${kw}\"`]))
      );
      qb.skip((page - 1) * perPage)
        .take(perPage)
        .orderBy('management.id', 'DESC');
      data = await qb.getMany();
      // Contar total con los mismos filtros
      const countQb = Management.createQueryBuilder('management').where(where);
      countQb.andWhere(
        lowerKeywords
          .map((_, i) => `JSON_CONTAINS(LOWER(JSON_EXTRACT(management.keywords, '$[*]')), :kw${i})`)
          .join(' OR '),
        Object.fromEntries(lowerKeywords.map((kw, i) => [`kw${i}`, `\"${kw}\"`]))
      );
      total = await countQb.getCount();
    } else {
      [data, total] = await Management.findAndCount({
        relations: ['category'],
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        order: { id: 'DESC' },
      });
    }
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

    // Eliminar archivos asociados
    const files: { nombre: string; url: string }[] = Array.isArray(management.file) ? management.file : [];
    for (const fileObj of files) {
      const fileName = typeof fileObj === 'object' && fileObj.url ? path.basename(fileObj.url) : String(fileObj);
      const filePath = path.join(__dirname, '..', '..', 'uploads', 'management', fileName);
      fs.unlink(filePath, (err) => {
        // Ignorar error si el archivo no existe
      });
    }

    // Eliminar registro de la base de datos (delete real)
    await Management.remove(management);
    return res.status(200).send();
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};
