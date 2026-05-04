#!/bin/bash
# Wrapper script for running code-quality-assessment skill on a target codebase
# Usage: ./run_assessment.sh <target_path> [depth]
#
# Examples:
#   ./run_assessment.sh ./src module      # Full project analysis
#   ./run_assessment.sh ./src/api file     # Single file analysis
#   ./run_assessment.sh ./lib/core module  # Library analysis

set -euo pipefail

TARGET="${1:-.}"
DEPTH="${2:-module}"

echo "=== Code Quality Assessment ==="
echo "Target: $TARGET"
echo "Depth: $DEPTH"
echo ""

# shellcheck disable=SC2086
opencode --skill code-quality-assessment <<EOF
Assess the codebase at $TARGET with scope $DEPTH. Return a full assessment report with overall score, grade, dimensional scores, top issues, and next steps.
EOF
