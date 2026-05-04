# Backend

Stack: **Node.js**, **TypeScript**, **Express**, **Prisma** sobre **PostgreSQL**. Código principal en `backend/src/`.

## Scripts (`backend/package.json`)

| Script | Uso |
|--------|-----|
| `npm run dev` | Desarrollo con recarga (`ts-node-dev`). |
| `npm run build` | Compilación TypeScript → `dist/`. |
| `npm start` | Ejecuta `dist/index.js` (tras build). |
| `npm test` | Jest. |
| `npx prisma generate` | Regenera el cliente Prisma tras cambios de esquema. |

Puerto HTTP por defecto en `src/index.ts`: **3010** (comprobar en despliegues).

## Superficie HTTP relevante

| Método y ruta | Comportamiento documentado |
|---------------|------------------------------|
| `GET /` | Respuesta de comprobación (“health” simple en texto). |
| `POST /candidates` | Alta de candidato (cuerpo JSON según validador y modelo de dominio). |
| `GET /candidates/:id` | Consulta de candidato por identificador numérico. |
| `POST /upload` | Subida de fichero (PDF/DOCX según configuración del servicio de subida). |

La descripción detallada de contratos vive también en `backend/api-spec.yaml` cuando esté alineada con la implementación.

## Capas y responsabilidades (objetivo vs repo)

### Presentación (`presentation/controllers/`)

**Objetivo**: controladores delgados; solo adaptación HTTP → llamada a aplicación y mapeo de errores a status.

**Referencia útil en el repo**: `candidateController.ts` delega en `addCandidate` / `findCandidateById` del servicio de aplicación y maneja errores con respuestas JSON. Mejora deseable: unificar con las rutas para no duplicar manejo de errores (ver `routes/candidateRoutes.ts`, que contiene lógica adicional en el `POST`).

### Aplicación (`application/`)

**Objetivo**: orquestación, validación de entrada, coordinación de agregados; dependencia de **puertos** (interfaces), no del cliente Prisma.

**Referencias útiles**:

- `validator.ts`: validaciones de nombre, email, teléfono, fechas, educación, experiencia y CV antes de persistir. *Nota de calidad*: varias firmas usan `any`; el objetivo es sustituirlas por tipos explícitos.

- `candidateService.ts`: valida con `validateCandidateData`, construye entidades de dominio y persiste en secuencia (candidato, educaciones, experiencias, CV). No importa `@prisma/client` directamente; delega en métodos `save()` de modelos. *Nota*: el servicio traduce códigos Prisma (`P2002`) a errores de negocio en un `catch` — en arquitectura hexagonal estricta, esa traducción viviría en un adaptador de salida, no en el caso de uso.

**Excluido como guía de capa de aplicación**: `fileUploadService.ts` acopla **Multer** y **Express** (`Request`/`Response`) dentro de `application/services/`. En el diseño objetivo, la configuración Multer y el handler HTTP deberían vivir en adaptadores de entrada (p. ej. middleware + ruta), y la aplicación solo recibiría metadatos ya extraídos (nombre, mime, buffer o ruta temporal tipada).

### Dominio (`domain/models/`)

**Objetivo**: entidades ricas, invariantes y factories sin Prisma ni Express.

**Estado actual**: los modelos bajo `domain/models/` utilizan `PrismaClient` y lógica de persistencia incrustada (p. ej. `save()`, `findOne()`). Eso es un **active record** anidado en la carpeta “domain”; para documentación de **patrón recomendado**, trátelo como deuda conocida: el dominio puro debería moverse a clases sin ORM y los repositorios implementarse en `infrastructure/` o equivalente.

## Composición (`src/index.ts`)

Registra `express.json()`, CORS hacia el origen del frontend en desarrollo, prefijo `/candidates`, ruta `/upload` y middleware de registro de peticiones. También adjunta `PrismaClient` a `req` mediante ampliación de tipos de Express — patrón conveniente para prototipos pero acoplado; en hexagonal estricto el cliente Prisma se inyectaría solo en adaptadores de salida, no en cada request.

## Calidad y pruebas

- ESLint y Prettier configurados en `backend/` (ver `.eslintrc.js`, `.prettierrc`).
- Tests con Jest (`jest.config.js`); al añadir casos de uso nuevos, colocar pruebas junto a la convención ya usada en el proyecto.

## Seguridad operativa

- No versionar secretos ni URLs con credenciales en `schema.prisma`; usar variable de entorno (`DATABASE_URL`) y `.env` local ignorado por Git (ver `database.md`).
