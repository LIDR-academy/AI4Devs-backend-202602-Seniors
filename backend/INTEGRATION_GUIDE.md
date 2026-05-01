# Integration Guide: Candidate Interview Stage Update Endpoint

## Overview

This guide explains how to integrate the new **PUT /candidates/:applicationId/stage** endpoint into your application. This endpoint allows recruiters and hiring managers to advance candidates through interview stages with full audit logging and compliance tracking.

## Quick Start

### 1. Authentication Setup

First, ensure you have a valid JWT token:

```bash
# Get your authorization token from your authentication service
AUTH_TOKEN="your-jwt-token-here"
```

### 2. Make Your First Request

```bash
curl -X PUT http://localhost:3010/candidates/1/stage \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewStepId": 2,
    "notes": "Candidate passed technical assessment"
  }'
```

### 3. Handle the Response

Success Response (200):
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

Error Response (4xx/5xx):
```json
{
  "error": "Interview step not valid for this position",
  "statusCode": 400,
  "message": "Interview step 999 is not valid for position 1"
}
```

## Frontend Integration

### React Example

```typescript
import { useState } from 'react';

interface StageUpdateResponse {
  applicationId: number;
  candidateId: number;
  currentInterviewStep: {
    stepId: number;
    stepName: string;
    stepOrder: number;
  };
  updatedAt: string;
}

interface Props {
  applicationId: number;
  authToken: string;
  onStageUpdated: (response: StageUpdateResponse) => void;
}

function CandidateStageUpdateButton({ applicationId, authToken, onStageUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStageUpdate = async (interviewStepId: number, notes?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3010/candidates/${applicationId}/stage`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            interviewStepId,
            notes: notes || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update stage');
      }

      const data: StageUpdateResponse = await response.json();
      console.log('Stage updated successfully:', data.currentInterviewStep.stepName);
      
      // Update UI with new stage
      onStageUpdated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={() => handleStageUpdate(2, 'Passed technical interview')}
      disabled={loading}
    >
      {loading ? 'Updating...' : 'Advance to HR Round'}
    </button>
  );
}
```

### JavaScript/Node.js Example

```javascript
async function updateCandidateStage(applicationId, interviewStepId, authToken) {
  const response = await fetch(
    `http://localhost:3010/candidates/${applicationId}/stage`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interviewStepId: interviewStepId,
        notes: 'Candidate performed well in technical assessment',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    const err = new Error(`${error.error}: ${error.message}`);
    err.status = response.status;
    throw err;
  }

  return await response.json();
}

// Usage
try {
  const result = await updateCandidateStage(1, 2, authToken);
  console.log(`Updated to: ${result.currentInterviewStep.stepName}`);
} catch (error) {
  console.error('Failed to update stage:', error.message);
}
```

## Backend Integration (Node.js/Express)

If you're integrating from another backend service:

```typescript
import axios from 'axios';

async function advanceCandidateStage(
  applicationId: number,
  interviewStepId: number,
  bearerToken: string,
  notes?: string
) {
  try {
    const response = await axios.put(
      `http://api.example.com/candidates/${applicationId}/stage`,
      {
        interviewStepId,
        notes: notes || undefined,
      },
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || 'Unknown error';
      throw new Error(`[${statusCode}] ${errorMessage}`);
    }
    throw error;
  }
}
```

## Workflow Integration

### Typical Recruitment Workflow

1. **Candidate Applies** → Application created with initial interview step
2. **Initial Screening** → Recruiter reviews application
3. **Update Stage** (Current endpoint) → Move to "HR Round"
4. **HR Interview** → HR representative conducts interview
5. **Update Stage** → Move to "Technical Round"
6. **Technical Interview** → Technical team evaluates candidate
7. **Final Decision** → Update to final stage or reject

### Using the Endpoint in Each Step

```javascript
// Step 3: Update to HR Round after screening
await updateCandidateStage(applicationId, hrRoundStepId, token, 
  'Passed initial screening. Scheduling HR round.');

// Step 5: Update to Technical Round after HR approval
await updateCandidateStage(applicationId, technicalRoundStepId, token,
  'Approved by HR. Ready for technical assessment.');

// Step 7: Final decision
await updateCandidateStage(applicationId, finalStepId, token,
  'All rounds completed. Preparing offer letter.');
