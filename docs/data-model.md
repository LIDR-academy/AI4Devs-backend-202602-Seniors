# Data Model

## Entity Relationship Diagram

```mermaid
erDiagram
  CANDIDATE ||--o{ EDUCATION : "has"
  CANDIDATE ||--o{ WORK_EXPERIENCE : "has"
  CANDIDATE ||--o{ RESUME : "has"
  CANDIDATE ||--o{ APPLICATION : "applies"

  COMPANY ||--o{ EMPLOYEE : "employs"
  COMPANY ||--o{ POSITION : "offers"

  POSITION ||--o{ APPLICATION : "receives"
  POSITION ||--o| INTERVIEW_FLOW : "uses"

  INTERVIEW_FLOW ||--o{ INTERVIEW_STEP : "defines"
  INTERVIEW_TYPE ||--o{ INTERVIEW_STEP : "categorizes"

  INTERVIEW_STEP ||--o{ APPLICATION : "tracks"
  INTERVIEW_STEP ||--o{ INTERVIEW : "scheduled_in"

  APPLICATION ||--o{ INTERVIEW : "contains"

  EMPLOYEE ||--o{ INTERVIEW : "conducts"

  CANDIDATE {
    int id PK
    string firstName
    string lastName
    string email
    string phone
    string address
  }

  EDUCATION {
    int id PK
    string institution
    string title
    datetime startDate
    datetime endDate
    int candidateId FK
  }

  WORK_EXPERIENCE {
    int id PK
    string company
    string position
    string description
    datetime startDate
    datetime endDate
    int candidateId FK
  }

  RESUME {
    int id PK
    string filePath
    string fileType
    datetime uploadDate
    int candidateId FK
  }

  COMPANY {
    int id PK
    string name
  }

  EMPLOYEE {
    int id PK
    int companyId FK
    string name
    string email
    string role
    boolean isActive
  }

  INTERVIEW_TYPE {
    int id PK
    string name
    string description
  }

  INTERVIEW_FLOW {
    int id PK
    string description
  }

  INTERVIEW_STEP {
    int id PK
    int interviewFlowId FK
    int interviewTypeId FK
    string name
    int orderIndex
  }

  POSITION {
    int id PK
    int companyId FK
    int interviewFlowId FK
    string title
    string description
    string status
    boolean isVisible
    string location
    string jobDescription
    string requirements
    string responsibilities
    float salaryMin
    float salaryMax
    string employmentType
    string benefits
    string companyDescription
    datetime applicationDeadline
    string contactInfo
  }

  APPLICATION {
    int id PK
    int positionId FK
    int candidateId FK
    datetime applicationDate
    int currentInterviewStep FK
    string notes
  }

  INTERVIEW {
    int id PK
    int applicationId FK
    int interviewStepId FK
    int employeeId FK
    datetime interviewDate
    string result
    int score
    string notes
  }
```

## Entities

| Entity | Description | Fields |
|--------|-------------|--------|
| **Candidate** | Job applicant with personal info, education, work history | id, firstName, lastName, email, phone, address |
| **Education** | Candidate's educational background | id, institution, title, startDate, endDate, candidateId |
| **WorkExperience** | Candidate's work history | id, company, position, description, startDate, endDate, candidateId |
| **Resume** | Uploaded resume files | id, filePath, fileType, uploadDate, candidateId |
| **Company** | Hiring organization | id, name |
| **Employee** | Staff member of a company | id, companyId, name, email, role, isActive |
| **InterviewType** | Type/category of interview | id, name, description |
| **InterviewFlow** | Template defining interview stages | id, description |
| **InterviewStep** | Individual stage in an interview flow | id, interviewFlowId, interviewTypeId, name, orderIndex |
| **Position** | Job opening at a company | id, companyId, interviewFlowId, title, description, status, isVisible, location, jobDescription, requirements, responsibilities, salaryMin, salaryMax, employmentType, benefits, companyDescription, applicationDeadline, contactInfo |
| **Application** | Candidate's application to a position | id, positionId, candidateId, applicationDate, currentInterviewStep, notes |
| **Interview** | Scheduled interview instance | id, applicationId, interviewStepId, employeeId, interviewDate, result, score, notes |

## Relationships

| Relation | From | To | Type |
|----------|------|----|------|
| Candidate → Education | 1 | N | has |
| Candidate → WorkExperience | 1 | N | has |
| Candidate → Resume | 1 | N | has |
| Candidate → Application | 1 | N | applies |
| Company → Employee | 1 | N | employs |
| Company → Position | 1 | N | offers |
| Position → InterviewFlow | N | 1 | uses |
| InterviewFlow → InterviewStep | 1 | N | defines |
| InterviewType → InterviewStep | 1 | N | categorizes |
| InterviewStep → Application | 1 | N | tracks |
| InterviewStep → Interview | 1 | N | scheduled_in |
| Application → Interview | 1 | N | contains |
| Employee → Interview | 1 | N | conducts |

## Technology Stack

- **ORM**: Prisma
- **Database**: PostgreSQL
- **Language**: TypeScript (domain models)
