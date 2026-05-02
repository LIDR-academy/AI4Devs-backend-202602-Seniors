# Tasks for STORY-002: Update Candidate Interview Stage

**Discipline**: Observability  
**Total Tasks**: 1  
**Coverage**: Logging, metrics, tracing, alerting, dashboards

---

## TASK-STORY-002-OBSERVABILITY-001

**Title**: Implement observability for stage update endpoint

**Parent Story**: STORY-002-update-candidate-stage ([link](/stories/STORY-002-update-candidate-stage.md))

**Discipline**: Observability

**Depends On**: TASK-STORY-002-BACKEND-001 (business logic must exist)

**Blocks**: TASK-STORY-002-DEVOPS-001 (monitoring config depends on metrics/alerts defined)

---

### Purpose & Scope

**Purpose**
Implement comprehensive observability (logging, metrics, tracing, alerting) for the PUT /candidates/:applicationId/stage endpoint. Enables operators to understand endpoint behavior, detect issues early, and debug problems in production.

Fulfills story's observability section: Logging (timestamps, user ID, stage IDs), Metrics (latency, error rate), Alerts (error spikes, performance degradation)

**Scope of Change**
- Create: Structured logging for stage updates (application, validation, errors, audit)
- Create: Prometheus metrics (counters, histograms, gauges)
- Create: Grafana dashboard with key metrics
- Create: Alert rules (error rate, latency, audit log failures)
- Create: Distributed tracing (if applicable; optional for simple endpoint)
- Document: Debugging guide for common issues

**Where**
- Logging: `backend/src/application/services/candidateStageService.ts` and controller
- Metrics: `backend/src/application/middleware/metricsMiddleware.ts` (new)
- Prometheus config: `backend/prometheus.yml` (new)
- Grafana dashboard: `backend/docs/GRAFANA-DASHBOARD.json` (new)
- Alerts: `backend/docs/MONITORING-ALERTS.md` (created by DevOps task, extended here)
- Debugging guide: `backend/docs/DEBUGGING-GUIDE.md` (new)

**Why**
Per story's observability section: "Log each stage update with application ID, userId, old/new stage", "Metrics: candidate_stage_updates_total, duration_ms, errors_total", "Alerts: if stage validation errors exceed 10/min, suggest bad data or API misuse".

Per operational excellence: Without observability, no way to know if production is working or why it's failing. Metrics + alerts enable proactive problem detection.

---

### Implementation Guidance

**How: Technical Approach & Implementation Steps**

1. **Implement structured logging**:
   ```typescript
   // backend/src/application/services/candidateStageService.ts
   
   import logger from '../logging/logger';
   
   export class CandidateStageService {
     async updateStage(
       applicationId: number,
       interviewStepId: number,
       userId: number,
       notes?: string
     ): Promise<Application> {
       const logContext = {
         applicationId,
         userId,
         timestamp: new Date().toISOString(),
         step: 'candidate_stage_update'
       };
       
       // Log start
       logger.info('Starting stage update', {
         ...logContext,
         targetStageId: interviewStepId,
         action: 'start'
       });
       
       try {
         // Fetch application
         const application = await this.prisma.application.findUnique({
           where: { id: applicationId },
           include: { position: { include: { interviewFlow: true } } }
         });
         
         if (!application) {
           logger.warn('Application not found', {
             ...logContext,
             reason: 'APPLICATION_NOT_FOUND',
             applicationId
           });
           throw new ApplicationNotFoundError(`Application with ID ${applicationId} not found`);
         }
         
         // Validate stage is in flow
         const interviewFlow = application.position.interviewFlow;
         const stageInFlow = interviewFlow.steps?.some(s => s.id === interviewStepId);
         
         if (!stageInFlow) {
           logger.warn('Invalid interview step', {
             ...logContext,
             reason: 'STAGE_NOT_IN_FLOW',
             requestedStageId: interviewStepId,
             validStageIds: interviewFlow.steps?.map(s => s.id)
           });
           throw new Error('Interview step not valid for this position');
         }
         
         // Update stage (wrap in transaction)
         const oldStageId = application.currentInterviewStep;
         const updated = await this.prisma.application.update({
           where: { id: applicationId },
           data: { currentInterviewStep: interviewStepId },
           include: { currentInterviewStepData: true }
         });
         
         // Log audit
         await this.auditService.logStageChange(
           applicationId, userId, oldStageId, interviewStepId, notes
         );
         
         // Log success
         logger.info('Stage update completed', {
           ...logContext,
           oldStageId,
           newStageId: interviewStepId,
           action: 'success',
           durationMs: Date.now() - Date.parse(logContext.timestamp)
         });
         
         return updated;
       } catch (err: any) {
         // Log error
         logger.error('Stage update failed', {
           ...logContext,
           error: err.message,
           errorType: err.constructor.name,
           action: 'error'
         });
         
         throw err;
       }
     }
   }
   ```

