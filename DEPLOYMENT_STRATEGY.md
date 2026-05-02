# Deployment Strategy: Candidate Interview Stage Update

## Feature: PUT /candidates/:applicationId/stage

### Overview
This document outlines the deployment and rollout strategy for the "Update Candidate Interview Stage" feature.

### Deployment Timeline

#### Phase 1: Initial Deployment (Day 0)
- **Status**: Feature deployed but disabled in production
- **Rollout**: 0% of users
- **Duration**: 4 hours (verification window)
- **Monitoring**: Metrics baseline collection, log analysis
- **Actions**:
  1. Deploy code to staging environment
  2. Run smoke tests to verify endpoint is accessible
  3. Check database migrations are applied
  4. Monitor staging logs for errors
  5. Deploy code to production (feature flag OFF)

#### Phase 2: Internal Testing (Day 1)
- **Status**: Feature enabled for internal users only
- **Rollout**: Specific user IDs (internal recruiting team)
- **Duration**: 1 day
- **Monitoring**: 
  - API error rate (target: <0.1%)
  - Endpoint latency (target: <500ms)
  - Audit log entries (verify logging works)
  - Database performance (query duration)
- **Rollback Plan**: Disable feature flag if error rate >1% or latency >2s

#### Phase 3: Beta Rollout (Days 2-4)
- **Status**: Feature enabled for 10% of active recruiters
- **Rollout**: 10% gradual rollout (userId hash-based)
- **Duration**: 3 days
- **Monitoring**: Same as Phase 2
- **Escalation**: Page on-call if error rate >0.5%
- **Actions**:
  1. Monitor metrics continuously
  2. Collect user feedback via Slack
  3. Check for issues in audit logs
  4. Verify stage transitions are correct

#### Phase 4: Wider Rollout (Days 5-9)
- **Status**: Feature enabled for increasing percentage of users
- **Rollout Schedule**:
  - Day 5-6: 25% of users
  - Day 7-8: 50% of users
  - Day 9: 75% of users
- **Duration**: 5 days
- **Monitoring**: Continued performance monitoring
- **Rollback Plan**: Disable feature flag if error rate >0.5%

#### Phase 5: Full Rollout (Day 10+)
- **Status**: Feature fully enabled for all users
- **Rollout**: 100% of users
- **Duration**: Permanent
- **Monitoring**: Standard production monitoring

### Rollback Procedure

**If Errors Detected**:
1. Set `FEATURE_CANDIDATE_STAGE_UPDATE=0` in production environment
2. Verify feature flag is disabled: `GET /health` and confirm `featureFlags.CANDIDATE_STAGE_UPDATE` is `"0"`
3. Monitor metrics to confirm error rate returns to baseline
4. Collect logs and error details for analysis
5. Roll back code if necessary using git revert
6. Re-deploy after fixing root cause

**Estimated Rollback Time**: <5 minutes

### Feature Flag Configuration

**Environment Variable**:
```bash
FEATURE_CANDIDATE_STAGE_UPDATE=100  # 0-100% rollout
```

**Current Values**:
- Staging: 100% (always enabled for testing)
- Production: 0% (initially disabled for safe rollout)

### Monitoring & Alerting

**Key Metrics**:
1. **Error Rate**: PUT /candidates/:applicationId/stage error responses (4xx, 5xx)
   - Threshold: >1% triggers warning, >5% triggers critical alert
2. **Latency**: P95 response time for the endpoint
   - Threshold: >500ms warning, >2s critical
3. **Audit Log Entries**: Number of successful STAGE_UPDATE entries
   - Target: Consistent with deployment phase percentage
4. **Database Performance**: Query duration for application updates
   - Threshold: >200ms triggers investigation

**Alert Recipients**:
- Staging: Slack #backend-dev
- Production: PagerDuty (on-call engineer)

### Load Testing

**Before Phase 3 (Beta)**:
- Test endpoint with 100 concurrent requests
- Verify no database connection pool exhaustion
- Check API response times under load

**Expected Results**:
- All requests succeed (no 5xx errors)
- P95 latency < 1 second
- Database connections stay below max pool size

### Compliance & Security Checks

**Before Rollout**:
- ✅ Input validation prevents SQL injection (Prisma parameterized queries)
- ✅ Authorization checks (recruiter/hiring_manager role required)
- ✅ PII not exposed in error messages
- ✅ HTML sanitization applied to notes field
- ✅ Audit log captures all stage changes
- ✅ GDPR right-to-erasure considerations (cascade delete)

**Data Retention**:
- Audit logs retained for 90 days minimum
- No user data retained beyond application lifecycle
- Comply with GDPR data deletion requirements

### Communication Plan

**Stakeholders to Notify**:
1. Recruiting Team: Phase 2 (Beta testing starts)
2. Management: Phase 1 & Phase 5 (Deploy & Go-live)
3. Support Team: Day 1 (for handling any questions)

**Communication Content**:
- What changed (new endpoint available)
- How to use it (API endpoint docs)
- What to watch for (expected behavior)
- Who to contact for issues (support channel)

### Post-Deployment

**Day 14 Verification**:
- ✅ Verify 100% of requests are going through new endpoint
- ✅ Confirm audit logs are being written correctly
- ✅ Check error rates are within acceptable range (<0.1%)
- ✅ Collect user feedback on feature usability

**After 30 Days**:
- Review deployment success
- Document lessons learned
- Plan for any improvements
- Remove feature flag if no issues (permanent state)

### Incident Response

**If P1 Incident Occurs**:
1. Disable feature flag immediately
2. Notify on-call team
3. Investigate root cause using logs
4. Document issue in incident tracker
5. Fix and re-test before re-enabling

**Escalation Path**:
- Team Lead → Engineering Manager → Director (if needed)

### Success Criteria

Feature rollout is considered successful when:
1. Zero critical bugs reported
2. Error rate remains <0.5% across all phases
3. No performance degradation compared to baseline
4. User feedback is positive (if collected)
5. All audit logs are working correctly
6. No security vulnerabilities discovered

### Rollout Automation

**To Update Rollout Percentage**:
```bash
# Set to 50% rollout
kubectl set env deployment/lti-backend \
  FEATURE_CANDIDATE_STAGE_UPDATE=50
```

**To Disable Feature Completely**:
```bash
# Set to 0% rollout (disabled)
kubectl set env deployment/lti-backend \
  FEATURE_CANDIDATE_STAGE_UPDATE=0
```

**To Enable for All Users**:
```bash
# Set to 100% rollout (fully enabled)
kubectl set env deployment/lti-backend \
  FEATURE_CANDIDATE_STAGE_UPDATE=100
```
