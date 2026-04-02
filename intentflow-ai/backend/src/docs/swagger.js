/**
 * Swagger/OpenAPI Documentation Setup
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IntentFlow AI API',
      version: '1.0.0',
      description:
        'AI-powered productivity backend with natural language task extraction, ' +
        'HITL (Human-in-the-Loop) workflow, and automation capabilities.',
      contact: {
        name: 'IntentFlow Team',
        email: 'support@intentflow.ai'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Supabase Auth JWT Token'
        }
      },
      schemas: {
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            title: { type: 'string', maxLength: 80 },
            description: { type: 'string', nullable: true },
            due_date: { type: 'string', format: 'date', nullable: true },
            due_time: { type: 'string', pattern: '^\\d{2}:\\d{2}$', nullable: true },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              default: 'medium'
            },
            category: {
              type: 'string',
              enum: ['work', 'personal', 'urgent', 'routine', 'health'],
              default: 'work'
            },
            status: {
              type: 'string',
              enum: ['active', 'completed', 'cancelled'],
              default: 'active'
            },
            people: { type: 'array', items: { type: 'string' } },
            confidence_score: { type: 'integer', minimum: 0, maximum: 100 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        HITLEntry: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            raw_input: { type: 'string' },
            extracted_tasks: {
              type: 'array',
              items: { $ref: '#/components/schemas/Task' }
            },
            status: {
              type: 'string',
              enum: ['pending_review', 'approved', 'rejected']
            },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        NLPRequest: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string', description: 'Natural language input' }
          }
        },
        NLPResponse: {
          type: 'object',
          properties: {
            hitlId: { type: 'string', format: 'uuid' },
            tasks: {
              type: 'array',
              items: { $ref: '#/components/schemas/Task' }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            details: { type: 'object', nullable: true }
          }
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'degraded', 'error'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            environment: { type: 'string' },
            version: { type: 'string' },
            checks: {
              type: 'object',
              properties: {
                database: { type: 'object' },
                memory: { type: 'object' },
                uptime: { type: 'object' }
              }
            }
          }
        }
      }
    },
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'NLP', description: 'Natural Language Processing endpoints' },
      { name: 'Tasks', description: 'Task management endpoints' },
      { name: 'HITL', description: 'Human-in-the-Loop workflow endpoints' },
      { name: 'Automation', description: 'Automation and webhook endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Auth', description: 'Authentication endpoints' }
    ]
  },
  apis: [
    './src/api/**/*.js',
    './src/docs/**/*.yaml'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;