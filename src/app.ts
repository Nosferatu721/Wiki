import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import categoryRoutes from './routes/category.routes';

const app = express();

app.use(cors());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/categories', categoryRoutes);

export default app;