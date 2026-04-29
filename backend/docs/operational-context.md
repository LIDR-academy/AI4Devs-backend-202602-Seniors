# Operational Context
Runtime and tooling:
- Backend scripts: dev, build, test, start, seed, prisma helpers.
- TypeScript config targets es5/commonjs with strict true.
- Jest configured with ts-jest.

Key dependencies and role:
- express/cors/dotenv: HTTP server + CORS + env loading.
- @prisma/client/prisma: ORM and migrations.
- multer: file upload.

API spec alignment status:
- In spec and implemented: POST /candidates, POST /upload.
- Implemented but missing in spec: GET /candidates/:id, GET /.