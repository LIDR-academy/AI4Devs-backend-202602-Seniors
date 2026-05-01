# API Reference: GET /positions/:id/candidates

## Endpoint Overview

Retrieve all candidates in the interview process for a specific job position.

**Method**: `GET`  
**Path**: `/positions/:id/candidates`  
**Authentication**: Required (Bearer token)  
**Authorization**: Requires `recruiter` or `hiring_manager` role

---

## Request

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Position ID (must be a valid integer) |

### Headers

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Example Request

```bash
curl -X GET http://localhost:3010/positions/1/candidates \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json"
```

---

## Response

### Success Response (HTTP 200)

```json
{
  "positionId": 1,
  "positionTitle": "Software Engineer",
  "candidates": [
    {
      "candidateId": 1,
      "fullName": "John Doe",
      "email": "john.doe@gmail.com",
      "phone": "1234567890",
      "address": "123 Main St",
      "applicationDate": "2026-05-01T10:00:00Z",
      "applicationNotes": "Strong technical background",
      "currentInterviewStep": {
        "stepId": 1,
        "stepName": "Technical Round 1",
        "stepOrder": 1,
        "interviewFlowId": 1
      },
      "averageScore": 4.5,
      "totalInterviewsCompleted": 2
    },
    {
      "candidateId": 2,
      "fullName": "Jane Smith",
      "email": "jane.smith@gmail.com",
      "applicationDate": "2026-05-02T11:30:00Z",
      "currentInterviewStep": {
        "stepId": 2,
        "stepName": "Technical Round 2",
        "stepOrder": 2,
        "interviewFlowId": 1
      },
      "averageScore": null,
      "totalInterviewsCompleted": 0
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `positionId` | integer | The position ID |
| `positionTitle` | string | Title of the position |
| `candidates` | array | Array of candidate objects |

#### Candidate Object

| Field | Type | Presence | Description |
|-------|------|----------|-------------|
| `candidateId` | integer | Always | Unique candidate ID |
| `fullName` | string | Always | Full name (firstName + lastName) |
| `email` | string | Always | Email address |
| `phone` | string | Omitted when not set | Phone number |
| `address` | string | Omitted when not set | Address |
| `applicationDate` | string (ISO 8601) | Always | Date candidate applied |
| `applicationNotes` | string | Omitted when not set | Notes on the application |
| `currentInterviewStep` | object | Always | Current interview step info |
| `averageScore` | number \| null | Always (null if no scored interviews) | Average of all interview scores |
| `totalInterviewsCompleted` | integer | Always | Count of completed interviews |

#### Interview Step Object

| Field | Type | Description |
|-------|------|-------------|
| `stepId` | integer | Interview step ID |
| `stepName` | string | Name of the step (e.g., "Technical Round 1") |
| `stepOrder` | integer | Sequential position in interview flow |
| `interviewFlowId` | integer | ID of the interview flow |

---

## Error Responses

### 400 Bad Request

Invalid or missing position ID.

```json
{
  "error": "Invalid position ID",
  "statusCode": 400,
  "message": "Position ID must be a valid integer"
}
```

### 401 Unauthorized

Missing or invalid authorization token.

```json
{
  "error": "Unauthorized",
  "statusCode": 401,
  "message": "Missing Authorization header"
}
```

### 403 Forbidden

User authenticated but doesn't have the required role.

```json
{
  "error": "Forbidden",
  "statusCode": 403,
  "message": "User role 'candidate' does not have permission to access this endpoint"
}
```

### 404 Not Found

Position does not exist.

```json
{
  "error": "Position not found",
  "statusCode": 404,
  "message": "Position with ID 9999 not found"
}
```

### 500 Internal Server Error

Database or server error.

```json
{
  "error": "Internal Server Error",
  "statusCode": 500,
  "message": "An error occurred while fetching position candidates"
}
```

---

## Additional Examples

### Example 1: Valid Position with Candidates

**Request:**
```bash
curl -X GET http://localhost:3010/positions/1/candidates \
  -H "Authorization: Bearer recruiter-token"
```

**Response:** (HTTP 200)
```json
{
  "positionId": 1,
  "positionTitle": "Software Engineer",
  "candidates": [
    {
      "candidateId": 1,
      "fullName": "John Doe",
      "email": "john.doe@gmail.com",
      "phone": "1234567890",
      "address": "123 Main St",
      "applicationDate": "2026-05-01T10:00:00Z",
      "applicationNotes": "Strong technical background",
      "currentInterviewStep": {
        "stepId": 1,
        "stepName": "Technical Round 1",
        "stepOrder": 1,
        "interviewFlowId": 1
      },
      "averageScore": 4.5,
      "totalInterviewsCompleted": 2
    }
  ]
}
```

### Example 2: Empty Candidates List

**Request:**
```bash
curl -X GET http://localhost:3010/positions/2/candidates \
  -H "Authorization: Bearer recruiter-token"
```

**Response:** (HTTP 200)
```json
{
  "positionId": 2,
  "positionTitle": "Product Manager",
  "candidates": []
}
```

### Example 3: Invalid Position ID

**Request:**
```bash
curl -X GET http://localhost:3010/positions/abc/candidates \
  -H "Authorization: Bearer recruiter-token"
```

**Response:** (HTTP 400)
```json
{
  "error": "Invalid position ID",
  "statusCode": 400,
  "message": "Position ID must be a valid integer"
}
```

### Example 4: Non-Existent Position

**Request:**
```bash
curl -X GET http://localhost:3010/positions/9999/candidates \
  -H "Authorization: Bearer recruiter-token"
```

**Response:** (HTTP 404)
```json
{
  "error": "Position not found",
  "statusCode": 404,
  "message": "Position with ID 9999 not found"
}
```

### Example 5: Missing Authorization Header

**Request:**
```bash
curl -X GET http://localhost:3010/positions/1/candidates
```

**Response:** (HTTP 401)
```json
{
  "error": "Unauthorized",
  "statusCode": 401,
  "message": "Missing Authorization header"
}
```

---

## Notes

- **Average Score Calculation**: Only non-null scores are included in the average. If a candidate has no interviews or only interviews with null scores, `averageScore` will be `null`.
- **Optional Fields**: `phone`, `address`, and `applicationNotes` may be `null` if not provided.
- **Date Format**: All dates are in ISO 8601 format (UTC).
- **Performance**: The endpoint is optimized to return results in <500ms for positions with up to 100 candidates.
- **Pagination**: Not implemented in MVP; all candidates are returned in a single response.
