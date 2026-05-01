# Observability Tasks for STORY-001: Retrieve Position Candidates

**Discipline**: Observability / Monitoring  
**Total Tasks**: 1  
**Coverage**: Non-functional requirements (monitoring, logging, tracing), operational visibility

---

## TASK-STORY-001-OBSERVABILITY-001

**Title**: Implement logging, metrics, tracing, and alerting for position candidates endpoint

**Parent Story**: STORY-001-get-position-candidates

**Discipline**: Observability

**Depends On**: TASK-STORY-001-BACKEND-001, TASK-STORY-001-API-001 (implementation complete)

**Blocks**: None (can run in parallel, but recommended before production deployment for operational visibility)

---

### Purpose

Instrument the GET /positions/:id/candidates endpoint with comprehensive logging, metrics, tracing, and alerts to enable real-time visibility into performance, errors, and usage. This allows ops teams to detect issues early, debug production problems, and track feature adoption.

Fulfills story NFR (Observability): "Logging: Log request, response, errors. Metrics: Track response time, errors. Example logging provided."

### Scope of Change

- **Already implemented**: Structured JSON logging and in-memory metrics (`backend/src/middleware/observabilityMiddleware.ts`)
- **Already implemented**: `/health` and `/metrics` endpoints (`backend/src/index.ts`)
- **Extend**: Wire position-specific log calls (`logInfo`, `logWarn`, `logError`) in controller/service
- **Create**: Dashboard for monitoring endpoint (Grafana or equivalent)
- **Create**: Alert rules (response time >1s, error rate >1%)
- **Create**: Tracing (optional, but recommended for distributed tracing)
- **Document**: Observability guide for runbook and debugging

### Where

- **Logging & Metrics**: `backend/src/middleware/observabilityMiddleware.ts` — contains `logInfo`, `logWarn`, `logError`, `logDebug`, `observabilityMiddleware`, `getMetrics()`, `getHealthStatus()`, `checkAndAlert()`
- **Health & Metrics endpoints**: `backend/src/index.ts` — `GET /health` calls `getHealthStatus()`, `GET /metrics` calls `getMetrics()` (both from observabilityMiddleware)
- **Dashboard**: Grafana dashboard JSON (provided to Grafana team or self-service)
- **Alerts**: Prometheus alert rules in `backend/config/alert-rules.yaml`
- **Tracing**: `backend/src/middleware/tracingMiddleware.ts` (optional, if using OpenTelemetry)
- **Documentation**: `docs/OBSERVABILITY-GUIDE-STORY-001.md`

### Why

Per STORY-001 Technical Design, Observability section:
> "Logging: Log request: GET /positions/{positionId}/candidates, Log position lookup, Log response: 200 OK | 404 Not Found | 500 Error with candidate count"
> "Metrics: http_request_duration_seconds — histogram of response time, position_candidates_endpoint_errors_total — counter for 4xx/5xx, position_candidates_count — gauge of total candidates returned"
> "Example logging (Node.js): logger.info(`GET /positions/:id/candidates`, { positionId, candidateCount: candidates.length, durationMs })"

Per STORY-001 Monitoring & Alerts (from Rollout section):
> "Alert if response time exceeds 1s (slow query)"
> "Alert if error rate exceeds 1% (data issue or bug)"
> "Alert if unauthorized access attempts (security concern)"

Observability enables:
1. **Operational visibility**: Ops team sees endpoint health in real-time
2. **Debugging production issues**: Logs + metrics + tracing help diagnose root cause
3. **Performance trending**: Historical metrics detect performance regression
4. **Business metrics**: Track feature adoption (request volume), user experience (error rate)
5. **Compliance**: Audit trail of who accessed what candidate data, when

### How: Technical Approach

**Step 1**: Understand the existing logging infrastructure
- **Implementation**: `backend/src/middleware/observabilityMiddleware.ts` — already provides a custom JSON structured logger, no external library required
- **Log levels**: `DEBUG`, `INFO`, `WARN`, `ERROR` (implemented as `LogLevel` enum)
- **Format**: JSON output via `console.log(JSON.stringify(entry))` — one event per line, parseable by ELK/Datadog
- **Exported helpers**:
  ```typescript
  import { logDebug, logInfo, logWarn, logError } from '../middleware/observabilityMiddleware';
  ```
