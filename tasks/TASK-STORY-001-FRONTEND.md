# Frontend Tasks for STORY-001: Retrieve Position Candidates

**Discipline**: Frontend  
**Total Tasks**: 1  
**Coverage**: AC-2 (candidate data display), AC-3 (interview step tracking), AC-4 (average score), AC-5 (application metadata), AC-6 (response format), AC-8 (authorization check)

---

## TASK-STORY-001-FRONTEND-001

**Title**: Implement position candidates list page component with filtering, sorting, and responsive layout

**Parent Story**: STORY-001-get-position-candidates

**Discipline**: Frontend

**Depends On**: TASK-STORY-001-API-001 (needs OpenAPI spec for mocking), TASK-STORY-001-BACKEND-001 (needs working endpoint)

**Blocks**: TASK-STORY-001-QA-001 (QA can only test once Frontend UI exists)

---

### Purpose

Create a React component that displays all candidates in interview process for a selected position. The component fetches from GET /positions/:id/candidates, renders candidate details (name, email, phone, address, application date, notes), displays current interview step with order/flow, shows average interview score, and implements responsive layout for desktop/mobile.

Fulfills AC-2 (candidate data display), AC-3 (interview step display), AC-4 (average score calculation and display), AC-5 (application metadata), AC-6 (response format matches expectations), and AC-8 (authorization handling on Frontend).

### Scope of Change

- **Create**: New component `frontend/src/components/PositionCandidatesList.tsx` to display candidates
- **Create**: New service file `frontend/src/services/positionService.ts` with API call to GET /positions/:id/candidates
- **Modify**: `frontend/src/App.tsx` or routing to add route to new page
- **Create**: Optional: `frontend/src/hooks/usePositionCandidates.ts` (custom hook for data fetching, optional refactor)
- **Create**: Optional: `frontend/src/types/position.ts` (TypeScript types matching API response)

### Where

- **Component**: `frontend/src/components/PositionCandidatesList.tsx`
- **Service**: `frontend/src/services/positionService.ts`
- **Route**: `frontend/src/App.tsx` or `frontend/src/routes/` (if routing exists)
- **Tests**: `frontend/src/components/PositionCandidatesList.test.tsx`
- **Styles**: Use Bootstrap 5 (already in dependencies per CLAUDE.md)

### Why

Per STORY-001 Technical Design, this story requires user-facing functionality to view position candidates. Recruiters need a real-time view of candidate pipeline, interview progress, and performance metrics (average scores). A dedicated page component provides this view.

Per CLAUDE.md, Frontend uses React 18 with TypeScript and Bootstrap 5. Component follows LTI architecture: presentation layer (component) calls application layer (service) which calls Backend API.

Per STORY-001 Business Value: "Pipeline Visibility: Recruiters can see all active candidates for a position at a glance, enabling faster decision-making."

### How: Technical Approach

**Step 1**: Define TypeScript types
- Create `frontend/src/types/position.ts` with interfaces matching API response (AC-6):
  ```typescript
  export interface InterviewStep {
    stepId: number;
    stepName: string;
    stepOrder: number;
    interviewFlowId: number;
  }

  export interface CandidateData {
    candidateId: number;
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    applicationDate: string;
    applicationNotes?: string;
    currentInterviewStep: InterviewStep;
    averageScore?: number;
    totalInterviewsCompleted: number;
  }

  export interface PositionCandidatesResponse {
    positionId: number;
    positionTitle: string;
    candidates: CandidateData[];
  }
  ```

