import 'reflect-metadata';
import app from './app';
import { AppDataSource } from './db';
import http from 'http';

async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established successfully 👻');
    const PORT = process.env.PORT || 3000;
    // Crear el servidor HTTP con un límite de headers más grande (32MB)
    const server = http.createServer({ maxHeaderSize: 32 * 1024 * 1024 }, app);
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT} 👻`);
    });
  } catch (error) {
    console.error('Error during Data Source initialization:', error);
    process.exit(1);
  }
}

startServer();
