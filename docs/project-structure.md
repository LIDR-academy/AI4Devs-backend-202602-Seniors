# Estructura del proyecto

Vista de alto nivel del repositorio. Las rutas son relativas a la raíz del proyecto salvo indicación.

## Raíz

| Ruta | Descripción |
|------|-------------|
| `backend/` | API Node.js + Express + TypeScript + Prisma. |
| `frontend/` | SPA React (Create React App) con TypeScript en el arranque y componentes adicionales en JavaScript. |
| `docker-compose.yml` | Orquestación local de servicios (p. ej. base de datos). |
| `package.json` | Metadatos mínimos en raíz; Prisma apunta a `backend/prisma/schema.prisma`. |
| `README.md` | Documentación general del repositorio. |
| `ai-specs/` | Especificaciones y agentes (fuera del runtime de la app). |
| `.cursor/` | Skills y subagentes del proyecto para Cursor. |

## Backend (`backend/`)

```
backend/
├── api-spec.yaml          # Especificación OpenAPI (referencia de API)
├── jest.config.js
├── package.json           # scripts: dev, build, test, prisma:*
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/        # migraciones versionadas SQL
├── src/
│   ├── index.ts           # entrada Express, middleware, rutas globales
│   ├── routes/
│   │   └── candidateRoutes.ts
│   ├── presentation/
│   │   └── controllers/
│   │       └── candidateController.ts
│   ├── application/
│   │   ├── validator.ts
│   │   └── services/
│   │       ├── candidateService.ts
│   │       └── fileUploadService.ts
│   └── domain/
│       └── models/        # entidades TS (Candidate, Company, …)
├── tsconfig.json
├── .eslintrc.js
└── .prettierrc
```

## Frontend (`frontend/`)

```
frontend/
├── public/                # estáticos CRA (index.html, favicon, …)
├── src/
│   ├── index.tsx          # bootstrap React + StrictMode
│   ├── App.tsx            # componente raíz TypeScript (plantilla por defecto)
│   ├── App.js             # variante JS (convivencia con TS)
│   ├── components/        # UI: formularios, dashboard, subida de ficheros (.js)
│   ├── services/          # cliente API hacia backend (p. ej. candidateService.js)
│   ├── assets/
│   ├── App.css / index.css
│   └── reportWebVitals.ts
├── package.json
└── tsconfig.json
```

## Documentación generada

| Ruta | Contenido |
|------|-----------|
| `docs/architecture.md` | Arquitectura objetivo y mapeo a carpetas. |
| `docs/backend.md` | Convenciones y flujo del backend. |
| `docs/frontend.md` | Estado y convenciones del cliente. |
| `docs/database.md` | Modelo de datos Prisma / PostgreSQL. |
