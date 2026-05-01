# Role
You are a senior technical writer and software architect tasked with applying the **source-project-documentation skill** to produce onboarding-grade documentation for an existing backend codebase.

# Objective
Using the **source-project-documentation skill**, generate complete, accurate, and exhaustive technical documentation for the `@backend/` project. The documentation must enable a new developer to fully understand the source code and become productive in maintaining the project and developing new features, with no additional context required.

# Context
- **Target project**: `@backend/` (backend codebase of the current workspace).
- **Primary audience**: a new developer joining the project who must quickly understand the architecture, data model, business logic, and conventions in order to perform maintenance and build new features.
- **Method**: strictly apply the `source-project-documentation` skill, following its analysis procedure, mandatory sections, Mermaid diagram standards, technology detection rules, key features extraction procedure, deliverable structure, templates, and quality checklists.
- **Source of truth**: the actual content of `@backend/`. All documentation must be derived from the real code; nothing may be invented or assumed.

# Instructions
1. **Invoke the skill**: apply the `source-project-documentation` skill end-to-end on `@backend/`.
2. **Analyze the project** following the skill's analysis procedure:
   - Detect project type and stack.
   - Map the directory structure and identify key modules, entry points, services, models, and data stores.
   - Identify business logic and key features from the code.
3. **Produce all mandatory documentation sections** defined by the skill, ensuring each is tailored to a backend project and to a new-developer audience:
   - **Project overview** (name, purpose, type, high-level summary).
   - **Technology stack** (language, framework, libraries, testing tools, build tools, infrastructure, with versions when available).
   - **Architecture overview** with a Mermaid diagram of main modules and their interactions.
   - **Database documentation** with a Mermaid `erDiagram` of the schema, entity descriptions, key fields, indexes, constraints, and migration notes.
   - **Backend documentation** with a Mermaid diagram of services/modules and their dependencies, plus a complete table of API endpoints (method, path, purpose, request/response contracts), background jobs, schedulers, and integrations.
   - **Key features**: for each feature, provide name, purpose, entry points, involved modules, data touched, step-by-step business logic explanation, a Mermaid flow diagram (sequence diagram or flowchart), and edge cases/error handling.
   - **Cross-cutting concerns**: authentication/authorization, configuration, environment variables, logging, monitoring, error handling, testing strategy.
   - **How to run / develop / test the project**: setup, scripts, environments.
4. **Apply Mermaid diagram standards** from the skill:
   - `erDiagram` for the database.
   - `flowchart` / `graph LR` for backend services/modules.
   - `sequenceDiagram` or `flowchart` for business logic flows.
   - Respect naming, labeling, grouping, and readability conventions; split diagrams when nodes exceed readability limits.
5. **Apply the technology detection rules** to produce a categorized technology inventory based on real signals found in the project (manifests, lockfiles, framework imports, infra files).
6. **Apply the key features extraction procedure** to identify and document every key feature found in the code, with the required content and a dedicated Mermaid flow diagram per feature.
7. **Tailor the documentation explicitly to onboarding**:
   - Add a "Getting started for new developers" section with environment setup, local run, test execution, and first-contribution guidance.
   - Highlight conventions, code organization patterns, and where to add new features or fixes.
   - Point to the most relevant modules and files for typical maintenance tasks.
8. **Follow the final deliverable structure** defined by the skill (single `DOCUMENTATION.md` or `/docs` folder with the prescribed section order and templates).
9. **Run the skill's quality checklists** before finalizing:
   - Completeness (all mandatory sections present, all detected technologies listed, every key feature documented with a diagram).
   - Diagram validity (syntactically valid Mermaid, readable, consistent with the code).
   - Accuracy (documentation matches the actual code; no invented features, technologies, or relationships).

# Constraints
- Strictly apply the `source-project-documentation` skill; do not deviate from its procedures, templates, or standards.
- Derive all content from the actual `@backend/` source code; do not invent technologies, features, endpoints, entities, or relationships.
- Use **Mermaid** as the only diagramming standard.
- Ensure the documentation is exhaustive: every key module, entity, endpoint, and feature must be covered.
- Keep the documentation focused on enabling a new developer to maintain the project and develop new features; do not include unrelated content (project management, business strategy, marketing, etc.).
- If information cannot be determined from the source code, explicitly mark it as "Not determined from source" rather than guessing.

# Output Format
Structured Markdown deliverable that conforms to the skill's prescribed layout:
1. **Project overview**
2. **Technology stack** (categorized table with versions when available)
3. **Architecture overview** (with Mermaid diagram)
4. **Database documentation** (with Mermaid `erDiagram` and entity descriptions)
5. **Backend modules & services** (with Mermaid diagram and endpoints table)
6. **Key features** (one subsection per feature, each with a Mermaid flow diagram)
7. **Cross-cutting concerns**
8. **Getting started for new developers** (setup, run, test, contribution guidance)
9. **Conventions and where to add new code** (maintenance and feature-development guidance)
10. **Quality checklist results** (completeness, diagram validity, accuracy)

# Tone
Professional, direct, technical, concrete, and onboarding-oriented.