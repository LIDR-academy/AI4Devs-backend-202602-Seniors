# Development Guide

This guide provides step-by-step instructions for setting up the development environment and running tests for the LTI ATS system.

## Prerequisites

Ensure you have the following installed:

- **Node.js** v18 or higher
- **npm** v9 or higher
- **Docker** and **Docker Compose**
- **Git**

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd AI4Devs-lab-ides-202602-Seniors
```

---

## 2. Start the Database

The project uses Docker to run PostgreSQL. From the project root:

```bash
docker-compose up -d
```

The database will be available at:

| Property | Value |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `LTIdb` |
| Username | `LTIdbUser` |
| Password | *(see `backend/.env`)* |

---

## 3. Backend Setup

### Environment configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in the required variables:

```env
DB_USER=LTIdbUser
DB_PASSWORD=<your_db_password>
DB_NAME=LTIdb
DB_PORT=5432
DATABASE_URL="postgresql://LTIdbUser:<your_db_password>@localhost:5432/LTIdb"
PORT=3010
FRONTEND_URL=http://localhost:3000

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<at_least_32_random_bytes>

CV_UPLOAD_DIR=./uploads/cvs
CV_MAX_SIZE_BYTES=5242880
```

> **Security**: `JWT_SECRET` is required. The `.env` file is git-ignored and must never be committed.

### Install, migrate, and seed

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Apply all database migrations
npx prisma migrate deploy

# Seed development data (creates recruiter user + sample candidate)
NODE_ENV=development npx prisma db seed
```

Default seeded credentials:

| Email | Password |
|---|---|
| `recruiter@example.com` | `recruiter123` |

### Start the development server

```bash
npm run dev
```

The backend API will be available at `http://localhost:3010`.  
Swagger UI: `http://localhost:3010/api-docs`

---

## 4. Frontend Setup

### Environment configuration

Create `frontend/.env` (or edit the existing one):

```env
REACT_APP_API_URL=http://localhost:3010
```

### Install and start

```bash
cd frontend
npm install
npm start
```

The frontend application will be available at `http://localhost:3000`.

---

## 5. Running Tests

### Backend

```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Frontend

```bash
cd frontend

# Run all unit and component tests
npm test
```

---

## 6. Database Maintenance

```bash
cd backend

# Apply pending migrations (production-safe)
npx prisma migrate deploy

# Create a new migration after schema changes
npx prisma migrate dev --name <migration_name>

# Reset database: drop, recreate, migrate, and re-seed (development only)
NODE_ENV=development npx prisma migrate reset
```

---

## 7. Authentication Flow (development reference)

1. Start both backend and frontend servers.
2. Open `http://localhost:3000` — the app redirects to `/login`.
3. Log in with `recruiter@example.com` / `recruiter123`.
4. The backend issues a short-lived JWT access token (15 min) returned in the response body, and an `HttpOnly` refresh-token cookie (7 days).
5. The frontend stores the access token in memory only. On page reload, it silently calls `POST /api/v1/auth/refresh` to restore the session.

### Auth endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Authenticate with `{ email, password }` |
| `POST` | `/api/v1/auth/refresh` | Exchange refresh cookie for new access token |
| `POST` | `/api/v1/auth/logout` | Clear refresh cookie |