- The `observabilityMiddleware` is already mounted globally in `index.ts` (line 38) and automatically logs every request/response with method, path, userId, statusCode, and duration

**Step 2**: Add position-specific log calls in controller/service
- The global `observabilityMiddleware` covers request/response lifecycle. For richer domain context, add explicit calls in `positionController.ts` / `positionService.ts`:
  ```typescript
  import { logInfo, logWarn, logError } from '../middleware/observabilityMiddleware';

  // On successful response:
  logInfo('GET /positions/:id/candidates - 200 OK', {
    positionId,
    candidateCount: response.candidates.length,
    userId: req.user?.id,
  });

  // On error:
  logError('GET /positions/:id/candidates failed', {
    positionId,
    error: (error as Error).message,
  });
  ```
- Do NOT add a second request/response logging layer — `observabilityMiddleware` already handles that

**Step 3**: Understand the existing metrics
- **Implementation**: `backend/src/middleware/observabilityMiddleware.ts` — in-memory counters (no external library)
- **Available metrics** (via `getMetrics()`):
  - `general.totalRequests` — total request count
  - `general.successCount` / `general.errorCount` — success/error split
  - `general.avgDurationMs` — average response time in ms
  - `general.successRate` — percentage success
  - `general.errorsByStatusCode` — error breakdown by HTTP status
  - `requestsByEndpoint` — per-route request counts (low-cardinality, normalized via `normalizeEndpointPath`)
- **Alerting hook**: `checkAndAlert(context)` fires `logError` when error rate >5% or avg duration >2000ms
- Note: these are in-process counters; they reset on restart. For persistent metrics, integrate a Prometheus exporter or time-series DB

**Step 4**: Use the existing /metrics and /health endpoints
- Both endpoints are already wired in `backend/src/index.ts`:
  ```typescript
  // Health check (200 = healthy, 503 = degraded)
  app.get('/health', (req, res) => {
    const health = getHealthStatus();
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  });

  // In-memory metrics snapshot
  app.get('/metrics', (req, res) => {
    res.json(getMetrics());
  });
  ```
- Do NOT add a duplicate `/metrics` route or a separate `metricsRoutes.ts` file
- Configure Prometheus or your monitoring system to scrape `GET /metrics` every 15 seconds

**Step 5**: Create Grafana dashboard
- **Panels**:
  1. **Response Time**: Graph of `histogram_quantile(0.95, http_request_duration_seconds)` over time
  2. **Request Volume**: Graph of rate of requests (`rate(http_requests_total[5m])`)
  3. **Error Rate**: Graph of `rate(position_candidates_endpoint_errors_total[5m])` by error type
  4. **Candidate Count**: Gauge of average/max candidates per position (`position_candidates_count`)
  5. **Status Code Distribution**: Pie chart of requests by status code (200, 400, 404, 500)
  6. **Request Latency P50/P95/P99**: Multi-line graph of percentiles
- **Refresh**: Set to auto-refresh every 10 seconds
- **Time range**: Default to last 1 hour (ops can change)

**Step 6**: Define alert rules (Prometheus)
- **Alert 1**: High response time
  ```yaml
  - alert: PositionCandidatesEndpointSlow
    expr: histogram_quantile(0.95, http_request_duration_seconds{route="/positions/{id}/candidates"}) > 1
    for: 5m
    annotations:
      summary: "Position candidates endpoint slow (P95 > 1s)"
      description: "{{ $value }}s"
      severity: warning
  ```
- **Alert 2**: High error rate
  ```yaml
  - alert: PositionCandidatesEndpointErrors
    expr: rate(position_candidates_endpoint_errors_total[5m]) > 0.01
    for: 5m
    annotations:
      summary: "Position candidates endpoint error rate > 1%"
      description: "{{ $value }}"
      severity: warning
  ```
- **Alert 3**: Authorization failures
  ```yaml
  - alert: PositionCandidatesAuthFailures
    expr: rate(position_candidates_endpoint_errors_total{error_type="auth"}[5m]) > 0.001
    for: 5m
    annotations:
      summary: "Multiple auth failures on position candidates endpoint"
      description: "Possible security issue or misconfigured client"
      severity: critical
  ```

**Step 7**: Set up alert routing
- Route warnings to on-call Slack channel (not paging)
- Route critical alerts to PagerDuty (page on-call engineer)
- Include runbook link in alert message