2. **Create metrics middleware**:
   ```typescript
   // backend/src/application/middleware/metricsMiddleware.ts
   
   import { Request, Response, NextFunction } from 'express';
   import client from 'prom-client';
   
   // Define metrics
   const httpRequestDuration = new client.Histogram({
     name: 'http_request_duration_ms',
     help: 'Duration of HTTP requests in ms',
     labelNames: ['method', 'route', 'status_code'],
     buckets: [10, 50, 100, 200, 500, 1000, 2000]
   });
   
   const candidateStageUpdateRequests = new client.Counter({
     name: 'candidate_stage_update_requests_total',
     help: 'Total number of candidate stage update requests',
     labelNames: ['status_code', 'error_type']
   });
   
   const candidateStageUpdateDuration = new client.Histogram({
     name: 'candidate_stage_update_duration_ms',
     help: 'Duration of candidate stage update operation',
     labelNames: ['status_code'],
     buckets: [10, 50, 100, 150, 200, 300, 500]
   });
   
   const auditLogInsertionDuration = new client.Histogram({
     name: 'audit_log_insertion_duration_ms',
     help: 'Duration of audit log insertion',
     labelNames: [],
     buckets: [5, 10, 20, 50]
   });
   
   // Middleware
   export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
     const start = Date.now();
     
     res.on('finish', () => {
       const duration = Date.now() - start;
       
       // Record general HTTP metrics
       httpRequestDuration
         .labels(req.method, req.path, res.statusCode)
         .observe(duration);
       
       // Record stage-update specific metrics
       if (req.path.includes('/candidates') && req.path.includes('/stage') && req.method === 'PUT') {
         candidateStageUpdateRequests
           .labels(res.statusCode, getErrorType(res.statusCode))
           .inc();
         
         candidateStageUpdateDuration
           .labels(res.statusCode)
           .observe(duration);
       }
     });
     
     next();
   };
   
   const getErrorType = (statusCode: number): string => {
     switch (statusCode) {
       case 400: return 'validation_error';
       case 401: return 'auth_error';
       case 403: return 'authz_error';
       case 404: return 'not_found';
       case 500: return 'server_error';
       default: return 'none';
     }
   };
   
   // Export metrics for Prometheus scraping
   export const getMetrics = async () => {
     return await client.register.metrics();
   };
   ```

3. **Register metrics endpoint**:
   ```typescript
   // backend/src/index.ts
   
   import { metricsMiddleware, getMetrics } from './application/middleware/metricsMiddleware';
   
   app.use(metricsMiddleware);
   
   // Prometheus scrape endpoint
   app.get('/metrics', async (req, res) => {
     res.set('Content-Type', 'text/plain');
     res.send(await getMetrics());
   });
   ```

4. **Create Prometheus configuration**:
   ```yaml
   # backend/prometheus.yml
   
   global:
     scrape_interval: 15s
     evaluation_interval: 15s
   
   scrape_configs:
     - job_name: 'lti-backend'
       static_configs:
         - targets: ['localhost:3010']
       metrics_path: '/metrics'
   
   # Alert rules
   rule_files:
     - 'alerts.yml'
   
   alerting:
     alertmanagers:
       - static_configs:
           - targets: ['localhost:9093']
   ```

