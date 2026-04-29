# Database Schema and Migrations
Schema source of truth:
- Prisma schema defines 11 models and relations for candidate management + hiring pipeline. Evidence: schema.prisma.

Model inventory:
| Model | Fields (type, nullability, defaults) | PK/Unique/Indexes | Relations |
|---|---|---|---|
| Candidate | id Int req auto-inc; firstName String(100) req; lastName String(100) req; email String(255) req; phone String(15) opt; address String(100) opt | PK id; Unique email | 1-N Education, WorkExperience, Resume, Application |
| Education | id Int req auto-inc; institution String(100) req; title String(250) req; startDate DateTime req; endDate DateTime opt; candidateId Int req | PK id | N-1 Candidate |
| WorkExperience | id Int req auto-inc; company String(100) req; position String(100) req; description String(200) opt; startDate DateTime req; endDate DateTime opt; candidateId Int req | PK id | N-1 Candidate |
| Resume | id Int req auto-inc; filePath String(500) req; fileType String(50) req; uploadDate DateTime req; candidateId Int req | PK id | N-1 Candidate |
| Company | id Int req auto-inc; name String req | PK id; Unique name | 1-N Employee, Position |
| Employee | id Int req auto-inc; companyId Int req; name String req; email String req; role String req; isActive Boolean req default true | PK id; Unique email | N-1 Company; 1-N Interview |
| InterviewType | id Int req auto-inc; name String req; description String opt | PK id | 1-N InterviewStep |
| InterviewFlow | id Int req auto-inc; description String opt | PK id | 1-N InterviewStep; 1-N Position |
| InterviewStep | id Int req auto-inc; interviewFlowId Int req; interviewTypeId Int req; name String req; orderIndex Int req | PK id | N-1 InterviewFlow; N-1 InterviewType; 1-N Application; 1-N Interview |
| Position | id Int req auto-inc; companyId Int req; interviewFlowId Int req; title req; description req; status req default Draft; isVisible req default false; location req; jobDescription req; requirements opt; responsibilities opt; salaryMin Float opt; salaryMax Float opt; employmentType opt; benefits opt; companyDescription opt; applicationDeadline DateTime opt; contactInfo opt | PK id | N-1 Company; N-1 InterviewFlow; 1-N Application |
| Application | id Int req auto-inc; positionId Int req; candidateId Int req; applicationDate DateTime req; currentInterviewStep Int req; notes String opt | PK id | N-1 Position; N-1 Candidate; N-1 InterviewStep; 1-N Interview |
| Interview | id Int req auto-inc; applicationId Int req; interviewStepId Int req; employeeId Int req; interviewDate DateTime req; result String opt; score Int opt; notes String opt | PK id | N-1 Application; N-1 InterviewStep; N-1 Employee |