**Step 8**: Add tracing (optional, but recommended)
- **Tool**: OpenTelemetry (OTEL) with Jaeger backend
- **Configuration**: Add OTEL middleware to instrument requests
  ```typescript
  import { NodeTracerProvider } from '@opentelemetry/node';
  import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

  const provider = new NodeTracerProvider();
  const exporter = new JaegerExporter({ serviceName: 'position-candidates-api' });
  provider.addSpanProcessor(new BatchSpanProcessor(exporter));
  ```
- **Traces**: Record request → service → database query spans
- **Use case**: Debug latency by seeing which component is slow (Jaeger waterfall view)

**Step 9**: Create runbook/debugging guide
- **File**: `docs/OBSERVABILITY-GUIDE-STORY-001.md`
- **Content**:
  1. How to access Grafana dashboard
  2. How to interpret metrics (what's normal, what's concerning)
  3. Common issues and how to debug:
     - "Response time increased from 200ms to 1000ms" → Check Jaeger traces, database slow query log
     - "Error rate spiking" → Check logs for error messages, check database connectivity
     - "Authorization failures" → Check logs for invalid tokens, check if roles misconfigured
  4. How to access logs (log aggregation tool, e.g., ELK Stack, Datadog)
  5. How to acknowledge/silence alerts
  6. Escalation procedure (page on-call, war room, etc.)

**Step 10**: Document PII handling in logs
- **What NOT to log**: Candidate email, phone, address, resume content, JWT tokens
- **What to log**: Position ID, candidate ID (internal), user ID, error type, response code
- **Example safe log**:
  ```json
  {
    "timestamp": "2026-05-01T10:30:45.123Z",
    "level": "INFO",
    "service": "position-candidates-api",
    "event": "endpoint_accessed",
    "positionId": 1,
    "candidateCount": 42,
    "durationMs": 380,
    "statusCode": 200,
    "userId": "user-uuid-123",
    "userRole": "recruiter"
  }
  ```

### Inputs / Outputs / Contracts

**Input**:
- Backend implementation (endpoint exists, logs can be added)
- Monitoring infrastructure (Prometheus, Grafana, log aggregation tool)
- Alert routing (Slack, PagerDuty, email)
- Jaeger backend (if adding tracing)

**Output**:
- Logging configuration and implementation
- Metrics definitions and instrumentation
- Grafana dashboard JSON
- Prometheus alert rules
- Runbook/debugging guide
- Alert routing configuration
- Tracing configuration (optional)

**Contracts**:
- Logs are JSON formatted (one log per line, parseable)
- Metrics follow Prometheus naming conventions (snake_case, _total suffix for counters)
- No PII in logs (email, phone, address, tokens not logged)
- Metrics have consistent labels (method, route, status_code)

### Dependencies

- `observabilityMiddleware.ts` already mounted in `index.ts` (no extra library install needed for logging or metrics)
- Prometheus scraping `GET /metrics` (for persistent metric storage; optional for MVP)
- Grafana must be installed and configured to scrape Prometheus (for dashboards)
- Log aggregation tool (ELK Stack, Datadog, or similar) to consume JSON logs from stdout
- OpenTelemetry + Jaeger backend (optional, for tracing only)

### Acceptance Criteria

- [ ] `observabilityMiddleware` mounted globally (JSON format, structured logs) — already in `index.ts`
- [ ] All requests logged with positionId, userId, status code, duration
- [ ] All errors logged with error type, message, stack trace
- [ ] No PII (email, phone, address, tokens) logged
- [ ] Response time metric defined (histogram with appropriate buckets)
- [ ] Error rate metric defined (counter by error type)
- [ ] Candidate count metric defined (gauge)
- [ ] `GET /metrics` endpoint serving `getMetrics()` and `GET /health` serving `getHealthStatus()` — already in `index.ts`; Prometheus configured to scrape
- [ ] Grafana dashboard created with key panels (latency, error rate, volume)
- [ ] Alert rules defined for slow responses (>1s) and high error rate (>1%)
- [ ] Alert routing configured (Slack for warnings, PagerDuty for critical)
- [ ] Runbook/debugging guide created
- [ ] Tracing infrastructure set up (if using OpenTelemetry + Jaeger)
- [ ] Logs are queryable in log aggregation tool
- [ ] Metrics are queryable in Prometheus UI
- [ ] Dashboard is readable and informative (no confusing units, clear labels)