5. **Create alert rules**:
   ```yaml
   # backend/alerts.yml
   
   groups:
     - name: candidate_stage_updates
       interval: 30s
       rules:
         - alert: CandidateStageUpdateErrorRate
           expr: |
             (
               rate(candidate_stage_update_requests_total{status_code=~"4..|5.."}[5m]) /
               rate(candidate_stage_update_requests_total[5m])
             ) > 0.01
           for: 5m
           annotations:
             summary: "Candidate stage update error rate > 1%"
             description: "Error rate is {{ $value | humanizePercentage }}"
         
         - alert: CandidateStageUpdateLatency
           expr: |
             histogram_quantile(0.95, rate(candidate_stage_update_duration_ms_bucket[5m])) > 500
           for: 5m
           annotations:
             summary: "Candidate stage update p95 latency > 500ms"
             description: "p95 latency is {{ $value }}ms (target: <200ms)"
         
         - alert: CandidateStageUpdateValidationErrors
           expr: |
             rate(candidate_stage_update_requests_total{error_type="validation_error"}[1m]) > 0.17
           for: 1m
           annotations:
             summary: "High validation error rate (>10/min) in stage updates"
             description: "This suggests bad data or API misuse"
   ```

6. **Create Grafana dashboard**:
   ```json
   {
     "dashboard": {
       "title": "Candidate Stage Updates",
       "panels": [
         {
           "title": "Request Rate",
           "targets": [
             { "expr": "rate(candidate_stage_update_requests_total[1m])" }
           ]
         },
         {
           "title": "Error Rate",
           "targets": [
             {
               "expr": "rate(candidate_stage_update_requests_total{status_code=~\"4..|5..\"}[1m]) / rate(candidate_stage_update_requests_total[1m])"
             }
           ]
         },
         {
           "title": "Latency (p50, p95, p99)",
           "targets": [
             { "expr": "histogram_quantile(0.5, rate(candidate_stage_update_duration_ms_bucket[5m]))" },
             { "expr": "histogram_quantile(0.95, rate(candidate_stage_update_duration_ms_bucket[5m]))" },
             { "expr": "histogram_quantile(0.99, rate(candidate_stage_update_duration_ms_bucket[5m]))" }
           ]
         },
         {
           "title": "Status Code Distribution",
           "targets": [
             { "expr": "rate(candidate_stage_update_requests_total[5m])" }
           ]
         }
       ]
     }
   }
   ```

7. **Create debugging guide**:
   ```markdown
   # Debugging Guide: Candidate Stage Update Endpoint
   
   ## Common Issues
   
   ### Issue: HTTP 404 Application Not Found
   - **Cause**: Application ID doesn't exist in database
   - **Debug**: 
     ```sql
     SELECT * FROM "Application" WHERE id = ?;
     ```
   - **Fix**: Verify candidate application exists; use correct applicationId
   
   ### Issue: HTTP 400 Interview Step Not Valid
   - **Cause**: interviewStepId not in position's interview flow
   - **Debug**:
     ```sql
     SELECT s.id, s.name FROM "InterviewStep" s
     JOIN "InterviewFlow" f ON s.flow_id = f.id
     WHERE f.position_id = ?;
     ```
   - **Fix**: Use one of the valid step IDs for this position
   
   ### Issue: HTTP 401 Unauthorized
   - **Cause**: Missing or invalid JWT token
   - **Debug**: Check Authorization header: `Authorization: Bearer <token>`
   - **Fix**: Include valid JWT token in request
   
   ### Issue: HTTP 403 Forbidden
   - **Cause**: User role is not recruiter/hiring_manager
   - **Debug**: Check token claims: `JWT_PAYLOAD.role`
   - **Fix**: Use token with recruiter or hiring_manager role
   
   ### Issue: Slow Performance (>500ms)
   - **Cause**: Slow database queries or heavy audit logging
   - **Debug**:
     ```sql
     SELECT * FROM pg_stat_statements WHERE query LIKE '%Application%' ORDER BY total_time DESC;
     ```
   - **Fix**: Check indexes on Application and InterviewStep tables
   
   ### Issue: Audit Log Insertion Failing
   - **Cause**: Audit log table doesn't exist or has constraint violation
   - **Debug**:
     ```sql
     SELECT * FROM information_schema.tables WHERE table_name = 'AuditLog';
     SELECT * FROM pg_indexes WHERE tablename = 'AuditLog';
     ```
   - **Fix**: Run database migration to create AuditLog table
   ```

**Inputs / Outputs / Contracts**

**Log Level Strategy:**
```
INFO: Stage update started/completed (success cases)
WARN: Validation failures (bad input, stage not in flow), entity not found
ERROR: Unexpected exceptions (database errors, service failures)
DEBUG: (optional) Input values, internal state transitions
```