**Step 2**: Create API service
- Create `frontend/src/services/positionService.ts` with function:
  ```typescript
  export async function getPositionCandidates(positionId: number): Promise<PositionCandidatesResponse> {
    const response = await fetch(`/api/positions/${positionId}/candidates`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`, // Get JWT from storage
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Handle errors: 400 (invalid ID), 401 (auth), 403 (forbidden), 404 (not found), 500 (server error)
      const error = await response.json();
      throw new Error(`${error.error}: ${error.message}`);
    }

    return response.json();
  }
  ```
- Handle error cases: 401 → redirect to login, 403 → show "permission denied", 404 → show "position not found", 500 → show "server error"

**Step 3**: Create main component
- Create `frontend/src/components/PositionCandidatesList.tsx` with:
  - Props: `positionId: number` (from URL params or parent)
  - State: candidates (array), loading (boolean), error (string or null)
  - useEffect hook: Fetch candidates on component mount (once positionId is known)
  - Render: Loading spinner, error message, or candidates table/list

**Step 4**: Implement candidate display
- Display as Bootstrap table (desktop) or card list (mobile) with columns/fields:
  - Full Name (candidate.fullName)
  - Email (candidate.email, clickable mailto: link)
  - Phone (candidate.phone, optional, show if present)
  - Address (candidate.address, optional, show if present)
  - Application Date (candidate.applicationDate, formatted as readable date)
  - Current Interview Step (candidate.currentInterviewStep.stepName + " (Step " + stepOrder + ")")
  - Average Score (candidate.averageScore, show as "N/A" if null per AC-4)
  - Total Interviews (candidate.totalInterviewsCompleted)
  - Application Notes (candidate.applicationNotes, optional, truncated to 100 chars with tooltip)

**Step 5**: Implement state management
- Use `useState` for candidates, loading, error
- Use `useEffect` for data fetching on mount
- Optional: Extract to custom hook `usePositionCandidates(positionId)` for reusability

**Step 6**: Implement error states
- Loading state: Show spinner/skeleton loader
- Error state: Show error message + retry button (per AC-7)
  - 401/403: Show "You are not authorized. Please log in or contact an administrator."
  - 404: Show "Position not found. It may have been deleted."
  - 400: Show "Invalid position ID."
  - 500: Show "Server error. Please try again later."
- Empty state: Show "No candidates for this position yet." if candidates array is empty

**Step 7**: Implement responsive layout
- Desktop (≥768px): Bootstrap table with all columns
- Tablet (576-767px): Collapse less important columns (phone, address); use card layout option
- Mobile (<576px): Card layout with essential info (name, step, score) stacked vertically
- Use Bootstrap utilities: `d-none`, `d-md-table`, `d-flex`, etc.

**Step 8**: Add filtering/sorting (optional, can be deferred to future story)
- Optional: Add client-side sort by name, step, score
- Optional: Add filter by interview step
- For MVP, just display all candidates in order returned by Backend

**Step 9**: Integrate with routing
- Add route in `frontend/src/App.tsx` or router config:
  ```typescript
  <Route path="/positions/:id/candidates" element={<PositionCandidatesList />} />
  ```
- Extract `id` from URL params: `const { id } = useParams<{ id: string }>();`
- Convert to number before passing to service: `parseInt(id, 10)`

**Step 10**: Add internationalization (i18n)
- No hardcoded English strings; use i18n keys:
  - `"position.candidates.loading"` → "Loading candidates..."
  - `"position.candidates.error"` → "Error loading candidates"
  - `"position.candidates.empty"` → "No candidates for this position"
  - Column headers: `"table.column.fullName"`, `"table.column.email"`, etc.

### Inputs / Outputs / Contracts

**Input**:
- Position ID (from URL parameter `:id`)
- Authorization token (from localStorage or session, used in API call)
- API spec (from TASK-STORY-001-API-001)

**Output**:
- React component `PositionCandidatesList` exported from `frontend/src/components/PositionCandidatesList.tsx`
- Service function `getPositionCandidates(positionId)` in `frontend/src/services/positionService.ts`
- Responsive UI that renders candidate list with all fields from AC-2–AC-5
- Error handling that displays user-friendly messages for all error cases (AC-7)

**Contracts**:
- API response matches AC-6 schema exactly (Component assumes this structure)
- Average score is null-safe (display "N/A" if null per AC-4)
- Authorization header is included in all API calls (JWT token)
- Error messages are localized (i18n keys)

### Dependencies

- React 18 (already installed)
- React Router (for `useParams`, `useNavigate`)
- Bootstrap 5 (for styling, already installed)
- TypeScript
- i18n library if not already in use (react-i18next recommended)
- Backend endpoint must be working (from TASK-STORY-001-BACKEND-001)

### Acceptance Criteria

- [ ] Component renders candidate list with all fields from AC-2 (full name, email, phone, address)
- [ ] Component displays application metadata from AC-5 (applicationDate, applicationNotes, totalInterviewsCompleted)
- [ ] Component displays current interview step from AC-3 (stepId, stepName, stepOrder, interviewFlowId)
- [ ] Component displays average score from AC-4 (or "N/A" if null)
- [ ] Component is responsive (Bootstrap grid, different layouts for mobile/tablet/desktop)
- [ ] Component handles 401/403 authorization errors (shows message, optionally redirects to login)
- [ ] Component handles 404 "not found" error (shows "Position not found" message)
- [ ] Component handles 400 "invalid ID" error (shows message, validates input before API call)
- [ ] Component handles 500 server error (shows message, retry button present)
- [ ] Component shows loading spinner/skeleton while fetching data
- [ ] Component shows empty state if candidates array is empty (per AC-6 "200 with empty array")
- [ ] All user-facing text is localized (i18n keys, not hardcoded English)
- [ ] Component matches response format from AC-6 (uses same field names, types)
- [ ] Route integrated into app routing (e.g., `/positions/:id/candidates` navigable)

### Test Requirements

**Unit Tests** (mock API calls):
- Test: Component renders loading spinner on mount
- Test: Component renders candidates list when API returns data
- Test: Component displays null averageScore as "N/A"
- Test: Component displays application date in readable format
- Test: Component handles 404 error (shows error message)
- Test: Component handles 401 error (shows auth message)
- Test: Component handles empty candidates array (shows "no candidates" message)
- Test: Correct API endpoint URL constructed from positionId prop
- Test: Authorization header included in API call

**Integration Tests** (mock fetch, real component):
```typescript
// Example test case
describe('PositionCandidatesList', () => {
  it('should display candidates when API returns data', async () => {
    const mockData = {
      positionId: 1,
      positionTitle: 'Software Engineer',
      candidates: [
        {
          candidateId: 1,
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          address: '123 Main St',
          applicationDate: '2026-05-01T10:00:00Z',
          applicationNotes: 'Strong candidate',
          currentInterviewStep: {
            stepId: 1,
            stepName: 'Technical Round 1',
            stepOrder: 1,
            interviewFlowId: 1,
          },
          averageScore: 4.5,
          totalInterviewsCompleted: 2,
        },
      ],
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    );

    render(<PositionCandidatesList positionId={1} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Technical Round 1')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });
  });
});
```

**Manual Testing** (in browser):
- Navigate to `/positions/1/candidates`
- Verify loading spinner appears briefly
- Verify candidates list displays (all columns visible on desktop)
- Verify data matches API response (names, emails, scores)
- Resize browser to mobile width; verify layout adapts (columns hide/rearrange)
- Try invalid position ID (e.g., `/positions/9999/candidates`); verify 404 error message
- Logout and try to access endpoint; verify 401 error message

**Regression Tests**:
- Ensure existing routes still work (no routing conflicts)
- Ensure Bootstrap layout does not conflict with existing styles

### Non-Functional Requirements

**Performance**:
- Component renders in <500ms (matches Backend API <500ms SLO per story)
- List of 100 candidates renders without lag (virtualization optional if >500 candidates)
- Images/avatars (if added in future) are lazy-loaded

**Accessibility** (WCAG 2.1 Level AA):
- Headings use semantic HTML (`<h1>`, `<h2>`)
- Table has `<thead>` and `<tbody>`; column headers have `scope="col"`
- Links are underlined or have sufficient contrast (email, phone)
- Form inputs (if filtering added) have `<label>` or `aria-label`
- Loading spinner has `role="status"` and accessible text ("Loading candidates...")
- Error messages are announced to screen readers
- Keyboard navigation works (Tab through table, links are focusable)

**Responsiveness**:
- Mobile (360px): All content readable, no horizontal scroll
- Tablet (768px): Some columns collapse, card layout works
- Desktop (1024px+): Full table visible, all columns shown

**Localization** (i18n):
- All user-facing strings are i18n keys (no hardcoded English)
- Supports RTL languages (Bootstrap supports RTL with `dir="rtl"`)
- Date formatting respects locale (e.g., MM/DD/YYYY vs DD/MM/YYYY)

**Browser Compatibility**:
- Chrome, Firefox, Safari, Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

**Data Privacy**:
- Candidate email/phone not logged to console (remove debug logs)
- No PII in error messages displayed to non-authorized users
- API errors should not expose internal database IDs (rely on Backend to sanitize)

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Authorization token missing or expired when API is called | Check token in localStorage before API call; if missing, show "Please log in" message; if expired, redirect to login page |
| API response schema differs from AC-6 (Frontend expects different field names) | Write unit tests that validate response shape; use TypeScript interface for type safety; handle missing fields gracefully |
| Component doesn't handle large candidate lists (>500) gracefully | Use virtualization library (react-window) if performance is poor; defer to future story if MVP <100 candidates |
| Mobile layout breaks due to long email/phone numbers | Use text truncation with title attribute or tooltip; allow horizontal scroll in table if needed (last resort) |
| i18n library not set up in Frontend | Add react-i18next to dependencies; create locale files; integrate early in component development |
| Route conflicts with existing routing structure | Review existing routes in App.tsx; ensure `/positions/:id/candidates` does not conflict with other routes (e.g., `/positions/:id` for position detail page) |

### Definition of Done

- [ ] Component created at `frontend/src/components/PositionCandidatesList.tsx`
- [ ] Service function created at `frontend/src/services/positionService.ts`
- [ ] TypeScript types defined for API response (matches AC-6)
- [ ] Component fetches data from GET `/positions/:id/candidates` endpoint
- [ ] Authorization header included in API requests (Bearer token)
- [ ] All candidate fields from AC-2 displayed (name, email, phone, address)
- [ ] Application metadata from AC-5 displayed (applicationDate, notes, totalInterviewsCompleted)
- [ ] Interview step from AC-3 displayed (stepName, stepOrder)
- [ ] Average score from AC-4 displayed (or "N/A" if null)
- [ ] Loading state shows spinner/skeleton loader
- [ ] Error states display user-friendly messages for 400, 401, 403, 404, 500
- [ ] Empty state displays when candidates array is empty
- [ ] Responsive layout works on mobile (<576px), tablet (576-767px), desktop (≥768px)
- [ ] All user-facing strings are localized (i18n keys)
- [ ] Unit tests written for data display, error handling, empty state
- [ ] Integration tests written for full component flow
- [ ] Manual testing completed (desktop, mobile, error cases)
- [ ] Route integrated into app (accessible at `/positions/:id/candidates`)
- [ ] Code review approved (no console.logs, clean imports, follows project patterns)
- [ ] Accessibility (WCAG AA) validated (semantic HTML, keyboard nav, screen reader tested)
- [ ] No regressions in existing routes or styles
- [ ] Task linked to STORY-001

---
