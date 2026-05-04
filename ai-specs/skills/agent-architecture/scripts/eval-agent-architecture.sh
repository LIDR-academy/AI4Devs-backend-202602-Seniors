#!/usr/bin/env bash
# Frozen rubric v1 — .agents/skills/agent-architecture/SKILL.md (Mode B)
# R1 name  R2 triggers  R3 size or refs split  R4 outcome-metrics  R5 metric charter
# R6 Mode A + Mode B  R7 evaluation-protocol link  R8 self-run pointers
# F1 fixture coding/multi-agent  F2 fixture generic/single-agent
# R9 behavioral (via eval_agent_architecture_behavior.py, max 10)
# Aggregate = sum(R1..R8), max 8. F1/F2/R9 reported separately.
set -euo pipefail

skill="${1:?usage: eval-agent-architecture.sh path/to/SKILL.md}"

skill_dir=$(cd "$(dirname "$skill")" && pwd)
skill_text=$(cat "$skill")

r1=0 r2=0 r3=0 r4=0 r5=0 r6=0 r7=0 r8=0

grep -q '^name: agent-architecture' "$skill" && r1=1

desc_block=$(head -n 30 "$skill")
if echo "$desc_block" | grep -qi 'Use when'; then r2=1; fi

lines=$(wc -l <"$skill" | tr -d ' ')
has_ref=0
refs_dir="$skill_dir/refs"
if grep -qE '\]\(refs/[^)]+\.md\)' "$skill" && [[ -d "$refs_dir" ]] && compgen -G "$refs_dir/*.md" >/dev/null; then
  has_ref=1
fi
if [[ "$lines" -le 120 ]] || [[ "$has_ref" -eq 1 ]]; then r3=1; fi

if grep -qF 'refs/outcome-metrics.md' "$skill" && [[ -f "$refs_dir/outcome-metrics.md" ]]; then r4=1; fi
grep -qi 'metric charter' "$skill" && r5=1
if grep -q '## Mode A' "$skill" && grep -q '## Mode B' "$skill"; then r6=1; fi
if grep -qF 'refs/evaluation-protocol.md' "$skill" && [[ -f "$refs_dir/evaluation-protocol.md" ]]; then r7=1; fi
if grep -qE 'eval-agent-architecture\.sh|improve-agent-architecture' "$skill"; then r8=1; fi

agg=$((r1 + r2 + r3 + r4 + r5 + r6 + r7 + r8))
echo "R1=$r1 R2=$r2 R3=$r3 R4=$r4 R5=$r5 R6=$r6 R7=$r7 R8=$r8 aggregate=$agg lines=$lines ref=$has_ref"

f1_pass=0
f2_pass=0

fixtures_dir="$skill_dir/fixtures"
f1_text=$(cat "$fixtures_dir/f1-task-input.txt" 2>/dev/null || echo "")
f2_text=$(cat "$fixtures_dir/f2-task-input.txt" 2>/dev/null || echo "")

check_pattern_choice() {
  echo "$skill_text" | grep -qiE '(supervisor|ReAct|human-in-the-loop|sequential|router|hierarchical|single-agent)' && return 0
  return 1
}

check_artifact_plan() {
  echo "$skill_text" | grep -qiE 'artifact_plan|surface.*path|path_or_key' && return 0
  return 1
}

check_handoff_contract() {
  local has_producer=$(echo "$skill_text" | grep -qiE 'producer|consumer|handoff' && echo 1 || echo 0)
  local has_payload=$(echo "$skill_text" | grep -qiE 'payload|schema|validation' && echo 1 || echo 0)
  local has_on_failure=$(echo "$skill_text" | grep -qiE 'on.failure|retry|escalate|fallback' && echo 1 || echo 0)
  if [[ "$has_producer" -eq 1 ]] && [[ "$has_payload" -eq 1 ]] && [[ "$has_on_failure" -eq 1 ]]; then
    return 0
  fi
  return 1
}

if check_pattern_choice && check_artifact_plan && check_handoff_contract; then
  f1_pass=1
fi

if echo "$skill_text" | grep -qiE 'single-agent|one.agent|supervisor.with.one|fallback.agent|degraded.mode'; then
  f2_pass=1
elif check_artifact_plan; then
  f2_pass=1
fi

echo "F1_fixture_coding_multi_agent=$f1_pass"
echo "F2_fixture_generic_single_agent=$f2_pass"

total_fixtures=$((f1_pass + f2_pass))
echo "fixture_pass_rate=${total_fixtures}/2"

eval_beh_py="$skill_dir/eval-behavior/eval_agent_architecture_behavior.py"
if [[ -f "$eval_beh_py" ]]; then
  beh_result=$(python3 "$eval_beh_py" --json 2>/dev/null || echo '{"aggregate_0_to_10": 0}')
  beh_score=$(echo "$beh_result" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('aggregate_0_to_10', 0))" 2>/dev/null || echo "0")
  echo "R9_behavioral=${beh_score}/10"
fi