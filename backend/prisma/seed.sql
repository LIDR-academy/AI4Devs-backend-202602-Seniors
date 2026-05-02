-- Seed script using raw SQL
-- Insert Company
INSERT INTO "Company" (name) VALUES ('LTI') ON CONFLICT (name) DO NOTHING;

-- Insert Interview Flows
INSERT INTO "InterviewFlow" (description) VALUES ('Standard development interview process');
INSERT INTO "InterviewFlow" (description) VALUES ('Data science interview process');

-- Insert Interview Types
INSERT INTO "InterviewType" (name, description) VALUES ('Technical', 'Technical assessment');
INSERT INTO "InterviewType" (name, description) VALUES ('HR', 'HR interview');

-- Get IDs for use in subsequent inserts
-- Note: We'll use dynamic IDs based on what was just inserted

-- Insert Interview Steps
INSERT INTO "InterviewStep" (name, "orderIndex", "interviewFlowId", "interviewTypeId")
SELECT 'Technical Round 1', 1, f.id, t.id
FROM "InterviewFlow" f, "InterviewType" t
WHERE f.description = 'Standard development interview process' AND t.name = 'Technical'
LIMIT 1;

INSERT INTO "InterviewStep" (name, "orderIndex", "interviewFlowId", "interviewTypeId")
SELECT 'HR Round', 2, f.id, t.id
FROM "InterviewFlow" f, "InterviewType" t
WHERE f.description = 'Standard development interview process' AND t.name = 'HR'
LIMIT 1;

INSERT INTO "InterviewStep" (name, "orderIndex", "interviewFlowId", "interviewTypeId")
SELECT 'Data Science Technical', 1, f.id, t.id
FROM "InterviewFlow" f, "InterviewType" t
WHERE f.description = 'Data science interview process' AND t.name = 'Technical'
LIMIT 1;

INSERT INTO "InterviewStep" (name, "orderIndex", "interviewFlowId", "interviewTypeId")
SELECT 'Data Science HR', 2, f.id, t.id
FROM "InterviewFlow" f, "InterviewType" t
WHERE f.description = 'Data science interview process' AND t.name = 'HR'
LIMIT 1;

-- Insert Positions
INSERT INTO "Position" (
  title, description, status, "isVisible", location,
  "jobDescription", "companyId", "interviewFlowId",
  "salaryMin", "salaryMax", "employmentType", benefits,
  "contactInfo", requirements, responsibilities,
  "companyDescription", "applicationDeadline"
)
SELECT
  'Software Engineer', 'Develop and maintain software applications.', 'Open', true, 'Remote',
  'Full-stack development', c.id, f.id,
  50000, 80000, 'Full-time', 'Health insurance, 401k, Paid time off',
  'hr@lti.com', '3+ years of experience in software development, knowledge in React and Node.js',
  'Develop, test, and maintain software solutions.',
  'LTI is a leading HR solutions provider.', '2024-12-31'::timestamp
FROM "Company" c, "InterviewFlow" f
WHERE c.name = 'LTI' AND f.description = 'Standard development interview process'
LIMIT 1;

INSERT INTO "Position" (
  title, description, status, "isVisible", location,
  "jobDescription", "companyId", "interviewFlowId",
  "salaryMin", "salaryMax", "employmentType", benefits,
  "contactInfo", requirements, responsibilities,
  "companyDescription", "applicationDeadline"
)
SELECT
  'Data Scientist', 'Analyze and interpret complex data.', 'Open', true, 'Remote',
  'Data analysis and machine learning', c.id, f.id,
  60000, 90000, 'Full-time', 'Health insurance, 401k, Paid time off, Stock options',
  'hr@lti.com', 'Master degree in Data Science or related field, proficiency in Python and R',
  'Analyze data sets to derive business insights and develop predictive models.',
  'LTI is a leading HR solutions provider.', '2024-12-31'::timestamp
FROM "Company" c, "InterviewFlow" f
WHERE c.name = 'LTI' AND f.description = 'Data science interview process'
LIMIT 1;

-- Insert Employees
INSERT INTO "Employee" ("companyId", name, email, role, "isActive")
SELECT c.id, 'Alice Johnson', 'alice.johnson@lti.com', 'Hiring Manager', true
FROM "Company" c
WHERE c.name = 'LTI'
LIMIT 1;

