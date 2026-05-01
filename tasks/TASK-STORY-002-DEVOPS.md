# Tasks for STORY-002: Update Candidate Interview Stage

**Discipline**: DevOps  
**Total Tasks**: 1  
**Coverage**: Deployment, feature flags, rollout strategy

---

## TASK-STORY-002-DEVOPS-001

**Title**: Set up feature flag and deployment strategy for staged rollout

**Parent Story**: STORY-002-update-candidate-stage ([link](/stories/STORY-002-update-candidate-stage.md))

**Discipline**: DevOps

**Depends On**: TASK-STORY-002-BACKEND-003 (endpoint implementation), TASK-STORY-002-QA-001 (all tests passing)

**Blocks**: None (deployment is final step before production)

---

### Purpose & Scope

**Purpose**
Implement feature flag infrastructure and deployment strategy to enable safe, gradual rollout of the PUT /candidates/:applicationId/stage endpoint. Feature flags allow disabling the feature without redeploying if issues arise.

Fulfills story's rollout plan: "3-day staged rollout with feature flag (10% → 50% → 100%)"

**Scope of Change**
- Create: Feature flag environment variable `FEATURE_CANDIDATE_STAGE_UPDATE` (default: 0 — disabled)
- Modify: Backend code to check feature flag before executing endpoint
- Create: Environment configuration for dev/staging/production (different default values)
- Create: Deployment runbook with rollout steps and rollback procedure
- Create: Monitoring alerts for error rate, latency, audit log volume
- Verify: Feature flag can be toggled without redeploying (via env var or configuration service)

**Where**
- Feature flag check: `backend/src/index.ts` (route guard) and/or middleware
- Environment config: `.env`, `.env.staging`, `.env.production` (feature flag values)
- Runbook: `backend/docs/DEPLOYMENT-RUNBOOK.md` (new)
- Monitoring config: `backend/docs/MONITORING-ALERTS.md` (new)
- CI/CD: `.github/workflows/deploy.yml` (update if needed)

**Why**
Per story's rollout plan: "3-day staged rollout (10% → 50% → 100%)" and "Rollback: if error rate >5%, disable flag without redeploying". Feature flags enable this without code changes.

Per CLAUDE.md architecture: All configuration via environment variables; deployment pipelines use .env files. Feature flags fit this pattern.

---

### Implementation Guidance

**How: Technical Approach & Implementation Steps**

1. **Add feature flag environment variable**:
   ```bash
   # .env (development default: disabled)
   FEATURE_CANDIDATE_STAGE_UPDATE=0
   
   # .env.staging (staging default: fully enabled; middleware also auto-enables when NODE_ENV=staging)
   FEATURE_CANDIDATE_STAGE_UPDATE=100
   
   # .env.production (production default: fully enabled; reduce percentage for staged rollout if needed)
   FEATURE_CANDIDATE_STAGE_UPDATE=100
   ```

2. **Feature flag check in route handler** (already implemented):
   ```typescript
   // backend/src/routes/candidateRoutes.ts
   // The route already uses featureFlagMiddleware from featureFlagMiddleware.ts,
   // which reads FEATURE_CANDIDATE_STAGE_UPDATE as a numeric percentage (0–100)
   // via parseInt(flagFromEnv, 10) and checks userId % 100 < rolloutPercentage.
   // Do NOT add a local boolean === 'true' check here.
   
   import { featureFlagMiddleware } from '../middleware/featureFlagMiddleware';
   
   router.put(
     '/:applicationId/stage',
     authMiddleware,
     requireRole(['recruiter', 'hiring_manager']),
     featureFlagMiddleware('CANDIDATE_STAGE_UPDATE'),
     updateCandidateStage
   );
   ```

3. **Configure environment per deployment target**:
   ```bash
   # build script in package.json checks NODE_ENV and loads correct .env
   "scripts": {
     "dev": "NODE_ENV=development ts-node src/index.ts",
     "start:prod": "NODE_ENV=production node dist/index.js",
     "deploy:staging": "NODE_ENV=staging ts-node src/index.ts",
     "deploy:prod": "NODE_ENV=production node dist/index.js"
   }
   ```

