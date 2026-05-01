# DevOps / Infrastructure Tasks for STORY-001: Retrieve Position Candidates

**Discipline**: DevOps / Infrastructure  
**Total Tasks**: 1  
**Coverage**: AC-8 (Authorization via token), non-functional requirements (performance, feature flag rollout)

---

## TASK-STORY-001-DEVOPS-001

**Title**: Set up feature flag, CI/CD pipeline integration, and gradual rollout strategy for position candidates endpoint

**Parent Story**: STORY-001-get-position-candidates

**Discipline**: DevOps

**Depends On**: TASK-STORY-001-BACKEND-001, TASK-STORY-001-QA-001 (all tests passing before deployment)

**Blocks**: Production deployment (feature flag is gating mechanism for rollout)

---

### Purpose

Configure feature flag to gate the GET /positions/:id/candidates endpoint, set up CI/CD pipeline to run tests on every commit, automate deployment to staging/production environments, and implement gradual rollout strategy (10% → 50% → 100% over 3 days). This enables safe, low-risk deployment of the feature with real-time monitoring and easy rollback if issues arise.

Fulfills story non-functional requirements: Feature flag for gradual rollout, monitoring strategy, safe rollback plan (from STORY-001 Technical Design, Rollout & Rollback section).

### Scope of Change

- **Create**: Feature flag `FEATURE_POSITION_CANDIDATES_ENDPOINT` in configuration system
- **Create**: Middleware to check feature flag before allowing request through
- **Create**: CI/CD pipeline steps: build, lint, test, staging deploy, prod deploy
- **Create**: Monitoring/alerts for endpoint performance and errors
- **Create**: Rollout runbook with step-by-step gradual deployment procedure
- **Modify**: `.env` and environment-specific configs to support feature flag
- **Create**: Deployment checklist before each stage (10%, 50%, 100%)

### Where

- **Feature flag config**: Environment variables (`FEATURE_POSITION_CANDIDATES_ENDPOINT=0..100`, where `0`=disabled, `10`/`50`/`100`=staged rollout percentage)
- **Feature flag middleware**: `backend/src/middleware/featureFlagMiddleware.ts`
- **CI/CD pipeline**: `.github/workflows/` (GitHub Actions) or equivalent for your CI tool
- **Monitoring config**: Prometheus/Grafana or equivalent monitoring system
- **Runbook**: `docs/DEPLOYMENT-RUNBOOK-STORY-001.md`
- **Environment config**: `.env.example`, `.env.staging`, `.env.production`

### Why

Per STORY-001 Technical Design section "Rollout & Rollback Plan":
> "Feature flag: `FEATURE_POSITION_CANDIDATES_ENDPOINT` (default: off in production)"
> "Rollout: Gradual, 10% → 50% → 100% over 2 days"
> "Testing: QA validates endpoint on 10% cohort; no regressions found before expanding"

Feature flags are critical for safe production deployments:
1. **Risk mitigation**: If issues detected at 10%, disable flag immediately (vs. hotfix rollback)
2. **Gradual validation**: Real users test feature before 100% rollout
3. **Monitoring**: Catch performance/error spikes early before affecting all users
4. **Rollback**: One config change vs. git revert + redeploy

Per CLAUDE.md (Development Workflow), changes should go through CI/CD before merging to main.

### How: Technical Approach

**Step 1**: Design feature flag system
- **Decision**: Use environment variables (simple, no external service)
  - Alternative: Use external flag service (LaunchDarkly, Unleash) for more granular control per user
  - MVP: Env variable sufficient; upgrade to service if needed later
- **Flag name**: `FEATURE_POSITION_CANDIDATES_ENDPOINT` (default: `0` in production, `100` in staging/dev)
- **Flag behavior**: Numeric percentage (0–100). `0` disables the endpoint (returns 501 Not Implemented). `10`/`50`/`100` enables for that percentage of users via `userId % 100 < percentage`.

**Step 2**: Implement feature flag middleware
- Create `backend/src/middleware/featureFlagMiddleware.ts`:
  ```typescript
  export const featureFlagMiddleware = (flagName: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const flagEnabled = process.env[flagName] === 'true';
      
      if (!flagEnabled) {
        return res.status(501).json({
          error: 'Not Implemented',
          statusCode: 501,
          message: 'This feature is not yet available',
        });
      }
      
      next();
    };
  };
  ```
- Register middleware on the route in `backend/src/routes/positionRoutes.ts`:
  ```typescript
  router.get(
    '/:id/candidates',
    featureFlagMiddleware('FEATURE_POSITION_CANDIDATES_ENDPOINT'),
    authMiddleware,
    getPositionCandidates
  );
  ```