INSERT INTO "Employee" ("companyId", name, email, role, "isActive")
SELECT c.id, 'Bob Smith', 'bob.smith@lti.com', 'Technical Lead', true
FROM "Company" c
WHERE c.name = 'LTI'
LIMIT 1;

-- Insert Candidates
INSERT INTO "Candidate" ("firstName", "lastName", email, phone, address)
VALUES ('John', 'Doe', 'john.doe@gmail.com', '1234567890', '123 Main St');

INSERT INTO "Candidate" ("firstName", "lastName", email, phone, address)
VALUES ('Jane', 'Smith', 'jane.smith@gmail.com', '9876543210', '456 Oak Ave');

-- Insert Education
INSERT INTO "Education" (institution, title, "startDate", "endDate", "candidateId")
SELECT 'University A', 'BSc Computer Science', '2015-09-01'::timestamp, '2019-06-01'::timestamp, c.id
FROM "Candidate" c
WHERE c.email = 'john.doe@gmail.com'
LIMIT 1;

INSERT INTO "Education" (institution, title, "startDate", "endDate", "candidateId")
SELECT 'University B', 'MSc Data Science', '2018-09-01'::timestamp, '2020-06-01'::timestamp, c.id
FROM "Candidate" c
WHERE c.email = 'jane.smith@gmail.com'
LIMIT 1;

-- Insert Work Experience
INSERT INTO "WorkExperience" (company, position, description, "startDate", "endDate", "candidateId")
SELECT 'Eventbrite', 'Software Developer', 'Developed web applications', '2019-07-01'::timestamp, '2021-08-01'::timestamp, c.id
FROM "Candidate" c
WHERE c.email = 'john.doe@gmail.com'
LIMIT 1;

INSERT INTO "WorkExperience" (company, position, description, "startDate", "endDate", "candidateId")
SELECT 'DataCorp', 'Data Analyst', 'Analyzed business data', '2020-07-01'::timestamp, '2023-12-31'::timestamp, c.id
FROM "Candidate" c
WHERE c.email = 'jane.smith@gmail.com'
LIMIT 1;

-- Insert Resumes
INSERT INTO "Resume" ("filePath", "fileType", "uploadDate", "candidateId")
SELECT '/uploads/john_doe_resume.pdf', 'pdf', NOW(), c.id
FROM "Candidate" c
WHERE c.email = 'john.doe@gmail.com'
LIMIT 1;

INSERT INTO "Resume" ("filePath", "fileType", "uploadDate", "candidateId")
SELECT '/uploads/jane_smith_resume.pdf', 'pdf', NOW(), c.id
FROM "Candidate" c
WHERE c.email = 'jane.smith@gmail.com'
LIMIT 1;

-- Insert Applications
INSERT INTO "Application" ("positionId", "candidateId", "applicationDate", "currentInterviewStep", notes)
SELECT p.id, c.id, NOW(), s.id, 'Strong technical background'
FROM "Position" p, "Candidate" c, "InterviewStep" s
WHERE p.title = 'Software Engineer' AND c.email = 'john.doe@gmail.com' AND s.name = 'Technical Round 1'
LIMIT 1;

INSERT INTO "Application" ("positionId", "candidateId", "applicationDate", "currentInterviewStep", notes)
SELECT p.id, c.id, NOW(), s.id, 'Excellent data science skills'
FROM "Position" p, "Candidate" c, "InterviewStep" s
WHERE p.title = 'Data Scientist' AND c.email = 'jane.smith@gmail.com' AND s.name = 'Data Science Technical'
LIMIT 1;

-- Insert Interviews
INSERT INTO "Interview" ("applicationId", "interviewStepId", "employeeId", "interviewDate", result, score, notes)
SELECT a.id, s.id, e.id, NOW(), 'Passed', 5, 'Good technical skills'
FROM "Application" a, "InterviewStep" s, "Employee" e
WHERE a.notes = 'Strong technical background' AND s.name = 'Technical Round 1' AND e.name = 'Alice Johnson'
LIMIT 1;

INSERT INTO "Interview" ("applicationId", "interviewStepId", "employeeId", "interviewDate", result, score, notes)
SELECT a.id, s.id, e.id, NOW(), 'Passed', 5, 'Excellent data analysis skills'
FROM "Application" a, "InterviewStep" s, "Employee" e
WHERE a.notes = 'Excellent data science skills' AND s.name = 'Data Science Technical' AND e.name = 'Bob Smith'
LIMIT 1;