4. **Create deployment runbook** (`backend/docs/DEPLOYMENT-RUNBOOK.md`):
   ```markdown
   # Deployment Runbook: STORY-002 (Update Candidate Stage)
   
   ## Pre-Deployment Checklist
   - [ ] All tests passing (unit, integration, e2e)
   - [ ] Performance baseline verified (<200ms on staging)
   - [ ] Audit log correctness verified
   - [ ] Security review completed (role-based access, input validation)
   - [ ] Observability configured (logging, metrics, alerts)
   - [ ] Documentation updated (API reference, runbook)
   - [ ] Team notification sent (Slack: #deployments channel)
   
   ## Day 0: Deploy with Feature Flag OFF
   ```bash
   # Step 1: Build and test in staging environment
   cd backend
   npm run build
   npm test
   
   # Step 2: Deploy to production with FEATURE_CANDIDATE_STAGE_UPDATE=0 (disabled)
   # (via CI/CD pipeline or manual deployment)
   export FEATURE_CANDIDATE_STAGE_UPDATE=0
   npm run start:prod
   
   # Step 3: Verify endpoint returns 501 (Not Implemented)
   curl -X PUT http://prod.example.com/candidates/1/stage \
     -H "Authorization: Bearer test-token" \
     -d '{"interviewStepId": 2}' \
     -w "\nStatus: %{http_code}\n"
   # Expected: HTTP 501 Not Implemented
   
   # Step 4: Monitor baseline (no errors expected; feature disabled)
   # Check Grafana dashboard: error_rate should be 0%
   ```
   
   ## Day 1: Enable for 10% of Requests
   ```bash
   # Option A: Environment variable (requires app restart)
   # featureFlagMiddleware reads this as a percentage: userId % 100 < 10 → enabled
   export FEATURE_CANDIDATE_STAGE_UPDATE=10
   systemctl restart app
   
   # Option B: Feature flag service (if available; zero downtime)
   # POST /admin/feature-flags
   # { "name": "FEATURE_CANDIDATE_STAGE_UPDATE", "rollout_percentage": 10 }
   
   # Monitor metrics:
   # - candidate_stage_update_errors_total: should be <1% of requests
   # - candidate_stage_update_duration_ms (p95): should be <200ms
   # - audit_log_insertion_latency: should be <50ms
   
   # If all metrics healthy for 2 hours, proceed to 50%
   ```
   
   ## Day 2: Enable for 50% of Requests
   ```bash
   export FEATURE_CANDIDATE_STAGE_UPDATE=50
   # (or update feature flag service to 50% rollout; userId % 100 < 50 → enabled)
   
   # Continue monitoring; if issues arise, rollback to 10% or disable
   ```
   
   ## Day 3: Enable for 100% of Users
   ```bash
   export FEATURE_CANDIDATE_STAGE_UPDATE=100
   # Feature now enabled for all users (userId % 100 < 100 → always true); monitor for 48 hours
   ```
   
   ## Rollback Procedure (if error rate >5%)
   ```bash
   # Step 1: Disable feature flag (0 = disabled for all users)
   export FEATURE_CANDIDATE_STAGE_UPDATE=0
   systemctl restart app
   
   # Step 2: Verify endpoint returns 501
   curl -X PUT http://prod.example.com/candidates/1/stage ...
   # Expected: HTTP 501 Not Implemented
   
   # Step 3: Alert team
   curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK \
     -d '{"text": "Rolled back STORY-002 due to error rate spike. Check /logs for details."}'
   
   # Step 4: Investigate root cause
   # - Check application logs: grep "error" /var/log/app.log
   # - Check database health: psql -c "SELECT * FROM pg_stat_statements LIMIT 10"
   # - Check audit log insertion latency: SELECT AVG(elapsed_ms) FROM audit_log_metrics
   # - Determine fix (schema issue, validation bug, performance regression)
   
   # Step 5: Fix and redeploy
   # (Once root cause is fixed, redeploy with flag OFF, then repeat rollout)
   ```
   
   ## Monitoring Dashboard
   - **Endpoint**: http://grafana.example.com/d/candidate-stage-update
   - **Key Metrics**:
     - `candidate_stage_update_requests_total`: Request volume by status code
     - `candidate_stage_update_errors_total`: Errors by type (validation, not_found, auth)
     - `candidate_stage_update_duration_ms`: Latency histogram (p50, p95, p99)
     - `audit_log_insertion_duration_ms`: Audit logging latency
     - `application_currentinterviewstep_update_errors`: DB update failures
   - **Alerts**:
     - If `error_rate > 1%` for 5 minutes: page on-call engineer
     - If `p95_latency > 500ms`: investigate performance regression
     - If `audit_log_insertion_errors > 0`: investigate audit log issues
   ```

