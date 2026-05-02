# LTI API Documentation

## Overview

The LTI (Talent Tracking System) API provides endpoints for managing candidates, positions, and interview processes.

## Base URL

- Development: `http://localhost:3010`
- Production: `https://api.example.com`

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

## Endpoints

### Update Candidate Interview Stage

**Endpoint**: `PUT /candidates/{applicationId}/stage`

**Description**: Advances a candidate to a new interview stage. Updates the application's current interview step and records an audit log entry.

**Authorization**: Required
- Role: `recruiter` or `hiring_manager`

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| applicationId | integer | Yes | ID of the application to update (must be positive) |

**Request Body**:
```json
{
  "interviewStepId": 2,
  "notes": "Optional notes about the stage update"
}
```

**Request Body Parameters**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| interviewStepId | integer | Yes | Must be positive, must exist in the interview flow | ID of the interview step to advance to |
| notes | string | No | Max 1000 chars, HTML stripped | Optional notes (HTML/script tags are sanitized) |

**Response** (200 OK):
```json
{
  "applicationId": 1,
  "candidateId": 1,
  "positionId": 1,
  "applicationDate": "2026-05-01T12:47:44.005Z",
  "updatedAt": "2026-05-01T14:12:10.321Z",
  "currentInterviewStep": {
    "stepId": 2,
    "stepName": "HR Round",
    "stepOrder": 2,
    "interviewFlowId": 1
  }
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| applicationId | integer | ID of the application |
| candidateId | integer | ID of the candidate |
| positionId | integer | ID of the position |
| applicationDate | string (ISO 8601) | Date when candidate applied |
| updatedAt | string (ISO 8601) | Timestamp of the update |
| currentInterviewStep | object | Details of the current interview step |
| currentInterviewStep.stepId | integer | Interview step ID |
| currentInterviewStep.stepName | string | Name of the interview step |
| currentInterviewStep.stepOrder | integer | Order in the interview flow |
| currentInterviewStep.interviewFlowId | integer | ID of the interview flow |

**Error Responses**:

**400 Bad Request** - Invalid input or validation error:
```json
{
  "error": "Invalid application ID",
  "statusCode": 400,
  "message": "Application ID must be a positive integer"
}
```

**400 Bad Request** - Interview step not in flow:
```json
{
  "error": "Interview step not valid for this position",
  "statusCode": 400,
  "message": "Interview step 999 is not valid for position 1"
}
```

**401 Unauthorized** - Missing or invalid authentication:
```json
{
  "error": "Unauthorized",
  "statusCode": 401,
  "message": "Missing Authorization header"
}
```

**403 Forbidden** - User does not have required role:
```json
{
  "error": "Forbidden",
  "statusCode": 403,
  "message": "User role 'viewer' does not have permission to access this endpoint"
}
```

**404 Not Found** - Application not found:
```json
{
  "error": "Application not found",
  "statusCode": 404,
  "message": "Application with ID 9999 not found"
}
```

**500 Internal Server Error** - Server error:
```json
{
  "error": "Internal server error",
  "statusCode": 500,
  "message": "An error occurred while updating the candidate stage"
}
```

### Examples

**Example 1: Successful update**
```bash
curl -X PUT http://localhost:3010/candidates/1/stage \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewStepId": 2,
    "notes": "Passed technical assessment"
  }'
```

**Example 2: Update without notes**
```bash
curl -X PUT http://localhost:3010/candidates/1/stage \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewStepId": 3
  }'
```

**Example 3: Invalid application ID**
```bash
curl -X PUT http://localhost:3010/candidates/invalid/stage \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"interviewStepId": 2}'

# Response: 400 Bad Request
# "Application ID must be a positive integer"
```

## Implementation Details

### Input Validation

- `applicationId`: Parsed from URL parameter, must be a positive integer
- `interviewStepId`: Must be a positive integer and exist in the interview flow for the position
- `notes`: Optional string field, HTML tags are sanitized before storage

### Security

- **Authentication**: JWT Bearer token required
- **Authorization**: User must have `recruiter` or `hiring_manager` role
- **Input Sanitization**: HTML/script tags in notes are stripped using sanitize-html
- **SQL Injection Prevention**: Prisma parameterized queries used throughout
- **Error Messages**: No PII (Personally Identifiable Information) included in error responses

### Transactions

The update operation is atomic:
1. Application stage is updated
2. Audit log entry is created with old/new stage IDs, timestamp, and optional notes
3. Both operations complete or both are rolled back if any error occurs

### Audit Logging

Every successful stage update creates an audit log entry with:
- Action: `STAGE_UPDATE`
- User ID: From JWT token
- Application ID
- Old stage ID
- New stage ID
- Timestamp
- Details (optional notes if provided)

### Idempotency

If a candidate is already at the requested stage, the endpoint returns 200 OK without making changes (idempotent behavior).

## Swagger/OpenAPI Documentation

Interactive API documentation available at: `http://localhost:3010/api-docs/`

The Swagger UI provides:
- Browse all endpoints with detailed specifications
- Try out API requests directly in the browser
- View request/response schemas and examples
- Test authentication and authorization
