import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';
import categoryRoutes from './routes/category.routes';
import managementRoutes from './routes/management.routes';
import errorRoutes from './routes/error.routes';

const app = express();

// Confía en el proxy para obtener el protocolo real (http/https)
app.set('trust proxy', true);

app.use(cors());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/categories', categoryRoutes);
app.use('/api/managements', managementRoutes);
app.use('/api/errors', errorRoutes);

// Swagger configuration
const file = fs.readFileSync('./src/docs/swagger.yaml', 'utf8');
const swaggerDocument = YAML.parse(file);
// Ruta para la documentación Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default app;