5. **Create monitoring alerts**:
   ```yaml
   # backend/docs/MONITORING-ALERTS.md
   
   ## Alert Rules (Prometheus/Grafana)
   
   ### Alert 1: High Error Rate
   ```
   alert: CandidateStageUpdateErrorRate
   expr: rate(candidate_stage_update_errors_total[5m]) / rate(candidate_stage_update_requests_total[5m]) > 0.01
   for: 5m
   annotations:
     summary: "Candidate stage update error rate > 1%"
     description: "{{ $value | humanizePercentage }} of stage update requests are failing"
   ```
   
   ### Alert 2: High Latency
   ```
   alert: CandidateStageUpdateLatency
   expr: histogram_quantile(0.95, rate(candidate_stage_update_duration_ms_bucket[5m])) > 500
   for: 5m
   annotations:
     summary: "Candidate stage update p95 latency > 500ms"
     description: "p95 latency is {{ $value }}ms (target: <200ms)"
   ```
   
   ### Alert 3: Audit Log Insertion Failures
   ```
   alert: AuditLogInsertionFailures
   expr: rate(audit_log_insertion_errors_total[5m]) > 0
   for: 1m
   annotations:
     summary: "Audit log insertion failing"
     description: "Check audit log table and indexes"
   ```
   ```

6. **Verify feature flag can be toggled without code changes**:
   ```bash
   # Test 1: Restart app with flag OFF → endpoint returns 501
   FEATURE_CANDIDATE_STAGE_UPDATE=0 npm run start:prod &
   curl -X PUT ... # → HTTP 501
   
   # Test 2: Toggle flag to full rollout (requires container restart to pick up env var)
   FEATURE_CANDIDATE_STAGE_UPDATE=100 systemctl restart app
   curl -X PUT ... # → HTTP 200/400/etc (depending on input)
   ```

**Inputs / Outputs / Contracts**

**Feature Flag Configuration:**
```
ENV VAR: FEATURE_CANDIDATE_STAGE_UPDATE
Type: numeric percentage string, parsed via parseInt(value, 10) — valid range 0–100
Default: 0 (feature disabled; featureFlagMiddleware returns HTTP 501)
Rollout: userId % 100 < percentage → enabled for that user
Behavior at 0:   Endpoint returns HTTP 501 "Not Implemented" for all users
Behavior at 10:  Enabled for users whose userId % 100 < 10 (~10% cohort)
Behavior at 50:  Enabled for users whose userId % 100 < 50 (~50% cohort)
Behavior at 100: Enabled for all authenticated users
```

**Deployment Environments:**
```
Development (.env):
  FEATURE_CANDIDATE_STAGE_UPDATE=0
  (Developers can override to 100 for local testing)

Staging (.env.staging):
  FEATURE_CANDIDATE_STAGE_UPDATE=100
  (featureFlagMiddleware also auto-enables at 100 when NODE_ENV=staging)

Production (.env.production):
  FEATURE_CANDIDATE_STAGE_UPDATE=0
  (Ops team sets to 10 → 50 → 100 during 3-day staged rollout)
  (Stored in secrets manager or .env.production.secrets, not in version control)
```

**HTTP Response When Feature Disabled (HTTP 501):**
```json
{
  "error": "Not Implemented",
  "statusCode": 501,
  "message": "Feature is not yet available"
}
```

