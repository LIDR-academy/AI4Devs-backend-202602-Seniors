# Role
You are a senior technical writer and frontend architect tasked with applying the **source-project-documentation skill** to produce comprehensive technical documentation for an existing frontend codebase.

# Objective
Using the **source-project-documentation skill**, generate complete, accurate, and exhaustive technical documentation for the `@frontend/` project. The documentation must cover the technology stack, the relationships between components and pages, all key features worth documenting, the architecture, the design patterns identified in the code, and the best practices observed or recommended for the project.

# Context
- **Target project**: `@frontend/` (frontend codebase of the current workspace).
- **Primary audience**: developers who need to understand the frontend project's structure, conventions, and behavior in order to maintain it and build new features confidently.
- **Method**: strictly apply the `source-project-documentation` skill, following its analysis procedure, mandatory sections, Mermaid diagram standards, technology detection rules, key features extraction procedure, deliverable structure, templates, and quality checklists.
- **Source of truth**: the actual content of `@frontend/`. All documentation must be derived from the real code; nothing may be invented or assumed.

# Instructions
1. **Invoke the skill**: apply the `source-project-documentation` skill end-to-end on `@frontend/`.
2. **Analyze the project** following the skill's analysis procedure:
   - Detect project type and frontend stack.
   - Map the directory structure and identify key modules, entry points, routes, pages, components, state stores, services, and assets.
   - Identify business logic and user-facing features from the code.
3. **Produce all mandatory documentation sections** defined by the skill, tailored to a frontend project:
   - **Project overview** (name, purpose, type, high-level summary).
   - **Technology stack** (language, framework, UI libraries, state management, routing, data fetching, styling, testing tools, build tools, linters/formatters, with versions when available — e.g., React, Next.js, Redux/Zustand, React Query, Cypress, Jest, Storybook, Tailwind, Vite).
   - **Architecture overview** with a Mermaid diagram showing main layers/modules and their interactions (UI, state, services, API clients, routing, shared utilities).
   - **Frontend documentation**:
     - Mermaid diagram of **pages and routing** structure.
     - Mermaid diagram of **component hierarchy and relationships** (parent/child, shared/reusable components, layout/providers, state context).
     - Description of state management, data fetching patterns, form handling, validation, and integration with backend APIs.
   - **Key features**: for each feature, provide name, purpose, user-facing description, technical description, involved pages/components, data and APIs touched, step-by-step business logic explanation, a Mermaid flow diagram (sequence diagram or flowchart), and edge cases/error/loading/empty states.
   - **Cross-cutting concerns**: authentication/authorization, configuration, environment variables, internationalization (i18n), accessibility (a11y), theming/styling, error handling, logging/analytics, performance optimizations, testing strategy.
   - **How to run / develop / test the project**: setup, scripts, environments, storybook, test commands.
4. **Document design patterns and best practices** explicitly:
   - **Design patterns identified in the code** (e.g., container/presentational components, hooks composition, provider pattern, render props, HOCs, feature-based folder structure, atomic design, repository/service layer, adapter pattern for APIs). For each pattern: name, where it is used, why, and example reference (file/module).
   - **Best practices observed** in the project (componentization, reusability, separation of concerns, type safety, testing coverage, accessibility, performance, code style).
   - **Recommended best practices** to follow when contributing (naming conventions, file structure, state management rules, API integration rules, testing rules, accessibility rules, commit/PR guidelines if visible).
5. **Apply Mermaid diagram standards** from the skill:
   - Pages/routing → `flowchart` or `graph`.
   - Component hierarchy → `flowchart` or `graph TD`, using subgraphs to group by feature/module.
   - Business logic flows → `sequenceDiagram` or `flowchart`.
   - Respect naming, labeling, grouping, and readability conventions; split diagrams when nodes exceed readability limits.
6. **Apply the technology detection rules** to produce a categorized technology inventory based on real signals (`package.json`, lockfiles, framework configs like `next.config.*`, `vite.config.*`, `angular.json`, test configs like `jest.config`, `cypress.config`, styling solutions, state libraries, type system).
7. **Apply the key features extraction procedure** to identify and document every key feature found in the code, with the required content and a dedicated Mermaid flow diagram per feature.
8. **Follow the final deliverable structure** defined by the skill (single `DOCUMENTATION.md` or `/docs` folder with the prescribed section order and templates).
9. **Run the skill's quality checklists** before finalizing:
   - Completeness (all mandatory sections present, all detected technologies listed, every key feature documented with a diagram, design patterns and best practices sections present).
   - Diagram validity (syntactically valid Mermaid, readable, consistent with the code).
   - Accuracy (documentation matches the actual code; no invented features, technologies, components, or relationships).

# Constraints
- Strictly apply the `source-project-documentation` skill; do not deviate from its procedures, templates, or standards.
- Derive all content from the actual `@frontend/` source code; do not invent technologies, features, components, routes, or relationships.
- Use **Mermaid** as the only diagramming standard.
- Ensure exhaustiveness: every key page, component group, feature, design pattern, and best practice must be covered.
- Keep the documentation strictly within the scope of documenting the frontend project (technologies, components/pages relations, key features, architecture, design patterns, best practices). Do not cover unrelated topics such as backend internals, business strategy, or project management.
- If information cannot be determined from the source code, explicitly mark it as "Not determined from source" rather than guessing.

# Output Format
Structured Markdown deliverable that conforms to the skill's prescribed layout:
1. **Project overview**
2. **Technology stack** (categorized table with versions when available)
3. **Architecture overview** (with Mermaid diagram)
4. **Pages and routing** (with Mermaid diagram and route descriptions)
5. **Component hierarchy and relationships** (with Mermaid diagram and component descriptions)
6. **State management, data fetching, and API integration**
7. **Key features** (one subsection per feature, each with a Mermaid flow diagram)
8. **Design patterns identified** (with locations and rationale)
9. **Best practices observed and recommended**
10. **Cross-cutting concerns** (auth, i18n, a11y, theming, performance, testing, error handling)
11. **Getting started: run, develop, test**
12. **Conventions and where to add new code**
13. **Quality checklist results** (completeness, diagram validity, accuracy)

# Tone
Professional, direct, technical, concrete, and contributor-oriented.