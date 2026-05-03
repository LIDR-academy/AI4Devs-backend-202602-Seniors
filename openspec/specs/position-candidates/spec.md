## Purpose

Defines the behaviour of the `GET /positions/:id/candidates` endpoint, which returns all active applications for a given position enriched with candidate name, current interview step, and average interview score.

---

## Requirements

### Requirement: Retrieve candidates in process for a position
The system SHALL expose a `GET /positions/:id/candidates` endpoint that returns all active applications for the specified position, including each candidate's full name, current interview step, and average interview score.

#### Scenario: Position exists with multiple candidates
- **WHEN** `GET /positions/1/candidates` is called and position 1 has two applications with scored interviews
- **THEN** the response is `200 OK` with `{ "success": true, "data": [...] }` containing one entry per application, each with `candidateId`, `fullName`, `currentInterviewStep`, and `averageScore`

#### Scenario: Position exists with no applications
- **WHEN** `GET /positions/5/candidates` is called and position 5 exists but has zero applications
- **THEN** the response is `200 OK` with `{ "success": true, "data": [] }`

#### Scenario: Position does not exist
- **WHEN** `GET /positions/999/candidates` is called and no position with id 999 exists
- **THEN** the response is `404 Not Found` with `{ "success": false, "error": { "message": "Position not found", "code": "NOT_FOUND" } }`

#### Scenario: Path parameter is not a valid integer
- **WHEN** `GET /positions/abc/candidates` is called
- **THEN** the response is `400 Bad Request` with `{ "success": false, "error": { "message": "Invalid position ID", "code": "VALIDATION_ERROR" } }`

#### Scenario: Path parameter is zero or negative
- **WHEN** `GET /positions/0/candidates` is called
- **THEN** the response is `400 Bad Request` with `{ "success": false, "error": { "message": "Invalid position ID", "code": "VALIDATION_ERROR" } }`

---

### Requirement: Candidate full name derived from first and last name
The system SHALL compose `fullName` by concatenating `Candidate.firstName`, a single space, and `Candidate.lastName`.

#### Scenario: Full name composition
- **WHEN** a candidate has `firstName = "Albert"` and `lastName = "Saelices"`
- **THEN** the `fullName` field in the response SHALL be `"Albert Saelices"`

---

### Requirement: Average score computed from non-null interview scores
The system SHALL compute `averageScore` as the arithmetic mean of all non-null `Interview.score` values associated with the application. If no scored interviews exist, `averageScore` SHALL be `null`.

#### Scenario: Candidate has multiple scored interviews
- **WHEN** an application has two interviews with scores `6` and `9`
- **THEN** `averageScore` in the response SHALL be `7.5`

#### Scenario: Candidate has interviews but none are scored
- **WHEN** an application has interviews where all `score` fields are `null`
- **THEN** `averageScore` in the response SHALL be `null`

#### Scenario: Candidate has a mix of scored and unscored interviews
- **WHEN** an application has three interviews with scores `8`, `null`, and `6`
- **THEN** `averageScore` SHALL be computed only from `8` and `6`, resulting in `7`

#### Scenario: Candidate has no interviews at all
- **WHEN** an application has zero associated interviews
- **THEN** `averageScore` in the response SHALL be `null`

---

### Requirement: Response envelope consistency
All responses from `GET /positions/:id/candidates` SHALL use the standard project response envelope.

#### Scenario: Success envelope
- **WHEN** the request succeeds
- **THEN** the JSON body SHALL have `"success": true` and `"data"` containing the results array

#### Scenario: Error envelope
- **WHEN** the request results in a 4xx or 5xx error
- **THEN** the JSON body SHALL have `"success": false` and `"error"` containing `"message"` and `"code"` fields

---

### Requirement: API contract documented in api-spec.yaml
The endpoint `GET /positions/{id}/candidates` SHALL be declared in `backend/api-spec.yaml` with request parameters, response schemas for `200`, `400`, `404`, and `500` status codes.

#### Scenario: OpenAPI contract present
- **WHEN** `backend/api-spec.yaml` is parsed by an OpenAPI 3.0 validator
- **THEN** `GET /positions/{id}/candidates` is present with valid schema definitions for all documented status codes
