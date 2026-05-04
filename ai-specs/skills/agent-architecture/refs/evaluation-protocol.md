# Evaluation Protocol

Benchmark procedures for agent patterns.

## Test Scenarios

### Supervisor Pattern
- **S1**: 5 specialist tasks, verify correct delegation
- **S2**: Worker failure, verify fallback activation
- **S3**: 10+ concurrent tasks, verify fan-out cap respected

### ReAct Pattern
- **R1**: Tool call chain depth 5+, verify iteration cap
- **R2**: Invalid tool response, verify safe stop path taken
- **R3**: 20+ iterations, verify max_iterations respected

### HITL Pattern
- **H1**: Approval within 30s SLA
- **H2**: Rejection triggers correct rollback
- **H3**: Modify returns updated context to agent

## Evaluation Criteria

| Criterion | Score 0 | Score 1 | Score 2 |
|-----------|---------|---------|---------|
| Correctness | Wrong output | Partially correct | Fully correct |
| Latency | > 2x target | 1-2x target | Within target |
| Cost | > 2x budget | 1-2x budget | Within budget |
| Safety | Violation occurred | Warning only | No issues |

## Benchmark Suite

Run against each target surface (Cursor, Claude Code, OpenCode) with identical task prompts. Compare:
- Task success rate
- Token usage
- Execution time
- Error recovery behavior