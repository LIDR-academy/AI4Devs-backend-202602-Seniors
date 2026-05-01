import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  try {
    await prisma.$transaction(async (tx) => {
      // Create Companies
      console.log('Creating companies...');
      const company1 = await tx.company.upsert({
        where: { name: 'LTI' },
        update: {},
        create: {
          name: 'LTI',
        },
      });
      console.log('Company created:', company1.id);

      // Create Interview Flows
      console.log('Creating interview flows...');
      const interviewFlow1 = await tx.interviewFlow.create({
        data: {
          description: 'Standard development interview process',
        },
      });

      const interviewFlow2 = await tx.interviewFlow.create({
        data: {
          description: 'Data science interview process',
        },
      });
      console.log('Interview flows created');

      // Create Interview Types
      console.log('Creating interview types...');
      const interviewType1 = await tx.interviewType.create({
        data: {
          name: 'Technical',
          description: 'Technical assessment',
        },
      });

      const interviewType2 = await tx.interviewType.create({
        data: {
          name: 'HR',
          description: 'HR interview',
        },
      });
      console.log('Interview types created');

      // Create Interview Steps
      console.log('Creating interview steps...');
      const step1 = await tx.interviewStep.create({
        data: {
          name: 'Technical Round 1',
          orderIndex: 1,
          interviewFlowId: interviewFlow1.id,
          interviewTypeId: interviewType1.id,
        },
      });

      await tx.interviewStep.create({
        data: {
          name: 'HR Round',
          orderIndex: 2,
          interviewFlowId: interviewFlow1.id,
          interviewTypeId: interviewType2.id,
        },
      });

      const step3 = await tx.interviewStep.create({
        data: {
          name: 'Data Science Technical',
          orderIndex: 1,
          interviewFlowId: interviewFlow2.id,
          interviewTypeId: interviewType1.id,
        },
      });

      await tx.interviewStep.create({
        data: {
          name: 'Data Science HR',
          orderIndex: 2,
          interviewFlowId: interviewFlow2.id,
          interviewTypeId: interviewType2.id,
        },
      });
      console.log('Interview steps created');

      // Create Positions
      console.log('Creating positions...');
      const position1 = await tx.position.create({
        data: {
          title: 'Software Engineer',
          description: 'Develop and maintain software applications.',
          status: 'Open',
          isVisible: true,
          location: 'Remote',
          jobDescription: 'Full-stack development',
          companyId: company1.id,
          interviewFlowId: interviewFlow1.id,
          salaryMin: 50000,
          salaryMax: 80000,
          employmentType: 'Full-time',
          benefits: 'Health insurance, 401k, Paid time off',
          contactInfo: 'hr@lti.com',
          requirements: '3+ years of experience in software development, knowledge in React and Node.js',
          responsibilities: 'Develop, test, and maintain software solutions.',
          companyDescription: 'LTI is a leading HR solutions provider.',
          applicationDeadline: new Date(new Date().getFullYear() + 1, 11, 31),
        },
      });

      const position2 = await tx.position.create({
        data: {
          title: 'Data Scientist',
          description: 'Analyze and interpret complex data.',
          status: 'Open',
          isVisible: true,
          location: 'Remote',
          jobDescription: 'Data analysis and machine learning',
          companyId: company1.id,
          interviewFlowId: interviewFlow2.id,
          salaryMin: 60000,
          salaryMax: 90000,
          employmentType: 'Full-time',
          benefits: 'Health insurance, 401k, Paid time off, Stock options',
          contactInfo: 'hr@lti.com',
          requirements: 'Master degree in Data Science or related field, proficiency in Python and R',
          responsibilities: 'Analyze data sets to derive business insights and develop predictive models.',
          companyDescription: 'LTI is a leading HR solutions provider.',
          applicationDeadline: new Date(new Date().getFullYear() + 1, 11, 31),
        },
      });
      console.log('Positions created');

      // Create Employees
      console.log('Creating employees...');
      const employee1 = await tx.employee.create({
        data: {
          name: 'Alice Johnson',
          email: 'alice.johnson@lti.com',
          role: 'Hiring Manager',
          companyId: company1.id,
          isActive: true,
        },
      });

      const employee2 = await tx.employee.create({
        data: {
          name: 'Bob Smith',
          email: 'bob.smith@lti.com',
          role: 'Technical Lead',
          companyId: company1.id,
          isActive: true,
        },
      });
      console.log('Employees created');

      // Create Candidates
      console.log('Creating candidates...');
      const candidate1 = await tx.candidate.create({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@gmail.com',
          phone: '1234567890',
          address: '123 Main St',
          educations: {
            create: [
              {
                institution: 'University A',
                title: 'BSc Computer Science',
                startDate: new Date('2015-09-01'),
                endDate: new Date('2019-06-01'),
              },
            ],
          },
          workExperiences: {
            create: [
              {
                company: 'Eventbrite',
                position: 'Software Developer',
                description: 'Developed web applications',
                startDate: new Date('2019-07-01'),
                endDate: new Date('2021-08-01'),
              },
            ],
          },
          resumes: {
            create: [
              {
                filePath: '/uploads/john_doe_resume.pdf',
                fileType: 'pdf',
                uploadDate: new Date(),
              },
            ],
          },
        },
      });

      const candidate2 = await tx.candidate.create({
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@gmail.com',
          phone: '9876543210',
          address: '456 Oak Ave',
          educations: {
            create: [
              {
                institution: 'University B',
                title: 'MSc Data Science',
                startDate: new Date('2018-09-01'),
                endDate: new Date('2020-06-01'),
              },
            ],
          },
          workExperiences: {
            create: [
              {
                company: 'DataCorp',
                position: 'Data Analyst',
                description: 'Analyzed business data',
                startDate: new Date('2020-07-01'),
                endDate: new Date('2023-12-31'),
              },
            ],
          },
          resumes: {
            create: [
              {
                filePath: '/uploads/jane_smith_resume.pdf',
                fileType: 'pdf',
                uploadDate: new Date(),
              },
            ],
          },
        },
      });
      console.log('Candidates created');

      // Create Applications
      console.log('Creating applications...');
      const application1 = await tx.application.create({
        data: {
          positionId: position1.id,
          candidateId: candidate1.id,
          applicationDate: new Date(),
          currentInterviewStep: step1.id,
          notes: 'Strong technical background',
        },
      });

      const application2 = await tx.application.create({
        data: {
          positionId: position2.id,
          candidateId: candidate2.id,
          applicationDate: new Date(),
          currentInterviewStep: step3.id,
          notes: 'Excellent data science skills',
        },
      });
      console.log('Applications created');

      // Create Interviews
      console.log('Creating interviews...');
      await tx.interview.create({
        data: {
          applicationId: application1.id,
          interviewStepId: step1.id,
          employeeId: employee1.id,
          interviewDate: new Date(),
          result: 'Passed',
          score: 5,
          notes: 'Good technical skills',
        },
      });

      await tx.interview.create({
        data: {
          applicationId: application2.id,
          interviewStepId: step3.id,
          employeeId: employee2.id,
          interviewDate: new Date(),
          result: 'Passed',
          score: 5,
          notes: 'Excellent data analysis skills',
        },
      });
      console.log('Interviews created');
    });

    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
