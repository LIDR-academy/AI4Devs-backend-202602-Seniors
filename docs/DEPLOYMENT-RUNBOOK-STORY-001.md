# Deployment Runbook: STORY-001 Position Candidates Endpoint

## Overview

This runbook provides step-by-step instructions for safely deploying the GET /positions/:id/candidates endpoint to production with a gradual rollout strategy.

---

## Pre-Deployment Checklist

- [ ] All tests passing (Backend unit/integration, Frontend component, E2E)
- [ ] Code review approved
- [ ] Database migrations applied to staging
- [ ] Staging environment validated (QA signoff)
- [ ] Performance baseline confirmed (<500ms for 100 candidates)
- [ ] Monitoring and alerts configured
- [ ] Runbook reviewed by ops team
- [ ] Feature flag configuration ready
- [ ] Rollback procedure documented and tested

---

## Deployment Stages

### Stage 1: Production Deployment (Feature Flag OFF)

**Timeline**: Day 0  
**Risk Level**: Low (feature disabled, no user impact)

#### 1.1 Pre-Deployment Validation

```bash
# Verify code build
npm run build

# Run all tests
npm test
npm run e2e

# Check database migrations status
npx prisma migrate status
```

#### 1.2 Deploy to Production

1. Merge PR to `main` branch
2. CI/CD pipeline automatically:
   - Runs linting and tests
   - Builds Docker image
   - Pushes to production registry
3. Approve production deployment
4. CI/CD deploys to production servers
5. Run smoke tests:
   ```bash
   curl -H "Authorization: Bearer test-token" \
     http://api.production.com/positions/1/candidates
   # Expected: HTTP 501 (feature not implemented yet)
   ```

#### 1.3 Validation

- [ ] Endpoint returns 501 (feature disabled)
- [ ] No errors in application logs
- [ ] Database connection healthy
- [ ] Monitoring dashboards operational

---

### Stage 2: Enable for 10% (Day 1)

**Timeline**: Day 1, 10:00 AM  
**Risk Level**: Low (small user cohort)

#### 2.1 Enable Feature Flag at 10%

The middleware reads `FEATURE_POSITION_CANDIDATES_ENDPOINT` as a numeric percentage (0–100).
Per-request eligibility is determined by `userId % 100 < rolloutPercentage`, so users whose
ID modulo 100 falls below the threshold are in the enabled cohort.

1. Update production environment variable:
   ```bash
   export FEATURE_POSITION_CANDIDATES_ENDPOINT=10
   ```
2. Redeploy configuration (or restart application to pick up the new env var)
3. Verify with a user whose ID is in the 10% cohort (userId % 100 < 10, e.g. userId=5):
   ```bash
   # User ID 5: 5 % 100 = 5 < 10 → should be enabled
   curl -H "Authorization: Bearer recruiter-token" \
        -H "X-User-Id: 5" \
     http://api.production.com/positions/1/candidates
   # Expected: HTTP 200 or 404 (feature enabled for this user)

   # User ID 15: 15 % 100 = 15 ≥ 10 → should be gated
   curl -H "Authorization: Bearer recruiter-token" \
        -H "X-User-Id: 15" \
     http://api.production.com/positions/1/candidates
   # Expected: HTTP 501 { "error": "Not Implemented" }
   ```
4. Rollback this stage: set `FEATURE_POSITION_CANDIDATES_ENDPOINT=0` and redeploy

#### 2.2 Monitor (24 hours)

**Key Metrics to Watch:**
- Response time: Should be <500ms for p95
- Error rate: Should be <1%
- Database query time: Check slow query log
- Authorization failures: Should be ~0

**Check every 2 hours:**
```bash
# Check Grafana dashboard: http://grafana.internal/d/position-candidates
# Check error logs: grep ERROR /var/log/app.log | grep "/positions"
# Check metrics: Check Prometheus for error spikes
```

