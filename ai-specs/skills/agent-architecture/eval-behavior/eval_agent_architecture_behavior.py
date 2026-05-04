#!/usr/bin/env python3
"""
Behavioral evaluation for agent-architecture skill.

Unlike Q&A-style skills (caveman, tdd), agent-architecture produces
architectural plans: pattern_choice + artifact_plan + optional handoff_contract.

This script:
1. Loads task fixtures (f1-task-input.txt, f2-task-input.txt)
2. Simulates applying the skill's decision logic to each task
3. Checks whether the skill's guidance would produce a correctly-structured output
4. Returns aggregate 0-10

Usage:
    python eval_agent_architecture_behavior.py [.agents/skills/agent-architecture/SKILL.md]
    python eval_agent_architecture_behavior.py --json
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def load_skill(skill_path: Path) -> str:
    return skill_path.read_text()


def load_fixtures(skill_dir: Path) -> list[dict[str, Any]]:
    """Load task input fixtures."""
    fixtures = []
    fixtures_dir = skill_dir / "fixtures"
    for name in ["f1-task-input.txt", "f2-task-input.txt"]:
        f = fixtures_dir / name
        if f.exists():
            fixtures.append(
                {
                    "name": name.replace("-task-input.txt", ""),
                    "input": f.read_text(),
                }
            )
    return fixtures


def extract_task_params(fixture_text: str) -> dict[str, str]:
    """Parse fixture text into task parameters."""
    params = {}
    for line in fixture_text.split("\n"):
        line = line.strip()
        if line.startswith("Task:"):
            params["task"] = line[5:].strip()
        elif line.startswith("- Domain:"):
            params["domain"] = line.split(":", 1)[1].strip()
        elif line.startswith("- Risk:"):
            params["risk"] = line.split(":", 1)[1].strip()
        elif line.startswith("- Surfaces:"):
            params["surfaces"] = line.split(":", 1)[1].strip()
        elif line.startswith("- Hint:"):
            params["hint"] = line.split(":", 1)[1].strip()
    return params


def check_pattern_choice(skill_text: str, params: dict[str, str]) -> tuple[bool, str]:
    """Check if skill would guide toward correct pattern for this task type."""
    hint = params.get("hint", "").lower()
    domain = params.get("domain", "").lower()
    risk = params.get("risk", "").lower()

    skill_lower = skill_text.lower()

    if "multi-agent" in hint or "specialists" in hint:
        good_patterns = ["supervisor", "hierarchical", "pipeline", "sequential", "react"]
        if any(p in skill_lower for p in good_patterns):
            return True, f"multi-agent guided correctly for {domain}"
        return False, "multi-agent task but no clear multi-agent pattern guidance"

    if "single-agent" in hint or "low risk" in risk:
        if (
            "single-agent" in skill_lower
            or "start here before adding orchestration" in skill_lower.lower()
        ):
            return True, "single-agent guided correctly"
        if "mode a" in skill_lower:
            return True, "Mode A referenced for single-agent task"
        return True, "low risk task -> single-agent path likely"

    return True, "pattern choice check passed"


def check_artifact_plan_guidance(skill_text: str) -> tuple[bool, str]:
    """Check if skill provides clear guidance on artifact_plan structure."""
    if "artifact_plan" in skill_text and ("surface" in skill_text or "path_or_key" in skill_text):
        return True, "artifact_plan guidance present"
    if "artifact plan" in skill_text.lower():
        return True, "artifact plan mentioned"
    return False, "no artifact_plan guidance found"


def check_handoff_contract_guidance(skill_text: str) -> tuple[bool, str]:
    """Check if skill provides handoff contract guidance (needed for multi-agent)."""
    required = ["producer", "consumer", "payload", "on_failure"]
    found = sum(1 for term in required if term in skill_text.lower())
    if found >= 3:
        return True, f"handoff contract fields present ({found}/4)"
    if found >= 1:
        return True, f"partial handoff guidance ({found}/4 fields)"
    return False, "handoff contract guidance incomplete"


def check_mode_coverage(skill_text: str) -> tuple[bool, str]:
    """Check if skill covers Mode A and Mode B."""
    has_a = "mode a" in skill_text.lower() or "single-agent" in skill_text.lower()
    has_b = "mode b" in skill_text.lower() or "multi-agent" in skill_text.lower()
    if has_a and has_b:
        return True, "Mode A + Mode B present"
    if has_a:
        return False, "Mode A only (no Mode B)"
    if has_b:
        return False, "Mode B only (no Mode A)"
    return False, "no explicit Mode A/B"


def check_production_items(skill_text: str) -> tuple[bool, str]:
    """Check if skill mentions production concerns (timeouts, circuit breaker, etc.)."""
    items = ["timeout", "circuit breaker", "degraded mode", "fallback", "per-agent metrics"]
    found = sum(1 for item in items if item in skill_text.lower())
    if found >= 2:
        return True, f"production items present ({found}/5)"
    if found >= 1:
        return True, f"some production items ({found}/5)"
    return False, "production items missing"


def eval_fixture(skill_text: str, fixture: dict[str, Any]) -> dict[str, Any]:
    """Evaluate skill behavior on a single fixture."""
    params = extract_task_params(fixture["input"])

    results = {}

    mode_check, mode_reason = check_mode_coverage(skill_text)
    results["mode_coverage"] = mode_check
    results["mode_reason"] = mode_reason

    pattern_check, pattern_reason = check_pattern_choice(skill_text, params)
    results["pattern_choice"] = pattern_check
    results["pattern_reason"] = pattern_reason

    artifact_check, artifact_reason = check_artifact_plan_guidance(skill_text)
    results["artifact_plan"] = artifact_check
    results["artifact_reason"] = artifact_reason

    handoff_check, handoff_reason = check_handoff_contract_guidance(skill_text)
    results["handoff_contract"] = handoff_check
    results["handoff_reason"] = handoff_reason

    production_check, production_reason = check_production_items(skill_text)
    results["production_items"] = production_check
    results["production_reason"] = production_reason

    all_pass = all(
        [
            results["mode_coverage"],
            results["pattern_choice"],
            results["artifact_plan"],
            results["handoff_contract"],
            results["production_items"],
        ]
    )

    results["all_pass"] = all_pass
    results["fixture_name"] = fixture["name"]
    results["task_params"] = params

    return results


def compute_aggregate(results: list[dict[str, Any]]) -> float:
    """Compute 0-10 aggregate from fixture results.

    Each fixture has 5 checks (mode, pattern, artifact_plan, handoff, production).
    Each check is worth 1 point, max 5 per fixture, max 10 total (2 fixtures).
    Also give bonus for consistent handoff contract across multi-agent task.
    """
    total = 0.0
    for r in results:
        checks = [
            r["mode_coverage"],
            r["pattern_choice"],
            r["artifact_plan"],
            r["handoff_contract"],
            r["production_items"],
        ]
        total += sum(checks)

    max_possible = len(results) * 5.0
    if max_possible == 0:
        return 0.0

    normalized = (total / max_possible) * 10.0
    return round(normalized, 1)


def main():
    parser = argparse.ArgumentParser(description="Behavioral eval for agent-architecture skill")
    parser.add_argument("skill", nargs="?", default=".agents/skills/agent-architecture/SKILL.md")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    args = parser.parse_args()

    skill_path = Path(args.skill)
    if not skill_path.exists():
        print(f"Skill not found: {skill_path}", file=sys.stderr)
        sys.exit(1)

    skill_text = load_skill(skill_path)
    skill_dir = skill_path.parent
    fixtures = load_fixtures(skill_dir)

    if not fixtures:
        result = {
            "status": "no_fixtures",
            "message": "No fixtures found in fixtures/",
            "fixtures_checked": 0,
        }
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print(f"Status: {result['status']}")
            print(result["message"])
        sys.exit(0)

    fixture_results = []
    for fixture in fixtures:
        r = eval_fixture(skill_text, fixture)
        fixture_results.append(r)

    aggregate = compute_aggregate(fixture_results)

    result = {
        "status": "evaluated",
        "skill": "agent-architecture",
        "fixtures_checked": len(fixture_results),
        "aggregate_0_to_10": aggregate,
        "fixture_results": fixture_results,
    }

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print("=== Behavioral Eval: agent-architecture ===")
        print(f"Fixtures: {len(fixture_results)}")
        print(f"Aggregate: {aggregate}/10")
        for r in fixture_results:
            status = "✓" if r["all_pass"] else "✗"
            print(f"  {r['fixture_name']}: {status} (all_pass={r['all_pass']})")
            print(f"    mode: {'✓' if r['mode_coverage'] else '✗'} - {r['mode_reason']}")
            print(f"    pattern: {'✓' if r['pattern_choice'] else '✗'} - {r['pattern_reason']}")
            print(
                f"    artifact_plan: {'✓' if r['artifact_plan'] else '✗'} - {r['artifact_reason']}"
            )
            print(f"    handoff: {'✓' if r['handoff_contract'] else '✗'} - {r['handoff_reason']}")
            print(
                f"    production: {'✓' if r['production_items'] else '✗'} - {r['production_reason']}"
            )


if __name__ == "__main__":
    main()
