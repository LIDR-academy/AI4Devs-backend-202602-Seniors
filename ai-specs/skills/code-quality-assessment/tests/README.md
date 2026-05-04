# Characterization tests for code-quality-assessment skill

These tests document the skill's expected output on known sample codebases.

## Test 1: High-quality codebase (grade A)

**Input**: A small, well-structured Python module with:
- Cyclomatic complexity < 10 per method
- Maintainability index > 80
- Zero duplication
- Full test coverage

**Expected output**:
- overall_score: 90
- grade: "A"
- dimensions.metrics.score: 95

## Test 2: Medium-quality codebase (grade C)

**Input**: A legacy Java service with:
- Cyclomatic complexity 15-25 per method
- Maintainability index 50-70
- 15% duplication
- 60% test coverage

**Expected output**:
- overall_score: 72
- grade: "C"
- dimensions.metrics.score: 65
- dimensions.patterns.score: 70 (god_class detected)

## Test 3: Critical codebase (grade F)

**Input**: A large Rails monolith with:
- Cyclomatic complexity > 30 per method in models
- Maintainability index < 40
- 30% duplication
- 25% test coverage
- Circular dependencies detected

**Expected output**:
- overall_score: 35
- grade: "F"
- technical_debt_minutes: > 30000

## Test 4: Edge case — utility classes

LCOM > 0.5 MUST NOT be flagged as SRP violation for utility/Stateless classes.

## Test 5: Edge case — AHA vs DRY

Intentional duplication for readability SHOULD be flagged as "AHA style" not a smell.
