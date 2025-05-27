import 'reflect-metadata';
import app from './app';
import { AppDataSource } from './db';

async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established successfully 👻');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT} 👻`);
    });
  } catch (error) {
    console.error('Error during Data Source initialization:', error);
    process.exit(1);
  }
}

startServer();
