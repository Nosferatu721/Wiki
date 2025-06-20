import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { Management } from '../entities/Managements';


export const convertServerFileWithLibreOffice = async (req: Request, res: Response) => {
  const { gestionId, url } = req.body;
  if (!gestionId || !url) {
    return res.status(400).json({ message: 'gestionId y url son requeridos' });
  }
  try {
    // Buscar la gestión
    const management = await Management.findOne({ where: { id: gestionId } });
    if (!management) {
      return res.status(404).json({ message: 'Gestión no encontrada' });
    }
    // Buscar el archivo en la gestión
    const fileObj = (management.file || []).find(f => f.url === url);
    if (!fileObj) {
      return res.status(404).json({ message: 'Archivo no encontrado en la gestión' });
    }
    // Obtener la ruta física del archivo
    // Asume que la url es tipo http://host/uploads/management/filename.ext
    const uploadsDir = path.resolve(__dirname, '../../uploads/management');
    const fileName = decodeURIComponent(url.split('/uploads/management/')[1] || '');
    const filePath = path.join(uploadsDir, fileName);
    console.log(`Converting file: ${fileName}`);
    console.log(`fileName: ${fileName}`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo físico no encontrado en el servidor' });
    }
    const outputDir = path.dirname(filePath);
    // Convertir a PDF con LibreOffice
    await new Promise<void>((resolve, reject) => {
      exec(`soffice --headless --convert-to pdf --outdir "${outputDir}" "${filePath}"`, (error, stdout, stderr) => {
        if (error) return reject(stderr || stdout || error);
        resolve();
      });
    });
    const baseName = path.basename(filePath, path.extname(filePath));
    const pdfPath = path.join(outputDir, `${baseName}.pdf`);
    if (!fs.existsSync(pdfPath)) {
      return res.status(500).json({ message: 'No se generó el PDF' });
    }
    res.download(pdfPath, `${baseName}.pdf`, (err) => {
      fs.unlink(pdfPath, () => {});
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al convertir archivo con LibreOffice', error });
  }
};

export const convertBlobWithLibreOffice = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const filePath = req.file.path;
  const outputDir = path.dirname(filePath);
  try {
    await new Promise<void>((resolve, reject) => {
      exec(`soffice --headless --convert-to pdf --outdir "${outputDir}" "${filePath}"`, (error, stdout, stderr) => {
        if (error) return reject(stderr || stdout || error);
        resolve();
      });
    });
    const baseName = path.basename(filePath, path.extname(filePath));
    const pdfPath = path.join(outputDir, `${baseName}.pdf`);
    if (!fs.existsSync(pdfPath)) {
      return res.status(500).json({ message: 'PDF file not generated' });
    }
    res.download(pdfPath, `${baseName}.pdf`, (err) => {
      fs.unlink(pdfPath, () => {});
      fs.unlink(filePath, () => {});
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error converting blob file with LibreOffice', error });
  }
};