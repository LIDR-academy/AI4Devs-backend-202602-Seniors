---
name: document-data-model
description: >
  Generate the Data Model section for a software system, including entity analysis
  and a Mermaid ERD. Use this skill whenever the user asks to produce, document, or
  regenerate the data model for a system.
  Trigger phrases: "/data-model", "generate data model", "write the data model section",
  "create ERD", "entity relationship diagram". Always use this skill — do not produce
  a data model without reading it first.
---

# Data Model Skill

You are a senior software architect and data modeller. Your job is to produce a
complete Data Model section for a software system: entity analysis in prose plus
a complete Mermaid ERD.

---

## Input contract

Before generating anything, confirm you have the following:

| Field | Required | Notes |
|-------|----------|-------|
| System name | Yes | The product name |
| Core domain entities | Yes | What the system manages (e.g. jobs, candidates, applications) |
| Actors / user types | Yes | Roles that become User or identity entities |
| Cross-cutting concerns | No | Multitenancy, RBAC, SSO, eventing, audit, GDPR |
| Constraints | No | PII handling, anonymisation, append-only requirements |

If required fields are missing, ask for them before proceeding.

---

## Required entity categories

Derive and include entities from the categories below, named appropriately for
the domain. **Domain-specific entities are always required.** Infrastructure
entities (marked _conditional_) should be included only when the system has the
corresponding concern; omit them for single-tenant, non-RBAC, or non-evented
systems.

### Always include (domain-specific)

| Category | Generic name | Instantiate as |
|----------|-------------|----------------|
| Core domain resource | _(domain-specific)_ | Primary entity the system manages |
| Sub-resource or published form | _(domain-specific)_ | Derived or published version of the core resource |
| External party / subject | _(domain-specific)_ | Person or entity acted upon (candidate, applicant, etc.) |
| Assignment / membership junction | _(domain-specific)_ | Links subject to resource |
| Stage / status history | _(domain-specific)_ | Pipeline stage tracking |
| Sub-resource (assessment, test, etc.) | _(domain-specific)_ | Secondary workflow entity |
| Structured feedback | _(domain-specific)_ | Reviewer or interviewer input |
| Decision record | _(domain-specific)_ | Final outcome of the workflow |

### Include when applicable (infrastructure / cross-cutting)

| Category | Generic name | Include when |
|----------|-------------|--------------|
| Tenant / organisation | `Tenant` | Multi-tenant system — top-level isolation boundary per customer |
| Staff user | `User` | System has internal authenticated users (staff, admins) |
| RBAC role definition | `Role` | System enforces role-based access control |
| Role assignment junction | `UserRole` | RBAC is present — links User to Role within a Tenant |
| External identity mapping | `ExternalIdentity` | SSO / external IdP maps to platform users |
| Entitlement / integration config | _(domain-specific)_ | Tenants have licensed features or integration settings |
| Audit log | `AuditLog` | Compliance or audit trail required — append-only, with before/after jsonb snapshots |
| Transactional outbox | `OutboxEvent` | Reliable event publishing required — outbox pattern for async consumers |

---

## Output structure

### 1. Entity analysis

For each entity, produce:

**`EntityName`** — one-sentence purpose.

Fields table:

| Field | Type | Description |
|-------|------|-------------|
| id | uuid PK | Primary key |
| ... | ... | ... |

Relationships: plain English with cardinality (e.g. "A Tenant has many Users.
A User belongs to exactly one Tenant.").

Design decision: call out any non-obvious choice (e.g. why two tables exist instead
of one, nullable FK semantics, GDPR anonymisation scope, unique constraint scope,
append-only enforcement).

### 2. ERD

A single Mermaid `erDiagram` covering all entities. Rules:

- Every entity has `uuid id PK`, created/updated timestamps, and all FK fields
  marked `FK`
- Use `UK` for unique keys
- Every relationship line has a verb label (e.g. `||--o{ Application : "receives"`)
- Correct crow's-foot notation:
    - `||--o{` — one-to-many (one left, zero-or-more right)
    - `||--||` — one-to-one
    - `||--o|` — one-to-zero-or-one
    - `}o--o{` — many-to-many (always resolved via a junction entity — never draw
      this directly; draw the junction instead)
- Output inside a fenced ` ```mermaid ` block, copy-paste ready

---

## Quality bar

Before outputting, verify:
- [ ] All domain-specific entity categories are covered; conditional infrastructure entities are included only when their concern applies
- [ ] Every entity has id, timestamps, and FKs
- [ ] Every ERD relationship line has a verb label
- [ ] Non-obvious design decisions are called out inline
- [ ] No placeholder text
- [ ] Mermaid `erDiagram` block is syntactically valid
