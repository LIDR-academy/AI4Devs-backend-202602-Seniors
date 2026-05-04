# Data Model Miner — Detailed Bash Commands

## Entity Extraction Commands

### TypeScript/JavaScript
```bash
# Find TypeScript entity files
rg -t ts -t tsx "(class|interface|type|model|schema)" --files-with-matches | head -50

# Extract TypeScript entities with line numbers
rg -t ts -t tsx "(class|interface|type|model|schema)\s+(\w+)" --line-number -o -A 20

# Find TypeScript interfaces specifically
rg -t ts "interface\s+\w+" --line-number -o -A 10

# Find TypeScript classes
rg -t ts "class\s+\w+" --line-number -o -A 15
```

### Python
```bash
# Find Python entity files
rg -t py "(class.*Model|class.*Table|Base|declarative)" --files-with-matches | head -50

# Extract SQLAlchemy models
rg -t py "class.*\(Base\)" --line-number -o -A 20

# Find Django models
rg -t py "class.*\(models\.Model\)" --line-number -o -A 15

# Find SQLAlchemy Table definitions
rg -t py "Table\(" --line-number -o -A 5
```

### Go
```bash
# Find Go struct/entity files
rg -t go "type\s+\w+\s+struct" --files-with-matches | head -50

# Extract Go structs with fields
rg -t go "type\s+\w+\s+struct" --line-number -o -A 30

# Find Go interfaces
rg -t go "type\s+\w+\s+interface" --line-number -o -A 10
```

### Prisma
```bash
# Find Prisma schema files
rg "model\s+\w+\s*{" --type-add 'prisma:*.prisma' -t prisma --files-with-matches

# Extract Prisma models
rg "model\s+\w+\s*{" --type prisma --line-number -o -A 30

# Find Prisma relations
rg "@relation|@id|@default" --type prisma --line-number -o
```

### SQLAlchemy
```bash
# Extract SQLAlchemy models
rg "class.*\(Base\)" --type py --line-number -o -A 20

# Find Column definitions
rg "Column\(" --type py --line-number -o -A 3

# Find relationship definitions
rg "relationship\(" --type py --line-number -o -A 3
```

## Relationship Detection

```bash
# Find foreign keys
rg "(ForeignKey|@Column|references)" --line-number -o

# Find ORM relationships
rg "(@OneToMany|@ManyToOne|@ManyToMany|belongsTo|hasMany|oneToOne)" --line-number -o

# Find join tables
rg "(join| Junction| join_table)" --line-number -o
```

## Full Mining Pipeline

```bash
#!/bin/bash
# Complete data model mining pipeline

set -e

LANG="${1:-ts}"
OUTPUT_DIR="${2:-data-model}"

mkdir -p "$OUTPUT_DIR"

echo "=== Step 1: Detect language/stack ==="
rg "package\.json|cargo\.toml|go\.mod|requirements\.txt" -t none -o | head -5

echo "=== Step 2: Find entity files ==="
rg -t "$LANG" "(class|interface|type|model|schema|entity)" --files-with-matches > "$OUTPUT_DIR/entity-files.txt"
cat "$OUTPUT_DIR/entity-files.txt"

echo "=== Step 3: Extract entities with fields ==="
rg -t "$LANG" "(class|interface|type|model|schema)\s+(\w+)" --line-number -o -A 20 > "$OUTPUT_DIR/entities.txt"

echo "=== Step 4: Find relationships ==="
rg "(ForeignKey|@Column|@OneToMany|@ManyToOne|relation|references)" --line-number -o > "$OUTPUT_DIR/relations.txt"

echo "=== Step 5: Generate Mermaid ERD ==="
# Use extracted data to generate Mermaid syntax

echo "Done. Outputs in $OUTPUT_DIR/"
```

## Validation Commands

```bash
# Count entities per file
rg "class\s+\w+" -t "$LANG" --line-number | cut -d: -f1 | sort | uniq -c | sort -rn

# Find files with most entities
rg "class\s+\w+" -t "$LANG" --line-number | cut -d: -f1 | sort | uniq -c | sort -rn | head -20

# Check for orphaned entities (entities not referenced by any relationship)
rg "(ForeignKey|@Column|references)" --line-number -o | grep -oE '\w+' | sort | uniq > relations.txt
rg "class\s+\w+" --type "$LANG" --line-number -o | grep -oE '(class|interface|type)\s+\w+' | awk '{print $2}' | sort | uniq > entities.txt
comm -23 entities.txt relations.txt
```

## Output Format Commands

```bash
# Generate entity list Markdown
echo "| Entity | Type | Fields |" > entities.md
echo "|--------|------|--------|" >> entities.md
rg "(class|interface|type)\s+(\w+)" --type "$LANG" -o | awk '{print "| " $3 " | - | - |"}' >> entities.md

# Generate relationships Markdown
echo "| Entity A | Relation | Entity B |" > relations.md
echo "|----------|----------|----------|" >> relations.md
# Add relationship entries

# Extract Mermaid from existing diagrams
rg "erDiagram" -A 50 --type-add 'mermaid:*.mermaid' -t mermaid --line-number -o
```