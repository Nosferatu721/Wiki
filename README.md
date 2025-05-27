# WIKINODE

Este proyecto es una API RESTful construida con Node.js, TypeScript y TypeORM, diseñada para la gestión de categorías y elementos de gestión (Managements) en una base de datos MySQL.

## Características
- Gestión de categorías y elementos de gestión.
- Conexión a base de datos MySQL mediante TypeORM.
- Estructura modular con controladores, rutas y entidades.
- Documentación Swagger disponible.

## Requisitos
- Node.js >= 20.x
- MySQL
- Docker (opcional, para despliegue rápido)

## Instalación
1. Clona el repositorio:
   ```bash
   git clone <https://github.com/Nosferatu721/Wiki>
   cd WIKINODE
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las variables de entorno en un archivo `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=root
   DB_PASSWORD=tu_contraseña
   DB_DATABASE=db_wiki_dev
   ```

## Uso
### Con Node.js
```bash
npm run build
npm start
```

### Con Docker
```bash
docker build -t wikinode .
docker-compose up
```

## Endpoints principales
- `/api/categories` - Gestión de categorías
- `/api/managements` - Gestión de elementos de gestión

## Documentación
La documentación de la API está disponible en `src/docs/swagger.yaml`.

## Estructura del proyecto
```
src/
  app.ts
  db.ts
  index.ts
  controllers/
  docs/
  entities/
  routes/
uploads/
```

## Licencia
MIT