**Metric Names:**
```
candidate_stage_update_requests_total        (counter)
candidate_stage_update_duration_ms           (histogram)
candidate_stage_update_errors_total          (counter)
audit_log_insertion_duration_ms              (histogram)
http_request_duration_ms                     (histogram, all endpoints)
```

**Alert Thresholds:**
```
Error rate > 1% for 5 minutes                  → page on-call
p95 latency > 500ms for 5 minutes              → page on-call
Validation errors > 10/min sustained           → page on-call (data quality)
Audit log insertion failures > 0               → page on-call (compliance risk)
```

**Dependencies**
- Prometheus client library (prom-client for Node.js)
- Prometheus server (for scraping metrics)
- Grafana (for dashboards)
- AlertManager (for alerting)

---

### Acceptance Criteria

- [ ] Structured logging implemented for stage updates (INFO, WARN, ERROR levels)
- [ ] Logs include: applicationId, userId, oldStageId, newStageId, timestamp, action
- [ ] Prometheus metrics created: candidate_stage_update_requests_total, duration_ms
- [ ] Histogram buckets defined: 10, 50, 100, 150, 200, 300, 500ms
- [ ] Metrics endpoint at /metrics returns Prometheus-format output
- [ ] Alert rules created: error rate >1%, latency >500ms, validation errors >10/min
- [ ] Grafana dashboard displays: request rate, error rate, latency (p50/p95/p99), status codes
- [ ] Metrics scraped every 15 seconds (Prometheus config)
- [ ] Alerts configured to page on-call for critical issues
- [ ] Debugging guide created with common issues and solutions
- [ ] Log queries documented (e.g., find all errors for applicationId=X)
- [ ] Metric queries documented (e.g., error rate over last hour)

---

### Test Requirements

**Unit Tests**
- Logger correctly formats messages with context
- Metrics correctly labeled with status codes and error types
- Alert expressions evaluate correctly (test with mock data)

**Integration Tests**
- Metrics endpoint at /metrics returns valid Prometheus format
- Counters increment on requests
- Histograms record latencies correctly
- Logs appear in output on success and error cases

**Manual Testing / Regression Scope**
- Make successful stage update; verify INFO log and counter increment
- Make failed request (missing auth); verify WARN log and error counter
- Query /metrics endpoint; verify output includes candidate_stage_update_* metrics
- Load Grafana dashboard; verify panels render with data
- Trigger alert condition (>1% error rate); verify alert fires

---

### Non-Functional Requirements

**Observability**
- Latency overhead of metrics collection <5ms
- Logging has minimal performance impact (<1ms per log statement)
- Metrics retained for 15 days (Prometheus default)

**Debugging**
- All logs include consistent context (applicationId, userId, timestamp)
- Error messages are actionable (include remediation steps)
- Metrics queries are documented and copy-paste-ready

**Compliance**
- Logs don't contain PII (no candidate email/name)
- Audit trail exists (who made changes, when)
- Alert response time <1 minute (alerting system configured)

---

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Logs grow too large (disk space) | Configure log rotation; set retention to 7-14 days |
| Metrics collection adds latency | Use async metrics collection; monitor overhead |
| False alert fires (noisy alerts) | Set conservative thresholds; require 5min sustained condition |
| Alerts not reaching on-call | Test alerting pipeline (Slack/PagerDuty); verify routing rules |
| Metrics gap during downtime | Prometheus has built-in persistence; retains data on restart |

---

### Definition of Done

- [ ] Structured logging implemented with INFO/WARN/ERROR levels
- [ ] Logs include applicationId, userId, stage IDs, timestamps
- [ ] Prometheus metrics created and registered
- [ ] Metrics endpoint at /metrics returns valid Prometheus output
- [ ] Alert rules created and tested (error rate, latency, validation errors)
- [ ] Grafana dashboard created and displays all key metrics
- [ ] Debugging guide created with common issues and solutions
- [ ] All tests passing (unit, integration, manual)
- [ ] Logs reviewed (no PII exposure)
- [ ] Metrics scraped and retained (15+ days)
- [ ] Alerts configured and tested
- [ ] Code merged to main branch
- [ ] Operations team trained on dashboards and alerts

---
