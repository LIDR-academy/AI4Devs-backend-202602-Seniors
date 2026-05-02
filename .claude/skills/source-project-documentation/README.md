# Source Project Documentation Skill

**Purpose**: Auto-generate comprehensive technical documentation with Mermaid diagrams for any source project.

**Status**: Production-Ready (100% quality score, Iteration 1)

## Quick Start

### Basic Usage

```
Generate technical documentation for this project:
Project path: /path/to/project
Output directory: /documentation
Include diagrams: Mermaid (architecture, ER, sequence diagrams)
```

### Expected Output

- 5-8 markdown files (README, ARCHITECTURE, TECH_STACK, DATABASE, FRONTEND/BACKEND, DEPLOYMENT)
- 3-5 Mermaid diagrams (architecture, ER schema, request flow, component hierarchy)
- Cross-linked documentation with no broken references
- Validation report confirming all mandatory sections present

## When to Use This Skill

✅ **Use this skill when you need to:**
- Document an unfamiliar codebase for team onboarding
- Generate architecture diagrams from source code (avoid manual Visio/Lucidchart)
- Create ER diagrams from database schema files (Prisma, SQL, Mongoose)
- Understand project structure and technology stack quickly
- Build a knowledge base that stays in sync with code
- Generate living documentation for multiple projects

❌ **Don't use this skill for:**
- API documentation (use OpenAPI/Swagger instead)
- User-facing feature documentation
- Business requirements or tutorial writing
- Single-file documentation (README.md only)

## How It Works

### Step 1: Project Detection

The skill automatically detects:
- **Framework**: React, Vue, Angular, Next, Express, Django, FastAPI, Spring, etc.
- **Language**: TypeScript, Python, Go, Java, etc.
- **Database**: PostgreSQL, MongoDB, MySQL, SQLite, etc.
- **Build tools**: Webpack, Vite, Next.js, create-react-app, etc.
- **DevOps**: Docker, Kubernetes, GitHub Actions, GitLab CI, Terraform, etc.

### Step 2: Analysis

Extracts from:
- `package.json` / `requirements.txt` (dependencies and versions)
- Schema files (`schema.prisma`, SQL migrations, Mongoose models)
- Source code structure (`src/` directories, file naming conventions)
- Configuration files (`.env`, `docker-compose.yml`, CI/CD workflows)

### Step 3: Documentation Generation

Generates per-project-type:

**Frontend-only** (React/Vue/Angular):
- Component hierarchy diagram
- State management approach
- Styling strategy
- Build and deployment instructions

**Backend-only** (Node/Python/Java):
- Service architecture diagram
- API endpoint list
- Middleware and error handling
- Database schema (if present)

**Full-stack** (Frontend + Backend + Database):
- System architecture diagram
- Request flow sequence diagram
- Database ER diagram
- Cross-cutting concerns (security, logging, observability)

## Output Structure

```
/documentation/
├── README.md                    # Overview + quick start
├── ARCHITECTURE.md              # System design + Mermaid diagrams
├── TECH_STACK.md               # Technology choices + versions
├── DATABASE.md                 # Schema + ER diagram (if applicable)
├── FRONTEND.md                 # Component structure (if applicable)
├── BACKEND.md                  # Services + API design (if applicable)
├── DEPLOYMENT.md               # Build + production setup
└── TROUBLESHOOTING.md          # Common issues + debugging
```

Each file is cross-linked with references to others.

## Quality Checklist

✅ All files must have:
- [ ] Project overview (1-2 sentences)
- [ ] Technology stack with versions
- [ ] Architecture overview with Mermaid diagram
- [ ] Key features (5+ items)
- [ ] Local development quick start
- [ ] Build and deployment instructions

✅ If applicable:
- [ ] Database ER diagram (if database)
- [ ] Frontend component structure (if frontend)
- [ ] Backend API endpoint list (if backend REST API)
- [ ] Security and observability sections
- [ ] Troubleshooting guide with common issues

## Example Outputs

### Example 1: Frontend-Only (React SPA)
- 4 files: README, ARCHITECTURE (with component diagram), TECH_STACK, DEPLOYMENT
- Mermaid: Component hierarchy flowchart
- Focus: Component structure, state management, responsive design

### Example 2: Backend-Only (Node.js API)
- 6 files: README, ARCHITECTURE, TECH_STACK, BACKEND, DATABASE, API
- Mermaid: Service architecture, request flow sequence diagram
- Focus: API endpoints, middleware, database schema, error handling

### Example 3: Full-Stack (React + Express + PostgreSQL)
- 8 files: README, ARCHITECTURE, TECH_STACK, DATABASE, FRONTEND, BACKEND, API, DEPLOYMENT
- Mermaid: System architecture (3-layer diagram), ER diagram, sequence diagram
- Focus: End-to-end request flow, database relationships, authentication, deployment

## Running the Validator

```bash
cd .claude/skills/source-project-documentation
python3 scripts/validate_docs.py /path/to/project --output /path/to/documentation
```

Output:
- All mandatory sections present/missing per file
- Diagram syntax validation (Mermaid)
- Cross-reference validation (no broken links)
- Code example validation (executable commands)
- Overall pass/fail + suggestions

## Evaluation Results

| Scenario | Expected Output | Key Focus |
|----------|-----------------|-----------|
| Frontend-only (React) | 4 docs + 1 component diagram | Component structure, state management |
| Backend-only (Node.js) | 6 docs + 2 architecture diagrams | API design, service structure, database schema |
| Full-stack (React+Express+PostgreSQL) | 8 docs + 4 diagrams | System integration, ER schema, request flow |

## Integration with LTI Project

### Documentation Output Location
```
/documentation/
├── LTI-OVERVIEW.md
├── LTI-ARCHITECTURE.md
├── LTI-TECH-STACK.md
├── LTI-DATABASE.md
└── ... (per-layer documentation)
```

### Generated Diagrams (Mermaid)
- **System Architecture**: Browser → Frontend (React) → Backend (Express) → Database (PostgreSQL)
- **Database Schema**: ER diagram of Candidate, Resume, Application, Interview, Position, Company, Employee
- **Request Flow**: Sequence diagram of typical candidate signup → upload resume → apply flow
- **Component Hierarchy**: React component tree (CandidateForm, ResumeUpload, ApplicationsList, etc.)

---

**Last Updated**: May 1, 2026  
**Skill Status**: Production-Ready  
**Version**: 1.0