**Alert Thresholds:**
- If response time > 1s: Page on-call (check database, indexes)
- If error rate > 1%: Page on-call (check error logs)
- If auth failures > 5/minute: Page on-call (security issue)

#### 2.3 Validation After 24 Hours

- [ ] No critical errors in logs
- [ ] Response time stable (<500ms p95)
- [ ] Error rate <1%
- [ ] User feedback: No complaints
- [ ] Candidate data accuracy confirmed

---

### Stage 3: Increase to 50% (Day 2)

**Timeline**: Day 2, 10:00 AM  
**Risk Level**: Medium (larger user cohort)

#### 3.1 Increase Feature Flag Rollout to 50%

1. Update production environment variable:
   ```bash
   export FEATURE_POSITION_CANDIDATES_ENDPOINT=50
   ```
2. Redeploy configuration
3. Verify with a user in the new cohort (50 ≤ userId % 100 < 100 were previously gated, e.g. userId=50):
   ```bash
   # User ID 50: 50 % 100 = 50 < 50? → false (boundary, still gated)
   # User ID 49: 49 % 100 = 49 < 50 → enabled
   curl -H "Authorization: Bearer recruiter-token" \
        -H "X-User-Id: 49" \
     http://api.production.com/positions/1/candidates
   # Expected: HTTP 200 or 404 (feature enabled)

   # User ID 75: 75 % 100 = 75 ≥ 50 → still gated
   curl -H "Authorization: Bearer recruiter-token" \
        -H "X-User-Id: 75" \
     http://api.production.com/positions/1/candidates
   # Expected: HTTP 501 { "error": "Not Implemented" }
   ```
4. Rollback this stage: set `FEATURE_POSITION_CANDIDATES_ENDPOINT=10` (revert to Stage 2) or `0` (full disable)

#### 3.2 Monitor (24 hours)

Same monitoring as Stage 2, but watch for:
- Any latency increase (more load on database)
- Unexpected error patterns
- Authorization or data access issues

---

### Stage 4: Enable for 100% (Day 3)

**Timeline**: Day 3, 10:00 AM  
**Risk Level**: Standard (full production)

#### 4.1 Full Rollout to 100%

1. Update production environment variable:
   ```bash
   export FEATURE_POSITION_CANDIDATES_ENDPOINT=100
   ```
2. Redeploy configuration
3. Verify all authenticated users can access the endpoint regardless of user ID:
   ```bash
   curl -H "Authorization: Bearer recruiter-token" \
     http://api.production.com/positions/1/candidates
   # Expected: HTTP 200 or 404 (feature enabled for all users)
   ```

#### 4.2 Final Validation

- [ ] All recruiter/hiring_manager users can access
- [ ] Response times stable
- [ ] No degradation in other endpoints
- [ ] Candidate data displayed correctly
- [ ] Average scores calculated correctly

---

## Rollback Procedure

### Immediate Rollback (If Critical Issue)

**Trigger**: Error rate >5%, Response time >2s, Data corruption detected

```bash
# Step 1: Disable feature flag (set percentage to 0)
export FEATURE_POSITION_CANDIDATES_ENDPOINT=0

# Step 2: Redeploy configuration
docker pull registry.internal/app:latest
docker run ... -e FEATURE_POSITION_CANDIDATES_ENDPOINT=0

# Step 3: Verify endpoint is gated for all users
curl -H "Authorization: Bearer recruiter-token" \
  http://api.production.com/positions/1/candidates
# Expected: HTTP 501 { "error": "Not Implemented" }

# Step 4: Alert team
slack post #incidents "Rolled back STORY-001 endpoint due to [reason]"

# Step 5: Investigate root cause
# - Check logs
# - Check database performance
# - Check for any data inconsistencies
```

### Gradual Rollback (If Minor Issue)

**Trigger**: Minor performance degradation, edge case bugs