**Step 3**: Configure environment variables
- **Development** (`.env.local` or `.env`): `FEATURE_POSITION_CANDIDATES_ENDPOINT=100`
  - Developers can test feature locally with full access
- **Staging** (`.env.staging`): `FEATURE_POSITION_CANDIDATES_ENDPOINT=100`
  - QA tests feature fully before production rollout
- **Production** (`.env.production`):
  - Day 0: `FEATURE_POSITION_CANDIDATES_ENDPOINT=0` (feature disabled; endpoint returns 501)
  - Day 1: `FEATURE_POSITION_CANDIDATES_ENDPOINT=10` (10% of users — userId % 100 < 10)
  - Day 2: `FEATURE_POSITION_CANDIDATES_ENDPOINT=50` (50% of users — userId % 100 < 50)
  - Day 3: `FEATURE_POSITION_CANDIDATES_ENDPOINT=100` (100% rollout complete)

**Step 4**: Set up CI/CD pipeline
- **Build step**: Compile TypeScript, bundle Frontend
- **Lint step**: Run ESLint (already configured per package.json)
- **Test step**: Run `npm test` (Backend Jest tests) and `npm run e2e` (Frontend Cypress tests)
- **Security scan**: Optional, but recommended (SAST tool like Snyk, SonarQube)
- **Staging deploy**: If tests pass, deploy to staging environment
- **Manual approval**: Ops team approves production deployment (don't auto-deploy)
- **Production deploy**: Deploy to production with feature flag OFF initially

**Step 5**: Create CI/CD pipeline file
- **Tool**: GitHub Actions (example below, adjust for your CI tool)
- **File**: `.github/workflows/deploy-position-candidates.yml`
  ```yaml
  name: STORY-001 CI/CD

  on:
    push:
      branches: [main]
      paths:
        - 'backend/src/**'
        - 'frontend/src/**'
        - 'backend/prisma/**'

  jobs:
    build-and-test:
      runs-on: ubuntu-latest
      services:
        postgres:
          image: postgres:15
          env:
            POSTGRES_PASSWORD: test
            POSTGRES_DB: test_db
          options: >-
            --health-cmd pg_isready
            --health-interval 10s
            --health-timeout 5s
            --health-retries 5

      steps:
        - uses: actions/checkout@v3

        - name: Setup Node.js
          uses: actions/setup-node@v3
          with:
            node-version: '18'

        - name: Install Backend dependencies
          working-directory: ./backend
          run: npm install

        - name: Install Frontend dependencies
          working-directory: ./frontend
          run: npm install

        - name: Lint Backend
          working-directory: ./backend
          run: npm run lint

        - name: Run Backend tests
          working-directory: ./backend
          env:
            DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db
          run: npm test

        - name: Run Frontend tests
          working-directory: ./frontend
          run: npm test -- --coverage

        - name: Build Backend
          working-directory: ./backend
          run: npm run build

        - name: Build Frontend
          working-directory: ./frontend
          run: npm run build

    deploy-staging:
      needs: build-and-test
      runs-on: ubuntu-latest
      if: success()

      steps:
        - name: Deploy to staging
          run: |
            # Example: Deploy to staging server
            # ssh staging-server "cd /app && git pull && npm install && npm run build"
            echo "Deploying to staging..."

    deploy-production:
      needs: deploy-staging
      runs-on: ubuntu-latest
      if: success()
      environment: production

      steps:
        - name: Deploy to production
          run: |
            # Example: Deploy to production server
            # ssh prod-server "cd /app && git pull && npm install && npm run build && systemctl restart app"
            echo "Deploying to production..."
```

**Step 6**: Set up monitoring and alerts
- **Metrics to track**:
  - `http_request_duration_seconds` histogram for GET /positions/:id/candidates (alert if >1s)
  - `http_requests_total` counter for endpoint (alert if error rate >1%)
  - `position_candidates_endpoint_errors_total` counter by error type (400, 404, 500)
- **Alert rules**:
  - Alert if response time exceeds 1s for 5 consecutive minutes
  - Alert if error rate exceeds 1% for 5 minutes
  - Alert if 5xx errors occur (immediate page)
- **Example**: Prometheus alert rule
  ```yaml
  - alert: PositionCandidatesEndpointSlow
    expr: histogram_quantile(0.95, http_request_duration_seconds{endpoint="/positions/{id}/candidates"}) > 1
    for: 5m
    annotations:
      summary: "Position candidates endpoint slow (>1s)"
  ```

**Step 7**: Create deployment runbook
- **File**: `docs/DEPLOYMENT-RUNBOOK-STORY-001.md`
- **Content**:
  1. Pre-deployment checklist (all tests passing, staging validated)
  2. Step 1: Deploy to production with flag OFF
  3. Step 2: Monitor for 30 min (no errors, performance good)
  4. Step 3: Enable flag for 10% of users (or use canary deployment)
  5. Step 4: Monitor for 24 hours (error rate <1%, performance <500ms)
  6. Step 5: Enable for 50% (or next batch)
  7. Step 6: Monitor for 24 hours
  8. Step 7: Enable for 100%
  9. Post-rollout validation (check key metrics, user feedback)
  10. Rollback procedure (if issues found, disable flag immediately)

**Step 8**: Create deployment checklist
- **Pre-deployment**:
  - [ ] All Backend tests passing (npm test)
  - [ ] All Frontend tests passing (npm run e2e)
  - [ ] Staging environment tested by QA (manual test checklist completed)
  - [ ] Performance baseline confirmed (<500ms for 100 candidates)
  - [ ] No open security issues
  - [ ] Feature flag config reviewed
  - [ ] Monitoring alerts configured and tested
  - [ ] Rollback plan documented and team trained
- **Deployment day**:
  - [ ] Create deployment PR with feature flag OFF
  - [ ] Get code review approval
  - [ ] Merge to main
  - [ ] CI/CD pipeline runs automatically (build, test, deploy to staging)
  - [ ] Manual smoke test on staging (endpoint returns 501)
  - [ ] Approve production deployment
  - [ ] CI/CD deploys to production
  - [ ] Verify endpoint returns 501 (flag OFF)
  - [ ] Monitor for 30 minutes (no unexpected errors)
- **Rollout day**:
  - [ ] Enable flag for 10% (set env var, deploy config change)
  - [ ] Monitor alerts for 24 hours
  - [ ] Review error rate, response time, user feedback
  - [ ] Proceed to 50% (or rollback if issues found)

**Step 9**: Document rollback procedure
- **Immediate rollback** (if critical issue):
  1. Disable feature flag: `FEATURE_POSITION_CANDIDATES_ENDPOINT=false`
  2. Redeploy configuration
  3. Verify endpoint returns 501
  4. Alert team; page on-call engineer
  5. No data loss (feature is read-only)
  6. Investigation: Review logs, metrics, user reports
- **Gradual rollback** (if performance issues detected):
  1. Reduce rollout percentage (10% → off)
  2. Monitor for stabilization
  3. Investigate root cause
  4. Fix and redeploy (or deprecate feature)

**Step 10**: Document post-deployment success criteria
- Endpoint is responding with 200 for valid position IDs
- Response time <500ms for 100 candidates
- Error rate <1%
- No SQL injection or authorization bypasses attempted
- User feedback positive (recruiters find feature useful)
- No regressions in other endpoints

### Inputs / Outputs / Contracts

**Input**:
- Completed Backend implementation (TASK-STORY-001-BACKEND-001, BACKEND-002, BACKEND-003)
- Passing test suite (TASK-STORY-001-QA-001)
- Staging environment available
- Production environment available
- CI/CD tool (GitHub Actions, GitLab CI, etc.)
- Monitoring system (Prometheus, DataDog, New Relic, etc.)

**Output**:
- Feature flag middleware implemented and integrated
- Environment variable configuration (`.env.example`, `.env.staging`, `.env.production`)
- CI/CD pipeline configuration (`.github/workflows/deploy-position-candidates.yml` or equivalent)
- Monitoring alert rules and dashboard
- Deployment runbook: `docs/DEPLOYMENT-RUNBOOK-STORY-001.md`
- Deployment checklist: `docs/DEPLOYMENT-CHECKLIST-STORY-001.md`
- Rollback procedure documented
- Team training completed (on-call engineer, DevOps team understand feature flag and rollback)

**Contracts**:
- Feature flag is environment variable (simple key-value)
- If flag OFF: endpoint returns 501 with message "Not Implemented" or "Feature unavailable"
- If flag ON: endpoint works normally (uses auth middleware, returns 200/4xx/5xx per AC)
- Monitoring metrics match Prometheus conventions (naming, labels)
- Alerts are actionable (not noisy, clear remediation steps)

### Dependencies

- Backend must be deployable (Docker image or artifact built)
- Frontend must be deployable (built static assets)
- CI/CD system must be available (GitHub Actions, etc.)
- Staging and production environments must exist
- Monitoring system must be in place (or alerting will be manual)
- Database migrations must be applied before feature flag is enabled

### Acceptance Criteria

- [ ] Feature flag `FEATURE_POSITION_CANDIDATES_ENDPOINT` implemented as environment variable
- [ ] Middleware created to check flag; returns 501 if OFF
- [ ] Feature flag integrated into route (positioned after authMiddleware so req.user is available for percentage-based rollout)
- [ ] Flag is OFF by default in production (safe to deploy)
- [ ] Flag is ON by default in staging and development
- [ ] CI/CD pipeline configured to build, lint, test on every commit
- [ ] All tests must pass before staging deployment
- [ ] Manual approval required before production deployment (no auto-deploy)
- [ ] Monitoring alerts configured for performance (>1s response time)
- [ ] Monitoring alerts configured for errors (>1% error rate)
- [ ] Deployment runbook created with step-by-step rollout procedure
- [ ] Rollback procedure documented and tested
- [ ] Deployment checklist created for team to follow
- [ ] Team training completed (on-call team understands feature flag, alerts, rollback)
- [ ] Staging environment tested and validated before production rollout
- [ ] Production deployment proceeds with gradual rollout (10% → 50% → 100%)
- [ ] All three rollout stages monitored and verified

### Test Requirements

**CI/CD Pipeline Validation**:
- Run pipeline on a test commit
- Verify build succeeds
- Verify tests run and pass
- Verify staging deploy completes

**Feature Flag Testing**:
- Test: With flag OFF, endpoint returns 501
- Test: With flag ON, endpoint returns 200/4xx per normal
- Test: Flag can be toggled via environment variable (no code change needed)

**Monitoring Testing**:
- Test: Generate slow response (>1s) and verify alert fires
- Test: Generate errors (5xx) and verify alert fires
- Test: Clear error condition and verify alert resolves

**Rollback Testing**:
- Test: Disable feature flag and verify endpoint returns 501
- Test: Re-enable feature flag and verify endpoint works again
- Test: Verify data integrity maintained (no data loss) during rollback

**Performance Testing**:
- Test: Feature flag middleware adds <5ms latency (negligible impact)
- Test: Endpoint still meets <500ms SLO with flag enabled

### Non-Functional Requirements

**Deployment Quality**:
- Deployments are repeatable (same code → same behavior in all environments)
- Deployments are traceable (commit hash, timestamp, who deployed)
- Deployments are reversible (rollback does not lose data)
- Downtime: Zero downtime deployment (blue-green or rolling update)

**Monitoring Quality**:
- Alerts are specific and actionable (not generic "error" alerts)
- Alert noise is minimized (no false positives)
- Dashboards show key metrics (response time, error rate, availability)
- Metrics are stored for historical analysis (trend detection)

**Security**:
- Feature flag cannot be bypassed (not a query parameter or header)
- Environment variables are not logged (no PII or secrets in logs)
- Only authorized team members can modify feature flag (access control to `.env.production`)

**Performance** (inherited from story):
- Feature flag check adds <5ms overhead
- Endpoint still achieves <500ms response time with flag enabled
- No N+1 queries or slow database calls introduced

**Reliability**:
- If monitoring system is down, feature is still deployable (don't rely on monitoring for safety)
- Rollback does not require downtime (flag change and redeploy is fast)

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Feature flag accidentally left ON in production during initial deployment | Deployment checklist includes step "Verify flag is OFF before merge"; peer review checks this |
| Monitoring alerts are too noisy (false positives) | Tune alert thresholds based on baseline performance; start with conservative thresholds |
| Monitoring system fails; alerts don't fire | Set up secondary alerting (email, SMS); don't rely solely on monitoring for safety |
| Gradual rollout stalls at 10% (team forgets to increase) | Runbook includes timeline (10% day 1, 50% day 2, 100% day 3); on-call reminder 24h before next stage |
| Rollback procedure untested; fails when needed | Test rollback procedure in staging before production rollout; include in pre-deployment checklist |
| CI/CD pipeline fails; blocks all deployments | Have manual deployment procedure as fallback; document and test it |
| Environment variable not set; feature behaves unexpectedly | Use default value (OFF) if env var not set; add warning to logs if feature is ambiguous |

### Definition of Done

- [ ] Feature flag middleware implemented and integrated
- [ ] Environment variable configuration created (all environments)
- [ ] Feature flag defaults to OFF in production
- [ ] Feature flag defaults to ON in staging/development
- [ ] CI/CD pipeline configured and tested
- [ ] All tests pass in CI/CD
- [ ] Monitoring alerts configured (performance, errors)
- [ ] Deployment runbook created and peer-reviewed
- [ ] Rollback procedure tested in staging
- [ ] Deployment checklist created and reviewed
- [ ] Team training completed (on-call, DevOps, QA)
- [ ] Staging environment validated (feature flag working, monitoring alerts firing)
- [ ] Production deployment proceeds with feature flag OFF
- [ ] Rollout stages executed as planned (10% day 1, 50% day 2, 100% day 3)
- [ ] Monitoring confirms no regressions or performance issues during rollout
- [ ] Post-rollout validation completed (metrics stable, user feedback positive)
- [ ] Feature flag procedure documented for future deployments
- [ ] Task linked to STORY-001

---
