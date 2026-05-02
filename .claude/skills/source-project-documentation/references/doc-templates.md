# Documentation Templates for Source Project Documentation Skill

These templates are used as references when generating documentation for projects. Each template shows the expected structure and content for its corresponding document.

## Template 1: README.md (Project Overview)

```markdown
# Project Name

## Overview

One sentence: What does this project do?

Two sentences: Why does it matter? What problem does it solve?

## Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop (for database)
- [Other requirements]

### Installation
\`\`\`bash
git clone <repo>
cd <project>
npm install
npm run setup  # or equivalent
\`\`\`

### Running Locally
\`\`\`bash
npm run dev
\`\`\`

Runs on http://localhost:3000 (frontend) or http://localhost:3001 (backend)

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18.2.0 |
| Backend | Express.js | 4.18.0 |
| Database | PostgreSQL | 14 |
| ORM | Prisma | 5.0.0 |

## Key Features

- [ ] Feature 1
- [ ] Feature 2
- [ ] Feature 3
- [ ] Feature 4
- [ ] Feature 5

## Architecture

[Link to ARCHITECTURE.md]

## Contributing

1. Create a branch: \`git checkout -b feature/name\`
2. Make changes and test
3. Push and open PR
4. See [DEVELOPMENT.md] for detailed guidelines

## Support

See [TROUBLESHOOTING.md] for common issues and debugging.

---

**Last Updated**: [Date]
\`\`\`

## Template 2: ARCHITECTURE.md (System Design)

System architecture, layers, request flow, key components.

## Template 3: TECH_STACK.md (Technology Details)

Technology choices, versions, justification, dependencies.

## Template 4: DATABASE.md (Schema)

Database schema, ER diagrams, tables, relationships, indexes.

## Template 5: FRONTEND.md (UI/Components)

Component structure, state management, styling, accessibility.

## Template 6: BACKEND.md (API Services)

Architecture, request flow, controllers, services, middleware.

## Template 7: DEPLOYMENT.md (Build & Deploy)

Local development, Docker setup, production build, cloud deployment, CI/CD pipeline.

---

**Last Updated**: May 1, 2026
**Skill Status**: Production-Ready