1. Keep feature flag ON (don't disable)
2. Deploy a hotfix:
   ```bash
   # Fix code in src/
   npm run build
   # Create PR, merge, redeploy
   ```
3. Monitor improvement
4. If not resolved in 1 hour, escalate to immediate rollback

---

## Monitoring During Rollout

### Grafana Dashboard

Navigate to: http://grafana.internal/d/position-candidates-story-001

**Key Panels:**
- **Response Time (p95)**: Should stay below 500ms
- **Error Rate**: Should stay below 1%
- **Request Volume**: Should match expected user load
- **Database Query Time**: Monitor slow queries

### Prometheus Queries

```promql
# Response time p95
histogram_quantile(0.95, http_request_duration_seconds{route="/positions/{id}/candidates"})

# Error rate (errors per minute)
rate(position_candidates_endpoint_errors_total[1m])

# Request volume
rate(http_requests_total{route="/positions/{id}/candidates"}[1m])
```

### Log Monitoring

```bash
# Watch for errors in real-time
tail -f /var/log/app.log | grep "/positions" | grep ERROR

# Count errors by type
grep "/positions.*ERROR" /var/log/app.log | awk -F'error_type=' '{print $2}' | sort | uniq -c
```

---

## Post-Deployment Validation

### Day 3 Checks (After Full Rollout)

- [ ] Feature accessible to all recruiters/hiring_managers
- [ ] Average response time: <500ms
- [ ] Error rate: <0.5%
- [ ] Database performance: No queries >1s
- [ ] Authorization working correctly
- [ ] Data accuracy verified (sample check 10 positions)
- [ ] Frontend component renders correctly
- [ ] Mobile responsive design working
- [ ] Accessibility (screen reader friendly)

### User Feedback

- [ ] At least 5 recruiters have tested
- [ ] No complaints about missing data
- [ ] Average scores calculation verified
- [ ] Interview step data correct
- [ ] Feature is useful/meets requirements

---

## Troubleshooting

### Problem: High Response Time (>1s)

1. Check database performance:
   ```bash
   # Check slow query log (PostgreSQL)
   tail -f /var/log/postgresql/postgresql-*.log | grep "positions"
   # Or via systemd: journalctl -u postgresql -f | grep "positions"

   # Check database indexes
   psql -d LTIdb -c "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'application';"
   ```

2. Check Jaeger traces:
   - Open http://jaeger.internal
   - Search for slow requests
   - Identify which component is slow (DB, Prisma, etc.)

3. Possible fixes:
   - Add missing database index
   - Optimize Prisma query (add/remove includes)
   - Check database connection pool exhaustion

### Problem: High Error Rate (>1%)

1. Check error logs:
   ```bash
   grep ERROR /var/log/app.log | tail -50
   ```

2. Common errors:
   - **"Position not found"**: Check if test position exists in production
   - **"Database connection failed"**: Check database connectivity
   - **"Authorization failed"**: Check JWT token validation
   - **"Null reference error"**: Check if required fields missing from schema

3. Fix and redeploy:
   - Fix code
   - Create hotfix PR
   - Deploy as usual

### Problem: Candidate Data Missing Fields

1. Check Prisma query:
   - Verify `includes` in positionService.ts
   - Ensure all required relations fetched

2. Check database schema:
   ```bash
   psql -d LTIdb -c "SELECT * FROM Application LIMIT 1 \gx"
   ```

3. Check seed data:
   - Verify test positions/candidates in database
   - Run seed script to populate test data

---

## Contacts & Escalation

| Issue | Owner | Contact |
|-------|-------|---------|
| Performance/Database | DevOps | @devops-oncall |
| Code/Logic Bug | Backend Team | @backend-lead |
| Authorization Issues | Security | @security-team |
| Frontend/UI Issues | Frontend Team | @frontend-lead |
| Monitoring/Alerts | SRE | @sre-oncall |

---

## Sign-Off

- [ ] Ops Lead: _________________ Date: _______
- [ ] DevOps Lead: _________________ Date: _______
- [ ] Backend Lead: _________________ Date: _______
- [ ] QA Lead: _________________ Date: _______
