# Init
/init

# Create PRD
Create a PRD (project requirements document) about this project. After done, use 3 expert agents to review it and make sure is solid and consistent, and that includes what design patterns and practices it uses. And then, link this document from claude.md file, so that you (the AI agent) can use it for context when you be planning the next tasks                                                                                                                         

# Create a story

Create a story docs/01-kanban-story.md:
We need create two new endpoints in the backend that will allow us to manipulate the candidate list for an application in a Kanban-style interface (in a later story).
For context, also read the docs/PRD.md file.

# GET /positions/:id/candidates
This endpoint will retrieve all candidates in the process for a given position, that is, all applications for a specific `positionID`. It must provide the following basic information:
- Full name of the candidate (from the `candidate` table).
- `current_interview_step`: the stage of the process the candidate is in (from the `application` table).
- The candidate's average score. Remember that each interview (`interview`) completed by the candidate has a score.

# PUT /candidates/:id/stage
This endpoint will update the stage of the moved candidate. It allows you to modify the current stage of the interview process in which a specific candidate is located.

Implementation details: use best practices, including DDD, SOLID and CUPID. Developing using TDD. Besides test units, make sure to create tests that checks the calls to the actual endpoints for happy paths, wrong paths and edge cases. And confirm that the tests are green.
Story structure: make sure to include Acceptance Criteria in Gherkin.
In the story, define the workflow to work the tests, the implementations and also, after you finish the implementation, use a couple of expert agents to review the implementation and tests, make sure the code is clean and it is structured in a way that is understandable for an AI and it doesn't cause any confusions.
Ask me any questions if you need to clarify any details.


# Implement
Proceed to implement story docs/01-kanban-story.md and make sure to follow the workflow specified in the story, including the reviews.