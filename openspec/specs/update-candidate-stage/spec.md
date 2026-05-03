# Capability: Update Candidate Interview Stage

## Purpose

Defines the behavior of the `PUT /candidates/:id/stage` endpoint, which updates the interview stage for a candidate's specific job application.

---

## Requirements

### Requirement: Update candidate interview stage

The system SHALL expose a `PUT /candidates/:id/stage` endpoint that updates the `currentInterviewStep` field for a candidate's application, with validation that the candidate owns the application and the new step belongs to the position's interview flow.

#### Scenario: Valid stage update for candidate's application
- **WHEN** `PUT /candidates/1/stage` is called with body `{ "applicationId": 123, "newInterviewStep": 5, "notes": "Advanced to technical interview" }` and candidate 1 owns application 123, and step 5 is valid for the position
- **THEN** the response is `200 OK` with `{ "success": true, "data": { "applicationId": 123, "candidateId": 1, "positionId": 456, "previousStep": 3, "currentInterviewStep": 5, "stepName": "Technical Interview", "updatedAt": "2024-01-15T10:30:00Z", "notes": "Advanced to technical interview" }, "message": "Candidate stage updated successfully" }`

#### Scenario: Candidate not found
- **WHEN** `PUT /candidates/999/stage` is called with valid request body and no candidate with id 999 exists
- **THEN** the response is `404 Not Found` with `{ "success": false, "error": { "message": "Candidate not found", "code": "NOT_FOUND" } }`

#### Scenario: Application not found for candidate (IDOR protection)
- **WHEN** `PUT /candidates/1/stage` is called with body `{ "applicationId": 999, "newInterviewStep": 5 }` and application 999 does not exist or belongs to a different candidate
- **THEN** the response is `404 Not Found` with `{ "success": false, "error": { "message": "Application not found for this candidate", "code": "NOT_FOUND" } }`

#### Scenario: Invalid interview step for position
- **WHEN** `PUT /candidates/1/stage` is called with body `{ "applicationId": 123, "newInterviewStep": 99 }` and step 99 does not belong to the position's interview flow
- **THEN** the response is `400 Bad Request` with `{ "success": false, "error": { "message": "Invalid interview step for this position", "code": "VALIDATION_ERROR" } }`

#### Scenario: Missing applicationId in request body
- **WHEN** `PUT /candidates/1/stage` is called with body `{ "newInterviewStep": 5 }` missing the required `applicationId` field
- **THEN** the response is `400 Bad Request` with `{ "success": false, "error": { "message": "Validation failed", "code": "VALIDATION_ERROR", "details": [{ "field": "applicationId", "message": "Application ID is required" }] } }`

#### Scenario: Missing newInterviewStep in request body
- **WHEN** `PUT /candidates/1/stage` is called with body `{ "applicationId": 123 }` missing the required `newInterviewStep` field
- **THEN** the response is `400 Bad Request` with `{ "success": false, "error": { "message": "Validation failed", "code": "VALIDATION_ERROR", "details": [{ "field": "newInterviewStep", "message": "Interview step ID is required" }] } }`

#### Scenario: Invalid candidate ID path parameter (non-numeric)
- **WHEN** `PUT /candidates/abc/stage` is called
- **THEN** the response is `400 Bad Request` with `{ "success": false, "error": { "message": "Invalid candidate ID", "code": "VALIDATION_ERROR" } }`

#### Scenario: Invalid candidate ID path parameter (zero or negative)
- **WHEN** `PUT /candidates/0/stage` is called
- **THEN** the response is `400 Bad Request` with `{ "success": false, "error": { "message": "Invalid candidate ID", "code": "VALIDATION_ERROR" } }`

#### Scenario: Notes field exceeds maximum length
- **WHEN** `PUT /candidates/1/stage` is called with body containing `notes` longer than 500 characters
- **THEN** the response is `400 Bad Request` with `{ "success": false, "error": { "message": "Validation failed", "code": "VALIDATION_ERROR", "details": [{ "field": "notes", "message": "Notes must not exceed 500 characters" }] } }`

#### Scenario: Negative applicationId in request body
- **WHEN** `PUT /candidates/1/stage` is called with body `{ "applicationId": -1, "newInterviewStep": 5 }`
- **THEN** the response is `400 Bad Request` with validation error for applicationId

#### Scenario: Negative newInterviewStep in request body
- **WHEN** `PUT /candidates/1/stage` is called with body `{ "applicationId": 123, "newInterviewStep": -5 }`
- **THEN** the response is `400 Bad Request` with validation error for newInterviewStep

#### Scenario: Stage update without notes (optional field)
- **WHEN** `PUT /candidates/1/stage` is called with body `{ "applicationId": 123, "newInterviewStep": 5 }` omitting the optional `notes` field
- **THEN** the response is `200 OK` with `notes` field omitted or null in response data

#### Scenario: Database error during update
- **WHEN** `PUT /candidates/1/stage` is called with valid data but a database error occurs
- **THEN** the response is `500 Internal Server Error` with `{ "success": false, "error": { "message": "Internal server error", "code": "INTERNAL_ERROR" } }` and error is passed to next(error)