**Dependencies**
- Feature flag mechanism (environment variables, or external service like LaunchDarkly)
- Monitoring system (Prometheus + Grafana, or equivalent)
- Alerting system (PagerDuty, Slack, or equivalent)
- Deployment automation (CI/CD pipeline, or manual via ops team)

---

### Acceptance Criteria

- [ ] Feature flag environment variable `FEATURE_CANDIDATE_STAGE_UPDATE` created
- [ ] Feature flag defaults to false in all environments
- [ ] Endpoint returns HTTP 501 "Not Implemented" when flag is false
- [ ] Endpoint executes normally when flag is true (all validations, auth, business logic)
- [ ] Feature flag can be toggled via environment variable without code changes
- [ ] Environment configuration created (.env, .env.staging, .env.production)
- [ ] Deployment runbook created with rollout steps and rollback procedure
- [ ] Monitoring alerts configured for: error rate >1%, latency >500ms, audit log failures
- [ ] Grafana dashboard created with key metrics: error rate, latency, audit log volume
- [ ] Rollout timeline documented: Day 0 (flag OFF), Day 1 (10%), Day 2 (50%), Day 3 (100%)
- [ ] Rollback procedure tested and documented (verified endpoint returns 501 when disabled)
- [ ] CI/CD pipeline updated to deploy with feature flag handling
- [ ] Team notified of deployment schedule and monitoring plan

---

### Test Requirements

**Unit Tests**
- Feature flag middleware returns 501 when flag is false
- Feature flag middleware calls next() when flag is true
- Feature flag check does not affect other endpoints

**Integration Tests**
- Endpoint returns 501 when flag is false
- Endpoint returns correct responses (200/400/etc) when flag is true
- Toggling flag affects endpoint behavior without restarting (if using dynamic config)

**Manual Testing / Regression Scope**
- Deploy to staging with flag OFF; verify endpoint returns 501
- Enable flag; verify endpoint works (happy path and error cases)
- Disable flag; verify endpoint returns 501 again
- Verify other endpoints not affected by feature flag
- Monitor metrics during 3-day rollout (error rate, latency, audit log volume)
- Verify rollback procedure: disable flag, endpoint returns 501, no data corruption

---

### Non-Functional Requirements

**Availability**
- Feature flag check adds <1ms latency (negligible)
- Toggling flag does not require code recompilation or full restart (if possible)
- Endpoint available 24/7 during rollout (monitoring + alerting ensure quick issue detection)

**Monitoring**
- All key metrics logged: error rate, latency, audit log volume
- Alerts fire immediately if error rate >1% or latency >500ms
- Dashboard provides real-time visibility into endpoint health during rollout

**Reliability**
- Feature flag toggle is idempotent: toggling multiple times has same effect
- Rollback procedure is simple and fast (disable flag, verify 501, alert team)
- No data loss if feature flag disabled mid-request (in-flight requests complete safely)

---

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Feature flag check adds latency | Use simple env var check in memory (not external service); recheck adds <1ms |
| Rollback is slow (requires restart) | Use dynamic configuration service (LaunchDarkly, feature flag service) for zero-downtime toggles |
| Monitoring alerts are noisy (false positives) | Set alert thresholds conservatively; alert on sustained errors (5min), not transient spikes |
| Audit log volume spikes during rollout | Monitor insertion latency; if >50ms, investigate indexes or batch inserts |
| 3-day rollout takes too long | Can accelerate to 1-day (OFF → 50% → 100%) if early metrics are healthy |

---

### Definition of Done

- [ ] Feature flag environment variable created and defaults to false
- [ ] Feature flag check implemented in route handler (returns 501 when false)
- [ ] Environment configurations created (.env, .env.staging, .env.production)
- [ ] Deployment runbook created with 4-step rollout plan and rollback procedure
- [ ] Monitoring alerts configured and tested
- [ ] Grafana dashboard created with key metrics
- [ ] Feature flag can be toggled without code changes (verified via testing)
- [ ] CI/CD pipeline updated to handle feature flag deployment
- [ ] Team trained on rollout plan and monitoring dashboard
- [ ] Runbook reviewed and approved by ops team
- [ ] Code deployed to staging and verified
- [ ] Code merged to main branch
- [ ] Ready for 3-day production rollout

---
