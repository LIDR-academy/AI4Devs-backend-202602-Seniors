---
name: code-quality-assessment
description: >
  Measure codebase health across metrics, design patterns, architecture, and
  programming best practices. Use when user asks to assess, audit, evaluate, or
  measure code quality, health, maintainability, technical debt, or codebase
  wellness. Use when planning refactors, setting quality gates, or scoring
  architecture decisions.
---

# Code Quality Assessment

## When to use

Invoke this skill when user mentions or asks about:
- "assess", "audit", "evaluate", "measure" + codebase/quality/health/maintainability
- "technical debt", "refactor plan", "quality gate"
- "code smells", "SOLID violations", "complexity"
- "duplication", "dependency graph", "coupling"
- "Is my code good?", "code score", "codebase grade"
- "LCOM", "cyclomatic complexity", "maintainability index"
- "God class", "middle man", "shotgun surgery"

Do NOT use when: user wants to fix a specific bug (use triage-issue), or run automated tests directly, or ask for implementation help (use implementation skill).

## Quick start

```
1. Choose assessment scope (file / module / project)
2. Analyze via four dimensions (Metrics · Patterns · Structure · Principles)
3. Generate weighted score with findings and recommendations
```

## Assessment Dimensions

### 1. Code Metrics
- **Complexity**: Cyclomatic (target <10/method), Cognitive (human-aligned)
- **Maintainability**: Maintainability Index (0-100), Technical Debt ratio (A-E)
- **Quality indicators**: Duplication %, Coverage %, Bug count, Security vulnerabilities
- **Churn**: Repeated modifications signal instability

### 2. Design Patterns & SOLID
- **SRP**: Responsibilities per class — multiple reasons to change → divergent change smell
- **OCP**: Modification points when adding features — violation if you must edit existing code
- **LSP**: `instanceof` / type casting → strategy/bridge pattern candidate
- **ISP**: Interface size vs actual usage — fat interfaces forcing unused methods
- **DIP**: `new` keyword in constructors → hardcoded dependencies, DIP violation
- **Pattern health**: Strategy, Adapter, Decorator → good OCP; God components, Middle man → anti-patterns

### 3. Architecture & Structure
- **Clean Architecture**: Domain core with zero I/O dependencies, layers point inward only
- **Coupling**: Afferent/Efferent coupling, Instability (I = Ce/(Ce+Ca)), Distance from Main Sequence
- **Cohesion**: LCOM >0.5 → SRP violation; RFC >50 → too many responsibilities
- **Boundaries**: No circular deps, acyclic dependency graph, clear module ownership
- **Structure**: Folder depth <4 levels, feature-based grouping vs type-based

### 4. Programming Principles
- **DRY**: Same knowledge in multiple places — WET alternatives acceptable (AHA principle)
- **KISS**: Complex contraptions vs simple solutions — look for Rube Goldberg patterns
- **YAGNI**: Speculative functionality added "just in case" → YAGNI violation
- **Naming**: Consistency, clarity, language-idiomatic patterns
- **Error handling**: Fail-fast, no exception swallowing, meaningful context in errors
- **Documentation**: Accuracy, maintenance (docs as code), completeness

## Workflow

```
sudo
workflow:
  name: "code-quality-assessment"
  description: "Multi-dimensional codebase health audit"
  goals:
    - "Cover all four quality dimensions systematically"
    - "Produce actionable findings with confidence levels"
    - "Weight findings by severity and blast radius"
  steps:
    - id: "define_scope"
      description: "Confirm target (file/module/project) and assessment depth"
      action_type: "clarify"
      inputs: ["target", "depth"]
      outputs:
        - name: "scope"
          type: "object"
      details: "Ask user to confirm scope if ambiguous. File = single file; module = directory/component; project = full codebase. Depth determines analysis thoroughness."
    - id: "analyze_metrics"
      description: "Run metric analysis: complexity, maintainability, duplication, coverage"
      action_type: "explore"
      inputs: ["scope"]
      outputs:
        - name: "metric_findings"
          type: "object"
      details: "Use complexity tools (e.g., Radon, SonarQube). Target: cyclomatic <10, maintainability >70, duplication <5%, coverage >80%. Record churn for repeated modifications."
    - id: "analyze_patterns"
      description: "Evaluate SOLID adherence, pattern usage, smell detection"
      action_type: "explore"
      inputs: ["scope"]
      outputs:
        - name: "pattern_findings"
          type: "object"
      details: "Check each SOLID principle. Look for: God components (>500 LOC), Middle man (excessive delegation), shotgun surgery (too many dependencies). Use 'instanceof' count as LSP proxy."
    - id: "analyze_structure"
      description: "Audit folder structure, layering, coupling, boundary violations"
      action_type: "explore"
      inputs: ["scope"]
      outputs:
        - name: "structure_findings"
          type: "object"
      details: "Build dependency graph. Check for cycles. Calculate afferent/efferent coupling. Instability = Ce/(Ce+Ca). Clean Architecture: domain core with zero I/O deps."
    - id: "analyze_principles"
      description: "Check DRY/KISS/YAGNI, naming, error handling, documentation"
      action_type: "explore"
      inputs: ["scope"]
      outputs:
        - name: "principle_findings"
          type: "object"
      details: "Flag AHA vs DRY conflicts (intentional duplication is OK). KISS: detect Rube Goldberg patterns. YAGNI: require evidence of 'just in case' intent. Naming: consistency + clarity."
    - id: "synthesize"
      description: "Merge all findings, weight by severity, produce weighted score"
      action_type: "reason"
      inputs: ["metric_findings", "pattern_findings", "structure_findings", "principle_findings"]
      outputs:
        - name: "assessment_report"
          type: "object"
```