```

## Error Handling Best Practices

### Implement Retry Logic

```javascript
async function updateWithRetry(
  applicationId,
  stepId,
  token,
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await updateCandidateStage(applicationId, stepId, token);
    } catch (error) {
      const status = error.status;
      // Immediately rethrow deterministic client errors — retrying won't help
      if (status === 400 || status === 401 || status === 403 || status === 404) {
        throw error;
      }
      if (attempt === maxRetries) {
        throw error;
      }
      // Exponential backoff: 1s, 2s, 4s
      // Retried only for transient errors: 5xx, 429, or no status (network failure)
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Handle Specific Error Cases

```javascript
async function handleStageUpdate(applicationId, stepId, token) {
  try {
    return await updateCandidateStage(applicationId, stepId, token);
  } catch (error) {
    const message = error.message;

    if (message.includes('401') || message.includes('Unauthorized')) {
      // Token expired - refresh and retry
      const newToken = await refreshAuthToken();
      return await updateCandidateStage(applicationId, stepId, newToken);
    }

    if (message.includes('404') || message.includes('Application not found')) {
      // Application doesn't exist
      console.error('Application not found. Check the ID.');
      throw new Error('Invalid application ID');
    }

    if (message.includes('400') || message.includes('Interview step')) {
      // Invalid step for this position
      console.error('This interview step is not valid for this position.');
      throw new Error('Invalid step for position');
    }

    if (message.includes('403') || message.includes('Forbidden')) {
      // User doesn't have permission
      console.error('You do not have permission to update this stage.');
      throw new Error('Insufficient permissions');
    }

    // Generic server error
    console.error('Server error. Please try again later.');
    throw error;
  }
}
```

## Monitoring Integration

### Check System Health

```bash
# Health status
curl -s http://localhost:3010/health | jq '.'

# Metrics
curl -s http://localhost:3010/metrics | jq '.stageUpdate'
```

### Monitor Stage Update Failures

```javascript
async function monitorStageUpdates() {
  const metrics = await fetch('http://localhost:3010/metrics').then(r => r.json());
  const stageUpdate = metrics.stageUpdate;

  if (stageUpdate.successRate < 95) {
    console.warn(`Low success rate: ${stageUpdate.successRate}%`);
    // Alert ops team
  }

  if (stageUpdate.avgDurationMs > 500) {
    console.warn(`Slow updates: ${stageUpdate.avgDurationMs}ms average`);
    // Investigate database performance
  }
}
```

## Audit Log Access

Once a stage is updated, the change is logged. Access audit logs via:

```sql
SELECT * FROM "AuditLog" 
WHERE "applicationId" = 1 
AND action = 'STAGE_UPDATE'
ORDER BY "timestamp" DESC
LIMIT 10;
```

Each audit log contains:
- `action`: 'STAGE_UPDATE'
- `userId`: Who made the change
- `applicationId`: Which application
- `oldStageId`: Previous stage
- `newStageId`: New stage
- `timestamp`: When it happened
- `details`: Optional notes (JSON)

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Missing or invalid token | Verify bearer token is valid and not expired |
| 403 Forbidden | Insufficient role | Ensure user has 'recruiter' or 'hiring_manager' role |
| 400 Bad Request | Invalid input | Check applicationId and interviewStepId are valid integers |
| 404 Not Found | Application doesn't exist | Verify applicationId is correct |
| 400 Invalid Step | Step not in interview flow | Use only steps from the position's interview flow |

### Enable Debug Logging

```javascript
// In development, enable verbose logging
process.env.LOG_LEVEL = 'DEBUG';

// View detailed logs
curl -s http://localhost:3010/metrics | jq '.requestsByEndpoint'
```

## Rate Limiting Considerations

Currently, no rate limiting is implemented. For production:
- Consider rate limiting by user ID to prevent abuse
- Implement sliding window rate limiting if needed
- Monitor for unusual activity patterns

## Testing

### Unit Test Example

```typescript
import { updateCandidateStage } from './api';

describe('Candidate Stage Update', () => {
  it('should update candidate stage', async () => {
    const result = await updateCandidateStage(1, 2, testToken);
    expect(result.applicationId).toBe(1);
    expect(result.currentInterviewStep.stepId).toBe(2);
  });

  it('should reject invalid stage', async () => {
    await expect(updateCandidateStage(1, 999, testToken))
      .rejects.toThrow('Interview step not valid');
  });
});
```

### Integration Test Example

```bash
# Test with real database
npm test -- integration --testNamePattern="stage-update"
```

## Support & Documentation

- **API Documentation**: http://localhost:3010/api-docs/
- **Health Check**: http://localhost:3010/health
- **Metrics Dashboard**: http://localhost:3010/metrics
- **Report Issues**: Create GitHub issue or contact support team
