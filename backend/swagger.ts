import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LTI (Talent Tracking System) API',
      version: '1.0.0',
      description: 'API for managing candidate recruitment and interview processes',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3010',
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme',
        },
      },
      schemas: {
        UpdateCandidateStageRequest: {
          type: 'object',
          required: ['interviewStepId'],
          properties: {
            interviewStepId: {
              type: 'integer',
              minimum: 1,
              description: 'ID of the interview step to advance to',
              example: 2,
            },
            notes: {
              type: 'string',
              maxLength: 1000,
              description: 'Optional notes about the stage update (HTML tags will be sanitized)',
              example: 'Candidate performed well in technical assessment',
            },
          },
        },
        InterviewStep: {
          type: 'object',
          properties: {
            stepId: {
              type: 'integer',
              description: 'Interview step ID',
              example: 2,
            },
            stepName: {
              type: 'string',
              description: 'Name of the interview step',
              example: 'HR Round',
            },
            stepOrder: {
              type: 'integer',
              description: 'Order of the step in the interview flow',
              example: 2,
            },
            interviewFlowId: {
              type: 'integer',
              description: 'ID of the interview flow this step belongs to',
              example: 1,
            },
          },
        },
        UpdateCandidateStageResponse: {
          type: 'object',
          properties: {
            applicationId: {
              type: 'integer',
              description: 'ID of the application',
              example: 1,
            },
            candidateId: {
              type: 'integer',
              description: 'ID of the candidate',
              example: 1,
            },
            positionId: {
              type: 'integer',
              description: 'ID of the position',
              example: 1,
            },
            applicationDate: {
              type: 'string',
              format: 'date-time',
              description: 'Date when candidate applied',
              example: '2026-05-01T12:47:44.005Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp of the stage update',
              example: '2026-05-01T14:12:10.321Z',
            },
            currentInterviewStep: {
              $ref: '#/components/schemas/InterviewStep',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type',
              example: 'Unauthorized',
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
              example: 401,
            },
            message: {
              type: 'string',
              description: 'Error message (no PII included)',
              example: 'Missing Authorization header',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
