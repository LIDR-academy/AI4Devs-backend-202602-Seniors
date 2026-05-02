# Story Template: Copy & Paste Starter

Use this as your starting point. Fill in each section, delete sections marked "Optional", and follow the guidance in SKILL.md.

---

# [STORY-ID] [Clear, Outcome-Focused Title]

**Status:** Draft  
**Created:** [YYYY-MM-DD]  
**Last Updated:** [YYYY-MM-DD]  
**Author:** [Your name]

---

## 📖 Narrative & Business Value

### User Story

As a **[user role]**, I want **[capability/feature]** so that **[business value / outcome]**.

*OR (for problem-statement format):*

**Problem:** [Describe the user pain or business problem]  
**Solution:** [Describe what we're building to solve it]  
**Expected outcome:** [Describe the measurable improvement or new capability]

### Business Value

Explain why this matters:
- What user need or business goal does this address?
- What metric or outcome improves?
- Who benefits? (users, business, engineering team?)

Example: *"Candidates currently lose resumes during upload (>5% failure rate). This feature reduces uploads to a single operation, improving completion rate by ~8% and eliminating async email loops (saves ~3h/week per recruiter)."*

### Out of Scope

Explicitly list what's NOT in this story (prevents scope creep):
- ❌ Resume parsing / skill extraction
- ❌ Resume templates or formatting tools
- ❌ Integration with ATS
- ❌ Automatic version history

---

## ✅ Acceptance Criteria

Use this checklist format. Each criterion must be testable.

- [ ] **AC1:** User can select multiple files (PDF, DOCX) via browser file picker
- [ ] **AC2:** System validates each file: rejects non-PDF/DOCX, rejects files >10MB
- [ ] **AC3:** On success, system returns `201 Created` with array of resume objects (id, filePath, fileType, uploadDate)
- [ ] **AC4:** On validation failure, system returns `400 Bad Request` with error message (e.g., "File type not supported")
- [ ] **AC5:** GET `/candidates/:id` includes `resumes` array with all uploaded files, sorted by uploadDate (newest first)
- [ ] **AC6:** Frontend displays list of uploaded resumes with download links and delete buttons
- [ ] **AC7:** Deleting a resume removes it from database and filesystem
- [ ] **AC8:** Uploading resumes works on mobile (tested on iOS Safari, Android Chrome)
- [ ] **AC9:** Progress indicator shows upload status (% complete, time remaining for large files)
- [ ] **AC10:** System logs all upload attempts (success, failures, file sizes) for monitoring

---

## 🏗️ Technical Design

### Affected Systems & Domains

List which parts of your codebase will change:

- **Domain:** Candidate aggregate (domain/models/Candidate.ts)
- **Infrastructure:** Resume model, file storage service (application/services/fileUploadService.ts)
- **Presentation:** Candidate controller, resume endpoints (presentation/controllers/)
- **API Routes:** POST `/candidates/:id/resumes`, DELETE `/candidates/:id/resumes/:resumeId`
- **Frontend:** CandidateForm component, ResumeList component
- **Database:** Resume table (already exists; no schema changes needed)

### Data Model Changes

Document any schema changes, new relations, or data migrations:

```prisma
// Current schema (no changes needed for this story):
model Resume {
  id          Int       @id @default(autoincrement())
  filePath    String    @db.VarChar(500)
  fileType    String    @db.VarChar(50)
  uploadDate  DateTime  @default(now())
  candidateId Int
  candidate   Candidate @relation(fields: [candidateId], references: [id])
}

// Migration: None required (Resume relation already 1-to-many)
```

### API Contract Changes

Document new endpoints, modified payloads, breaking changes:

**New Endpoint: POST `/candidates/:candidateId/resumes`**
- Request: `multipart/form-data` with file(s)
- Response: 
  ```json
  {
    "success": true,
    "resumes": [
      { "id": 42, "filePath": "uploads/1715760936750-cv.pdf", "fileType": "application/pdf", "uploadDate": "2024-05-15T10:23:45Z" }
    ]
  }
  ```
- Error (400): 
  ```json
  {
    "success": false,
    "error": "File type not supported. Accepted: PDF, DOCX",
    "failedFiles": ["resume.txt"]
  }
  ```

**New Endpoint: DELETE `/candidates/:candidateId/resumes/:resumeId`**
- Response: 200 OK, returns updated candidate object

**Modified Endpoint: GET `/candidates/:id`**
- Response now includes `resumes` array (was single resume object)
- Breaking change: Frontend must adapt to array format

### Implementation Notes

Describe key technical decisions and patterns:

- **File Storage:** Continue using local `uploads/` directory (not S3, per current infrastructure)
- **Multer Configuration:** Middleware in `fileUploadService.ts` already handles multipart; extend to accept multiple files
- **Async Processing:** Use synchronous upload for now (files typically <10MB); revisit if performance degrades
- **Error Handling:** Validate file type server-side (don't trust client); return `HTTP 400` with a generic reason (e.g., `"File type not supported. Accepted: PDF, DOCX"`) — explicit errors are observable and testable, and do not aid enumeration when the accepted types are already documented in the API contract
- **Database Transactions:** Wrap file upload + DB insert in transaction to ensure consistency

### Non-Functional Requirements

| Requirement | Target | Justification |
|---|---|---|
| **Performance** | Resume upload completes in <5s for 10MB file on 4G | User research: slower = higher abandonment |
| **Security** | Virus scan all uploads via ClamAV before storage | Compliance: no unscanned files in production |
| **Accessibility** | Upload button has ARIA label; progress indicator is screen-reader friendly | WCAG 2.1 AA compliance |
| **Scalability** | Support >1000 concurrent uploads without degradation | Marketing team plans 10x user growth |
| **Observability** | Log all upload events; alert if error rate >1% | Ops: need visibility into upload health |

### Dependencies

List other stories or work this depends on:

- ❌ **Blocks:** None
- ✅ **Depends on:** User authentication (STORY-015) — must be complete before testing
- ✅ **Depends on:** File upload infrastructure (already deployed; no new infrastructure needed)
- 🤝 **Coordinates with:** Resume parser integration (STORY-089) — we enable it, but parser not in this story

### Observability

Document what logging, metrics, and monitoring to add:

**Logging:**
```typescript
// Log successful upload
logger.info('Resume uploaded', { candidateId, fileSize, fileType, duration_ms });

// Log failure
logger.warn('Resume upload failed', { candidateId, fileType, reason, fileSize });
```

**Metrics:**
- `resume.upload.success` (counter)
- `resume.upload.failure` (counter, labeled by reason: "file_type", "file_size", "virus_detected")
- `resume.upload.duration_ms` (histogram)

**Alerts:**
- Alert if resume upload error rate exceeds 1% (5-minute window)
- Alert if avg upload duration exceeds 10s

### Security & Privacy

Document sensitive data handling and compliance:

- **File Validation:** Whitelist only PDF, DOCX (no executable files)
- **Virus Scanning:** Integrate ClamAV; block upload if scan fails
- **Access Control:** Only candidate can delete their own resumes; admins can view all
- **Data Retention:** Resumes deleted from DB also removed from filesystem (no orphans)
- **Privacy:** Resume content is not indexed for search (future feature requires explicit consent per GDPR)

### Rollout & Rollback Plan

Document how to safely deploy and roll back:

- **Feature Flag:** `FEATURE_MULTIPLE_RESUMES` (default: `false`)
- **Rollout:** Gradual, 10% → 50% → 100% over 3 days
- **Monitoring:** Watch error rate, upload duration, storage usage during rollout
- **Rollback:** Disable flag; no data migration needed (Resume table already supports multiple files)
- **Data Safety:** Old single-resume UI still works if feature disabled; no cleanup needed

---

## 🔗 Project Analysis Linkage

### Referenced Analysis Documents

Link to discovery, impact assessments, ADRs, etc. Be specific and traceable:

- **Discovery Research** (file: `docs/discovery/user-research-may-2024.md`, Section 3.2 "Resume Submission Friction")
  - Finding: 12% of candidates report upload failures; primary blocker to application completion
  - Quote: *"Candidates lost work multiple times; gave up after 2 attempts"*

- **Impact Assessment** (file: `docs/impact/candidate-experience-analysis-v2.md`, Section 2.1)
  - Metric: Reducing manual re-uploads saves ~3h/week per recruiter (async email loop eliminated)
  - ROI: $X cost to implement vs. $Y saved per recruiter per year

- **Architecture Decision Record** (file: `docs/adr/ADR-007-orm-strategy.md`)
  - Decision: Adopt Prisma ORM for consistency across backend
  - Implication: Resume model uses Prisma relations; no raw SQL queries

### Traceability to Business Goals

Map this story to OKRs, business goals, or strategic initiatives:

- **Q3 OKR: Improve Candidate Experience Score (+15%)**
  - Metric: Application completion rate (currently 78%, target 85%)
  - This story addresses: Reducing upload friction (one of three key drivers)
  - Impact: AC #8, #9 directly measure upload success rate post-launch

- **Strategic Initiative: Scalability for Growth**
  - Initiative: Support 10x user growth without new infrastructure
  - This story ensures: Concurrent upload support; failure monitoring in place

### Assumptions & Constraints Inherited from Analysis

Document assumptions from analysis and how they constrain this story:

| Assumption | Source | Impact on This Story | Review Trigger |
|---|---|---|---|
| Candidates upload only PDF/DOCX | User research | File type validation accepts only these; no image support | If research reveals user demand for images |
| Candidates rarely upload >10 files | User research | No pagination UI; simple array display acceptable | Monitor analytics post-launch; if violated, escalate to design |
| Local file storage is sufficient | Infrastructure analysis | No S3 integration; continue using local `uploads/` | If storage exceeds capacity (threshold: 500GB) |
| Virus scanning is mandatory | Compliance analysis | Integrate ClamAV before storage; block unsigned files | If compliance rules relax or storage cost exceeds threshold |

### How to Keep This Story Synced as Analysis Evolves

Define a sync plan so the story stays current:

- **Trigger:** When analysis documents are updated, check this story for impact
- **Cadence:** Review before each sprint planning (bi-weekly)
- **Owner:** Product lead (responsible for keeping analysis & stories aligned)
- **Process:**
  1. If user research is updated: verify AC still match findings; update "Referenced Analysis" links
  2. If impact assessment changes: verify ROI assumptions; update Business Value section
  3. If ADR is revised: check Implementation Notes for alignment; update if needed
  4. If OKR is redefined: update "Traceability to Business Goals" section
- **Example escalation:** If research reveals users need image upload support, create new story STORY-XXX and link as future work; don't expand current story mid-sprint

---

## 📋 Definition of Ready (DoR)

Use this checklist before pulling into a sprint. All items must be ✅.

### Functional Clarity
- [ ] Narrative is clear; any engineer can understand "what" and "why"
- [ ] Acceptance criteria are testable, specific, and measurable (not vague)
- [ ] Out of Scope section prevents scope creep
- [ ] Business value is quantified (metric, user impact, cost savings, etc.)

### Technical Soundness
- [ ] Affected systems & domains are identified
- [ ] Technical scope is bounded (not open-ended)
- [ ] Data model changes (or "none") are documented
- [ ] API contract changes are clear (endpoints, payloads, breaking changes)
- [ ] Implementation approach is sketched (no deep design needed; blockers identified)
- [ ] Dependencies are identified and scheduled (can we start, or do we wait?)
- [ ] Non-functional requirements are explicit (performance, security, accessibility, scalability, observability)

### Analysis Linkage ⭐
- [ ] Story references at least one analysis document (discovery, ADR, impact assessment, OKR)
- [ ] Traceability is explicit (not vague; e.g., "per analysis" is NOT sufficient)
- [ ] Assumptions inherited from analysis are documented
- [ ] Sync plan exists (how to keep story current if analysis evolves)

### Risk & Rollout
- [ ] Dependencies are cleared (or explicitly blocked with next step identified)
- [ ] Rollout plan is documented (feature flag, staged rollout, monitoring, rollback)
- [ ] Security & privacy considerations are addressed (or justified as N/A)
- [ ] Observability is planned (logging, metrics, alerts)
- [ ] No open questions remain (if yes, story is not ready)

### Process
- [ ] Story is in version control (`/stories/[ID]-[title].md`)
- [ ] Story is linked to related documents (analysis, ADRs, OKRs)
- [ ] Story is assigned to a team (or marked "Ready for Grooming")

---

## ✨ Definition of Done (DoD)

Use this checklist when closing the story. All items must be ✅.

### Development
- [ ] All acceptance criteria are met (tested manually or via automated tests)
- [ ] Code is written, reviewed, and merged to main
- [ ] No regressions in existing functionality
- [ ] Backward compatibility maintained (or breaking change explicitly communicated)

### Quality
- [ ] Integration tests pass
- [ ] Security review completed (if applicable)
- [ ] Accessibility verified (WCAG 2.1 AA or justified)
- [ ] Performance targets met (if applicable)

### Operations
- [ ] Observability in place (logging, metrics, alerts functioning)
- [ ] Monitoring configured (dashboards, alerts active)
- [ ] Rollout plan executed (feature flag enabled gradually, errors monitored)
- [ ] Rollback tested (if needed; feature flag disabled cleanly)

### Documentation
- [ ] Code comments added (where non-obvious)
- [ ] API documentation updated (if new endpoints)
- [ ] Architecture docs updated (if design decisions made)
- [ ] Team notified of changes (if cross-team impact)

### Verification
- [ ] Analysis-linked assumptions are verified in implementation (spot-check)
- [ ] Story is linked to merged PR(s)
- [ ] Story status is updated to "Done" in tracking system

---

## 📝 Notes

Add any additional context, open questions, or future considerations:

- [Notes here]

---

**End of template.** Copy this file, rename it to `/stories/[ID]-[title-slug].md`, and start filling in sections.
