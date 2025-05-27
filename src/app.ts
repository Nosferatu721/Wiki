import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import categoryRoutes from './routes/category.routes';
import managementRoutes from './routes/management.routes';

const app = express();

app.use(cors());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/categories', categoryRoutes);
app.use('/api/managements', managementRoutes);

export default app;