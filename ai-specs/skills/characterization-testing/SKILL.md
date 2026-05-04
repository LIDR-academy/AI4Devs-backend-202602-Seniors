---
name: characterization-testing
description: >
  Document existing code behavior with characterization tests before refactoring or fixing bugs.
  Use when user says "characterization", "characterization tests", "document current behavior",
  "legacy tests", "capture current behavior", "write tests for legacy code", or
  "I need to understand what this code actually does before changing it."
---

# Characterization Testing

## Purpose

Create tests that **capture current behavior** (even if buggy/wrong) before making changes. These tests serve as a
**behavioral snapshot**: they encode what the code *does*, not what it *should* do. After characterization,
the codebase is safe to refactor because the test suite regresses any unintended behavior change.

## Quick start

```
1. Identify the target module / file / function to characterize
2. Explore the code: read implementation, trace call paths, note edge cases
3. Generate tests that reproduce observed behavior — never assume intended behavior
4. Label characterization tests clearly: // CHARACTERIZATION: ...
5. Verify tests pass against current implementation
6. Proceed to refactor/fix with confidence
```

## When to use

- **Before any refactor** of untested legacy code
- **Before fixing bugs** in code you don't fully understand
- **Onboarding to a new codebase** module
- **Contract考古** (understanding what an API actually guarantees vs. what docs claim)
- **Dangerous merge/regression risk** — characterize first, change second

## When not to use

- Code already has solid test coverage (use TDD instead)
- You're certain about the behavior and just need to add a feature (use TDD)
- The code is genuinely new (use TDD / test-first)

## Workflow

```
sudo
workflow:
  name: "characterization-testing"
  description: "Agent reasoning + code exploration to document current behavior as tests"
  goals:
    - "Explore target code thoroughly via code inspection"
    - "Identify all observable behaviors, side effects, and edge cases"
    - "Generate tests that reproduce those behaviors"
    - "Label tests as CHARACTERIZATION to flag legacy/buggy behavior"
    - "Verify tests pass against current implementation"
  non_goals:
    - "Fix or change the implementation"
    - "Write tests for desired/ideal behavior"
    - "Replace tdd skill — this is pre-refactor documentation only"
  steps:
    - id: "locate_target"
      description: "Identify the exact file/module/function to characterize"
      action_type: "agent"
      outputs:
        - name: "target_paths"
          type: "List[string]"
      gotcha: "File paths may be wrong if code uses dynamic imports, symlinks, or generated modules — verify paths resolve before proceeding"

    - id: "explore_code"
      description: "Explore all paths, side effects, dependencies, and observable behaviors"
      action_type: "agent"
      inputs: ["target_paths"]
      outputs:
        - name: "behavior_map"
          type: "Map[string, List[string]]"
      gotcha: "Behavior may be non-deterministic (timestamps, UUIDs, randoms, time-based caches) — always run twice to detect volatility before labeling as stable"

    - id: "detect_volatility"
      description: "Detect and mask non-deterministic behavior (timestamps, random IDs, UUIDs, time-based values, volatile caches)"
      action_type: "agent"
      inputs: ["behavior_map"]
      outputs:
        - name: "volatility_report"
          type: "Map[string, string]"
        - name: "stable_behavior_map"
          type: "Map[string, List[string]]"
      gotcha: "Run target code 2–3 times to confirm volatility — timestamps and randoms won't be stable across runs"

    - id: "generate_characterization_tests"
      description: "Generate test file with tests for every observable behavior"
      action_type: "agent"
      inputs: ["stable_behavior_map", "volatility_report", "target_paths"]
      outputs:
        - name: "test_file_path"
          type: "string"
        - name: "test_content"
          type: "string"
        - name: "behaviors_captured"
          type: "List[string]"
      gotcha: "Mask volatile values (timestamps, UUIDs, random seeds) before comparison — unmasked dynamic values cause spurious test failures; use matchers like expect.any() for dynamic fields"

    - id: "verify_tests_pass"
      description: "Run generated tests to confirm they pass against current implementation"
      action_type: "bash"
      inputs: ["test_file_path"]
      outputs:
        - name: "verification_result"
          type: "string"
      gotcha: "Tests may pass spuriously if they depend on external services (DB, API, clock) — verify environment is isolated or mocked before trusting pass result"
```

## Test labeling convention

```python
# CHARACTERIZATION: documents current behavior; may change when aligning to intended spec
def test_parses_valid_email():
    assert parse_email("a@b.com") == {"local": "a", "domain": "b.com"}

# CHARACTERIZATION: this test encodes the BUGGY behavior — do NOT "fix" before adding regression tests
def test_rejects_email_with_plus_in_local():
    # BUG: currently rejects valid RFC email like user+tag@b.com
    assert parse_email("user+tag@b.com") == {"local": "user", "domain": "tag@b.com"}
```

## Constraints

```
sudo
Constraints {
  MUST test only observed behavior — never invent or assume intended behavior
  MUST treat current implementation as the provisional spec
  MUST label every characterization test with // CHARACTERIZATION comment
  MUST mark buggy/incorrect behavior tests with additional BUG comment
  MUST NOT fix bugs during characterization — separate documenting from fixing
  MUST verify tests pass against current implementation before concluding
}
```

## Test framework agnosticism

This skill generates tests in the style of the target codebase:

| Stack | Test style |
|-------|------------|
| Python | pytest (`.py` test files) |
| TypeScript/JS | Jest/Vitest (`*.test.ts`) |
| Shell | bats-core or TAP output comparison |
| Go | Go `testing` package |
| Generic | TAP/plain output with pass/fail assertions |

Detect the test framework from the project:
```bash
# Check for pytest.ini, pyproject.toml, jest.config.*, vitest.config.*, etc.
ls pytest.ini pyproject.toml jest.config.* vitest.config.* 2>/dev/null
```

## Outputs

- **Test file** colocated with source: `src/foo.py` → `tests/src/foo_characterization.spec.py`
- **Behavior list** — summary of behaviors captured (for later reference during fix)
- **Bug flags** — list of tests that encode buggy behavior (for review before fix)

## Companion scripts

See `scripts/`:
- `scripts/generate-characterization.sh` — scaffolding helper (creates test file with proper headers)
- `scripts/label-characterization.py` — post-processor to add `// CHARACTERIZATION` markers

## References

- [Working Effectively with Legacy Code](https://www.oreilly.com/library/title/working-effectively-with-legacy-code/) — Michael Feathers
- [Sokoban characterization testing pattern](https://en.wikipedia.org/wiki/Characterization_test) — Wikipedia
- [pytest-remaster](https://github.com/retworking/pytest-remaster) — golden master plugin for pytest
- [pytest-golden](https://github.com/GoldenMaster/pytest-golden) — golden master plugin for pytest