## Constraints

- **MUST** confirm assessment scope (file/module/project) before analysis
- **MUST** cover all four dimensions (Metrics · Patterns · Structure · Principles)
- **MUST** produce findings with confidence levels (High/Medium/Low)
- **MUST** weight findings by severity and blast radius
- **MUST** fail fast on circular dependency boundary violations
- **MUST NOT** report LCOM >0.5 as violation for utility/Stateless classes
- **MUST NOT** use subjective quality terms ("bad", "ugly", "wrong") without specific metric evidence
- **MUST NOT** flag AHA-style intentional duplication as DRY violation
- **SHOULD** flag AHA principle conflicts with DRY when duplication is intentional
- **SHOULD** flag speculative YAGNI violations with evidence of "just in case" intent
- **SHOULD** provide specific threshold references (e.g., "complexity >20" not just "high complexity")
- **SHOULD** suggest remediation action for each critical/high severity finding

## Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `target` | string | Yes | File path, module path, or project root to assess |
| `depth` | string | No | `file`, `module`, or `project` (default: `module`) |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `assessment_report` | object | Full report with overall_score, grade, dimensional scores, findings |
| `scope` | object | Confirmed scope with depth level |
| `metric_findings` | object | Complexity, maintainability, duplication, coverage results |
| `pattern_findings` | object | SOLID violations, pattern usage, smells detected |
| `structure_findings` | object | Folder structure, layering, coupling, boundary analysis |
| `principle_findings` | object | DRY/KISS/YAGNI violations, naming issues |

## Output Format

```json
{
  "overall_score": 0-100,
  "grade": "A"-"F",
  "dimensions": {
    "metrics": { "score": 0-100, "findings": [], "critical_issues": [] },
    "patterns": { "score": 0-100, "findings": [], "violations": [] },
    "structure": { "score": 0-100, "findings": [], "boundary_violations": [] },
    "principles": { "score": 0-100, "findings": [], "smells": [] }
  },
  "top_5_issues": [{ "issue": "", "severity": "critical|high|medium", "dimension": "", "recommendation": "" }],
  "technical_debt_minutes": 0,
  "next_steps": []
}
```

## Scoring Weights

| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| Metrics | 25% | Objective, tool-measurable |
| Patterns | 25% | Long-term maintainability impact |
| Structure | 25% | Architectural foundations |
| Principles | 25% | Day-to-day code quality |

## Confidence Levels

- **High**: Direct evidence (tool output, explicit pattern match)
- **Medium**: Inference from indirect signals
- **Low**: Heuristic assumption, needs manual verification

## Gotchas

- **Circular dependency boundary violations**: fail fast — detect cycles via dependency graph traversal, do not proceed with analysis
- **LCOM >0.5 false positives**: utility/Stateless classes often have low cohesion by design — do NOT flag them as SRP violations
- **AHA principle conflicts with DRY**: intentional duplication (copy-paste for readability, performance) may conflict with strict DRY — flag as "AHA style" not a smell
- **YAGNI speculative violations**: require evidence of "just in case" intent; do not flag forward-looking design that has documented rationale

## See also

See [refs/dimensions.md](refs/dimensions.md) for detailed metric definitions and thresholds.
See [refs/scoring.md](refs/scoring.md) for scoring algorithms and grade boundaries.