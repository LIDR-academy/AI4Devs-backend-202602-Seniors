# 01 - Candidates for a position

As a recruiter
I want to have a list of candidates that a position has
So that I can easily take a decission about what is the next step I have to perform

## Description

We want to implement the following endpoint: GET /positions/:id/candidates

This endpoint will get all the candidates associated to a position. All the applies a possition (positionID) has received. The response should include the following information:
- Full name of the candidate (candidate table)
- Current candidate's phase (application table, currentInterviewStep field)
- Average score of the candidate based on the interview score

Endpoint response:
```json
[
	{
		"fullName": "Candidate 1 full name",
		"currentInterviewStep": 2,
		"averageScore": 75
	},
	{
		"fullName": "Candidate 2 full name",
		"currentInterviewStep": 1,
		"averageScore": null
	}
]
```

## Acceptance criteria

Given a position without candidates
When calling the endpoint
Then it will return an empty array of records

Given a position with candidates
When calling the endpoint
Then it will return an array with all the values

Given a position with a candidate in the first interview step
When calling the endpoing
Then it will return an array with one candidate
And the candidate will have null as averageScore because it has not been interviewed yet