### Test Requirements

**Manual Testing**:
- Make request to endpoint; verify log appears in logs (check timestamps match)
- Make multiple requests; verify request count metric increases in Prometheus
- Trigger error (e.g., 404 by requesting invalid position); verify error metric increases
- Measure response time manually; verify it matches metric histogram percentiles
- Check logs for PII (grep for common patterns: emails, phone numbers); verify none found
- Trigger alert condition (e.g., slow request >1s); verify alert fires in Slack/PagerDuty

**Automation Testing** (optional):
- Unit test: Verify logger is called with correct structure on request
- Integration test: Make endpoint request, check metrics endpoint for new samples
- Load test: Generate 100 requests/second; verify metrics update correctly (no overflow)

### Non-Functional Requirements

**Logging Quality**:
- Logs are structured (JSON), parseable, and queryable
- Logs have consistent schema (timestamp, level, service, message, fields)
- Logs include context (request ID for correlation across services)
- Log volume is reasonable (not excessively verbose; DEBUG logs disabled in production)
- Logs are retained for compliance period (e.g., 90 days)

**Metrics Quality**:
- Metrics are accurate (counts are correct, percentiles are reasonable)
- Metrics have low cardinality (limited unique label combinations to avoid Prometheus explosion)
- Metrics are queryable and filterable (can slice by status code, error type, etc.)
- Metrics retention is appropriate (1 year for trending, detailed for 30 days)

**Alerting Quality**:
- Alerts are actionable (op team knows what to do when alert fires)
- Alerts are not noisy (no false positives)
- Alerts have clear severity (warning vs. critical)
- Alerts include runbook link for remediation steps

**Performance Impact**:
- Logging adds <10ms latency (non-blocking, buffered)
- Metrics recording adds <5ms latency (in-process, no network calls)
- Tracing adds <50ms latency if enabled (optional, can disable if too expensive)

**Privacy & Compliance**:
- No PII logged (email, phone, address)
- Logs comply with GDPR (personal data retention <90 days, or minimized)
- Audit trail available for access logs (who accessed what, when)

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Logs are too verbose; log aggregation system filled with noise | Use log levels (DEBUG disabled in prod); filter by severity in aggregation tool |
| PII accidentally leaked in logs (customer email, phone) | Code review specifically looks for logging sensitive data; automated PII detection (grep patterns) in CI |
| Metrics cardinality explosion (too many label combinations) | Limit label values (e.g., bucket position IDs into ranges); monitor Prometheus memory usage |
| Alert thresholds too tight; too many false alerts (alert fatigue) | Start conservative (e.g., >1s for slow, >1% error), tune based on historical data |
| Alert threshold too loose; miss real issues | Set up dashboards to see trending; adjust thresholds monthly based on data |
| Logging/metrics adds too much latency | Profile impact; use async logging; consider sampled metrics (not every request) |
| Jaeger tracing too expensive (storage, bandwidth) | Start with sampling (e.g., 10% of requests); increase if needed |

### Definition of Done

- [ ] Logging configured (JSON format, structured fields)
- [ ] All requests and responses logged
- [ ] All errors logged with full context
- [ ] No PII in any logs (email, phone, address, tokens)
- [ ] Metrics definitions confirmed in `observabilityMiddleware.ts` (response time, error rate, volume, per-endpoint counts)
- [ ] Metrics recorded via `observabilityMiddleware` (in-memory counters; no duplicate instrumentation)
- [ ] `GET /metrics` endpoint (in `index.ts`) exposed and Prometheus scraping it
- [ ] Grafana dashboard created with key visualizations
- [ ] Alert rules defined (slow response, high error rate)
- [ ] Alerts routed to correct channel (Slack warning, PagerDuty critical)
- [ ] Runbook/debugging guide created and reviewed
- [ ] Tracing configured (if using OpenTelemetry)
- [ ] Log aggregation tool configured to collect logs
- [ ] Team trained on how to access/interpret metrics and logs
- [ ] Dashboard tested and confirmed readable
- [ ] Alerts tested (triggered manually, verified they fire)
- [ ] Performance impact validated (latency <50ms)
- [ ] All standards (naming, schema, retention) documented
- [ ] Task linked to STORY-001

---
