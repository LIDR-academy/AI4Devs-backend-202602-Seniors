# Prompts - JGLL

## Prompt 2
Build PUT /candidates/:id/stage
This endpoint will update the stage of the moved candidate. It allows modifying the current phase of the interview process in which a specific candidate is.

## Prompt 1
Build GET /positions/:id/candidates
This endpoint will retrieve all candidates in process for a given position, i.e., all applications for a specific positionID. It must provide the following basic information:

Candidate's full name (from the candidate table).
current_interview_step: the stage of the process the candidate is currently in (from the application table).
The candidate's average score. Remember that each interview conducted with the candidate has a score.

