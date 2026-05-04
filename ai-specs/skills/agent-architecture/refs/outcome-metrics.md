# Outcome Metrics (Mode B)

Quantitative metrics for multi-agent orchestration evaluation.

## Core Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| success_rate | Task completion rate end-to-end | >= 95% |
| latency_p50 | Median task duration (seconds) | < 120s |
| latency_p95 | 95th percentile task duration | < 300s |
| cost_per_task | Average cost in USD | < $0.50 |
| handoff_failure_rate | Failed handoffs / total handoffs | < 2% |

## Per-Agent Metrics

- **Supervisor**: delegation rate, synthesis latency, fallback activation count
- **Workers**: task acceptance rate, execution time, error rate per worker
- **HITL gates**: approval SLA (avg seconds), rejection rate, modification rate

## Collection

Instrument agents to emit:
```
{ "event": "handoff", "from": "supervisor", "to": "reviewer", "latency_ms": 45 }
{ "event": "task_complete", "agent": "reviewer", "duration_ms": 1200 }
```
Aggregate in dashboards per pattern, surface, and time window.

## Benchmark Procedures

See [evaluation-protocol.md](evaluation-protocol.md) for benchmark procedures.