# 02 - Update candidate interview step

As a recruiter
I want to be able to update the candidate's interview step
So that I can see the real status of the selection process

## Description

In this ticket we want to implement the following endpoint: PUT /candidates/:id/stage
This endpoint will update the candidate stage to the value passed:

Request
```json
{
	"positionId": 5,
	"interviewStepId": 5
}
```

Response
```json
{
	"message": "Application updated successfully",
	"data": application_data
}
```

## Acceptance criteria

Given a candidate
When calling the endpoint with valid positionId and stage
Then the interview step for the application is updated to reflect the new stage
