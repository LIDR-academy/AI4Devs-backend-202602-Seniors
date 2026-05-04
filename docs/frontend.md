# Frontend

Stack declarado: **React 18**, **TypeScript** (tooling CRA), **Bootstrap 5** y **react-router-dom** entre las dependencias de `frontend/package.json`. Punto de entrada: `src/index.tsx`.

## Estructura relevante

| Ruta | Rol |
|------|-----|
| `src/index.tsx` | Montaje de la app en `#root`, `StrictMode`, `reportWebVitals`. |
| `src/App.tsx` | Componente raíz TypeScript (plantilla CRA por defecto: logo y enlace a documentación React). |
| `src/App.js` | Variante JavaScript del mismo nivel; convivencia TS/JS a consolidar en una sola entrada. |
| `src/components/` | UI de negocio en **JavaScript** (`AddCandidateForm.js`, `RecruiterDashboard.js`, `FileUploader.js`, …). |
| `src/services/candidateService.js` | Cliente HTTP hacia la API de candidatos. |

## Arquitectura objetivo (cliente)

Para alinearse con **hexagonal / ports & adapters** en el front:

1. **Adaptadores de salida (driving)**: módulos `api/` o `services/` que encapsulen `fetch`/axios contra el backend; sin URLs dispersas en componentes.
2. **Casos de uso / hooks**: orquestar validación local + llamadas al puerto HTTP; componentes solo renderizan estado y eventos.
3. **Dominio de UI (opcional)**: tipos compartidos con el backend vía paquete común o tipos generados desde OpenAPI (`backend/api-spec.yaml`).

## Estado actual frente al objetivo

- La base **TypeScript** (`App.tsx`, `index.tsx`) está alineada con CRA, pero gran parte de la funcionalidad vive en **`.js`**, lo que reduce garantías de tipo y dificulta interfaces explícitas.
- No hay aún en el árbol analizado un **router** aplicado en `App.tsx`; las dependencias (`react-router-dom`) sugieren evolución hacia navegación por rutas.

## Scripts (`frontend/package.json`)

| Script | Uso |
|--------|-----|
| `npm start` | Desarrollo en `http://localhost:3000` (típico CRA). |
| `npm run build` | Bundle de producción. |
| `npm test` | Jest con `jest.config.js` del proyecto. |

## Integración con el backend

- CORS en el backend permite origen `http://localhost:3000` en la configuración actual de `backend/src/index.ts`.
- Las llamadas desde `src/services/` deben apuntar al host/puerto del API (p. ej. `http://localhost:3010` según el backend por defecto).

## Buenas prácticas recomendadas (sin citar anti-patrones como estándar)

- Migrar componentes críticos a **TypeScript** con props y estados tipados.
- Definir **DTOs** o tipos de respuesta alineados con la API documentada.
- Mantener componentes de presentación **delgados**; extraer lógica a hooks o servicios.
