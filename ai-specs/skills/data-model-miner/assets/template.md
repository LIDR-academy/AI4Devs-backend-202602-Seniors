# Entity Report Template

## Detected Entities

| Entity | File | Type | Confidence | Fields |
|--------|------|------|------------|--------|
| {name} | {file} | {class/interface/type/model} | HIGH/MEDIUM/LOW | {count} |

## Relationships

| From | To | Type | Location |
|------|-----|------|----------|
| {entityA} | {entityB} | {1:1/1:N/N:M} | {file:line} |

## Mermaid ERD

```mermaid
erDiagram
{diagram_content}
```

## Orphan Entities

- {list of entities not linked to any other}

## Validation

- Total entities: {n}
- Total relationships: {n}
- Orphaned: {n}
