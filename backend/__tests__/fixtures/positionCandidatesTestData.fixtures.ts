// Test data fixtures for STORY-001 position candidates endpoint
// These fixtures are used to seed the test database with realistic data

export const testDataScripts = {
  // Create test company
  createTestCompany: `
    INSERT INTO "Company" (name) VALUES ('Test Company')
    ON CONFLICT (name) DO UPDATE SET name = 'Test Company'
    RETURNING id;
  `,

  // Create test position with interview flow
  createTestPosition: `
    WITH test_company AS (
      INSERT INTO "Company" (name) VALUES ('Test Company')
      ON CONFLICT (name) DO UPDATE SET name = 'Test Company'
      RETURNING id
    ),
    test_flow AS (
      INSERT INTO "InterviewFlow" (description)
      VALUES ('Test Interview Flow')
      RETURNING id
    ),
    test_interview_type AS (
      INSERT INTO "InterviewType" (name, description)
      VALUES ('Technical Interview', 'Technical skills assessment')
      RETURNING id
    ),
    test_steps AS (
      INSERT INTO "InterviewStep" (
        "interviewFlowId",
        "interviewTypeId",
        name,
        "orderIndex"
      )
      SELECT test_flow.id, test_interview_type.id, 'Technical Round 1', 1
      FROM test_flow, test_interview_type
      UNION ALL
      SELECT test_flow.id, test_interview_type.id, 'Technical Round 2', 2
      FROM test_flow, test_interview_type
      UNION ALL
      SELECT test_flow.id, test_interview_type.id, 'Final Round', 3
      FROM test_flow, test_interview_type
      RETURNING id
    )
    INSERT INTO "Position" (
      "companyId",
      "interviewFlowId",
      title,
      description,
      location,
      "jobDescription",
      status,
      "isVisible"
    )
    SELECT test_company.id, test_flow.id, 'Software Engineer', 'Full-stack engineer', 'San Francisco',
      'Looking for experienced engineer', 'Active', true
    FROM test_company, test_flow
    WHERE NOT EXISTS (SELECT 1 FROM "Position" WHERE title = 'Software Engineer')
    RETURNING id;
  `,

  // Create test candidates
  createTestCandidates: `
    INSERT INTO "Candidate" ("firstName", "lastName", email, phone, address)
    VALUES
      ('John', 'Doe', 'john.doe@example.com', '555-0001', '123 Main St'),
      ('Jane', 'Smith', 'jane.smith@example.com', '555-0002', '456 Oak Ave'),
      ('Bob', 'Johnson', 'bob.johnson@example.com', '555-0003', '789 Pine Rd'),
      ('Alice', 'Williams', 'alice.williams@example.com', NULL, NULL),
      ('Charlie', 'Brown', 'charlie.brown@example.com', '555-0005', '321 Elm St')
    ON CONFLICT (email) DO NOTHING
    RETURNING id;
  `,

  // Create test applications
  createTestApplications: `
    WITH test_position AS (
      SELECT id FROM "Position" WHERE title = 'Software Engineer' LIMIT 1
    ),
    test_candidates AS (
      SELECT id FROM "Candidate"
      WHERE email IN (
        'john.doe@example.com', 'jane.smith@example.com',
        'bob.johnson@example.com', 'alice.williams@example.com'
      )
    ),
    test_steps AS (
      SELECT id FROM "InterviewStep"
      WHERE name IN ('Technical Round 1', 'Technical Round 2', 'Final Round')
      ORDER BY "orderIndex"
    )
    INSERT INTO "Application" (
      "positionId",
      "candidateId",
      "applicationDate",
      "currentInterviewStep",
      notes
    )
    SELECT
      tp.id,
      tc.id,
      NOW() - INTERVAL '7 days',
      (SELECT id FROM test_steps ORDER BY "orderIndex" LIMIT 1),
      'Strong technical background'
    FROM test_position tp, test_candidates tc
    WHERE NOT EXISTS (
      SELECT 1 FROM "Application"
      WHERE "positionId" = tp.id AND "candidateId" = tc.id
    )
    RETURNING id;
  `,

  // Create test employee (interviewer)
  createTestEmployee: `
    WITH test_company AS (
      SELECT id FROM "Company" WHERE name = 'Test Company' LIMIT 1
    )
    INSERT INTO "Employee" ("companyId", name, email, role, "isActive")
    SELECT tc.id, 'Sarah Engineer', 'sarah@example.com', 'recruiter', true
    FROM test_company tc
    WHERE NOT EXISTS (SELECT 1 FROM "Employee" WHERE email = 'sarah@example.com')
    RETURNING id;
  `,

  // Create test interviews with scores
  createTestInterviews: `
    WITH test_applications AS (
      SELECT a.id, a."currentInterviewStep"
      FROM "Application" a
      WHERE a."positionId" = (
        SELECT id FROM "Position" WHERE title = 'Software Engineer' LIMIT 1
      )
      LIMIT 4
    ),
    test_employee AS (
      SELECT id FROM "Employee" WHERE email = 'sarah@example.com' LIMIT 1
    )
    INSERT INTO "Interview" (
      "applicationId",
      "interviewStepId",
      "employeeId",
      "interviewDate",
      score,
      result,
      notes
    )
    SELECT
      ta.id,
      ta."currentInterviewStep",
      te.id,
      NOW() - INTERVAL '2 days',
      (RANDOM() * 4 + 1)::INT,
      'Pass',
      'Good technical knowledge'
    FROM test_applications ta, test_employee te
    WHERE NOT EXISTS (
      SELECT 1 FROM "Interview"
      WHERE "applicationId" = ta.id
    );

    -- Add second interviews with varying scores
    INSERT INTO "Interview" (
      "applicationId",
      "interviewStepId",
      "employeeId",
      "interviewDate",
      score,
      result,
      notes
    )
    SELECT
      ta.id,
      (SELECT id FROM "InterviewStep" WHERE name = 'Technical Round 2' LIMIT 1),
      te.id,
      NOW() - INTERVAL '1 day',
      (RANDOM() * 4 + 1)::INT,
      'Pass',
      'Great problem solving'
    FROM (
      SELECT a.id FROM "Application" a
      WHERE a."positionId" = (
        SELECT id FROM "Position" WHERE title = 'Software Engineer' LIMIT 1
      )
      ORDER BY a.id DESC LIMIT 2
    ) ta,
    (SELECT id FROM "Employee" WHERE email = 'sarah@example.com' LIMIT 1) te
    WHERE NOT EXISTS (
      SELECT 1 FROM "Interview"
      WHERE "applicationId" = ta.id
        AND "interviewStepId" = (SELECT id FROM "InterviewStep" WHERE name = 'Technical Round 2' LIMIT 1)
    );
  `,

  // Cleanup script
  cleanup: `
    DELETE FROM "Interview"
    WHERE "applicationId" IN (
      SELECT id FROM "Application"
      WHERE "positionId" = (
        SELECT id FROM "Position" WHERE title = 'Software Engineer' LIMIT 1
      )
    );

    DELETE FROM "Application"
    WHERE "positionId" = (
      SELECT id FROM "Position" WHERE title = 'Software Engineer' LIMIT 1
    );

    DELETE FROM "Position" WHERE title = 'Software Engineer';
    DELETE FROM "InterviewStep" WHERE "interviewFlowId" = (
      SELECT id FROM "InterviewFlow" WHERE description = 'Test Interview Flow' LIMIT 1
    );
    DELETE FROM "InterviewFlow" WHERE description = 'Test Interview Flow';
    DELETE FROM "InterviewType" WHERE name = 'Technical Interview';
    DELETE FROM "Employee" WHERE email = 'sarah@example.com';
    DELETE FROM "Candidate"
    WHERE email IN (
      'john.doe@example.com', 'jane.smith@example.com',
      'bob.johnson@example.com', 'alice.williams@example.com',
      'charlie.brown@example.com'
    );
    DELETE FROM "Company" WHERE name = 'Test Company';
  `,
};
