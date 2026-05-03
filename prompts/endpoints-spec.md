# Kanban Candidate Management Endpoints

Your mission in this exercise is to create two new endpoints that will allow us to manipulate the list of candidates of an application in a kanban-type interface.

## GET /positions/:id/candidates

This endpoint will retrieve all candidates in process for a given position—that is, all applications for a given `positionID`. It must provide the following basic information:

- **Full name of the candidate** (from the `candidate` table)
- **current_interview_step**: what phase of the process the candidate is in (from the `application` table)
- **Average score of the candidate**: Remember that each interview conducted by the candidate has a score

### Implementation Plan

1. **Create the Application Service Layer**
   - Build a use case/service method to fetch all applications for a given `positionID`
   - Implement logic to join `Application` → `Candidate` → `Interview` tables
   - Calculate the average score from interviews per candidate

2. **Build the Repository Query**
   - Extend the `ApplicationRepository` with a method like `findByPositionId(positionId: string)`
   - Use Prisma's `include` to fetch related `Candidate` and `Interview` records
   - Ensure the query returns optimized data

3. **Transform to DTO**
   - Map the domain entities to a response DTO containing: candidate full name, `current_interview_step`, and average score
   - Apply any business rules or filtering

4. **Create the Controller**
   - Add a route handler in `candidateRoutes.ts` or create a new `positionRoutes.ts`
   - Extract the `positionId` from the URL parameter
   - Validate that the position exists
   - Call the application service and return the result

5. **Add Validation & Error Handling**
   - Validate that `positionId` is a valid UUID/ID format
   - Return 404 if position does not exist
   - Return 500 if a database error occurs

## PUT /candidates/:id/stage

This endpoint will update the moved candidate's stage. It allows you to modify the current phase of the interview process in which a specific candidate is located.

### Implementation Plan

1. **Define the Request DTO**
   - Create a payload structure: `{ newStage: string }` or `{ interviewStepId: number }`
   - Add validation to ensure the new stage is valid (enum or exists in the database)

2. **Create the Application Service Layer**
   - Build a use case/service method to update a candidate's application stage
   - Implement business logic to validate the stage transition (e.g., prevent skipping steps)
   - Ensure only valid interview steps can be assigned

3. **Build the Repository Update Method**
   - Extend the `ApplicationRepository` with a method like `updateStage(applicationId: string, newStageId: number)`
   - Use Prisma's `update` to modify the `current_interview_step` on the `Application` table
   - Return the updated application record

4. **Create the Controller**
   - Add a route handler for `PUT /candidates/:id/stage`
   - Extract the `candidateId` from the URL parameter
   - Parse the request body for the new stage
   - Call the application service to perform the update
   - Return the updated candidate/application data

5. **Add Validation & Error Handling**
   - Validate that `candidateId` is a valid ID format
   - Validate that the new stage exists in `InterviewStep`
   - Return 404 if candidate/application does not exist
   - Return 400 if the stage transition is invalid
   - Return 500 if a database error occurs

6. **Audit & Logging (Optional)**
   - Log the stage change with timestamp and user information
   - Consider adding an audit trail for compliance
